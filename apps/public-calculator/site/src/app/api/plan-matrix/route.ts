import type {
  EntitlementsSnapshotV01,
  EntitlementV01,
  FxSnapshotV01,
  ModelsSnapshotV01,
  PricingSnapshotV01,
  ScenarioResult,
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
          const match = models.models.find((m) => m.provider === provider && m.model === model);
          return match
            ? {
                provider: match.provider,
                model: match.model,
                family: match.family ?? null,
                has_ratings: Array.isArray(match.ratings) && match.ratings.length > 0,
              }
            : null;
        })
        .filter(Boolean);

      planEntries.push({
        kind: "tool_plan",
        tool: tp.tool,
        plan_id: tp.plan_id,
        pricing_type: tp.pricing_type,
        monthly_cost_floor: floor,
        monthly_cost_effective: effective,
        break_even: breakEven,
        fits_budget: fitsBudget,
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
          const match = models.models.find((m) => m.provider === provider && m.model === model);
          return match
            ? {
                provider: match.provider,
                model: match.model,
                family: match.family ?? null,
                has_ratings: Array.isArray(match.ratings) && match.ratings.length > 0,
              }
            : null;
        })
        .filter(Boolean);

      planEntries.push({
        kind: "subscription",
        provider: sub.provider,
        plan_id: sub.plan_id,
        product: sub.product ?? null,
        monthly_cost_floor: floor,
        break_even: breakEven,
        fits_budget: fitsBudget,
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

    planEntries.sort((a, b) => {
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
