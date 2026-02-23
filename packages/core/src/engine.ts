import type { EntitlementV01, EntitlementsSnapshotV01, FxSnapshotV01, PricingSnapshotV01 } from "./types";
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
  point: number;
  low?: number;
  high?: number;
}

export interface EvidencedMoneyEstimate extends MoneyEstimate {
  method: EstimateMethod;
  confidence: ConfidenceLevel;
  confidence_reasons: string[];
  evidence: EvidenceRef[];
}

export interface NumberEstimate {
  unit: string;
  point: number;
  low?: number;
  high?: number;
}

export interface EvidencedNumberEstimate extends NumberEstimate {
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

export interface MetricLineItem {
  kind: string;
  label: string;
  metric: EvidencedNumberEstimate;
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
      /**
       * Optional seat count for per-seat plans. If omitted and a plan is per-seat,
       * the engine will assume 1 seat (method: heuristic).
       */
      seat_count?: number;
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
       * Given a budget workload, compute how many tokens could be purchased
       * for a specific provider/channel/model at token-meter rates.
       */
      kind: "token_meter_budget_capacity";
      provider: string;
      channel: string;
      model: string;
      region?: string;
      /**
       * Ratio used when converting a "total tokens" capacity into input/output tokens.
       * Default: "3:1" (heuristic) unless provided.
       */
      input_to_output_ratio?: string;
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
      seat_count?: number;
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
    }
  | {
      kind: "tool_plan_token_quota_effective";
      tool: string;
      plan_id: string;
      seat_count?: number;
      scenario_id?: string;
    }
  | {
      kind: "tool_plan_compute_units_effective";
      tool: string;
      plan_id: string;
      seat_count?: number;
      scenario_id?: string;
    }
  | {
      kind: "tool_plan_premium_requests_effective";
      tool: string;
      plan_id: string;
      seat_count?: number;
      scenario_id?: string;
    }
  | {
      /**
       * Break-even math for a subscription/tool plan versus a token-meter baseline.
       * Always returns a computable USD break-even and (if token rates exist) a token estimate.
       */
      kind: "break_even_vs_token_meter";
      subject:
        | { kind: "subscription"; provider: string; plan_id: string }
        | { kind: "tool_plan"; tool: string; plan_id: string; seat_count?: number };
      token_meter: {
        provider: string;
        channel: string;
        model: string;
        region?: string;
      };
      input_to_output_ratio?: string;
      /** Optional markup (e.g., Cursor Max mode). If omitted, defaults to 0 (heuristic). */
      markup_multiplier?: number;
      scenario_id?: string;
    };

export interface ScenarioResult {
  scenario_id: string;
  monthly_cost_estimate: EvidencedMoneyEstimate;
  line_items: CostLineItem[];
  metrics?: MetricLineItem[];
  assumptions: CalculationAssumption[];
  evidence: EvidenceRef[];
  warnings: string[];
  entitlements?: EntitlementV01[];
}

export interface EngineInput {
  pricing: PricingSnapshotV01;
  entitlements: EntitlementsSnapshotV01;
  fx?: FxSnapshotV01;
  workload: WorkloadRequest;
  scenarios: ScenarioRequest[];
  target_region?: string;
  evidence_policy?: "public_only" | "allow_private";
  output_currency?: string;
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
    point: 0,
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
    point: parts.reduce((acc, p) => acc + p.point, 0),
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

/**
 * Resolve the monthly subscription price from a tool plan, handling the
 * various field name conventions used across the pricing snapshot:
 *
 *   - subscription_price_usd              (flat monthly)
 *   - subscription_price_usd_per_seat     (per-seat, needs seat_count)
 *   - subscription_price_usd_per_seat_per_month  (per-seat variant)
 *   - credit_tiers[0].monthly_billing_usd (tiered credits, use lowest tier as floor)
 *
 * Field precedence is intentional: subscription_price_usd takes priority over
 * credit_tiers to handle plans with explicit base prices. If a plan mistakenly
 * defines both subscription_price_usd and credit_tiers, only subscription_price_usd
 * is used (credit_tiers is ignored). Current pricing data (2026-02-22) has no such
 * conflicts; this behavior guards against malformed future entries.
 *
 * Returns { monthly, isPerSeat, hasCreditTiers } or null monthly when no price found.
 */
function resolvePlanPrice(plan: Record<string, unknown>): {
  monthly: number | null;
  isPerSeat: boolean;
  hasCreditTiers: boolean;
} {
  // Flat monthly price
  const sub = plan.subscription_price_usd;
  if (typeof sub === "number") {
    return { monthly: sub, isPerSeat: false, hasCreditTiers: false };
  }

  // Per-seat: check both field name variants
  const perSeat = plan.subscription_price_usd_per_seat;
  if (typeof perSeat === "number") {
    return { monthly: perSeat, isPerSeat: true, hasCreditTiers: false };
  }
  const perSeatPerMonth = plan.subscription_price_usd_per_seat_per_month;
  if (typeof perSeatPerMonth === "number") {
    return { monthly: perSeatPerMonth, isPerSeat: true, hasCreditTiers: false };
  }

  // Credit tiers: use lowest tier's monthly price as the floor
  const tiers = plan.credit_tiers;
  if (Array.isArray(tiers) && tiers.length > 0) {
    const first = tiers[0] as Record<string, unknown>;
    const tierPrice = first?.monthly_billing_usd;
    if (typeof tierPrice === "number") {
      return { monthly: tierPrice, isPerSeat: false, hasCreditTiers: true };
    }
  }

  return { monthly: null, isPerSeat: false, hasCreditTiers: false };
}

/**
 * Match a simplified region (us, eu, cn) against actual cloud regions.
 * Supports prefix matching for simplified region selection.
 */
function regionMatches(simplifiedRegion: string, actualRegion: string): boolean {
  const simplified = simplifiedRegion.toLowerCase();
  const actual = actualRegion.toLowerCase();
  
  // Exact match
  if (simplified === actual) return true;
  
  // Simplified region prefix matching
  // "us" matches "us-east-1", "us-west-2", etc.
  // "eu" matches "eu-west-1", "eu-central-1", etc.
  // "cn" matches "cn-north-1", "cn-northwest-1", etc.
  if (simplified === "us" && actual.startsWith("us-")) return true;
  if (simplified === "eu" && actual.startsWith("eu-")) return true;
  if (simplified === "cn" && actual.startsWith("cn-")) return true;
  if (simplified === "ap" && actual.startsWith("ap-")) return true;
  if (simplified === "sa" && actual.startsWith("sa-")) return true;
  if (simplified === "ca" && actual.startsWith("ca-")) return true;
  if (simplified === "af" && actual.startsWith("af-")) return true;
  if (simplified === "me" && actual.startsWith("me-")) return true;
  
  return false;
}

function ensureFiniteNonNegative(n: number, label: string): number {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid ${label}: must be a finite non-negative number`);
  }
  return n;
}

function parseRatio(ratio: string): { input: number; output: number } | null {
  const trimmed = ratio.trim();
  const match = /^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/.exec(trimmed);
  if (!match) return null;
  const input = Number(match[1]);
  const output = Number(match[2]);
  if (!Number.isFinite(input) || !Number.isFinite(output) || input <= 0 || output <= 0) return null;
  return { input, output };
}

function normalizeTokenWorkload(
  workload: WorkloadRequest,
): { normalized: { input_tokens: number; output_tokens: number; cached_input_tokens: number }; assumptions: CalculationAssumption[]; warnings: string[] } | null {
  if (workload.kind === "tokens_per_month") {
    return {
      normalized: {
        input_tokens: ensureFiniteNonNegative(workload.input_tokens, "input_tokens"),
        output_tokens: ensureFiniteNonNegative(workload.output_tokens, "output_tokens"),
        cached_input_tokens: ensureFiniteNonNegative(workload.cached_input_tokens ?? 0, "cached_input_tokens"),
      },
      assumptions: [],
      warnings: [],
    };
  }

  if (workload.kind === "total_tokens_per_month") {
    const totalTokens = ensureFiniteNonNegative(workload.total_tokens, "total_tokens");
    const cached = ensureFiniteNonNegative(workload.cached_input_tokens ?? 0, "cached_input_tokens");

    const ratioRaw = workload.assumptions?.input_to_output_ratio ?? "3:1";
    const parsed = parseRatio(ratioRaw);
    const ratio = parsed ?? { input: 3, output: 1 };
    const ratioLabel = parsed ? ratioRaw : "3:1";
    if (!parsed && ratioRaw !== "3:1") {
      return {
        normalized: {
          input_tokens: (totalTokens * ratio.input) / (ratio.input + ratio.output),
          output_tokens: (totalTokens * ratio.output) / (ratio.input + ratio.output),
          cached_input_tokens: cached,
        },
        assumptions: [
          {
            id: "input_to_output_ratio",
            value: ratioLabel,
            notes: "Provided ratio was invalid; defaulted to 3:1 (heuristic).",
          },
        ],
        warnings: ["Invalid input_to_output_ratio; defaulted to 3:1."],
      };
    }

    return {
      normalized: {
        input_tokens: (totalTokens * ratio.input) / (ratio.input + ratio.output),
        output_tokens: (totalTokens * ratio.output) / (ratio.input + ratio.output),
        cached_input_tokens: cached,
      },
      assumptions: [
        { id: "input_to_output_ratio", value: ratioLabel, notes: "Used to split total_tokens into input/output (heuristic unless user-specified)." },
      ],
      warnings: workload.assumptions?.input_to_output_ratio ? [] : ["No input_to_output_ratio provided; defaulted to 3:1 (heuristic)."],
    };
  }

  return null;
}

function totalTokensFromWorkload(workload: WorkloadRequest): { total_tokens: number; warnings: string[]; assumptions: CalculationAssumption[] } | null {
  const normalized = normalizeTokenWorkload(workload);
  if (!normalized) return null;
  return {
    total_tokens: normalized.normalized.input_tokens + normalized.normalized.output_tokens + normalized.normalized.cached_input_tokens,
    warnings: normalized.warnings,
    assumptions: normalized.assumptions,
  };
}

function deriveUsdPerCreditFromTopups(topup: unknown): { usd_per_credit: number; method: EstimateMethod; confidence: ConfidenceLevel; reasons: string[] } | null {
  if (typeof topup !== "object" || topup === null) return null;
  const t = topup as Record<string, unknown>;

  if (typeof t.usd_per_credit === "number" && Number.isFinite(t.usd_per_credit) && t.usd_per_credit > 0) {
    return { usd_per_credit: t.usd_per_credit, method: "direct", confidence: "medium", reasons: ["USD/credit provided directly in dataset."] };
  }

  const priceUsd = typeof t.price_usd === "number" ? t.price_usd : null;
  const credits = typeof t.credits === "number" ? t.credits : null;
  if (priceUsd != null && credits != null && Number.isFinite(priceUsd) && Number.isFinite(credits) && priceUsd > 0 && credits > 0) {
    return { usd_per_credit: priceUsd / credits, method: "derived", confidence: "medium", reasons: ["Derived from pack price_usd and credits."] };
  }

  const pricePer50 = typeof t.price_usd_per_50_credits === "number" ? t.price_usd_per_50_credits : null;
  if (pricePer50 != null && Number.isFinite(pricePer50) && pricePer50 > 0) {
    return { usd_per_credit: pricePer50 / 50, method: "derived", confidence: "medium", reasons: ["Derived from price_usd_per_50_credits."] };
  }

  return null;
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
  const normalized = normalizeTokenWorkload(workload);
  if (!normalized) {
    return {
      scenario_id: "token_meter",
      monthly_cost_estimate: moneyZero(
        currency,
        "direct",
        "low",
        ["Token-meter scenario requires a token workload (tokens_per_month or total_tokens_per_month)."],
        sourceIds.map((id) => ({ source_id: id })),
      ),
      line_items: [],
      assumptions: [],
      evidence: sourceIds.map((id) => ({ source_id: id })),
      warnings: ["Token-meter scenario skipped: workload is not a token workload."],
    };
  }

  if (unit !== "usd_per_1m_tokens") {
    warnings.push(`Token-meter unit '${unit}' not supported; treating as USD per 1M tokens (heuristic).`);
    confidence = "low";
    confidence_reasons = [...confidence_reasons, `Unsupported unit '${unit}'`];
  }

  const inputTokens = ensureFiniteNonNegative(normalized.normalized.input_tokens, "input_tokens");
  const outputTokens = ensureFiniteNonNegative(normalized.normalized.output_tokens, "output_tokens");
  const cachedInputTokens = ensureFiniteNonNegative(normalized.normalized.cached_input_tokens, "cached_input_tokens");

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
  const assumptions: CalculationAssumption[] = [...normalized.assumptions];
  warnings.push(...normalized.warnings);

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
      assumptions,
      evidence,
      warnings: [...warnings, "Cannot compute token-meter cost: missing input/output rates."],
    };
  }

  const inputCost = (inputTokens / 1_000_000) * inputRate;
  parts.push({
    currency,
    point: inputCost,
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
        point: cachedAsInputCost,
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
        point: cachedCost,
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
    point: outputCost,
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

  const totalTokens = inputTokens + outputTokens + cachedInputTokens;
  const totalCost = parts.reduce((acc, p) => acc + p.point, 0);
  const metrics: MetricLineItem[] = [];
  metrics.push({
    kind: "workload_total_tokens",
    label: "Workload total tokens",
    metric: {
      unit: "tokens",
      point: totalTokens,
      method: "derived",
      confidence: "high",
      confidence_reasons: [],
      evidence,
    },
  });
  if (totalTokens > 0) {
    metrics.push({
      kind: "effective_usd_per_1m_tokens",
      label: `Effective ${currency} per 1M tokens`,
      metric: {
        unit: `${currency}_per_1m_tokens`,
        point: (totalCost / totalTokens) * 1_000_000,
        method: "derived",
        confidence,
        confidence_reasons,
        evidence,
      },
    });
  }

  return {
    scenario_id: "token_meter",
    monthly_cost_estimate: sumMoney(currency, parts, "direct", confidence, confidence_reasons, evidence),
    line_items: lineItems,
    metrics,
    assumptions,
    evidence,
    warnings,
  };
}

export function calculate(input: EngineInput): EngineOutput {
  const baseCurrency = input.pricing.meta.default_currency ?? "USD";
  const requestedCurrency = input.output_currency ?? baseCurrency;

  const results: ScenarioResult[] = [];

  function slugifyProviderId(label: string): string {
    return label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function selectEntitlements(providerId: string, planId: string, region: string, warnings: string[]): EntitlementV01[] {
    const all = input.entitlements.entitlements.filter(
      (e) => e.provider_id === providerId && e.plan_id === planId && (e.region === region || e.region === "global"),
    );

    if (input.evidence_policy === "public_only") {
      const filtered = all.filter((e) => e.evidence?.type === "public_url");
      if (filtered.length !== all.length && all.length > 0) {
        warnings.push("Some entitlements were omitted due to evidence_policy=public_only.");
      }
      return filtered;
    }

    return all;
  }

  const targetRegion = input.target_region ?? "us";

  for (const scenario of input.scenarios) {
    if (scenario.kind === "subscription_floor") {
      const sub = input.pricing.subscriptions.find(
        (s) => s.provider === scenario.provider && s.plan_id === scenario.plan_id,
      );
      const evidence = (sub?.source_ids ?? []).map((id) => ({ source_id: id }));

      if (!sub || sub.price_usd_per_month == null) {
        const warnings: string[] = ["Subscription price missing; cannot compute plan price floor."];
        const entitlements = selectEntitlements(scenario.provider, scenario.plan_id, targetRegion, warnings);
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.plan_id}:subscription_floor`,
          monthly_cost_estimate: moneyZero(
            baseCurrency,
            "direct",
            "low",
            ["No subscription price found in pricing snapshot."],
            evidence,
          ),
          line_items: [],
          assumptions: [],
          evidence,
          warnings,
          entitlements,
        });
        continue;
      }

      const amount: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: sub.price_usd_per_month,
        method: "direct",
        confidence: sub.verified ? "high" : "medium",
        confidence_reasons: sub.verified ? [] : ["Subscription price is not verified."],
        evidence,
      };

      const warnings: string[] = sub.usage_limits ? [`Usage limits: ${sub.usage_limits}`] : [];
      const entitlements = selectEntitlements(scenario.provider, scenario.plan_id, targetRegion, warnings);

      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.plan_id}:subscription_floor`,
        monthly_cost_estimate: amount,
        line_items: [{ kind: "subscription_fee", label: "Subscription fee", amount }],
        assumptions: [],
        evidence,
        warnings,
        entitlements,
      });
      continue;
    }

    if (scenario.kind === "tool_plan_floor") {
      const plan = input.pricing.tool_plans.find(
        (p) => p.tool === scenario.tool && p.plan_id === scenario.plan_id,
      );
      const evidence = (plan?.source_ids ?? []).map((id) => ({ source_id: id }));

      const warnings: string[] = [];
      const assumptions: CalculationAssumption[] = [];

      const resolved = resolvePlanPrice((plan ?? {}) as Record<string, unknown>);

      const seatCount =
        scenario.seat_count ?? (resolved.isPerSeat ? 1 : undefined);
      if (resolved.isPerSeat) {
        if (scenario.seat_count == null) {
          warnings.push("Per-seat pricing detected; assuming seat_count=1.");
          assumptions.push({ id: "seat_count", value: 1, notes: "Assumed default for per-seat pricing." });
        } else {
          assumptions.push({ id: "seat_count", value: seatCount ?? 1, notes: "Provided by request." });
        }
      }
      if (resolved.hasCreditTiers) {
        assumptions.push({ id: "credit_tier", value: "lowest", notes: "Using lowest credit tier as price floor." });
      }

      const monthly =
        resolved.monthly != null && resolved.isPerSeat && seatCount != null
          ? resolved.monthly * seatCount
          : resolved.monthly;

      if (!plan || monthly == null) {
        warnings.push("Tool plan price missing; cannot compute plan price floor.");
        const entitlements = selectEntitlements(slugifyProviderId(scenario.tool), scenario.plan_id, targetRegion, warnings);
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:tool_plan_floor`,
          monthly_cost_estimate: moneyZero(
            baseCurrency,
            "direct",
            "low",
            ["No tool plan subscription price found in pricing snapshot."],
            evidence,
          ),
          line_items: [],
          assumptions,
          evidence,
          warnings,
          entitlements,
        });
        continue;
      }

      const amount: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: monthly,
        method: "direct",
        confidence: plan.verified ? "high" : "medium",
        confidence_reasons: plan.verified ? [] : ["Tool plan price is not verified."],
        evidence,
      };

      if (plan.metering) warnings.push(`Metering: ${plan.metering}`);
      const entitlements = selectEntitlements(slugifyProviderId(scenario.tool), scenario.plan_id, targetRegion, warnings);

      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:tool_plan_floor`,
        monthly_cost_estimate: amount,
        line_items: [{ kind: "subscription_fee", label: "Subscription fee", amount }],
        assumptions,
        evidence,
        warnings,
        entitlements,
      });
      continue;
    }

    if (scenario.kind === "token_meter_budget_capacity") {
      const apiRate = findApiRate(input.pricing, scenario.provider, scenario.channel, scenario.model);
      const evidence = (apiRate?.source_ids ?? []).map((id) => ({ source_id: id }));
      const warnings: string[] = [];
      const assumptions: CalculationAssumption[] = [];

      if (!apiRate) {
        warnings.push("Token-meter entry missing; cannot compute budget capacity.");
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:budget_capacity`,
          monthly_cost_estimate: moneyZero(
            baseCurrency,
            "direct",
            "low",
            ["No matching token-meter entry found in pricing snapshot."],
            evidence,
          ),
          line_items: [],
          metrics: [],
          assumptions,
          evidence,
          warnings,
          entitlements: [],
        });
        continue;
      }

      if (input.workload.kind !== "budget_per_month") {
        warnings.push("token_meter_budget_capacity requires budget_per_month workload.");
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:budget_capacity`,
          monthly_cost_estimate: moneyZero(
            baseCurrency,
            "direct",
            "low",
            ["Budget capacity scenario requires budget_per_month workload."],
            evidence,
          ),
          line_items: [],
          metrics: [],
          assumptions,
          evidence,
          warnings,
          entitlements: [],
        });
        continue;
      }

      const budgetCurrency = input.workload.currency;
      const budgetAmount = ensureFiniteNonNegative(input.workload.budget, "budget");

      let budgetBase = budgetAmount;
      if (budgetCurrency !== baseCurrency) {
        const fx = input.fx;
        const fxRate = fx?.meta?.base_currency === baseCurrency ? fx?.rates?.[budgetCurrency] : undefined;
        if (typeof fxRate === "number" && Number.isFinite(fxRate) && fxRate > 0) {
          // fxRate is base->currency, so currency->base is divide.
          budgetBase = budgetAmount / fxRate;
          assumptions.push({
            id: "budget_fx_rate",
            value: fxRate,
            notes: `Converted budget from ${budgetCurrency} to ${baseCurrency} using FX effective_date=${fx?.meta?.effective_date}.`,
          });
        } else {
          warnings.push(`No FX rate for budget currency ${budgetCurrency}; treating budget as ${baseCurrency} (heuristic).`);
          assumptions.push({
            id: "budget_currency_assumed",
            value: baseCurrency,
            notes: `Budget currency ${budgetCurrency} could not be converted; treated as ${baseCurrency}.`,
          });
        }
      }

      // Select a usable (input/output) rate set.
      const pickedRates: Record<string, number> = {};
      if (apiRate.regional_rates && apiRate.regional_rates.length > 0) {
        const region = scenario.region ?? input.target_region;
        const match = region
          ? apiRate.regional_rates.find((rr) => rr.regions.some((r) => regionMatches(region, r)))
          : null;
        const picked = match ?? apiRate.regional_rates[0];
        if (!match) warnings.push(`Regional pricing for '${region}' not found; using ${picked.regions[0]} rates.`);
        if (typeof picked.input === "number") pickedRates.input = picked.input;
        if (typeof picked.output === "number") pickedRates.output = picked.output;
      } else if (apiRate.tiers && apiRate.tiers.length > 0) {
        const standard = apiRate.tiers.find((t) => t.name === "standard") ?? apiRate.tiers[0]!;
        warnings.push("Tiered token pricing exists; using 'standard' tier for budget capacity.");
        Object.assign(pickedRates, standard.rates);
      } else if (apiRate.rates) {
        Object.assign(pickedRates, apiRate.rates);
      }

      const inputRate = pickedRates.input ?? pickedRates.input_cache_miss ?? pickedRates.input_uncached ?? null;
      const outputRate = pickedRates.output ?? null;
      if (inputRate == null || outputRate == null) {
        warnings.push("Cannot compute budget capacity: missing input/output token rates.");
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:budget_capacity`,
          monthly_cost_estimate: {
            currency: baseCurrency,
            point: budgetBase,
            method: "assumed",
            confidence: "low",
            confidence_reasons: ["Budget provided but token rates are incomplete."],
            evidence,
          },
          line_items: [
            {
              kind: "budget_spend",
              label: "Budget spend",
              amount: {
                currency: baseCurrency,
                point: budgetBase,
                method: budgetCurrency === baseCurrency ? "direct" : "derived",
                confidence: budgetCurrency === baseCurrency ? "high" : "medium",
                confidence_reasons: budgetCurrency === baseCurrency ? [] : ["Budget converted using FX when available."],
                evidence,
              },
            },
          ],
          metrics: [],
          assumptions,
          evidence,
          warnings,
          entitlements: [],
        });
        continue;
      }

      const ratioRaw = scenario.input_to_output_ratio ?? "3:1";
      const parsedRatio = parseRatio(ratioRaw);
      const ratio = parsedRatio ?? { input: 3, output: 1 };
      const ratioLabel = parsedRatio ? ratioRaw : "3:1";
      if (!parsedRatio && ratioRaw !== "3:1") warnings.push("Invalid input_to_output_ratio; defaulted to 3:1.");
      assumptions.push({
        id: "input_to_output_ratio",
        value: ratioLabel,
        notes: "Used to compute budget-based token capacity.",
      });

      const weightInput = ratio.input / (ratio.input + ratio.output);
      const weightOutput = ratio.output / (ratio.input + ratio.output);
      const blendedUsdPer1M = inputRate * weightInput + outputRate * weightOutput;
      const totalTokens = blendedUsdPer1M > 0 ? (budgetBase / blendedUsdPer1M) * 1_000_000 : 0;
      const inputTokens = totalTokens * weightInput;
      const outputTokens = totalTokens * weightOutput;

      const budgetAmountEstimate: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: budgetBase,
        method: budgetCurrency === baseCurrency ? "direct" : "derived",
        confidence: budgetCurrency === baseCurrency ? "high" : "medium",
        confidence_reasons: budgetCurrency === baseCurrency ? [] : ["Budget converted using FX when available."],
        evidence,
      };

      const metrics: MetricLineItem[] = [
        {
          kind: "capacity_total_tokens",
          label: "Token capacity (total tokens)",
          metric: {
            unit: "tokens",
            point: totalTokens,
            method: "derived",
            confidence: apiRate.verified ? "high" : "medium",
            confidence_reasons: apiRate.verified ? [] : ["Token rates are not verified."],
            evidence,
          },
        },
        {
          kind: "capacity_input_tokens",
          label: "Token capacity (input tokens)",
          metric: {
            unit: "tokens",
            point: inputTokens,
            method: "derived",
            confidence: apiRate.verified ? "high" : "medium",
            confidence_reasons: apiRate.verified ? [] : ["Token rates are not verified."],
            evidence,
          },
        },
        {
          kind: "capacity_output_tokens",
          label: "Token capacity (output tokens)",
          metric: {
            unit: "tokens",
            point: outputTokens,
            method: "derived",
            confidence: apiRate.verified ? "high" : "medium",
            confidence_reasons: apiRate.verified ? [] : ["Token rates are not verified."],
            evidence,
          },
        },
      ];

      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:budget_capacity`,
        monthly_cost_estimate: budgetAmountEstimate,
        line_items: [{ kind: "budget_spend", label: "Budget spend", amount: budgetAmountEstimate }],
        metrics,
        assumptions,
        evidence,
        warnings,
        entitlements: [],
      });
      continue;
    }

    if (scenario.kind === "token_meter") {
      const apiRate = findApiRate(input.pricing, scenario.provider, scenario.channel, scenario.model);

      if (!apiRate) {
        const warnings: string[] = ["Token-meter entry missing; cannot compute baseline API-equivalent cost."];
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:token_meter`,
          monthly_cost_estimate: moneyZero(
            baseCurrency,
            "direct",
            "low",
            ["No matching token-meter entry found in pricing snapshot."],
            [],
          ),
          line_items: [],
          assumptions: [],
          evidence: [],
          warnings,
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
          baseCurrency,
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
          entitlements: [],
        });
        continue;
      }

      if (apiRate.tiers && apiRate.tiers.length > 0) {
        const normalized = normalizeTokenWorkload(input.workload);
        const inputTokens = normalized?.normalized.input_tokens ?? 0;
        if (!normalized) warnings.push("Tiered token pricing exists but workload is not token-based; using default tier.");
        const standard = apiRate.tiers.find((t) => t.name === "standard");
        const longContext = apiRate.tiers.find((t) => t.name === "long_context");
        const threshold = 200_000;
        const picked =
          longContext && inputTokens > threshold
            ? longContext
            : standard ?? apiRate.tiers[0];

        if (picked === longContext) warnings.push(`Selected long-context tier because input_tokens > ${threshold}.`);

        const result = tokenMeterCostFromRates(
          baseCurrency,
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
          entitlements: [],
        });
        continue;
      }

      if (!apiRate.rates) {
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.provider}:${scenario.model}:token_meter`,
          monthly_cost_estimate: moneyZero(
            baseCurrency,
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
        baseCurrency,
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
        entitlements: [],
      });
      continue;
    }

    if (scenario.kind === "tool_plan_api_pool_effective") {
      const plan = input.pricing.tool_plans.find(
        (p) => p.tool === scenario.tool && p.plan_id === scenario.plan_id,
      );
      const planEvidence = (plan?.source_ids ?? []).map((id) => ({ source_id: id }));

      const warnings: string[] = [];
      const assumptions: CalculationAssumption[] = [];

      if (!plan) {
        warnings.push("Tool plan not found; returning baseline token-meter only.");
      }

      const resolvedPool = resolvePlanPrice((plan ?? {}) as Record<string, unknown>);
      const seatCount =
        scenario.seat_count ?? (resolvedPool.isPerSeat ? 1 : undefined);
      if (resolvedPool.isPerSeat) {
        if (scenario.seat_count == null) {
          warnings.push("Per-seat subscription price found; assuming seat_count=1.");
          assumptions.push({ id: "seat_count", value: 1, notes: "Assumed default for per-seat pricing." });
        } else {
          assumptions.push({ id: "seat_count", value: seatCount ?? 1, notes: "Provided by request." });
        }
      }

      const subscriptionFee =
        resolvedPool.monthly != null && resolvedPool.isPerSeat && seatCount != null
          ? resolvedPool.monthly * seatCount
          : resolvedPool.monthly ?? 0;

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

      const metered = baseline.monthly_cost_estimate.point * (1 + markup);
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
        currency: baseCurrency,
        point: subscriptionFee,
        method: subscriptionFee > 0 ? "direct" : "heuristic",
        confidence: plan?.verified ? "high" : "medium",
        confidence_reasons: plan?.verified ? [] : ["Subscription price is not verified."],
        evidence: planEvidence,
      };

      const overageAmount: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: overage,
        method,
        confidence,
        confidence_reasons: confidenceReasons,
        evidence,
      };

      const totalAmount: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: total,
        method,
        confidence,
        confidence_reasons: confidenceReasons,
        evidence,
      };

      const allWarnings = [...warnings, ...baseline.warnings];
      const entitlements = selectEntitlements(
        slugifyProviderId(scenario.tool),
        scenario.plan_id,
        targetRegion,
        allWarnings,
      );

      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:api_pool_effective`,
        monthly_cost_estimate: totalAmount,
        line_items: [
          { kind: "subscription_fee", label: "Subscription fee", amount: subscriptionAmount },
          { kind: "overage", label: "Overage above included pool", amount: overageAmount, notes: `Included pool: $${poolUsd}` },
        ],
        assumptions,
        evidence,
        warnings: allWarnings,
        entitlements,
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

      const resolvedCredits = resolvePlanPrice((plan ?? {}) as Record<string, unknown>);
      const seatCount =
        scenario.seat_count ?? (resolvedCredits.isPerSeat ? 1 : undefined);
      if (resolvedCredits.isPerSeat) {
        if (scenario.seat_count == null) {
          warnings.push("Per-seat pricing detected; assuming seat_count=1.");
          assumptions.push({ id: "seat_count", value: 1, notes: "Assumed default." });
        } else {
          assumptions.push({ id: "seat_count", value: seatCount ?? 1, notes: "Provided by request." });
        }
      }

      const subscriptionFee =
        resolvedCredits.monthly != null && resolvedCredits.isPerSeat && seatCount != null
          ? resolvedCredits.monthly * seatCount
          : resolvedCredits.monthly ?? 0;

      if (!plan) warnings.push("Tool plan not found; returning $0 with warnings.");
      if (subscriptionFee === 0 && resolvedCredits.monthly == null) warnings.push("Subscription fee missing; treated as $0.");

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
        const derived = deriveUsdPerCreditFromTopups(plan?.topups_pricing);
        if (derived) {
          usdPerCredit = derived.usd_per_credit;
          usdPerCreditMethod = derived.method;
          usdPerCreditConfidence = plan?.verified ? derived.confidence : "low";
          usdPerCreditReasons.push(...derived.reasons);
          assumptions.push({ id: "usd_per_credit", value: usdPerCredit, notes: "Derived from tool plan top-ups pricing." });
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
        currency: baseCurrency,
        point: subscriptionFee,
        method: subscriptionFee > 0 ? "direct" : "heuristic",
        confidence: plan?.verified ? "high" : "medium",
        confidence_reasons: plan?.verified ? [] : ["Subscription price is not verified."],
        evidence: planEvidence,
      };

      const creditsAmount: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: creditSpendUsd,
        method: usdPerCreditMethod,
        confidence: usdPerCreditConfidence,
        confidence_reasons: usdPerCreditReasons,
        evidence: planEvidence,
      };

      const totalAmount: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: subscriptionFee + creditSpendUsd,
        method,
        confidence,
        confidence_reasons: confidenceReasons,
        evidence: planEvidence,
      };

      const metrics: MetricLineItem[] = [];
      const includedCredits = (plan as any)?.included_credits_per_month;
      if (typeof includedCredits === "number" && Number.isFinite(includedCredits) && includedCredits > 0) {
        metrics.push({
          kind: "included_credits_per_month",
          label: "Included credits per month",
          metric: {
            unit: "credits",
            point: includedCredits,
            method: "direct",
            confidence: plan?.verified ? "high" : "medium",
            confidence_reasons: plan?.verified ? [] : ["Included credits are not verified."],
            evidence: planEvidence,
          },
        });
        if (usdPerCredit != null) {
          metrics.push({
            kind: "included_credits_value_usd",
            label: "Implied value of included credits (USD)",
            metric: {
              unit: "USD",
              point: includedCredits * usdPerCredit,
              method: usdPerCreditMethod,
              confidence: usdPerCreditConfidence,
              confidence_reasons: usdPerCreditReasons,
              evidence: planEvidence,
            },
            notes: "Not token-equivalent; valued using USD/credit best-effort.",
          });
        }
      }

      const entitlements = selectEntitlements(
        slugifyProviderId(scenario.tool),
        scenario.plan_id,
        targetRegion,
        warnings,
      );

      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:credits_effective`,
        monthly_cost_estimate: totalAmount,
        line_items: [
          { kind: "subscription_fee", label: "Subscription fee", amount: subscriptionAmount },
          { kind: "credits_spend", label: "Credits spend (best-effort)", amount: creditsAmount },
        ],
        metrics: metrics.length > 0 ? metrics : undefined,
        assumptions,
        evidence: planEvidence,
        warnings,
        entitlements,
      });
      continue;
    }

    if (scenario.kind === "tool_plan_token_quota_effective") {
      const plan = input.pricing.tool_plans.find(
        (p) => p.tool === scenario.tool && p.plan_id === scenario.plan_id,
      );
      const evidence = (plan?.source_ids ?? []).map((id) => ({ source_id: id }));
      const warnings: string[] = [];
      const assumptions: CalculationAssumption[] = [];

      const resolvedQuota = resolvePlanPrice((plan ?? {}) as Record<string, unknown>);
      const seatCount =
        scenario.seat_count ?? (resolvedQuota.isPerSeat ? 1 : undefined);
      if (resolvedQuota.isPerSeat) {
        if (scenario.seat_count == null) {
          warnings.push("Per-seat pricing detected; assuming seat_count=1.");
          assumptions.push({ id: "seat_count", value: 1, notes: "Assumed default for per-seat pricing." });
        } else {
          assumptions.push({ id: "seat_count", value: seatCount ?? 1, notes: "Provided by request." });
        }
      }

      const subscriptionFee =
        resolvedQuota.monthly != null && resolvedQuota.isPerSeat && seatCount != null
          ? resolvedQuota.monthly * seatCount
          : resolvedQuota.monthly ?? 0;

      if (!plan) warnings.push("Tool plan not found; returning $0 with warnings.");

      if (plan && plan.pricing_type !== "token_quota" && plan.pricing_type !== "seat_subscription_with_token_quota") {
        warnings.push(`tool_plan_token_quota_effective used with pricing_type=${plan.pricing_type}; treating as best-effort.`);
      }

      const amount: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: subscriptionFee,
        method: subscriptionFee > 0 ? "direct" : "heuristic",
        confidence: plan?.verified ? "high" : "medium",
        confidence_reasons: plan?.verified ? [] : ["Tool plan price is not verified."],
        evidence,
      };

      const metrics: MetricLineItem[] = [];
      const includedTokens = (plan as any)?.included_tokens_per_month;
      if (typeof includedTokens === "number" && Number.isFinite(includedTokens) && includedTokens > 0) {
        metrics.push({
          kind: "included_tokens_per_month",
          label: "Included tokens per month",
          metric: {
            unit: "tokens",
            point: includedTokens,
            method: "direct",
            confidence: plan?.verified ? "high" : "medium",
            confidence_reasons: plan?.verified ? [] : ["Included token quota is not verified."],
            evidence,
          },
        });
      } else {
        warnings.push("No included_tokens_per_month found; cannot compute quota coverage.");
      }

      const totals = totalTokensFromWorkload(input.workload);
      if (totals) {
        assumptions.push(...totals.assumptions);
        warnings.push(...totals.warnings);
        metrics.push({
          kind: "workload_total_tokens_per_month",
          label: "Workload total tokens per month",
          metric: {
            unit: "tokens",
            point: totals.total_tokens,
            method: "derived",
            confidence: "medium",
            confidence_reasons: ["Derived from token workload fields."],
            evidence,
          },
        });
        if (typeof includedTokens === "number" && includedTokens > 0) {
          const pct = (totals.total_tokens / includedTokens) * 100;
          metrics.push({
            kind: "quota_percent_used",
            label: "Quota used (% of included)",
            metric: {
              unit: "percent",
              point: pct,
              method: "derived",
              confidence: "medium",
              confidence_reasons: [],
              evidence,
            },
          });
          if (totals.total_tokens > includedTokens) {
            warnings.push("Workload exceeds the included token quota; overage pricing/policy may apply.");
          }
        }
      } else {
        warnings.push("Quota coverage requires a token workload (tokens_per_month or total_tokens_per_month).");
      }

      const entitlements = selectEntitlements(
        slugifyProviderId(scenario.tool),
        scenario.plan_id,
        targetRegion,
        warnings,
      );

      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:token_quota_effective`,
        monthly_cost_estimate: amount,
        line_items: [{ kind: "subscription_fee", label: "Subscription fee", amount }],
        metrics: metrics.length > 0 ? metrics : undefined,
        assumptions,
        evidence,
        warnings,
        entitlements,
      });
      continue;
    }

    if (scenario.kind === "tool_plan_compute_units_effective") {
      const plan = input.pricing.tool_plans.find(
        (p) => p.tool === scenario.tool && p.plan_id === scenario.plan_id,
      );
      const evidence = (plan?.source_ids ?? []).map((id) => ({ source_id: id }));
      const warnings: string[] = [];
      const assumptions: CalculationAssumption[] = [];

      const resolvedCU = resolvePlanPrice((plan ?? {}) as Record<string, unknown>);
      const seatCount =
        scenario.seat_count ?? (resolvedCU.isPerSeat ? 1 : undefined);
      if (resolvedCU.isPerSeat) {
        if (scenario.seat_count == null) {
          warnings.push("Per-seat pricing detected; assuming seat_count=1.");
          assumptions.push({ id: "seat_count", value: 1, notes: "Assumed default for per-seat pricing." });
        } else {
          assumptions.push({ id: "seat_count", value: seatCount ?? 1, notes: "Provided by request." });
        }
      }

      const subscriptionFee =
        resolvedCU.monthly != null && resolvedCU.isPerSeat && seatCount != null
          ? resolvedCU.monthly * seatCount
          : resolvedCU.monthly ?? 0;

      const unitName = (plan as any)?.unit_name;
      const unitPriceUsd = (plan as any)?.unit_price_usd;
      const includedUnits = (plan as any)?.included_units_per_month;

      const amountFloor: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: subscriptionFee,
        method: subscriptionFee > 0 ? "direct" : "heuristic",
        confidence: plan?.verified ? "high" : "medium",
        confidence_reasons: plan?.verified ? [] : ["Tool plan price is not verified."],
        evidence,
      };

      const metrics: MetricLineItem[] = [];
      if (typeof unitName === "string") assumptions.push({ id: "unit_name", value: unitName, notes: "Plan billing unit name." });

      if (input.workload.kind !== "usage_units_per_month") {
        warnings.push("tool_plan_compute_units_effective requires usage_units_per_month workload.");
        const entitlements = selectEntitlements(slugifyProviderId(scenario.tool), scenario.plan_id, targetRegion, warnings);
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:compute_units_effective`,
          monthly_cost_estimate: amountFloor,
          line_items: [{ kind: "subscription_fee", label: "Subscription fee", amount: amountFloor }],
          metrics: metrics.length > 0 ? metrics : undefined,
          assumptions,
          evidence,
          warnings,
          entitlements,
        });
        continue;
      }

      const units = ensureFiniteNonNegative(input.workload.units, "units");
      const workloadUnitName = input.workload.unit_name;
      if (typeof unitName === "string" && workloadUnitName !== unitName) {
        warnings.push(`Workload unit_name='${workloadUnitName}' does not match plan unit_name='${unitName}'.`);
      }

      const included = typeof includedUnits === "number" && Number.isFinite(includedUnits) && includedUnits > 0 ? includedUnits : 0;
      if (typeof includedUnits === "number") {
        metrics.push({
          kind: "included_units_per_month",
          label: "Included units per month",
          metric: {
            unit: unitName ?? "units",
            point: includedUnits,
            method: "direct",
            confidence: plan?.verified ? "high" : "medium",
            confidence_reasons: plan?.verified ? [] : ["Included units are not verified."],
            evidence,
          },
        });
      }

      if (typeof unitPriceUsd !== "number" || !Number.isFinite(unitPriceUsd) || unitPriceUsd <= 0) {
        warnings.push("No unit_price_usd found; returning subscription floor only.");
        const entitlements = selectEntitlements(slugifyProviderId(scenario.tool), scenario.plan_id, targetRegion, warnings);
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:compute_units_effective`,
          monthly_cost_estimate: amountFloor,
          line_items: [{ kind: "subscription_fee", label: "Subscription fee", amount: amountFloor }],
          metrics: metrics.length > 0 ? metrics : undefined,
          assumptions,
          evidence,
          warnings,
          entitlements,
        });
        continue;
      }

      const billableUnits = Math.max(0, units - included);
      assumptions.push({ id: "billable_units", value: billableUnits, notes: "Computed as max(0, units - included_units_per_month)." });

      const usageCost = billableUnits * unitPriceUsd;
      const usageAmount: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: usageCost,
        method: "derived",
        confidence: plan?.verified ? "medium" : "low",
        confidence_reasons: plan?.verified ? [] : ["Unit price is not verified."],
        evidence,
      };

      const totalAmount: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: subscriptionFee + usageCost,
        method: "derived",
        confidence: plan?.verified ? "medium" : "low",
        confidence_reasons: plan?.verified ? [] : ["Includes derived unit usage cost."],
        evidence,
      };

      const entitlements = selectEntitlements(slugifyProviderId(scenario.tool), scenario.plan_id, targetRegion, warnings);
      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:compute_units_effective`,
        monthly_cost_estimate: totalAmount,
        line_items: [
          { kind: "subscription_fee", label: "Subscription fee", amount: amountFloor },
          { kind: "usage_overage", label: `Usage overage (${billableUnits} ${unitName ?? "units"})`, amount: usageAmount },
        ],
        metrics: metrics.length > 0 ? metrics : undefined,
        assumptions,
        evidence,
        warnings,
        entitlements,
      });
      continue;
    }

    if (scenario.kind === "tool_plan_premium_requests_effective") {
      const plan = input.pricing.tool_plans.find(
        (p) => p.tool === scenario.tool && p.plan_id === scenario.plan_id,
      );
      const evidence = (plan?.source_ids ?? []).map((id) => ({ source_id: id }));
      const warnings: string[] = [];
      const assumptions: CalculationAssumption[] = [];

      const resolvedPR = resolvePlanPrice((plan ?? {}) as Record<string, unknown>);
      const seatCount =
        scenario.seat_count ?? (resolvedPR.isPerSeat ? 1 : undefined);
      if (resolvedPR.isPerSeat) {
        if (scenario.seat_count == null) {
          warnings.push("Per-seat pricing detected; assuming seat_count=1.");
          assumptions.push({ id: "seat_count", value: 1, notes: "Assumed default for per-seat pricing." });
        } else {
          assumptions.push({ id: "seat_count", value: seatCount ?? 1, notes: "Provided by request." });
        }
      }

      const subscriptionFee =
        resolvedPR.monthly != null && resolvedPR.isPerSeat && seatCount != null
          ? resolvedPR.monthly * seatCount
          : resolvedPR.monthly ?? 0;

      const floor: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: subscriptionFee,
        method: resolvedPR.monthly != null ? "direct" : "heuristic",
        confidence: plan?.verified ? "high" : "medium",
        confidence_reasons: plan?.verified ? [] : ["Tool plan price is not verified."],
        evidence,
      };

      if (input.workload.kind !== "premium_requests_per_month") {
        warnings.push("tool_plan_premium_requests_effective requires premium_requests_per_month workload.");
        const entitlements = selectEntitlements(slugifyProviderId(scenario.tool), scenario.plan_id, targetRegion, warnings);
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:premium_requests_effective`,
          monthly_cost_estimate: floor,
          line_items: [{ kind: "subscription_fee", label: "Subscription fee", amount: floor }],
          assumptions,
          evidence,
          warnings,
          entitlements,
        });
        continue;
      }

      const included =
        (plan as any)?.included_premium_requests_per_month ??
        (plan as any)?.included_requests_per_month;
      const unitPriceUsd =
        (plan as any)?.overage_usd_per_premium_request ??
        (plan as any)?.unit_price_usd;
      const requests = ensureFiniteNonNegative(input.workload.requests, "requests");

      if (typeof included !== "number" || !Number.isFinite(included) || included < 0) {
        warnings.push("No included_premium_requests_per_month found; returning subscription floor only.");
        const entitlements = selectEntitlements(slugifyProviderId(scenario.tool), scenario.plan_id, targetRegion, warnings);
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:premium_requests_effective`,
          monthly_cost_estimate: floor,
          line_items: [{ kind: "subscription_fee", label: "Subscription fee", amount: floor }],
          assumptions,
          evidence,
          warnings,
          entitlements,
        });
        continue;
      }

      if (typeof unitPriceUsd !== "number" || !Number.isFinite(unitPriceUsd) || unitPriceUsd <= 0) {
        warnings.push("No overage_usd_per_premium_request found; returning subscription floor only.");
        const entitlements = selectEntitlements(slugifyProviderId(scenario.tool), scenario.plan_id, targetRegion, warnings);
        results.push({
          scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:premium_requests_effective`,
          monthly_cost_estimate: floor,
          line_items: [{ kind: "subscription_fee", label: "Subscription fee", amount: floor }],
          assumptions,
          evidence,
          warnings,
          entitlements,
        });
        continue;
      }

      const billable = Math.max(0, requests - included);
      assumptions.push({ id: "billable_requests", value: billable, notes: "Computed as max(0, requests - included_requests_per_month)." });

      const overageCost = billable * unitPriceUsd;
      const overageAmount: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: overageCost,
        method: "derived",
        confidence: plan?.verified ? "medium" : "low",
        confidence_reasons: plan?.verified ? [] : ["Request price is not verified."],
        evidence,
      };

      const totalAmount: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: subscriptionFee + overageCost,
        method: "derived",
        confidence: plan?.verified ? "medium" : "low",
        confidence_reasons: plan?.verified ? [] : ["Includes derived premium request overage cost."],
        evidence,
      };

      const entitlements = selectEntitlements(slugifyProviderId(scenario.tool), scenario.plan_id, targetRegion, warnings);
      results.push({
        scenario_id: scenario.scenario_id ?? `${scenario.tool}:${scenario.plan_id}:premium_requests_effective`,
        monthly_cost_estimate: totalAmount,
        line_items: [
          { kind: "subscription_fee", label: "Subscription fee", amount: floor },
          { kind: "premium_request_overage", label: `Premium request overage (${billable})`, amount: overageAmount },
        ],
        assumptions,
        evidence,
        warnings,
        entitlements,
      });
      continue;
    }

    if (scenario.kind === "break_even_vs_token_meter") {
      const tokenRate = findApiRate(
        input.pricing,
        scenario.token_meter.provider,
        scenario.token_meter.channel,
        scenario.token_meter.model,
      );
      const tokenEvidence = (tokenRate?.source_ids ?? []).map((id) => ({ source_id: id }));
      const warnings: string[] = [];
      const assumptions: CalculationAssumption[] = [];

      // Determine subject fee.
      let subjectLabel = "";
      let subjectFee = 0;
      let subjectVerified = false;
      let subjectEvidence: EvidenceRef[] = [];

      const subject = scenario.subject;
      if (subject.kind === "subscription") {
        subjectLabel = `${subject.provider}:${subject.plan_id}`;
        const sub = input.pricing.subscriptions.find(
          (s) => s.provider === subject.provider && s.plan_id === subject.plan_id,
        );
        subjectFee = sub?.price_usd_per_month ?? 0;
        subjectVerified = !!sub?.verified;
        subjectEvidence = (sub?.source_ids ?? []).map((id) => ({ source_id: id }));
        if (!sub || sub.price_usd_per_month == null) warnings.push("Subscription price missing; break-even USD is not computable beyond $0.");
      } else {
        subjectLabel = `${subject.tool}:${subject.plan_id}`;
        const plan = input.pricing.tool_plans.find(
          (p) => p.tool === subject.tool && p.plan_id === subject.plan_id,
        );
        const resolvedBE = resolvePlanPrice((plan ?? {}) as Record<string, unknown>);
        const seatCount =
          subject.seat_count ?? (resolvedBE.isPerSeat ? 1 : undefined);
        if (resolvedBE.isPerSeat && subject.seat_count == null) {
          warnings.push("Per-seat pricing detected; assuming seat_count=1 for break-even.");
          assumptions.push({ id: "seat_count", value: 1, notes: "Assumed default for per-seat pricing." });
        }
        subjectFee =
          resolvedBE.monthly != null && resolvedBE.isPerSeat && seatCount != null
            ? resolvedBE.monthly * seatCount
            : resolvedBE.monthly ?? 0;
        subjectVerified = !!plan?.verified;
        subjectEvidence = (plan?.source_ids ?? []).map((id) => ({ source_id: id }));
        if (!plan) warnings.push("Tool plan not found; break-even USD is not computable beyond $0.");
      }

      const ratioRaw = scenario.input_to_output_ratio ?? "3:1";
      const parsed = parseRatio(ratioRaw);
      const ratio = parsed ?? { input: 3, output: 1 };
      const ratioLabel = parsed ? ratioRaw : "3:1";
      if (!parsed && ratioRaw !== "3:1") warnings.push("Invalid input_to_output_ratio; defaulted to 3:1.");
      assumptions.push({ id: "input_to_output_ratio", value: ratioLabel, notes: "Used for break-even token conversion." });

      const markup = scenario.markup_multiplier ?? 0;
      if (scenario.markup_multiplier == null) {
        assumptions.push({ id: "markup_multiplier", value: 0, notes: "Assumed default." });
      } else {
        assumptions.push({ id: "markup_multiplier", value: markup, notes: "Provided by request." });
      }

      const evidence = [...subjectEvidence, ...tokenEvidence];

      // Break-even USD per month is just the fee floor.
      const breakEvenUsd: EvidencedMoneyEstimate = {
        currency: baseCurrency,
        point: subjectFee,
        method: "derived",
        confidence: subjectVerified ? "high" : "medium",
        confidence_reasons: subjectVerified ? [] : ["Subject price is not verified."],
        evidence,
      };

      const lineItems: CostLineItem[] = [
        { kind: "plan_fee_floor", label: "Plan fee floor", amount: breakEvenUsd },
      ];

      const metrics: MetricLineItem[] = [];

      // If token rates exist, convert break-even USD -> tokens using a ratio.
      const pickedRates: Record<string, number> = {};
      if (tokenRate?.regional_rates && tokenRate.regional_rates.length > 0) {
        const region = scenario.token_meter.region ?? input.target_region;
        const match = region
          ? tokenRate.regional_rates.find((rr) => rr.regions.includes(region))
          : null;
        const picked = match ?? tokenRate.regional_rates[0];
        if (!match) warnings.push("Regional token pricing exists but no matching region provided; using first regional rate set for break-even.");
        if (typeof picked.input === "number") pickedRates.input = picked.input;
        if (typeof picked.output === "number") pickedRates.output = picked.output;
      } else if (tokenRate?.tiers && tokenRate.tiers.length > 0) {
        const standard = tokenRate.tiers.find((t) => t.name === "standard") ?? tokenRate.tiers[0]!;
        warnings.push("Tiered token pricing exists; using 'standard' tier for break-even token conversion.");
        Object.assign(pickedRates, standard.rates);
      } else if (tokenRate?.rates) {
        Object.assign(pickedRates, tokenRate.rates);
      }

      const inputRate = pickedRates.input ?? pickedRates.input_cache_miss ?? pickedRates.input_uncached ?? null;
      const outputRate = pickedRates.output ?? null;
      if (inputRate != null && outputRate != null && subjectFee > 0) {
        const weightInput = ratio.input / (ratio.input + ratio.output);
        const weightOutput = ratio.output / (ratio.input + ratio.output);
        const blendedUsdPer1M = inputRate * weightInput + outputRate * weightOutput;
        const breakEvenTotalTokens = blendedUsdPer1M > 0 ? (subjectFee / blendedUsdPer1M) * 1_000_000 : 0;
        metrics.push({
          kind: "break_even_total_tokens_per_month",
          label: "Break-even token usage (total tokens/month)",
          metric: {
            unit: "tokens",
            point: breakEvenTotalTokens,
            method: "derived",
            confidence: tokenRate?.verified ? "high" : "medium",
            confidence_reasons: tokenRate?.verified ? [] : ["Token rates are not verified."],
            evidence,
          },
          notes: "Assumes a fixed input:output ratio; ignores caching.",
        });
      } else {
        warnings.push("Cannot compute break-even tokens: missing token rates or subject fee.");
      }

      // Pool plans + markup: add best-effort notes about where the plan may stop being favorable.
      if (subject.kind === "tool_plan") {
        const plan = input.pricing.tool_plans.find(
          (p) => p.tool === subject.tool && p.plan_id === subject.plan_id,
        );
        const poolUsd = plan?.included_pool_usd;
        if ((plan?.pricing_type === "api_pool_usd" || plan?.pricing_type === "usd_credits_pool") && typeof poolUsd === "number") {
          if (markup > 0) {
            if (poolUsd > subjectFee) {
              const maxApiSpendWhereCheaper = (poolUsd - subjectFee) / markup;
              lineItems.push({
                kind: "pool_max_api_spend_where_plan_beats_api",
                label: "Max API spend where pool plan can still beat API (best-effort)",
                amount: {
                  currency: baseCurrency,
                  point: maxApiSpendWhereCheaper,
                  method: "derived",
                  confidence: plan?.verified ? "medium" : "low",
                  confidence_reasons: ["Pool plans with markup can be worse at very high usage."],
                  evidence,
                },
                notes: "Upper bound on API-equivalent spend where plan may still be cheaper; depends on pool and markup assumptions.",
              });
            } else {
              warnings.push("Pool <= fee and markup > 0: pool plan likely never beats direct API on cost.");
            }
          } else {
            if (poolUsd >= subjectFee) {
              warnings.push("Pool >= fee and markup=0: pool plan is always <= direct API cost (ignoring other limits).");
            } else {
              warnings.push("Pool < fee and markup=0: pool plan is always >= direct API cost (ignoring other limits).");
            }
          }
        }
      }

      results.push({
        scenario_id: scenario.scenario_id ?? `break_even:${subjectLabel}:${scenario.token_meter.provider}:${scenario.token_meter.model}`,
        monthly_cost_estimate: breakEvenUsd,
        line_items: lineItems,
        metrics,
        assumptions,
        evidence,
        warnings,
        entitlements: [],
      });
      continue;
    }
  }

  function convertEstimate(
    estimate: EvidencedMoneyEstimate,
    scenarioWarnings: string[],
    scenarioAssumptions: CalculationAssumption[],
  ): EvidencedMoneyEstimate {
    if (requestedCurrency === baseCurrency) return estimate;
    const fx = input.fx;
    if (!fx) {
      scenarioWarnings.push(`No FX snapshot available; returning amounts in ${baseCurrency}.`);
      return estimate;
    }
    if (fx.meta.base_currency !== baseCurrency) {
      scenarioWarnings.push(`FX base currency is ${fx.meta.base_currency}; expected ${baseCurrency}. Returning ${baseCurrency}.`);
      return estimate;
    }
    const rate = fx.rates[requestedCurrency];
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      scenarioWarnings.push(`No FX rate for ${requestedCurrency}; returning ${baseCurrency}.`);
      return estimate;
    }

    scenarioAssumptions.push({
      id: "fx_rate",
      value: rate,
      notes: `Converted from ${baseCurrency} to ${requestedCurrency} using FX effective_date=${fx.meta.effective_date}.`,
    });

    return {
      ...estimate,
      currency: requestedCurrency,
      point: estimate.point * rate,
      low: estimate.low != null ? estimate.low * rate : undefined,
      high: estimate.high != null ? estimate.high * rate : undefined,
      method: "derived",
      confidence: estimate.confidence === "high" ? "medium" : "low",
      confidence_reasons: [
        ...estimate.confidence_reasons,
        `Converted from ${baseCurrency} using FX effective_date=${fx.meta.effective_date}.`,
      ],
    };
  }

  const converted = results.map((r) => {
    const warnings = [...r.warnings];
    const assumptions = [...r.assumptions];
    const monthly = convertEstimate(r.monthly_cost_estimate, warnings, assumptions);
    const lineItems = r.line_items.map((li) => ({
      ...li,
      amount: convertEstimate(li.amount, warnings, assumptions),
    }));
    return { ...r, monthly_cost_estimate: monthly, line_items: lineItems, warnings, assumptions };
  });

  return { generated_at: nowIsoTimestamp(), scenarios: converted };
}
