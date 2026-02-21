import type {
  EntitlementsSnapshotV01,
  FxSnapshotV01,
  PricingSnapshotV01,
} from "@ai-cost-analysis/core";
import { NextResponse } from "next/server";

import {
  loadLatestEntitlementsSnapshot,
  loadLatestFxSnapshot,
  loadLatestPricingSnapshot,
} from "@/lib/public-datasets";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function uniqSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

export async function GET(): Promise<NextResponse> {
  const [
    { date: pricingDate, data: pricingRaw },
    { date: entitlementsDate, data: entitlementsRaw },
    { date: fxDate, data: fxRaw },
  ] = await Promise.all([
    loadLatestPricingSnapshot(),
    loadLatestEntitlementsSnapshot(),
    loadLatestFxSnapshot(),
  ]);

  const pricing = pricingRaw as PricingSnapshotV01;
  const entitlements = entitlementsRaw as EntitlementsSnapshotV01;
  const fx = fxRaw as FxSnapshotV01;

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

  const regionsFromApiRates: string[] = [];
  for (const rate of pricing.api_rates) {
    if (Array.isArray(rate.regional_rates)) {
      for (const rr of rate.regional_rates) {
        regionsFromApiRates.push(...rr.regions);
      }
    }
  }

  const regionsFromEntitlements = entitlements.entitlements
    .map((e) => e.region)
    .filter((r) => typeof r === "string");
  const regions = uniqSorted([...regionsFromApiRates, ...regionsFromEntitlements]);

  const tokenMeters = pricing.api_rates.map((r) => ({
    provider: r.provider,
    channel: r.channel,
    model: r.model,
    unit: r.unit,
    verified: r.verified,
    has_tiers: Array.isArray(r.tiers) && r.tiers.length > 0,
    has_regional_rates: Array.isArray(r.regional_rates) && r.regional_rates.length > 0,
    source_ids: r.source_ids,
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
  }));

  const subscriptions = pricing.subscriptions.map((s) => ({
    provider: s.provider,
    plan_id: s.plan_id,
    product: s.product ?? null,
    price_usd_per_month: s.price_usd_per_month ?? null,
    verified: s.verified,
    source_ids: s.source_ids,
  }));

  return NextResponse.json({
    snapshot_dates: { pricing: pricingDate, entitlements: entitlementsDate, fx: fxDate },
    base_currency: baseCurrency,
    currencies,
    regions,
    token_meters: tokenMeters,
    tool_plans: toolPlans,
    subscriptions,
  });
}
