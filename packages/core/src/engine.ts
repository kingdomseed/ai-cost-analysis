import type { EntitlementsSnapshotV01, PricingSnapshotV01 } from "./types";
import type { WorkloadRequest } from "./workload";

/**
 * Calculator engine contract (API-first).
 *
 * Core principles:
 * - Always return something computable (baseline token-meter API-equivalent + known plan price floor).
 * - Never guess unit conversions (credits/quotas stay opaque unless sourced or user-assumed).
 * - Every numeric output carries method + confidence + evidence references, so the UI is a renderer
 *   of truth rather than a place where math is hidden.
 */
export type ConfidenceLevel = "high" | "medium" | "low";
export type EstimateMethod = "direct" | "derived" | "assumed" | "heuristic";

export interface CalculationAssumption {
  id: string;
  value: string | number | boolean | null;
  notes?: string;
}

export interface EvidenceRef {
  source_id: string;
  evidence_type?: string;
}

export interface MoneyEstimate {
  currency: string;
  point_usd: number;
  low_usd?: number;
  high_usd?: number;
}

export interface EvidencedMoneyEstimate extends MoneyEstimate {
  method: EstimateMethod;
  confidence: ConfidenceLevel;
  confidence_reasons: string[];
  evidence: EvidenceRef[];
}

export interface CostLineItem {
  kind: string;
  label: string;
  amount: EvidencedMoneyEstimate;
  notes?: string;
}

export type ScenarioRequest =
  | {
      kind: "token_meter";
      provider: string;
      channel: string;
      model: string;
      region?: string;
      scenario_id?: string;
    }
  | {
      kind: "tool_plan_floor";
      tool: string;
      plan_id: string;
      scenario_id?: string;
    }
  | {
      kind: "subscription_floor";
      provider: string;
      plan_id: string;
      scenario_id?: string;
    }
  | {
      /**
       * Cursor-like: subscription includes a USD pool of metered usage.
       * The plan-effective cost is:
       *   subscription_fee + max(0, api_equivalent_cost*(1+markup) - included_pool)
       */
      kind: "tool_plan_api_pool_effective";
      tool: string;
      plan_id: string;
      token_meter: {
        provider: string;
        channel: string;
        model: string;
        region?: string;
      };
      /** Optional markup applied to the metered token cost, e.g. 0.2 for +20%. */
      markup_multiplier?: number;
      scenario_id?: string;
    }
  | {
      /**
       * Credit plans: compute $/credit from a sourced pack when possible.
       * If we cannot derive or are not given a $/credit assumption, we still return a plan price floor.
       */
      kind: "tool_plan_credits_effective";
      tool: string;
      plan_id: string;
      /**
       * Seat count is only meaningful when the plan has per-seat subscription pricing.
       * If omitted, defaults to 1 (method: heuristic).
       */
      seat_count?: number;
      /**
       * Optional override for credit usage. If omitted, the engine uses credits from workload when workload is credits_per_month.
       */
      credits_per_month?: number;
      /** Optional override; if omitted, attempt to derive from official top-up pack pricing. */
      usd_per_credit?: number;
      scenario_id?: string;
    };

export interface ScenarioResult {
  scenario_id: string;
  monthly_cost_estimate: EvidencedMoneyEstimate;
  line_items: CostLineItem[];
  assumptions: CalculationAssumption[];
  evidence: EvidenceRef[];
  warnings: string[];
}

export interface EngineInput {
  pricing: PricingSnapshotV01;
  entitlements: EntitlementsSnapshotV01;
  workload: WorkloadRequest;
  scenarios: ScenarioRequest[];
  target_region?: string;
  evidence_policy?: "public_only" | "allow_private";
}

export interface EngineOutput {
  generated_at: string;
  scenarios: ScenarioResult[];
}

function nowIsoTimestamp(): string {
  return new Date().toISOString();
}

function moneyZero(
  currency: string,
  method: EstimateMethod,
  confidence: ConfidenceLevel,
  confidence_reasons: string[],
  evidence: EvidenceRef[],
): EvidencedMoneyEstimate {
  return {
    currency,
    point_usd: 0,
    method,
    confidence,
    confidence_reasons,
    evidence,
  };
}

function sumMoney(
  currency: string,
  parts: EvidencedMoneyEstimate[],
  method: EstimateMethod,
  confidence: ConfidenceLevel,
  confidence_reasons: string[],
  evidence: EvidenceRef[],
): EvidencedMoneyEstimate {
  return {
    currency,
    point_usd: parts.reduce((acc, p) => acc + p.point_usd, 0),
    method,
    confidence,
    confidence_reasons,
    evidence,
  };
}

function findApiRate(pricing: PricingSnapshotV01, provider: string, channel: string, model: string) {
  return pricing.api_rates.find(
    (r) =>
      r.provider === provider &&
      r.channel === channel &&
      r.model === model,
  );
}

function ensureFiniteNonNegative(n: number, label: string): number {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid ${label}: must be a finite non-negative number`);
  }
  return n;
}

function tokenMeterCostFromRates(
  currency: string,
  unit: string,
  rates: Record<string, number>,
  workload: WorkloadRequest,
  sourceIds: string[],
  confidence: ConfidenceLevel,
  confidence_reasons: string[],
  warnings: string[],
): ScenarioResult {
  if (workload.kind !== "tokens_per_month") {
    return {
      scenario_id: "token_meter",
      monthly_cost_estimate: moneyZero(
        currency,
        "direct",
        "low",
        ["Token-meter scenario requires tokens_per_month workload."],
        sourceIds.map((id) => ({ source_id: id })),
      ),
      line_items: [],
      assumptions: [],
      evidence: sourceIds.map((id) => ({ source_id: id })),
      warnings: ["Token-meter scenario skipped: workload is not tokens_per_month."],
    };
  }

  if (unit !== "usd_per_1m_tokens") {
    warnings.push(`Token-meter unit '${unit}' not supported; treating as USD per 1M tokens (heuristic).`);
    confidence = "low";
    confidence_reasons = [...confidence_reasons, `Unsupported unit '${unit}'`];
  }

  const inputTokens = ensureFiniteNonNegative(workload.input_tokens, "input_tokens");
  const outputTokens = ensureFiniteNonNegative(workload.output_tokens, "output_tokens");
  const cachedInputTokens = ensureFiniteNonNegative(workload.cached_input_tokens ?? 0, "cached_input_tokens");

  const inputRate =
    rates.input ??
    rates.input_cache_miss ??
    rates.input_uncached ??
    null;
  const cachedInputRate =
    rates.cached_input ??
    rates.input_cache_hit ??
    null;
  const outputRate = rates.output ?? null;

  const evidence = sourceIds.map((id) => ({ source_id: id }));

  const lineItems: CostLineItem[] = [];
  const parts: EvidencedMoneyEstimate[] = [];

  if (inputRate == null || outputRate == null) {
    return {
      scenario_id: "token_meter",
      monthly_cost_estimate: moneyZero(
        currency,
        "direct",
        "low",
        ["Missing required token-meter rates for input/output."],
        evidence,
      ),
      line_items: [],
      assumptions: [],
      evidence,
      warnings: [...warnings, "Cannot compute token-meter cost: missing input/output rates."],
    };
  }

  const inputCost = (inputTokens / 1_000_000) * inputRate;
  parts.push({
    currency,
    point_usd: inputCost,
    method: "direct",
    confidence,
    confidence_reasons,
    evidence,
  });
  lineItems.push({
    kind: "token_meter_input",
    label: "Input tokens",
    amount: parts[parts.length - 1]!,
  });

  if (cachedInputTokens > 0) {
    if (cachedInputRate == null) {
      warnings.push("cached_input_tokens provided but no cached-input rate exists; treating cached tokens as normal input.");
      const cachedAsInputCost = (cachedInputTokens / 1_000_000) * inputRate;
      parts.push({
        currency,
        point_usd: cachedAsInputCost,
        method: "heuristic",
        confidence: "low",
        confidence_reasons: [...confidence_reasons, "No cached-input rate available"],
        evidence,
      });
      lineItems.push({
        kind: "token_meter_cached_input",
        label: "Cached input tokens (treated as input)",
        amount: parts[parts.length - 1]!,
      });
    } else {
      const cachedCost = (cachedInputTokens / 1_000_000) * cachedInputRate;
      parts.push({
        currency,
        point_usd: cachedCost,
        method: "direct",
        confidence,
        confidence_reasons,
        evidence,
      });
      lineItems.push({
        kind: "token_meter_cached_input",
        label: "Cached input tokens",
        amount: parts[parts.length - 1]!,
      });
    }
  }

  const outputCost = (outputTokens / 1_000_000) * outputRate;
  parts.push({
    currency,
    point_usd: outputCost,
    method: "direct",
    confidence,
    confidence_reasons,
    evidence,
  });
  lineItems.push({
    kind: "token_meter_output",
    label: "Output tokens",
    amount: parts[parts.length - 1]!,
  });

  return {
    scenario_id: "token_meter",
    monthly_cost_estimate: sumMoney(currency, parts, "direct", confidence, confidence_reasons, evidence),
    line_items: lineItems,
    assumptions: [],
    evidence,
    warnings,
  };
}

export function calculate(input: EngineInput): EngineOutput {
  const currency = input.pricing.meta.default_currency ?? "USD";

  const results: ScenarioResult[] = [];

  for (const scenario of input.scenarios) {
    if (scenario.kind === "subscription_floor") {
      const sub = input.pricing.subscriptions.find(
        (s) => s.provider === scenario.provider && s.plan_id === scenario.plan_id,
      );
      const evidence = (sub?.source_ids ?? []).map((id) => ({ source_id: id }));

      if (!sub || sub.price_usd_per_month == null) {
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.plan_id}:subscription_floor`,
          monthly_cost_estimate: moneyZero(
            currency,
            "direct",
            "low",
            ["No subscription price found in pricing snapshot."],
            evidence,
          ),
          line_items: [],
          assumptions: [],
          evidence,
          warnings: ["Subscription price missing; cannot compute plan price floor."],
        });
        continue;
      }

      const amount: EvidencedMoneyEstimate = {
        currency,
        point_usd: sub.price_usd_per_month,
        method: "direct",
        confidence: sub.verified ? "high" : "medium",
        confidence_reasons: sub.verified ? [] : ["Subscription price is not verified."],
        evidence,
      };

      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.plan_id}:subscription_floor`,
        monthly_cost_estimate: amount,
        line_items: [{ kind: "subscription_fee", label: "Subscription fee", amount }],
        assumptions: [],
        evidence,
        warnings: sub.usage_limits ? [`Usage limits: ${sub.usage_limits}`] : [],
      });
      continue;
    }

    if (scenario.kind === "tool_plan_floor") {
      const plan = input.pricing.tool_plans.find(
        (p) => p.tool === scenario.tool && p.plan_id === scenario.plan_id,
      );
      const evidence = (plan?.source_ids ?? []).map((id) => ({ source_id: id }));

      const monthly =
        plan?.subscription_price_usd ??
        null;

      if (!plan || monthly == null) {
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:tool_plan_floor`,
          monthly_cost_estimate: moneyZero(
            currency,
            "direct",
            "low",
            ["No tool plan subscription price found in pricing snapshot."],
            evidence,
          ),
          line_items: [],
          assumptions: [],
          evidence,
          warnings: ["Tool plan price missing; cannot compute plan price floor."],
        });
        continue;
      }

      const amount: EvidencedMoneyEstimate = {
        currency,
        point_usd: monthly,
        method: "direct",
        confidence: plan.verified ? "high" : "medium",
        confidence_reasons: plan.verified ? [] : ["Tool plan price is not verified."],
        evidence,
      };

      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:tool_plan_floor`,
        monthly_cost_estimate: amount,
        line_items: [{ kind: "subscription_fee", label: "Subscription fee", amount }],
        assumptions: [],
        evidence,
        warnings: plan.metering ? [`Metering: ${plan.metering}`] : [],
      });
      continue;
    }

    if (scenario.kind === "token_meter") {
      const apiRate = findApiRate(input.pricing, scenario.provider, scenario.channel, scenario.model);

      if (!apiRate) {
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:token_meter`,
          monthly_cost_estimate: moneyZero(
            currency,
            "direct",
            "low",
            ["No matching token-meter entry found in pricing snapshot."],
            [],
          ),
          line_items: [],
          assumptions: [],
          evidence: [],
          warnings: ["Token-meter entry missing; cannot compute baseline API-equivalent cost."],
        });
        continue;
      }

      const warnings: string[] = [];
      const confidenceReasons: string[] = [];
      let confidence: ConfidenceLevel = apiRate.verified ? "high" : "medium";
      if (!apiRate.verified) confidenceReasons.push("Token-meter rates are not verified.");

      if (apiRate.regional_rates && apiRate.regional_rates.length > 0) {
        const region = scenario.region ?? input.target_region;
        const match = region
          ? apiRate.regional_rates.find((rr) => rr.regions.includes(region))
          : null;
        const picked = match ?? apiRate.regional_rates[0];
        if (!match) warnings.push("Regional token pricing exists but no matching region provided; using first regional rate set.");

        const rates: Record<string, number> = {};
        if (typeof picked.input === "number") rates.input = picked.input;
        if (typeof picked.output === "number") rates.output = picked.output;

        const result = tokenMeterCostFromRates(
          currency,
          apiRate.unit,
          rates,
          input.workload,
          apiRate.source_ids,
          confidence,
          [...confidenceReasons, "Regional pricing selected from a table."],
          warnings,
        );
        results.push({
          ...result,
          scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:token_meter`,
        });
        continue;
      }

      if (apiRate.tiers && apiRate.tiers.length > 0) {
        if (input.workload.kind !== "tokens_per_month") {
          results.push({
            scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:token_meter`,
            monthly_cost_estimate: moneyZero(
              currency,
              "direct",
              "low",
              ["Tiered token-meter selection requires tokens_per_month workload."],
              apiRate.source_ids.map((id) => ({ source_id: id })),
            ),
            line_items: [],
            assumptions: [],
            evidence: apiRate.source_ids.map((id) => ({ source_id: id })),
            warnings: ["Cannot select tier: workload is not tokens_per_month."],
          });
          continue;
        }

        const inputTokens = input.workload.input_tokens;
        const standard = apiRate.tiers.find((t) => t.name === "standard");
        const longContext = apiRate.tiers.find((t) => t.name === "long_context");
        const threshold = 200_000;
        const picked =
          longContext && inputTokens > threshold
            ? longContext
            : standard ?? apiRate.tiers[0];

        if (picked === longContext) warnings.push(`Selected long-context tier because input_tokens > ${threshold}.`);

        const result = tokenMeterCostFromRates(
          currency,
          apiRate.unit,
          picked.rates,
          input.workload,
          apiRate.source_ids,
          "medium",
          [...confidenceReasons, "Tier selection uses a fixed 200k input token threshold."],
          warnings,
        );
        results.push({
          ...result,
          scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:token_meter`,
        });
        continue;
      }

      if (!apiRate.rates) {
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:token_meter`,
          monthly_cost_estimate: moneyZero(
            currency,
            "direct",
            "low",
            ["Token-meter entry missing rates/tiers/regional_rates."],
            apiRate.source_ids.map((id) => ({ source_id: id })),
          ),
          line_items: [],
          assumptions: [],
          evidence: apiRate.source_ids.map((id) => ({ source_id: id })),
          warnings: ["Token-meter entry has no computable rate fields."],
        });
        continue;
      }

      const result = tokenMeterCostFromRates(
        currency,
        apiRate.unit,
        apiRate.rates,
        input.workload,
        apiRate.source_ids,
        confidence,
        confidenceReasons,
        warnings,
      );
      results.push({
        ...result,
        scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:token_meter`,
      });
      continue;
    }

    if (scenario.kind === "tool_plan_api_pool_effective") {
      const plan = input.pricing.tool_plans.find(
        (p) => p.tool === scenario.tool && p.plan_id === scenario.plan_id,
      );
      const planEvidence = (plan?.source_ids ?? []).map((id) => ({ source_id: id }));

      const subscriptionFee =
        plan?.subscription_price_usd ??
        (plan?.subscription_price_usd_per_seat != null
          ? plan.subscription_price_usd_per_seat
          : 0);

      const warnings: string[] = [];
      const assumptions: CalculationAssumption[] = [];

      if (!plan) {
        warnings.push("Tool plan not found; returning baseline token-meter only.");
      }

      if (plan?.subscription_price_usd == null && plan?.subscription_price_usd_per_seat != null) {
        warnings.push("Per-seat subscription price found; assuming seat_count=1.");
        assumptions.push({ id: "seat_count", value: 1, notes: "Assumed because no seat_count provided." });
      }

      const poolUsd = plan?.included_pool_usd ?? 0;
      if (plan?.included_pool_usd == null) {
        warnings.push("Included USD pool not found; treating included_pool_usd as 0.");
        assumptions.push({ id: "included_pool_usd", value: 0, notes: "Missing in dataset; treated as 0." });
      }

      const markup = scenario.markup_multiplier ?? 0;
      if (scenario.markup_multiplier == null) {
        warnings.push("No markup provided; assuming markup_multiplier=0.");
        assumptions.push({ id: "markup_multiplier", value: 0, notes: "Assumed default." });
      } else {
        assumptions.push({ id: "markup_multiplier", value: markup, notes: "Provided by request." });
      }

      // Compute API-equivalent baseline for the referenced model.
      const baseline = calculate({
        pricing: input.pricing,
        entitlements: input.entitlements,
        workload: input.workload,
        scenarios: [
          {
            kind: "token_meter",
            provider: scenario.token_meter.provider,
            channel: scenario.token_meter.channel,
            model: scenario.token_meter.model,
            region: scenario.token_meter.region,
          },
        ],
        target_region: input.target_region,
        evidence_policy: input.evidence_policy,
      }).scenarios[0]!;

      const metered = baseline.monthly_cost_estimate.point_usd * (1 + markup);
      const overage = Math.max(0, metered - poolUsd);
      const total = subscriptionFee + overage;

      const evidence = [...planEvidence, ...baseline.evidence];
      const confidenceReasons: string[] = [];
      let confidence: ConfidenceLevel = "medium";
      let method: EstimateMethod = "derived";

      if (!plan?.verified) confidenceReasons.push("Tool plan pricing is not verified.");
      if (baseline.monthly_cost_estimate.confidence !== "high") {
        confidenceReasons.push(...baseline.monthly_cost_estimate.confidence_reasons);
      }
      if (scenario.markup_multiplier == null) {
        method = "heuristic";
        confidence = "low";
        confidenceReasons.push("Markup multiplier was assumed.");
      }
      if (plan?.included_pool_usd == null) {
        confidence = "low";
        confidenceReasons.push("Included USD pool was missing and assumed as 0.");
      }

      const subscriptionAmount: EvidencedMoneyEstimate = {
        currency,
        point_usd: subscriptionFee,
        method: plan?.subscription_price_usd != null || plan?.subscription_price_usd_per_seat != null ? "direct" : "heuristic",
        confidence: plan?.verified ? "high" : "medium",
        confidence_reasons: plan?.verified ? [] : ["Subscription price is not verified."],
        evidence: planEvidence,
      };

      const overageAmount: EvidencedMoneyEstimate = {
        currency,
        point_usd: overage,
        method,
        confidence,
        confidence_reasons: confidenceReasons,
        evidence,
      };

      const totalAmount: EvidencedMoneyEstimate = {
        currency,
        point_usd: total,
        method,
        confidence,
        confidence_reasons: confidenceReasons,
        evidence,
      };

      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:api_pool_effective`,
        monthly_cost_estimate: totalAmount,
        line_items: [
          { kind: "subscription_fee", label: "Subscription fee", amount: subscriptionAmount },
          { kind: "overage", label: "Overage above included pool", amount: overageAmount, notes: `Included pool: $${poolUsd}` },
        ],
        assumptions,
        evidence,
        warnings: [...warnings, ...baseline.warnings],
      });
      continue;
    }

    if (scenario.kind === "tool_plan_credits_effective") {
      const plan = input.pricing.tool_plans.find(
        (p) => p.tool === scenario.tool && p.plan_id === scenario.plan_id,
      );
      const planEvidence = (plan?.source_ids ?? []).map((id) => ({ source_id: id }));

      const warnings: string[] = [];
      const assumptions: CalculationAssumption[] = [];

      const seatCount =
        scenario.seat_count ??
        (plan?.subscription_price_usd_per_seat != null ? 1 : undefined);
      if (plan?.subscription_price_usd_per_seat != null) {
        if (scenario.seat_count == null) {
          warnings.push("Per-seat pricing detected; assuming seat_count=1.");
          assumptions.push({ id: "seat_count", value: 1, notes: "Assumed default." });
        } else {
          assumptions.push({ id: "seat_count", value: seatCount ?? 1, notes: "Provided by request." });
        }
      }

      const subscriptionFee =
        plan?.subscription_price_usd ??
        (plan?.subscription_price_usd_per_seat != null && seatCount != null
          ? plan.subscription_price_usd_per_seat * seatCount
          : 0);

      if (!plan) warnings.push("Tool plan not found; returning $0 with warnings.");
      if (subscriptionFee === 0) warnings.push("Subscription fee missing; treated as $0.");

      // Determine monthly credits usage.
      let credits: number | null = null;
      if (scenario.credits_per_month != null) {
        credits = scenario.credits_per_month;
        assumptions.push({ id: "credits_per_month", value: credits, notes: "Provided by request." });
      } else if (input.workload.kind === "credits_per_month") {
        credits = input.workload.credits;
        assumptions.push({ id: "credits_per_month", value: credits, notes: "From workload." });
      }

      // Determine $/credit.
      let usdPerCredit: number | null = null;
      let usdPerCreditMethod: EstimateMethod = "assumed";
      let usdPerCreditConfidence: ConfidenceLevel = "low";
      const usdPerCreditReasons: string[] = [];

      if (scenario.usd_per_credit != null) {
        usdPerCredit = scenario.usd_per_credit;
        usdPerCreditMethod = "assumed";
        usdPerCreditConfidence = "low";
        usdPerCreditReasons.push("USD/credit provided as an assumption.");
        assumptions.push({ id: "usd_per_credit", value: usdPerCredit, notes: "Provided by request." });
      } else {
        const topup = plan?.topups_pricing as any;
        const priceUsd = topup?.price_usd;
        const packCredits = topup?.credits;
        if (typeof priceUsd === "number" && typeof packCredits === "number" && packCredits > 0) {
          usdPerCredit = priceUsd / packCredits;
          usdPerCreditMethod = "derived";
          usdPerCreditConfidence = plan?.verified ? "medium" : "low";
          usdPerCreditReasons.push("Derived from pack price and credit count.");
          assumptions.push({ id: "usd_per_credit", value: usdPerCredit, notes: "Derived from top-up pack pricing." });
        } else {
          warnings.push("No USD/credit provided and no top-up pack pricing available; cannot price credit usage.");
          usdPerCreditReasons.push("No sourced credit pack price was found.");
        }
      }

      // Compute credits cost if we can.
      const creditSpendUsd =
        credits != null && usdPerCredit != null ? credits * usdPerCredit : 0;

      const confidenceReasons: string[] = [];
      let confidence: ConfidenceLevel = "medium";
      let method: EstimateMethod = "derived";

      if (!plan?.verified) confidenceReasons.push("Tool plan pricing is not verified.");
      if (usdPerCreditMethod !== "derived") {
        confidence = "low";
        method = "heuristic";
        confidenceReasons.push(...usdPerCreditReasons);
      } else {
        confidenceReasons.push(...usdPerCreditReasons);
      }

      const subscriptionAmount: EvidencedMoneyEstimate = {
        currency,
        point_usd: subscriptionFee,
        method: plan?.subscription_price_usd != null || plan?.subscription_price_usd_per_seat != null ? "direct" : "heuristic",
        confidence: plan?.verified ? "high" : "medium",
        confidence_reasons: plan?.verified ? [] : ["Subscription price is not verified."],
        evidence: planEvidence,
      };

      const creditsAmount: EvidencedMoneyEstimate = {
        currency,
        point_usd: creditSpendUsd,
        method: usdPerCreditMethod,
        confidence: usdPerCreditConfidence,
        confidence_reasons: usdPerCreditReasons,
        evidence: planEvidence,
      };

      const totalAmount: EvidencedMoneyEstimate = {
        currency,
        point_usd: subscriptionFee + creditSpendUsd,
        method,
        confidence,
        confidence_reasons: confidenceReasons,
        evidence: planEvidence,
      };

      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:credits_effective`,
        monthly_cost_estimate: totalAmount,
        line_items: [
          { kind: "subscription_fee", label: "Subscription fee", amount: subscriptionAmount },
          { kind: "credits_spend", label: "Credits spend (best-effort)", amount: creditsAmount },
        ],
        assumptions,
        evidence: planEvidence,
        warnings,
      });
      continue;
    }
  }

  return { generated_at: nowIsoTimestamp(), scenarios: results };
}
