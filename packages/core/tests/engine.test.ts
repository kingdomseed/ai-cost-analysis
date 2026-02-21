import assert from "node:assert/strict";
import test from "node:test";

import type { EntitlementsSnapshotV01, FxSnapshotV01, PricingSnapshotV01 } from "@ai-cost-analysis/core";
import { calculate } from "@ai-cost-analysis/core";

function minimalPricingSnapshot(overrides?: Partial<PricingSnapshotV01>): PricingSnapshotV01 {
  return {
    meta: {
      schema_version: "v0.1",
      retrieved_at: "2026-02-21",
      last_verified_at: "2026-02-21",
      default_currency: "USD",
    },
    sources: [
      {
        id: "s1",
        url: "https://example.com",
        retrieved_at: "2026-02-21",
        verified: true,
      },
    ],
    api_rates: [],
    subscriptions: [],
    tool_plans: [],
    ...overrides,
  };
}

function minimalEntitlementsSnapshot(overrides?: Partial<EntitlementsSnapshotV01>): EntitlementsSnapshotV01 {
  return {
    meta: { version_date: "2026-02-21" },
    sources: [],
    entitlements: [],
    ...overrides,
  };
}

function minimalFxSnapshot(overrides?: Partial<FxSnapshotV01>): FxSnapshotV01 {
  return {
    meta: {
      schema_version: "v0.1",
      retrieved_at: "2026-02-21",
      last_verified_at: "2026-02-21",
      base_currency: "USD",
      effective_date: "2026-02-20",
    },
    sources: [],
    rates: {},
    ...overrides,
  };
}

test("token_meter computes correct USD cost for tokens_per_month", () => {
  const pricing = minimalPricingSnapshot({
    api_rates: [
      {
        provider: "openai",
        channel: "api",
        model: "test-model",
        unit: "usd_per_1m_tokens",
        source_ids: ["s1"],
        verified: true,
        rates: { input: 1, output: 2 },
      },
    ],
  });

  const out = calculate({
    pricing,
    entitlements: minimalEntitlementsSnapshot(),
    fx: minimalFxSnapshot(),
    workload: { kind: "tokens_per_month", input_tokens: 1_000_000, output_tokens: 1_000_000 },
    scenarios: [{ kind: "token_meter", provider: "openai", channel: "api", model: "test-model" }],
  });

  assert.equal(out.scenarios[0]?.monthly_cost_estimate.currency, "USD");
  assert.equal(out.scenarios[0]?.monthly_cost_estimate.point, 3);
});

test("token_meter supports total_tokens_per_month with default 3:1 split", () => {
  const pricing = minimalPricingSnapshot({
    api_rates: [
      {
        provider: "openai",
        channel: "api",
        model: "test-model",
        unit: "usd_per_1m_tokens",
        source_ids: ["s1"],
        verified: true,
        rates: { input: 1, output: 2 },
      },
    ],
  });

  const out = calculate({
    pricing,
    entitlements: minimalEntitlementsSnapshot(),
    fx: minimalFxSnapshot(),
    workload: { kind: "total_tokens_per_month", total_tokens: 4_000_000 },
    scenarios: [{ kind: "token_meter", provider: "openai", channel: "api", model: "test-model" }],
  });

  // 4M total tokens split 3:1 => 3M input, 1M output => cost = 3*1 + 1*2 = 5
  assert.equal(out.scenarios[0]?.monthly_cost_estimate.point, 5);
  assert.ok(out.scenarios[0]?.assumptions.some((a) => a.id === "input_to_output_ratio"));
});

test("FX conversion converts outputs and downgrades confidence", () => {
  const pricing = minimalPricingSnapshot({
    api_rates: [
      {
        provider: "openai",
        channel: "api",
        model: "test-model",
        unit: "usd_per_1m_tokens",
        source_ids: ["s1"],
        verified: true,
        rates: { input: 1, output: 2 },
      },
    ],
  });

  const fx = minimalFxSnapshot({ rates: { EUR: 2 } });

  const out = calculate({
    pricing,
    entitlements: minimalEntitlementsSnapshot(),
    fx,
    workload: { kind: "tokens_per_month", input_tokens: 1_000_000, output_tokens: 1_000_000 },
    scenarios: [{ kind: "token_meter", provider: "openai", channel: "api", model: "test-model" }],
    output_currency: "EUR",
  });

  assert.equal(out.scenarios[0]?.monthly_cost_estimate.currency, "EUR");
  assert.equal(out.scenarios[0]?.monthly_cost_estimate.point, 6);
  assert.equal(out.scenarios[0]?.monthly_cost_estimate.confidence, "medium");
});

test("tool_plan_credits_effective derives USD/credit from pack pricing", () => {
  const pricing = minimalPricingSnapshot({
    tool_plans: [
      {
        tool: "Windsurf",
        plan_id: "windsurf-teams",
        pricing_type: "seat_subscription_with_credits",
        subscription_price_usd_per_seat: 30,
        topups_pricing: { price_usd: 40, credits: 1000, pooled: true },
        source_ids: ["s1"],
        verified: true,
      },
    ],
  });

  const out = calculate({
    pricing,
    entitlements: minimalEntitlementsSnapshot(),
    fx: minimalFxSnapshot(),
    workload: { kind: "credits_per_month", credits: 100 },
    scenarios: [{ kind: "tool_plan_credits_effective", tool: "Windsurf", plan_id: "windsurf-teams", seat_count: 1 }],
  });

  // subscription 30 + (100 * (40/1000)=4) => 34
  assert.equal(out.scenarios[0]?.monthly_cost_estimate.point, 34);
});

test("tool_plan_premium_requests_effective computes overage when fields exist", () => {
  const pricing = minimalPricingSnapshot({
    tool_plans: [
      {
        tool: "GitHub Copilot",
        plan_id: "copilot-pro",
        pricing_type: "premium_requests",
        subscription_price_usd: 10,
        included_premium_requests_per_month: 300,
        overage_usd_per_premium_request: 0.04,
        source_ids: ["s1"],
        verified: true,
      },
    ],
  });

  const out = calculate({
    pricing,
    entitlements: minimalEntitlementsSnapshot(),
    fx: minimalFxSnapshot(),
    workload: { kind: "premium_requests_per_month", requests: 400 },
    scenarios: [{ kind: "tool_plan_premium_requests_effective", tool: "GitHub Copilot", plan_id: "copilot-pro" }],
  });

  assert.equal(out.scenarios[0]?.monthly_cost_estimate.point, 14);
});

test("token_meter_budget_capacity computes token capacity for a USD budget", () => {
  const pricing = minimalPricingSnapshot({
    api_rates: [
      {
        provider: "openai",
        channel: "api",
        model: "test-model",
        unit: "usd_per_1m_tokens",
        source_ids: ["s1"],
        verified: true,
        rates: { input: 1, output: 1 },
      },
    ],
  });

  const out = calculate({
    pricing,
    entitlements: minimalEntitlementsSnapshot(),
    fx: minimalFxSnapshot({ rates: { EUR: 2 } }),
    workload: { kind: "budget_per_month", budget: 100, currency: "USD" },
    scenarios: [{ kind: "token_meter_budget_capacity", provider: "openai", channel: "api", model: "test-model", input_to_output_ratio: "3:1" }],
  });

  assert.equal(out.scenarios[0]?.monthly_cost_estimate.point, 100);
  const totalMetric = out.scenarios[0]?.metrics?.find((m) => m.kind === "capacity_total_tokens");
  assert.ok(totalMetric);
  // blended rate is $1 per 1M tokens => $100 => 100M tokens
  assert.equal(Math.round(totalMetric.metric.point), 100_000_000);
});

