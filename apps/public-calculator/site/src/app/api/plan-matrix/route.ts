import type {
  EntitlementsSnapshotV01,
  EntitlementV01,
  FxSnapshotV01,
  ModelsSnapshotV01,
  PricingSnapshotV01,
  ScenarioResult,
  ToolPlanV01,
  WorkloadRequest,
} from "@ai-cost-analysis/core";
import { calculate } from "@ai-cost-analysis/core";
import { NextResponse } from "next/server";
import {
  loadLatestEntitlementsSnapshot,
  loadLatestFxSnapshot,
  loadLatestModelsSnapshot,
  loadLatestPricingSnapshot,
} from "@/lib/public-datasets";
import type { PlanViability } from "@/types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseWorkload(value: unknown): WorkloadRequest {
  if (!isRecord(value) || !isString(value.kind)) {
    throw new Error("workload.kind is required");
  }

  if (value.kind === "tokens_per_month") {
    if (!isNumber(value.input_tokens) || !isNumber(value.output_tokens)) {
      throw new Error("tokens_per_month requires input_tokens and output_tokens (numbers)");
    }
    const cached = value.cached_input_tokens;
    if (cached != null && !isNumber(cached)) {
      throw new Error("cached_input_tokens must be a number when provided");
    }
    return {
      kind: "tokens_per_month",
      input_tokens: value.input_tokens,
      output_tokens: value.output_tokens,
      cached_input_tokens: cached ?? undefined,
    };
  }

  if (value.kind === "total_tokens_per_month") {
    if (!isNumber(value.total_tokens)) {
      throw new Error("total_tokens_per_month requires total_tokens (number)");
    }
    const cached = value.cached_input_tokens;
    if (cached != null && !isNumber(cached)) {
      throw new Error("cached_input_tokens must be a number when provided");
    }
    const ratio = isString(value.input_to_output_ratio) ? value.input_to_output_ratio : undefined;
    return {
      kind: "total_tokens_per_month",
      total_tokens: value.total_tokens,
      cached_input_tokens: cached ?? undefined,
      assumptions: ratio ? { input_to_output_ratio: ratio } : undefined,
    };
  }

  if (value.kind === "credits_per_month") {
    if (!isNumber(value.credits)) {
      throw new Error("credits_per_month requires credits (number)");
    }
    return { kind: "credits_per_month", credits: value.credits };
  }

  if (value.kind === "budget_per_month") {
    if (isNumber(value.budget_usd)) {
      return { kind: "budget_per_month", budget: value.budget_usd, currency: "USD" };
    }
    if (!isNumber(value.budget) || !isString(value.currency)) {
      throw new Error("budget_per_month requires budget (number) and currency (string)");
    }
    return { kind: "budget_per_month", budget: value.budget, currency: value.currency };
  }

  if (value.kind === "premium_requests_per_month") {
    if (!isNumber(value.requests)) {
      throw new Error("premium_requests_per_month requires requests (number)");
    }
    return { kind: "premium_requests_per_month", requests: value.requests };
  }

  if (value.kind === "usage_units_per_month") {
    if (!isString(value.unit_name) || !isNumber(value.units)) {
      throw new Error("usage_units_per_month requires unit_name (string) and units (number)");
    }
    return { kind: "usage_units_per_month", unit_name: value.unit_name, units: value.units };
  }

  throw new Error(`Unknown workload kind: ${value.kind}`);
}

type BudgetRequest = { amount: number; currency: string };

function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  fx: FxSnapshotV01 | null,
  baseCurrency: string,
): { amount: number; warnings: string[] } {
  const warnings: string[] = [];
  if (fromCurrency === toCurrency) return { amount, warnings };
  if (!fx) {
    warnings.push("No FX snapshot available; cannot convert budget.");
    return { amount, warnings };
  }
  if (fx.meta.base_currency !== baseCurrency) {
    warnings.push(
      `FX base currency is ${fx.meta.base_currency}; expected ${baseCurrency}. Cannot convert budget.`,
    );
    return { amount, warnings };
  }

  const rateFrom = fromCurrency === baseCurrency ? 1 : fx.rates[fromCurrency];
  const rateTo = toCurrency === baseCurrency ? 1 : fx.rates[toCurrency];

  if (typeof rateFrom !== "number" || !Number.isFinite(rateFrom) || rateFrom <= 0) {
    warnings.push(`Missing FX rate for ${fromCurrency}; cannot convert budget.`);
    return { amount, warnings };
  }
  if (typeof rateTo !== "number" || !Number.isFinite(rateTo) || rateTo <= 0) {
    warnings.push(`Missing FX rate for ${toCurrency}; cannot convert budget.`);
    return { amount, warnings };
  }

  const inBase = fromCurrency === baseCurrency ? amount : amount / rateFrom;
  const out = toCurrency === baseCurrency ? inBase : inBase * rateTo;
  return { amount: out, warnings };
}

function indexResults(results: ScenarioResult[]): Map<string, ScenarioResult> {
  const map = new Map<string, ScenarioResult>();
  for (const r of results) map.set(r.scenario_id, r);
  return map;
}

function providersFromEntitlements(entitlements: EntitlementV01[]): string[] {
  const providers = new Set<string>();
  for (const e of entitlements) {
    if (typeof e.feature_id !== "string") continue;
    if (e.feature_id.startsWith("provider_access:")) {
      providers.add(e.feature_id.slice("provider_access:".length));
    }
    if (e.feature_id.startsWith("model_access:")) {
      const rest = e.feature_id.slice("model_access:".length);
      const provider = rest.split(":")[0];
      if (provider) providers.add(provider);
    }
  }
  return Array.from(providers).sort();
}

function modalitiesFromEntitlements(entitlements: EntitlementV01[]): string[] {
  const modalities = new Set<string>();
  for (const e of entitlements) {
    if (typeof e.feature_id !== "string") continue;
    if (e.feature_id.startsWith("modality_access:")) {
      modalities.add(e.feature_id.slice("modality_access:".length));
    }
  }
  return Array.from(modalities).sort();
}

function modelAccessFromEntitlements(entitlements: EntitlementV01[]): string[] {
  const models = new Set<string>();
  for (const e of entitlements) {
    if (typeof e.feature_id !== "string") continue;
    if (e.feature_id.startsWith("model_access:")) {
      models.add(e.feature_id.slice("model_access:".length));
    }
  }
  return Array.from(models).sort();
}

function familyForProvider(provider: string): string | null {
  switch (provider) {
    case "openai":
    case "azure":
      return "gpt";
    case "anthropic":
      return "claude";
    case "google":
      return "gemini";
    case "moonshot":
      return "kimi";
    default:
      return null;
  }
}

function findModelInfo(
  models: ModelsSnapshotV01,
  provider: string,
  model: string,
): ModelsSnapshotV01["models"][number] | null {
  const direct = models.models.find((m) => m.provider === provider && m.model === model);
  if (direct) return direct;

  const target = model.toLowerCase();
  const aliasMatch = models.models.find((m) => {
    if (m.provider !== provider) return false;
    const aliases = Array.isArray(m.aliases) ? m.aliases : [];
    if (aliases.some((a) => String(a).toLowerCase() === target)) return true;
    const maybeRecord = m as unknown as Record<string, unknown>;
    const azureLabel =
      typeof maybeRecord.azure_model_label === "string" ? maybeRecord.azure_model_label : null;
    if (azureLabel && String(azureLabel).toLowerCase() === target) return true;
    return false;
  });

  return aliasMatch ?? null;
}

function ratingValue(
  model: ModelsSnapshotV01["models"][number],
  system: string,
  metric: string,
): { score: number; scale: string | null; as_of: string } | null {
  const ratings = Array.isArray(model.ratings) ? model.ratings : [];
  const candidates = ratings
    .filter((r) => r.system === system && r.metric === metric && typeof r.score === "number")
    .sort((a, b) => String(b.as_of).localeCompare(String(a.as_of)));
  const best = candidates[0];
  if (!best) return null;
  return { score: best.score, scale: best.scale ?? null, as_of: best.as_of };
}

function cartesianProduct<T>(lists: T[][]): T[][] {
  if (lists.length === 0) return [[]];
  let acc: T[][] = [[]];
  for (const list of lists) {
    const next: T[][] = [];
    for (const prefix of acc) {
      for (const item of list) next.push([...prefix, item]);
    }
    acc = next;
  }
  return acc;
}

/**
 * Resolve the total number of tokens the user's workload represents.
 * Returns null if the workload isn't token-denominated.
 */
function resolveWorkloadTokens(workload: WorkloadRequest | null): number | null {
  if (!workload) return null;
  if (workload.kind === "tokens_per_month") {
    return workload.input_tokens + workload.output_tokens;
  }
  if (workload.kind === "total_tokens_per_month") {
    return workload.total_tokens;
  }
  return null;
}

/**
 * Assess whether a tool plan can plausibly serve the user's stated workload.
 *
 * Returns a viability classification and human-readable reason.
 * The logic checks known capacity fields in the pricing snapshot against the
 * workload's token volume.  When capacity data is absent or the plan's
 * metering unit is incommensurable with the workload unit, viability is
 * "viability_unknown" rather than a false positive.
 */
function assessToolPlanViability(
  tp: ToolPlanV01,
  workload: WorkloadRequest | null,
): { viability: PlanViability; reason: string } {
  const raw = tp as Record<string, unknown>;
  const pricingType = tp.pricing_type;

  const fmt = (tokens: number) => `${(tokens / 1_000_000).toFixed(1)}M`;

  // ── Resolve price from all known field name variants ───────────────
  const subPrice = raw.subscription_price_usd as number | null | undefined;
  const seatPrice = raw.subscription_price_usd_per_seat as number | null | undefined;
  const seatPricePerMonth = raw.subscription_price_usd_per_seat_per_month as
    | number
    | null
    | undefined;
  const creditTiers = raw.credit_tiers as unknown[] | null | undefined;
  const metering = (raw.metering as string | undefined) ?? "";
  const isByok =
    metering.toLowerCase().includes("byok") ||
    metering.toLowerCase().includes("your chosen provider");

  const hasPositivePrice =
    (typeof subPrice === "number" && subPrice > 0) ||
    (typeof seatPrice === "number" && seatPrice > 0) ||
    (typeof seatPricePerMonth === "number" && seatPricePerMonth > 0) ||
    (Array.isArray(creditTiers) && creditTiers.length > 0);

  const isExplicitlyFree =
    pricingType === "free_with_limits" ||
    (typeof subPrice === "number" && subPrice === 0 && !isByok);

  // ── Custom/enterprise pricing → always price_unavailable ──────────
  if (pricingType === "custom_enterprise") {
    return { viability: "price_unavailable", reason: "Enterprise pricing; contact vendor." };
  }

  // ── No discoverable price and not free → price_unavailable ────────
  if (!hasPositivePrice && !isExplicitlyFree && pricingType !== "prepaid_usd_credits") {
    // BYOK tools have $0 subscription intentionally — handle separately below
    if (!isByok && pricingType !== "compute_units") {
      return {
        viability: "price_unavailable",
        reason: "Pricing not publicly available; check vendor directly.",
      };
    }
  }

  // ── BYOK: $0 subscription but user always pays API costs ─────────
  // Always viability_unknown regardless of workload — the $0 subscription
  // is misleading since cost entirely depends on usage.
  if (isByok && !hasPositivePrice) {
    return {
      viability: "viability_unknown",
      reason:
        "BYOK — $0 subscription but you pay API costs through your provider. Switch to Token Usage tab to estimate your cost.",
    };
  }

  // ── PAYG: user always pays real usage costs ───────────────────────
  // Same logic — always flag even with no workload.
  if (pricingType === "prepaid_usd_credits" && !workload) {
    return {
      viability: "viability_unknown",
      reason:
        "Pay-as-you-go — no subscription fee, but you pay per-token usage costs. Switch to Token Usage tab to estimate your cost.",
    };
  }

  // ── No workload provided → can't assess further ───────────────────
  if (!workload) {
    return { viability: "viable", reason: "" };
  }

  const totalTokens = resolveWorkloadTokens(workload);

  // ── Prepaid USD credits (PAYG): user pays real usage costs ────────
  if (pricingType === "prepaid_usd_credits") {
    return {
      viability: "viability_unknown",
      reason:
        "Pay-as-you-go — no subscription fee, but you pay per-token usage costs. Actual monthly cost depends on your token usage and model choice.",
    };
  }

  // ── Compute units / opaque metering with $0 floor ─────────────────
  if (pricingType === "compute_units" && !hasPositivePrice) {
    return {
      viability: "viability_unknown",
      reason: "Compute-unit pricing is opaque; check vendor for capacity at your usage level.",
    };
  }

  // ── Free-with-limits: check hard capacity ─────────────────────────
  if (pricingType === "free_with_limits") {
    const includedTokens = raw.included_tokens_per_month as number | undefined;
    if (totalTokens != null && includedTokens != null && totalTokens > includedTokens) {
      return {
        viability: "non_viable",
        reason: `Free tier includes ${fmt(includedTokens)} tokens/month; workload requires ${fmt(totalTokens)}.`,
      };
    }

    const includedRequests = raw.included_agentic_requests_per_month as number | undefined;
    if (includedRequests != null && totalTokens != null) {
      const cap = includedRequests * 10_000;
      if (totalTokens > cap) {
        return {
          viability: "non_viable",
          reason: `Free tier includes ~${includedRequests} agentic requests/month (~${fmt(cap)} tokens equivalent); workload requires ${fmt(totalTokens)}.`,
        };
      }
    }

    const includedInline = raw.included_inline_suggestions_per_month as number | undefined;
    const includedPremium = raw.included_premium_requests_per_month as number | undefined;
    if (includedPremium != null && totalTokens != null) {
      const cap = includedPremium * 5_000 + (includedInline ?? 0) * 500;
      if (totalTokens > cap) {
        return {
          viability: "non_viable",
          reason: `Free tier includes ${includedPremium} premium requests/month (~${fmt(cap)} tokens equivalent); workload requires ${fmt(totalTokens)}.`,
        };
      }
    }

    const includedCredits30d = raw.included_credits_per_30_days as number | undefined;
    if (
      includedCredits30d != null &&
      includedCredits30d <= 10 &&
      totalTokens != null &&
      totalTokens > 100_000
    ) {
      return {
        viability: "non_viable",
        reason: `Free tier includes only ${includedCredits30d} credits per 30 days; insufficient for ${fmt(totalTokens)} tokens/month workload.`,
      };
    }

    if (
      includedTokens == null &&
      includedRequests == null &&
      includedPremium == null &&
      includedCredits30d == null
    ) {
      return {
        viability: "viability_unknown",
        reason: "Free tier capacity limits not quantified in our data.",
      };
    }
  }

  // ── Token quota plans: check if workload exceeds included tokens ───
  if (pricingType === "token_quota" || pricingType.includes("token_quota")) {
    const includedTokens = raw.included_tokens_per_month as number | undefined;
    if (totalTokens != null && includedTokens != null && totalTokens > includedTokens) {
      return {
        viability: "non_viable",
        reason: `Plan includes ${fmt(includedTokens)} tokens/month; workload requires ${fmt(totalTokens)}.`,
      };
    }
  }

  // ── Premium request plans at $0: check request capacity ───────────
  if (pricingType === "premium_requests" && typeof subPrice === "number" && subPrice === 0) {
    const includedRequests = raw.included_premium_requests_per_month as number | undefined;
    if (includedRequests != null && totalTokens != null) {
      const cap = includedRequests * 5_000;
      if (totalTokens > cap) {
        return {
          viability: "non_viable",
          reason: `Free tier includes ${includedRequests} premium requests/month (~${fmt(cap)} tokens equivalent); workload requires ${fmt(totalTokens)}.`,
        };
      }
    }
  }

  // ── Credits-based plans with very low credit counts ────────────────
  if (pricingType === "credits" || pricingType.includes("credits")) {
    const includedCredits = (raw.included_credits_per_month_per_seat ??
      raw.included_credits_per_month ??
      raw.included_credits_per_30_days_per_seat ??
      raw.included_credits_per_30_days ??
      raw.included_credits_per_seat ??
      raw.included_credits) as number | undefined;

    if (
      includedCredits != null &&
      includedCredits <= 10 &&
      totalTokens != null &&
      totalTokens > 100_000
    ) {
      return {
        viability: "non_viable",
        reason: `Plan includes only ${includedCredits} credits; insufficient for ${fmt(totalTokens)} tokens/month workload.`,
      };
    }
  }

  // ── Default: plan has a real price and no disqualifying capacity issue
  return { viability: "viable", reason: "" };
}

/**
 * Derive USD-per-credit from a tool plan's topup pricing data.
 * Different platforms store topup info in different shapes; this
 * normalizes them all to a single number (or null).
 */
function deriveUsdPerCredit(plan: Record<string, unknown>): {
  usd_per_credit: number | null;
  source: string;
} {
  // 1. Explicit credit_conversion field (JetBrains, Qoder)
  const cc = plan.credit_conversion as Record<string, unknown> | undefined;
  if (cc) {
    const explicit = cc.usd_per_credit ?? cc.usd_per_credit_regular ?? cc.usd_per_credit_discount;
    if (typeof explicit === "number") {
      return { usd_per_credit: explicit, source: "explicit credit_conversion" };
    }
  }

  // 2. topups_pricing with usd_per_credit (JetBrains style)
  const tp = plan.topups_pricing as Record<string, unknown> | undefined;
  if (tp && typeof tp.usd_per_credit === "number") {
    return { usd_per_credit: tp.usd_per_credit, source: "topup pack pricing" };
  }
  if (tp && typeof tp.price_usd_per_credit === "number") {
    return { usd_per_credit: tp.price_usd_per_credit, source: "topup pack pricing" };
  }
  // Lovable style: price_usd_per_50_credits
  if (tp && typeof tp.price_usd_per_50_credits === "number") {
    return {
      usd_per_credit: (tp.price_usd_per_50_credits as number) / 50,
      source: "derived from topup pack (price_per_50_credits)",
    };
  }
  // topups_pricing with credits+price (Windsurf teams style)
  if (
    tp &&
    typeof tp.price_usd === "number" &&
    typeof tp.credits === "number" &&
    (tp.credits as number) > 0
  ) {
    return {
      usd_per_credit: (tp.price_usd as number) / (tp.credits as number),
      source: "derived from topup pack",
    };
  }

  // 3. topups array (Windsurf, Warp, Verdent style) — use the best rate
  const topupsArr = plan.topups as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(topupsArr) && topupsArr.length > 0) {
    let bestRate = Infinity;
    for (const t of topupsArr) {
      const price = t.price_usd as number | undefined;
      const credits = t.credits as number | undefined;
      if (typeof price === "number" && typeof credits === "number" && credits > 0) {
        const rate = price / credits;
        if (rate < bestRate) bestRate = rate;
      }
    }
    if (bestRate < Infinity) {
      return { usd_per_credit: bestRate, source: "derived from best topup pack rate" };
    }
  }

  return { usd_per_credit: null, source: "" };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
    }

    const [
      { date: pricingDate, data: pricingRaw },
      { date: entitlementsDate, data: entitlementsRaw },
      { date: fxDate, data: fxRaw },
      { date: modelsDate, data: modelsRaw },
    ] = await Promise.all([
      loadLatestPricingSnapshot(),
      loadLatestEntitlementsSnapshot(),
      loadLatestFxSnapshot(),
      loadLatestModelsSnapshot(),
    ]);

    const pricing = pricingRaw as PricingSnapshotV01;
    const entitlements = entitlementsRaw as EntitlementsSnapshotV01;
    const fx = fxRaw as FxSnapshotV01;
    const models = modelsRaw as ModelsSnapshotV01;

    const baseCurrency = pricing.meta.default_currency ?? "USD";
    const outputCurrency = isString(body.output_currency) ? body.output_currency : baseCurrency;

    const evidencePolicy =
      body.evidence_policy === "allow_private" ? "allow_private" : "public_only";
    const targetRegion = isString(body.target_region) ? body.target_region : "us";

    const budget: BudgetRequest | null = isRecord(body.budget)
      ? {
          amount: isNumber(body.budget.amount) ? body.budget.amount : NaN,
          currency: isString(body.budget.currency) ? body.budget.currency : "",
        }
      : null;

    if (budget && (!Number.isFinite(budget.amount) || budget.amount < 0 || !budget.currency)) {
      return NextResponse.json(
        { error: "budget must be {amount:number, currency:string}" },
        { status: 400 },
      );
    }

    const workload: WorkloadRequest | null =
      body.workload != null ? parseWorkload(body.workload) : null;

    const tokenMeterDefault =
      isRecord(body.token_meter_default) &&
      isString(body.token_meter_default.provider) &&
      isString(body.token_meter_default.channel) &&
      isString(body.token_meter_default.model)
        ? {
            provider: body.token_meter_default.provider,
            channel: body.token_meter_default.channel,
            model: body.token_meter_default.model,
            region: isString(body.token_meter_default.region)
              ? body.token_meter_default.region
              : undefined,
          }
        : null;

    const assumptions = isRecord(body.assumptions) ? body.assumptions : {};
    const markupByTool = isRecord(assumptions.markup_by_tool) ? assumptions.markup_by_tool : null;
    const seatCountByPlan = isRecord(assumptions.seat_count_by_plan)
      ? assumptions.seat_count_by_plan
      : null;

    const requirements = isRecord(body.requirements) ? body.requirements : null;
    const requiredProviders =
      requirements && Array.isArray(requirements.providers)
        ? requirements.providers.filter(isString)
        : [];
    const requiredModalities =
      requirements && Array.isArray(requirements.modalities)
        ? requirements.modalities.filter(isString)
        : [];

    const include = isRecord(body.include) ? body.include : null;
    const toolFilter =
      include && Array.isArray(include.tools) ? include.tools.filter(isString) : null;
    const providerFilter =
      include && Array.isArray(include.providers) ? include.providers.filter(isString) : null;

    const toolPlans = pricing.tool_plans.filter((p) =>
      toolFilter ? toolFilter.includes(p.tool) : true,
    );
    const subscriptions = pricing.subscriptions.filter((s) =>
      providerFilter ? providerFilter.includes(s.provider) : true,
    );

    const scenarios = [];

    for (const tp of toolPlans) {
      const key = `${tp.tool}:${tp.plan_id}`;
      const seatCount =
        seatCountByPlan && typeof seatCountByPlan[key] === "number"
          ? (seatCountByPlan[key] as number)
          : undefined;

      scenarios.push({
        kind: "tool_plan_floor" as const,
        tool: tp.tool,
        plan_id: tp.plan_id,
        seat_count: seatCount,
        scenario_id: `tool_plan_floor:${key}`,
      });

      if (workload) {
        // Credits plans: if workload is credits_per_month, use directly
        if (
          (tp.pricing_type === "credits" || tp.pricing_type.includes("credits")) &&
          workload.kind === "credits_per_month"
        ) {
          scenarios.push({
            kind: "tool_plan_credits_effective" as const,
            tool: tp.tool,
            plan_id: tp.plan_id,
            seat_count: seatCount,
            scenario_id: `tool_plan_effective:${key}`,
          });
        }

        // Credits plans with token workloads: we know $/credit but NOT tokens→credits
        // conversion, so we cannot compute a meaningful effective cost without
        // fabricating a conversion ratio.  Skip the effective scenario; the credit
        // rate will be surfaced in the plan card metadata instead.

        // PAYG / prepaid_usd_credits plans with token workloads: the effective
        // cost is the token-meter baseline (they're pass-through gateways).
        if (
          tp.pricing_type === "prepaid_usd_credits" &&
          tokenMeterDefault &&
          (workload.kind === "tokens_per_month" || workload.kind === "total_tokens_per_month")
        ) {
          scenarios.push({
            kind: "tool_plan_api_pool_effective" as const,
            tool: tp.tool,
            plan_id: tp.plan_id,
            seat_count: seatCount,
            token_meter: tokenMeterDefault,
            markup_multiplier: 0,
            scenario_id: `tool_plan_effective:${key}`,
          });
        }

        if (
          (tp.pricing_type === "token_quota" || tp.pricing_type.includes("token_quota")) &&
          (workload.kind === "tokens_per_month" || workload.kind === "total_tokens_per_month")
        ) {
          scenarios.push({
            kind: "tool_plan_token_quota_effective" as const,
            tool: tp.tool,
            plan_id: tp.plan_id,
            seat_count: seatCount,
            scenario_id: `tool_plan_effective:${key}`,
          });
        }

        if (tp.pricing_type === "compute_units" && workload.kind === "usage_units_per_month") {
          scenarios.push({
            kind: "tool_plan_compute_units_effective" as const,
            tool: tp.tool,
            plan_id: tp.plan_id,
            seat_count: seatCount,
            scenario_id: `tool_plan_effective:${key}`,
          });
        }

        if (
          tp.pricing_type === "premium_requests" &&
          workload.kind === "premium_requests_per_month"
        ) {
          scenarios.push({
            kind: "tool_plan_premium_requests_effective" as const,
            tool: tp.tool,
            plan_id: tp.plan_id,
            seat_count: seatCount,
            scenario_id: `tool_plan_effective:${key}`,
          });
        }

        if (
          (tp.pricing_type === "api_pool_usd" || tp.pricing_type === "usd_credits_pool") &&
          tokenMeterDefault &&
          (workload.kind === "tokens_per_month" || workload.kind === "total_tokens_per_month")
        ) {
          const markup =
            markupByTool && typeof markupByTool[tp.tool] === "number"
              ? (markupByTool[tp.tool] as number)
              : undefined;
          scenarios.push({
            kind: "tool_plan_api_pool_effective" as const,
            tool: tp.tool,
            plan_id: tp.plan_id,
            seat_count: seatCount,
            token_meter: tokenMeterDefault,
            markup_multiplier: markup,
            scenario_id: `tool_plan_effective:${key}`,
          });
        }

        // BYOK subscription plans (e.g., Cline): effective cost = token-meter baseline
        // since the user pays API costs directly.
        if (
          (tp.pricing_type === "subscription" || tp.pricing_type === "seat_subscription") &&
          tokenMeterDefault &&
          (workload.kind === "tokens_per_month" || workload.kind === "total_tokens_per_month")
        ) {
          const raw = tp as Record<string, unknown>;
          const met = (raw.metering as string | undefined) ?? "";
          const isBYOK =
            met.toLowerCase().includes("byok") ||
            met.toLowerCase().includes("your chosen provider");
          if (isBYOK) {
            scenarios.push({
              kind: "tool_plan_api_pool_effective" as const,
              tool: tp.tool,
              plan_id: tp.plan_id,
              seat_count: seatCount,
              token_meter: tokenMeterDefault,
              markup_multiplier: 0,
              scenario_id: `tool_plan_effective:${key}`,
            });
          }
        }
      }

      if (tokenMeterDefault) {
        scenarios.push({
          kind: "break_even_vs_token_meter" as const,
          subject: {
            kind: "tool_plan" as const,
            tool: tp.tool,
            plan_id: tp.plan_id,
            seat_count: seatCount,
          },
          token_meter: tokenMeterDefault,
          scenario_id: `break_even:${key}`,
        });
      }
    }

    for (const sub of subscriptions) {
      const key = `${sub.provider}:${sub.plan_id}`;
      scenarios.push({
        kind: "subscription_floor" as const,
        provider: sub.provider,
        plan_id: sub.plan_id,
        scenario_id: `subscription_floor:${key}`,
      });
      if (tokenMeterDefault) {
        scenarios.push({
          kind: "break_even_vs_token_meter" as const,
          subject: { kind: "subscription" as const, provider: sub.provider, plan_id: sub.plan_id },
          token_meter: tokenMeterDefault,
          scenario_id: `break_even:${key}`,
        });
      }
    }

    const engineOut = calculate({
      pricing,
      entitlements,
      fx,
      workload: workload ?? { kind: "tokens_per_month", input_tokens: 0, output_tokens: 0 },
      scenarios,
      target_region: targetRegion,
      evidence_policy: evidencePolicy,
      output_currency: outputCurrency,
    });

    const byId = indexResults(engineOut.scenarios);

    const budgetConverted = budget
      ? convertCurrency(budget.amount, budget.currency, outputCurrency, fx ?? null, baseCurrency)
      : null;
    const budgetAmountInOutput = budgetConverted ? budgetConverted.amount : null;

    const planEntries = [];

    for (const tp of toolPlans) {
      const key = `${tp.tool}:${tp.plan_id}`;
      const floor = byId.get(`tool_plan_floor:${key}`) ?? null;
      const effective = byId.get(`tool_plan_effective:${key}`) ?? null;
      const breakEven = byId.get(`break_even:${key}`) ?? null;

      const ent = (effective?.entitlements ?? floor?.entitlements ?? []) as EntitlementV01[];
      const providers = providersFromEntitlements(ent);
      const modalities = modalitiesFromEntitlements(ent);
      const modelAccess = modelAccessFromEntitlements(ent);

      const inferredFamilies = new Set<string>();
      for (const p of providers) {
        const fam = familyForProvider(p);
        if (fam) inferredFamilies.add(fam);
      }

      const notes: string[] = [];
      if (providers.length === 0)
        notes.push(
          "Provider/model access is unknown unless entitlements include provider_access:* or model_access:*.",
        );
      if (modalities.length === 0)
        notes.push("Modalities are unknown unless entitlements include modality_access:*.");

      const best = effective ?? floor;
      const bestCost = best?.monthly_cost_estimate ?? null;
      const fitsBudget =
        budgetAmountInOutput != null && bestCost ? bestCost.point <= budgetAmountInOutput : null;

      const missingModalities =
        requiredModalities.length > 0
          ? requiredModalities.filter((rm) => !modalities.includes(rm))
          : [];

      const modelDetails = modelAccess
        .map((id) => {
          const [provider, model] = id.split(":");
          const match = provider && model ? findModelInfo(models, provider, model) : null;
          if (!match) return null;

          const azureQuality = ratingValue(
            match,
            "azure-foundry-model-leaderboard",
            "quality_index",
          );
          const azureSafety = ratingValue(
            match,
            "azure-foundry-model-leaderboard",
            "safety_attack_success_rate_percent",
          );

          return {
            provider: match.provider,
            model: match.model,
            family: match.family ?? null,
            has_ratings: Array.isArray(match.ratings) && match.ratings.length > 0,
            ratings_summary: {
              azure_quality_index: azureQuality,
              azure_safety_attack_success_rate_percent: azureSafety,
            },
          };
        })
        .filter(Boolean);

      let { viability, reason: viabilityReason } = assessToolPlanViability(tp, workload);

      // If the viability check said "unknown" but the engine successfully computed
      // an effective cost, upgrade to viable — we now have a real number.
      if (
        viability === "viability_unknown" &&
        effective &&
        effective.monthly_cost_estimate.point > 0
      ) {
        viability = "viable";
        viabilityReason = "";
      }

      // Non-viable and price-unavailable plans don't "fit" a budget even if their floor is $0
      const adjustedFitsBudget =
        viability === "non_viable" || viability === "price_unavailable" ? false : fitsBudget;

      // For credit-based plans, surface the derived credit rate so the UI can show it
      const rawTp = tp as Record<string, unknown>;
      const isPricedByCredits =
        tp.pricing_type === "credits" || tp.pricing_type.includes("credits");
      const derivedCreditRate = isPricedByCredits ? deriveUsdPerCredit(rawTp) : null;

      planEntries.push({
        kind: "tool_plan",
        tool: tp.tool,
        plan_id: tp.plan_id,
        pricing_type: tp.pricing_type,
        monthly_cost_floor: floor,
        monthly_cost_effective: effective,
        break_even: breakEven,
        fits_budget: adjustedFitsBudget,
        viability,
        viability_reason: viabilityReason || undefined,
        credit_rate:
          derivedCreditRate?.usd_per_credit != null
            ? { usd_per_credit: derivedCreditRate.usd_per_credit, source: derivedCreditRate.source }
            : null,
        capabilities: {
          providers: providers.length > 0 ? providers : null,
          families: inferredFamilies.size > 0 ? Array.from(inferredFamilies).sort() : null,
          modalities: modalities.length > 0 ? modalities : null,
          model_access: modelAccess.length > 0 ? modelAccess : null,
          model_details: modelDetails.length > 0 ? modelDetails : null,
          notes,
          missing: {
            providers:
              requiredProviders.length > 0 && providers.length > 0
                ? requiredProviders.filter((rp) => !providers.includes(rp))
                : null,
            modalities:
              requiredModalities.length > 0 && modalities.length > 0 ? missingModalities : null,
          },
        },
      });
    }

    for (const sub of subscriptions) {
      const key = `${sub.provider}:${sub.plan_id}`;
      const floor = byId.get(`subscription_floor:${key}`) ?? null;
      const breakEven = byId.get(`break_even:${key}`) ?? null;

      const ent = (floor?.entitlements ?? []) as EntitlementV01[];
      const entProviders = providersFromEntitlements(ent);
      const providers = Array.from(new Set([sub.provider, ...entProviders])).sort();

      const modalities = modalitiesFromEntitlements(ent);
      const modelAccess = modelAccessFromEntitlements(ent);

      const families = Array.from(
        new Set(providers.map((p) => familyForProvider(p)).filter(Boolean)),
      );
      const best = floor;
      const bestCost = best?.monthly_cost_estimate ?? null;
      const fitsBudget =
        budgetAmountInOutput != null && bestCost ? bestCost.point <= budgetAmountInOutput : null;

      const modelDetails = modelAccess
        .map((id) => {
          const [provider, model] = id.split(":");
          const match = provider && model ? findModelInfo(models, provider, model) : null;
          if (!match) return null;

          const azureQuality = ratingValue(
            match,
            "azure-foundry-model-leaderboard",
            "quality_index",
          );
          const azureSafety = ratingValue(
            match,
            "azure-foundry-model-leaderboard",
            "safety_attack_success_rate_percent",
          );

          return {
            provider: match.provider,
            model: match.model,
            family: match.family ?? null,
            has_ratings: Array.isArray(match.ratings) && match.ratings.length > 0,
            ratings_summary: {
              azure_quality_index: azureQuality,
              azure_safety_attack_success_rate_percent: azureSafety,
            },
          };
        })
        .filter(Boolean);

      // Subscriptions: price_unavailable if no price; otherwise viable
      const subViability: PlanViability =
        sub.price_usd_per_month == null ? "price_unavailable" : "viable";
      const subViabilityReason =
        sub.price_usd_per_month == null
          ? "Pricing not publicly available; check vendor directly."
          : "";
      const subFitsBudget = subViability === "price_unavailable" ? false : fitsBudget;

      planEntries.push({
        kind: "subscription",
        provider: sub.provider,
        plan_id: sub.plan_id,
        product: sub.product ?? null,
        monthly_cost_floor: floor,
        break_even: breakEven,
        fits_budget: subFitsBudget,
        viability: subViability,
        viability_reason: subViabilityReason || undefined,
        capabilities: {
          providers,
          families,
          modalities: modalities.length > 0 ? modalities : null,
          model_access: modelAccess.length > 0 ? modelAccess : null,
          model_details: modelDetails.length > 0 ? modelDetails : null,
          notes:
            modelAccess.length > 0 || modalities.length > 0
              ? ["Some capabilities are sourced from entitlements entries."]
              : [
                  "Provider coverage is derived from the subscription provider identity; this does not imply third-party model access.",
                  "Specific model access/modality access is reported only when encoded as entitlements (model_access:* and modality_access:*).",
                ],
          missing: {
            providers:
              requiredProviders.length > 0
                ? requiredProviders.filter((rp) => !providers.includes(rp))
                : null,
            modalities: null,
          },
        },
      });
    }

    // Sort: viable plans first (by cost), then viability_unknown (by cost),
    // then non_viable, then price_unavailable.
    const viabilityOrder: Record<string, number> = {
      viable: 0,
      viability_unknown: 1,
      non_viable: 2,
      price_unavailable: 3,
    };

    planEntries.sort((a, b) => {
      const va = viabilityOrder[(a as { viability?: string }).viability ?? "viable"] ?? 0;
      const vb = viabilityOrder[(b as { viability?: string }).viability ?? "viable"] ?? 0;
      if (va !== vb) return va - vb;

      const ac =
        a.monthly_cost_effective?.monthly_cost_estimate?.point ??
        a.monthly_cost_floor?.monthly_cost_estimate?.point ??
        Infinity;
      const bc =
        b.monthly_cost_effective?.monthly_cost_estimate?.point ??
        b.monthly_cost_floor?.monthly_cost_estimate?.point ??
        Infinity;
      return ac - bc;
    });

    // Provider bundle enumeration (objective): only based on subscription fee floors.
    const bundles = [];
    if (requiredProviders.length > 1) {
      type SubscriptionFloor = { key: string; floor: ScenarioResult };
      const byProvider = new Map<string, SubscriptionFloor[]>();
      for (const sub of subscriptions) {
        const key = `${sub.provider}:${sub.plan_id}`;
        const floor = byId.get(`subscription_floor:${key}`) ?? null;
        if (!floor) continue;
        if (!byProvider.has(sub.provider)) byProvider.set(sub.provider, []);
        const list = byProvider.get(sub.provider);
        if (list) list.push({ key, floor });
      }

      const providersNeeded = requiredProviders.filter((p) => byProvider.has(p));
      if (providersNeeded.length === requiredProviders.length) {
        const lists = providersNeeded.map((p) => byProvider.get(p) ?? []);
        const combos = cartesianProduct(lists);
        for (const combo of combos) {
          const total = combo.reduce(
            (sum, x) => sum + (x.floor?.monthly_cost_estimate.point ?? 0),
            0,
          );
          const fits = budgetAmountInOutput != null ? total <= budgetAmountInOutput : null;
          bundles.push({
            providers: providersNeeded,
            subscription_keys: combo.map((x) => x.key),
            total_monthly_cost: { currency: outputCurrency, point: total },
            fits_budget: fits,
          });
        }

        bundles.sort((a, b) => a.total_monthly_cost.point - b.total_monthly_cost.point);
      }
    }

    return NextResponse.json({
      snapshot_dates: {
        pricing: pricingDate,
        entitlements: entitlementsDate,
        fx: fxDate,
        models: modelsDate,
      },
      base_currency: baseCurrency,
      output_currency: outputCurrency,
      budget: budget
        ? {
            ...budget,
            amount_in_output_currency: budgetAmountInOutput,
            conversion_warnings: budgetConverted?.warnings ?? [],
          }
        : null,
      requirements: requirements
        ? {
            providers: requiredProviders.length > 0 ? requiredProviders : null,
            modalities: requiredModalities.length > 0 ? requiredModalities : null,
          }
        : null,
      token_meter_default: tokenMeterDefault,
      plans: planEntries,
      bundles: bundles.length > 0 ? bundles.slice(0, 50) : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
