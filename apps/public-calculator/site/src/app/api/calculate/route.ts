import type {
  EntitlementsSnapshotV01,
  PricingSnapshotV01,
  ScenarioRequest,
  WorkloadRequest,
} from "@ai-cost-analysis/core";
import { calculate } from "@ai-cost-analysis/core";
import { NextResponse } from "next/server";

import { loadLatestEntitlementsSnapshot, loadLatestPricingSnapshot } from "@/lib/public-datasets";

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

  if (value.kind === "credits_per_month") {
    if (!isNumber(value.credits)) {
      throw new Error("credits_per_month requires credits (number)");
    }
    return { kind: "credits_per_month", credits: value.credits };
  }

  if (value.kind === "budget_per_month") {
    if (!isNumber(value.budget_usd)) {
      throw new Error("budget_per_month requires budget_usd (number)");
    }
    return { kind: "budget_per_month", budget_usd: value.budget_usd };
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
    return { kind: "tool_plan_floor", tool: value.tool, plan_id: value.plan_id, scenario_id };
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
    const region = isString(token_meter.region) ? token_meter.region : undefined;
    return {
      kind: "tool_plan_api_pool_effective",
      tool: value.tool,
      plan_id: value.plan_id,
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

    const [{ data: pricing }, { data: entitlements }] = await Promise.all([
      loadLatestPricingSnapshot(),
      loadLatestEntitlementsSnapshot(),
    ]);

    const pricingSnapshot = pricing as PricingSnapshotV01;
    const entitlementsSnapshot = entitlements as EntitlementsSnapshotV01;

    const output = calculate({
      pricing: pricingSnapshot,
      entitlements: entitlementsSnapshot,
      workload,
      scenarios,
      target_region: isString(body.target_region) ? body.target_region : undefined,
      evidence_policy: body.evidence_policy === "allow_private" ? "allow_private" : "public_only",
    });

    return NextResponse.json(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
