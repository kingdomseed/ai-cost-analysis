import type {
  EntitlementsSnapshotV01,
  FxSnapshotV01,
  ModelsSnapshotV01,
  PricingSnapshotV01,
} from "@ai-cost-analysis/core";
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

function uniqSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function simplifiedRegionFrom(region: string): string | null {
  const value = region.toLowerCase();
  if (value === "us" || value === "eu" || value === "cn") return value;
  if (value.startsWith("us-")) return "us";
  if (value.startsWith("eu-")) return "eu";
  if (value.startsWith("cn-")) return "cn";
  if (value.startsWith("ap-")) return "ap";
  if (value.startsWith("sa-")) return "sa";
  if (value.startsWith("ca-")) return "ca";
  if (value.startsWith("af-")) return "af";
  if (value.startsWith("me-")) return "me";
  return null;
}

const TOOL_PROVIDER_ID_MAP: Record<string, string> = {
  cursor: "cursor",
  "github copilot": "github",
  "openai codex": "openai",
  windsurf: "windsurf",
};

function providerIdForTool(
  tool: string,
  planId: string,
  entitlements: EntitlementsSnapshotV01,
): string | null {
  const explicit = TOOL_PROVIDER_ID_MAP[tool.toLowerCase()];
  if (explicit) return explicit;

  const candidates = new Set(
    entitlements.entitlements
      .filter((e) => e.plan_id === planId)
      .map((e) => e.provider_id),
  );

  if (candidates.size === 1) {
    return Array.from(candidates)[0] ?? null;
  }

  return null;
}

function scenarioKindsForToolPlan(pricingType: string): string[] {
  const base = ["tool_plan_floor"];
  switch (pricingType) {
    case "api_pool_usd":
    case "usd_credits_pool":
      return [...base, "tool_plan_api_pool_effective", "break_even_vs_token_meter"];
    case "credits":
    case "seat_subscription_with_credits":
    case "team_subscription_with_credits":
      return [...base, "tool_plan_credits_effective"];
    case "token_quota":
    case "seat_subscription_with_token_quota":
      return [...base, "tool_plan_token_quota_effective"];
    case "compute_units":
      return [...base, "tool_plan_compute_units_effective"];
    case "premium_requests":
      return [...base, "tool_plan_premium_requests_effective"];
    default:
      return base;
  }
}

export async function GET(): Promise<NextResponse> {
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

  const baseCurrency =
    isRecord(pricing.meta) && typeof pricing.meta.default_currency === "string"
      ? pricing.meta.default_currency
      : "USD";
  const fxBase =
    isRecord(fx.meta) && typeof fx.meta.base_currency === "string" ? fx.meta.base_currency : null;

  const currencies =
    fxBase === baseCurrency
      ? uniqSorted([baseCurrency, ...Object.keys(fx.rates ?? {})])
      : [baseCurrency];

  const derivedRegions = uniqSorted(
    pricing.api_rates
      .flatMap((rate) => (rate.regional_rates ?? []).flatMap((entry) => entry.regions ?? []))
      .map((region) => simplifiedRegionFrom(region))
      .filter((region): region is string => typeof region === "string"),
  );
  const regions = derivedRegions.length > 0 ? derivedRegions : ["global"];

  // Build unified providers list
  // Type 1: Direct API providers (token meters)
  const apiProviders = uniqSorted(pricing.api_rates.map((r) => r.provider));

  // Type 2: Tools (Cursor, Copilot, etc.)
  const toolProviders = uniqSorted(pricing.tool_plans.map((p) => p.tool));

  // Type 3: Consumer subscriptions (ChatGPT, Claude, etc.)
  const subscriptionProviders = uniqSorted(pricing.subscriptions.map((s) => s.provider));

  // All unique providers
  const allProviders = uniqSorted([...apiProviders, ...toolProviders, ...subscriptionProviders]);

  // Build models list with provider info
  const modelMap = new Map<string, { provider: string; model: string; channels: string[] }>();

  // From API rates
  for (const rate of pricing.api_rates) {
    const key = `${rate.provider}:${rate.model}`;
    if (!modelMap.has(key)) {
      modelMap.set(key, { provider: rate.provider, model: rate.model, channels: [] });
    }
    modelMap.get(key)!.channels.push(rate.channel);
  }

  // From models catalog
  for (const m of models.models) {
    const key = `${m.provider}:${m.model}`;
    if (!modelMap.has(key)) {
      modelMap.set(key, { provider: m.provider, model: m.model, channels: m.channels || [] });
    }
  }

  const allModels = Array.from(modelMap.values()).sort((a, b) => {
    if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
    return a.model.localeCompare(b.model);
  });

  // Build unified options list (what users select from)
  const options: Array<{
    id: string;
    kind: "api" | "tool" | "subscription";
    name: string;
    provider?: string;
    model?: string;
    channel?: string;
    plan_id?: string;
    price_usd_per_month: number | null;
    pricing_type: string;
    verified: boolean;
    models_included?: string[];
  }> = [];

  // Add API rate options (direct model access)
  for (const rate of pricing.api_rates) {
    options.push({
      id: `api:${rate.provider}:${rate.channel}:${rate.model}`,
      kind: "api",
      name: `${rate.provider} ${rate.model}`,
      provider: rate.provider,
      model: rate.model,
      channel: rate.channel,
      price_usd_per_month: null, // Pay per use, no fixed price
      pricing_type: "token_meter",
      verified: rate.verified,
    });
  }

  // Add tool plan options
  for (const plan of pricing.tool_plans) {
    const price = plan.subscription_price_usd ?? plan.subscription_price_usd_per_seat ?? null;

    // Find what models this tool provides access to
    const providerId = providerIdForTool(plan.tool, plan.plan_id, entitlements);
    const toolEntitlements = providerId
      ? entitlements.entitlements.filter(
          (e) => e.provider_id === providerId && e.plan_id === plan.plan_id,
        )
      : [];
    const modelsIncluded = toolEntitlements
      .filter((e) => e.feature_id.startsWith("model_access:"))
      .map((e) => e.feature_id.replace("model_access:", ""));

    options.push({
      id: `tool:${plan.tool}:${plan.plan_id}`,
      kind: "tool",
      name: `${plan.tool} (${plan.plan_id})`,
      plan_id: plan.plan_id,
      price_usd_per_month: price,
      pricing_type: plan.pricing_type,
      verified: plan.verified,
      models_included: modelsIncluded.length > 0 ? modelsIncluded : undefined,
    });
  }

  // Add subscription options
  for (const sub of pricing.subscriptions) {
    const subEntitlements = entitlements.entitlements.filter(
      (e) => e.provider_id === sub.provider && e.plan_id === sub.plan_id,
    );
    const modelsIncluded = subEntitlements
      .filter((e) => e.feature_id.startsWith("model_access:"))
      .map((e) => e.feature_id.replace("model_access:", ""));

    options.push({
      id: `subscription:${sub.provider}:${sub.plan_id}`,
      kind: "subscription",
      name: `${sub.provider} ${sub.plan_id}`,
      provider: sub.provider,
      plan_id: sub.plan_id,
      price_usd_per_month: sub.price_usd_per_month ?? null,
      pricing_type: "subscription",
      verified: sub.verified,
      models_included: modelsIncluded.length > 0 ? modelsIncluded : undefined,
    });
  }

  // Sort options by price (nulls last)
  options.sort((a, b) => {
    if (a.price_usd_per_month === null && b.price_usd_per_month === null) return 0;
    if (a.price_usd_per_month === null) return 1;
    if (b.price_usd_per_month === null) return -1;
    return a.price_usd_per_month - b.price_usd_per_month;
  });

  const tokenMeters = pricing.api_rates.map((r) => ({
    provider: r.provider,
    channel: r.channel,
    model: r.model,
    unit: r.unit,
    verified: r.verified,
    has_tiers: Array.isArray(r.tiers) && r.tiers.length > 0,
    has_regional_rates: Array.isArray(r.regional_rates) && r.regional_rates.length > 0,
    source_ids: r.source_ids,
    scenario_kinds: ["token_meter", "token_meter_budget_capacity"],
  }));

  const toolPlans = pricing.tool_plans.map((p) => ({
    tool: p.tool,
    plan_id: p.plan_id,
    pricing_type: p.pricing_type,
    verified: p.verified,
    subscription_price_usd: p.subscription_price_usd ?? null,
    subscription_price_usd_per_seat: p.subscription_price_usd_per_seat ?? null,
    included_pool_usd: p.included_pool_usd ?? null,
    topups_pricing: p.topups_pricing ?? null,
    source_ids: p.source_ids,
    scenario_kinds: scenarioKindsForToolPlan(p.pricing_type),
  }));

  const subscriptions = pricing.subscriptions.map((s) => ({
    provider: s.provider,
    plan_id: s.plan_id,
    product: s.product ?? null,
    price_usd_per_month: s.price_usd_per_month ?? null,
    verified: s.verified,
    source_ids: s.source_ids,
    scenario_kinds: ["subscription_floor", "break_even_vs_token_meter"],
  }));

  const modelCatalog = models.models.map((m) => ({
    provider: m.provider,
    model: m.model,
    channels: m.channels,
    family: m.family ?? null,
    modalities: m.modalities ?? null,
    has_ratings: Array.isArray(m.ratings) && m.ratings.length > 0,
  }));

  return NextResponse.json({
    snapshot_dates: {
      pricing: pricingDate,
      entitlements: entitlementsDate,
      fx: fxDate,
      models: modelsDate,
    },
    base_currency: baseCurrency,
    supported_workload_kinds: [
      "tokens_per_month",
      "total_tokens_per_month",
      "credits_per_month",
      "budget_per_month",
      "premium_requests_per_month",
      "usage_units_per_month",
    ],
    supported_scenario_kinds: [
      "token_meter",
      "token_meter_budget_capacity",
      "tool_plan_floor",
      "subscription_floor",
      "tool_plan_api_pool_effective",
      "tool_plan_credits_effective",
      "tool_plan_token_quota_effective",
      "tool_plan_compute_units_effective",
      "tool_plan_premium_requests_effective",
      "break_even_vs_token_meter",
    ],
    currencies,
    regions,
    providers: allProviders,
    models: allModels,
    options,
    token_meters: tokenMeters,
    tool_plans: toolPlans,
    subscriptions,
    models_catalog: modelCatalog,
  });
}
