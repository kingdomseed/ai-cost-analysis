export interface CatalogOption {
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
}

export interface CatalogModel {
  provider: string;
  model: string;
  channels: string[];
}

export interface CatalogResponse {
  snapshot_dates: {
    pricing: string;
    entitlements: string;
    fx: string;
    models: string;
  };
  base_currency: string;
  supported_workload_kinds: string[];
  supported_scenario_kinds: string[];
  currencies: string[];
  regions: string[];
  providers: string[];
  models: CatalogModel[];
  options: CatalogOption[];
  token_meters: Array<{
    provider: string;
    channel: string;
    model: string;
    unit: string;
    verified: boolean;
    has_tiers: boolean;
    has_regional_rates: boolean;
    source_ids: string[];
    scenario_kinds: string[];
  }>;
  tool_plans: Array<{
    tool: string;
    plan_id: string;
    pricing_type: string;
    verified: boolean;
    subscription_price_usd: number | null;
    subscription_price_usd_per_seat: number | null;
    included_pool_usd: number | null;
    topups_pricing: Record<string, unknown> | null;
    source_ids: string[];
    scenario_kinds: string[];
  }>;
  subscriptions: Array<{
    provider: string;
    plan_id: string;
    product: string | null;
    price_usd_per_month: number | null;
    verified: boolean;
    source_ids: string[];
    scenario_kinds: string[];
  }>;
  models_catalog: Array<{
    provider: string;
    model: string;
    channels: string[];
    family: string | null;
    modalities: string[] | null;
    has_ratings: boolean;
  }>;
}

export type WorkloadRequest =
  | {
      kind: "tokens_per_month";
      input_tokens: number;
      output_tokens: number;
      cached_input_tokens?: number;
    }
  | {
      kind: "total_tokens_per_month";
      total_tokens: number;
      cached_input_tokens?: number;
      assumptions?: { input_to_output_ratio?: string };
    }
  | {
      kind: "credits_per_month";
      credits: number;
    }
  | {
      kind: "budget_per_month";
      budget: number;
      currency: string;
    }
  | {
      kind: "premium_requests_per_month";
      requests: number;
    }
  | {
      kind: "usage_units_per_month";
      unit_name: string;
      units: number;
    };

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
      kind: "token_meter_budget_capacity";
      provider: string;
      channel: string;
      model: string;
      region?: string;
      input_to_output_ratio?: string;
      scenario_id?: string;
    }
  | {
      kind: "tool_plan_floor";
      tool: string;
      plan_id: string;
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
      markup_multiplier?: number;
      scenario_id?: string;
    }
  | {
      kind: "tool_plan_credits_effective";
      tool: string;
      plan_id: string;
      seat_count?: number;
      credits_per_month?: number;
      usd_per_credit?: number;
      scenario_id?: string;
    }
  | {
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
      markup_multiplier?: number;
      scenario_id?: string;
    };

export interface CalculateRequest {
  workload: WorkloadRequest;
  scenarios: ScenarioRequest[];
  target_region?: string;
  evidence_policy?: "public_only" | "allow_private";
  output_currency?: string;
}

export interface MoneyEstimate {
  currency: string;
  point: number;
  low?: number;
  high?: number;
}

export interface EvidencedMoneyEstimate extends MoneyEstimate {
  method: "direct" | "derived" | "assumed" | "heuristic";
  confidence: "high" | "medium" | "low";
  confidence_reasons: string[];
  evidence: Array<{ source_id: string; evidence_type?: string }>;
}

export interface NumberEstimate {
  unit: string;
  point: number;
  low?: number;
  high?: number;
}

export interface EvidencedNumberEstimate extends NumberEstimate {
  method: "direct" | "derived" | "assumed" | "heuristic";
  confidence: "high" | "medium" | "low";
  confidence_reasons: string[];
  evidence: Array<{ source_id: string; evidence_type?: string }>;
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

export interface CalculationAssumption {
  id: string;
  value: string | number | boolean | null;
  notes?: string;
}

export interface ScenarioResult {
  scenario_id: string;
  monthly_cost_estimate: EvidencedMoneyEstimate;
  line_items: CostLineItem[];
  metrics?: MetricLineItem[];
  assumptions: CalculationAssumption[];
  evidence: Array<{ source_id: string; evidence_type?: string }>;
  warnings: string[];
}

export interface CalculateResponse {
  generated_at: string;
  scenarios: ScenarioResult[];
}

// Plan Matrix types
export interface PlanMatrixRequest {
  budget?: {
    amount: number;
    currency: string;
  };
  workload?: WorkloadRequest;
  token_meter_default?: {
    provider: string;
    channel: string;
    model: string;
    region?: string;
  };
  requirements?: {
    providers?: string[];
    modalities?: string[];
  };
  include?: {
    tools?: string[];
    providers?: string[];
  };
  assumptions?: {
    markup_by_tool?: Record<string, number>;
    seat_count_by_plan?: Record<string, number>;
  };
  target_region?: string;
  evidence_policy?: "public_only" | "allow_private";
  output_currency?: string;
}

/**
 * Plan viability relative to the user's stated workload.
 *
 * - "viable"            – plan can plausibly serve the workload
 * - "non_viable"        – plan's known capacity is clearly insufficient for the workload
 * - "viability_unknown"  – can't determine (opaque metering, no capacity data)
 * - "price_unavailable" – pricing data is missing; user should check vendor directly
 */
export type PlanViability = "viable" | "non_viable" | "viability_unknown" | "price_unavailable";

export interface PlanMatrixEntry {
  kind: "tool_plan" | "subscription";
  tool?: string;
  provider?: string;
  plan_id: string;
  product?: string | null;
  pricing_type?: string;
  monthly_cost_floor?: ScenarioResult;
  monthly_cost_effective?: ScenarioResult;
  break_even?: ScenarioResult;
  fits_budget: boolean | null;
  viability: PlanViability;
  viability_reason?: string;
  /** Derived credit rate for credit-based plans — shown to help users estimate their own cost */
  credit_rate?: { usd_per_credit: number; source: string } | null;
  capabilities: {
    providers: string[] | null;
    families: string[] | null;
    modalities: string[] | null;
    model_access: string[] | null;
    model_details: Array<{
      provider: string;
      model: string;
      family: string | null;
      has_ratings: boolean;
      ratings_summary: {
        azure_quality_index: { score: number; scale: string | null; as_of: string } | null;
        azure_safety_attack_success_rate_percent: {
          score: number;
          scale: string | null;
          as_of: string;
        } | null;
      };
    }> | null;
    notes: string[];
    missing: {
      providers: string[] | null;
      modalities: string[] | null;
    };
  };
}

export interface PlanMatrixBundle {
  providers: string[];
  subscription_keys: string[];
  total_monthly_cost: {
    currency: string;
    point: number;
  };
  fits_budget: boolean | null;
}

export interface PlanMatrixResponse {
  snapshot_dates: {
    pricing: string;
    entitlements: string;
    fx: string;
    models: string;
  };
  base_currency: string;
  output_currency: string;
  budget: {
    amount: number;
    currency: string;
    amount_in_output_currency: number | null;
    conversion_warnings: string[];
  } | null;
  requirements: {
    providers: string[] | null;
    modalities: string[] | null;
  } | null;
  token_meter_default: {
    provider: string;
    channel: string;
    model: string;
    region?: string;
  } | null;
  plans: PlanMatrixEntry[];
  bundles: PlanMatrixBundle[];
}
