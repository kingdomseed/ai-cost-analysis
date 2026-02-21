import type {
  EntitlementsSnapshotV01,
  FxSnapshotV01,
  PricingSnapshotV01,
  ScenarioRequest,
  WorkloadRequest,
} from "@ai-cost-analysis/core";
import { calculate } from "@ai-cost-analysis/core";
import { NextResponse } from "next/server";

import {
  loadLatestEntitlementsSnapshot,
  loadLatestFxSnapshot,
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
    // Back-compat: accept {budget_usd} and normalize to USD.
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

function parseScenario(value: unknown): ScenarioRequest {
  if (!isRecord(value) || !isString(value.kind)) {
    throw new Error("scenario.kind is required");
  }

  const scenario_id = isString(value.scenario_id) ? value.scenario_id : undefined;

  if (value.kind === "token_meter") {
    if (!isString(value.provider) || !isString(value.channel) || !isString(value.model)) {
      throw new Error("token_meter scenario requires provider, channel, model");
    }
    const region = isString(value.region) ? value.region : undefined;
    return {
      kind: "token_meter",
      provider: value.provider,
      channel: value.channel,
      model: value.model,
      region,
      scenario_id,
    };
  }

  if (value.kind === "tool_plan_floor") {
    if (!isString(value.tool) || !isString(value.plan_id)) {
      throw new Error("tool_plan_floor scenario requires tool and plan_id");
    }
    const seat_count = isNumber(value.seat_count) ? value.seat_count : undefined;
    return {
      kind: "tool_plan_floor",
      tool: value.tool,
      plan_id: value.plan_id,
      seat_count,
      scenario_id,
    };
  }

  if (value.kind === "subscription_floor") {
    if (!isString(value.provider) || !isString(value.plan_id)) {
      throw new Error("subscription_floor scenario requires provider and plan_id");
    }
    return {
      kind: "subscription_floor",
      provider: value.provider,
      plan_id: value.plan_id,
      scenario_id,
    };
  }

  if (value.kind === "tool_plan_api_pool_effective") {
    if (!isString(value.tool) || !isString(value.plan_id)) {
      throw new Error("tool_plan_api_pool_effective requires tool and plan_id");
    }
    const token_meter = value.token_meter;
    if (
      !isRecord(token_meter) ||
      !isString(token_meter.provider) ||
      !isString(token_meter.channel) ||
      !isString(token_meter.model)
    ) {
      throw new Error(
        "tool_plan_api_pool_effective requires token_meter {provider, channel, model}",
      );
    }
    const markup_multiplier = isNumber(value.markup_multiplier)
      ? value.markup_multiplier
      : undefined;
    const seat_count = isNumber(value.seat_count) ? value.seat_count : undefined;
    const region = isString(token_meter.region) ? token_meter.region : undefined;
    return {
      kind: "tool_plan_api_pool_effective",
      tool: value.tool,
      plan_id: value.plan_id,
      seat_count,
      token_meter: {
        provider: token_meter.provider,
        channel: token_meter.channel,
        model: token_meter.model,
        region,
      },
      markup_multiplier,
      scenario_id,
    };
  }

  if (value.kind === "tool_plan_credits_effective") {
    if (!isString(value.tool) || !isString(value.plan_id)) {
      throw new Error("tool_plan_credits_effective requires tool and plan_id");
    }
    const seat_count = isNumber(value.seat_count) ? value.seat_count : undefined;
    const credits_per_month = isNumber(value.credits_per_month)
      ? value.credits_per_month
      : undefined;
    const usd_per_credit = isNumber(value.usd_per_credit) ? value.usd_per_credit : undefined;
    return {
      kind: "tool_plan_credits_effective",
      tool: value.tool,
      plan_id: value.plan_id,
      seat_count,
      credits_per_month,
      usd_per_credit,
      scenario_id,
    };
  }

  if (value.kind === "tool_plan_token_quota_effective") {
    if (!isString(value.tool) || !isString(value.plan_id)) {
      throw new Error("tool_plan_token_quota_effective requires tool and plan_id");
    }
    const seat_count = isNumber(value.seat_count) ? value.seat_count : undefined;
    return {
      kind: "tool_plan_token_quota_effective",
      tool: value.tool,
      plan_id: value.plan_id,
      seat_count,
      scenario_id,
    };
  }

  if (value.kind === "tool_plan_compute_units_effective") {
    if (!isString(value.tool) || !isString(value.plan_id)) {
      throw new Error("tool_plan_compute_units_effective requires tool and plan_id");
    }
    const seat_count = isNumber(value.seat_count) ? value.seat_count : undefined;
    return {
      kind: "tool_plan_compute_units_effective",
      tool: value.tool,
      plan_id: value.plan_id,
      seat_count,
      scenario_id,
    };
  }

  if (value.kind === "tool_plan_premium_requests_effective") {
    if (!isString(value.tool) || !isString(value.plan_id)) {
      throw new Error("tool_plan_premium_requests_effective requires tool and plan_id");
    }
    const seat_count = isNumber(value.seat_count) ? value.seat_count : undefined;
    return {
      kind: "tool_plan_premium_requests_effective",
      tool: value.tool,
      plan_id: value.plan_id,
      seat_count,
      scenario_id,
    };
  }

  if (value.kind === "token_meter_budget_capacity") {
    if (!isString(value.provider) || !isString(value.channel) || !isString(value.model)) {
      throw new Error("token_meter_budget_capacity scenario requires provider, channel, model");
    }
    const region = isString(value.region) ? value.region : undefined;
    const input_to_output_ratio = isString(value.input_to_output_ratio)
      ? value.input_to_output_ratio
      : undefined;
    return {
      kind: "token_meter_budget_capacity",
      provider: value.provider,
      channel: value.channel,
      model: value.model,
      region,
      input_to_output_ratio,
      scenario_id,
    };
  }

  if (value.kind === "break_even_vs_token_meter") {
    const subject = value.subject;
    const token_meter = value.token_meter;
    if (!isRecord(subject) || !isString(subject.kind)) {
      throw new Error("break_even_vs_token_meter requires subject.kind");
    }
    if (
      !isRecord(token_meter) ||
      !isString(token_meter.provider) ||
      !isString(token_meter.channel) ||
      !isString(token_meter.model)
    ) {
      throw new Error("break_even_vs_token_meter requires token_meter {provider, channel, model}");
    }

    const input_to_output_ratio = isString(value.input_to_output_ratio)
      ? value.input_to_output_ratio
      : undefined;
    const markup_multiplier = isNumber(value.markup_multiplier)
      ? value.markup_multiplier
      : undefined;
    const region = isString(token_meter.region) ? token_meter.region : undefined;

    if (subject.kind === "subscription") {
      if (!isString(subject.provider) || !isString(subject.plan_id)) {
        throw new Error(
          "break_even_vs_token_meter subject=subscription requires provider and plan_id",
        );
      }
      return {
        kind: "break_even_vs_token_meter",
        subject: { kind: "subscription", provider: subject.provider, plan_id: subject.plan_id },
        token_meter: {
          provider: token_meter.provider,
          channel: token_meter.channel,
          model: token_meter.model,
          region,
        },
        input_to_output_ratio,
        markup_multiplier,
        scenario_id,
      };
    }

    if (subject.kind === "tool_plan") {
      if (!isString(subject.tool) || !isString(subject.plan_id)) {
        throw new Error("break_even_vs_token_meter subject=tool_plan requires tool and plan_id");
      }
      const seat_count = isNumber(subject.seat_count) ? subject.seat_count : undefined;
      return {
        kind: "break_even_vs_token_meter",
        subject: { kind: "tool_plan", tool: subject.tool, plan_id: subject.plan_id, seat_count },
        token_meter: {
          provider: token_meter.provider,
          channel: token_meter.channel,
          model: token_meter.model,
          region,
        },
        input_to_output_ratio,
        markup_multiplier,
        scenario_id,
      };
    }

    throw new Error(`break_even_vs_token_meter subject.kind must be 'subscription' or 'tool_plan'`);
  }

  throw new Error(`Unknown scenario kind: ${value.kind}`);
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
    }

    const workload = parseWorkload(body.workload);
    const scenariosRaw = body.scenarios;
    if (!Array.isArray(scenariosRaw) || scenariosRaw.length === 0) {
      return NextResponse.json({ error: "scenarios[] is required" }, { status: 400 });
    }
    const scenarios = scenariosRaw.map(parseScenario);

    const [{ data: pricing }, { data: entitlements }, { data: fx }] = await Promise.all([
      loadLatestPricingSnapshot(),
      loadLatestEntitlementsSnapshot(),
      loadLatestFxSnapshot(),
    ]);

    const pricingSnapshot = pricing as PricingSnapshotV01;
    const entitlementsSnapshot = entitlements as EntitlementsSnapshotV01;
    const fxSnapshot = fx as FxSnapshotV01;

    const output = calculate({
      pricing: pricingSnapshot,
      entitlements: entitlementsSnapshot,
      fx: fxSnapshot,
      workload,
      scenarios,
      target_region: isString(body.target_region) ? body.target_region : undefined,
      evidence_policy: body.evidence_policy === "allow_private" ? "allow_private" : "public_only",
      output_currency: isString(body.output_currency) ? body.output_currency : undefined,
    });

    return NextResponse.json(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
