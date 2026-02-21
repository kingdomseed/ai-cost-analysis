export type WorkloadKind =
  | "tokens_per_month"
  | "total_tokens_per_month"
  | "credits_per_month"
  | "budget_per_month"
  | "premium_requests_per_month"
  | "usage_units_per_month";

/**
 * Workload inputs are intentionally minimal and unit-safe.
 *
 * If a user provides only "total tokens", we can model it as input/output with a declared ratio
 * (method: heuristic) but we should never silently assume conversions for credits/quota systems.
 */
export interface TokenWorkload {
  kind: "tokens_per_month";
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens?: number;
  assumptions?: {
    /**
     * Input-to-output ratio, expressed as a string like "3:1" meaning:
     *   input_tokens : output_tokens = 3 : 1
     */
    input_to_output_ratio?: string;
    cache_hit_rate?: number;
  };
}

export interface TotalTokenWorkload {
  kind: "total_tokens_per_month";
  total_tokens: number;
  cached_input_tokens?: number;
  assumptions?: {
    /**
     * Input-to-output ratio. Default heuristic: "3:1" for agentic programming work.
     */
    input_to_output_ratio?: string;
  };
}

export interface CreditWorkload {
  kind: "credits_per_month";
  credits: number;
  assumptions?: {
    usd_per_credit?: number;
    effective_credits_per_request?: number;
  };
}

export interface BudgetWorkload {
  kind: "budget_per_month";
  budget: number;
  currency: string;
}

export interface PremiumRequestsWorkload {
  kind: "premium_requests_per_month";
  requests: number;
}

export interface UsageUnitsWorkload {
  kind: "usage_units_per_month";
  unit_name: string;
  units: number;
}

export type WorkloadRequest =
  | TokenWorkload
  | TotalTokenWorkload
  | CreditWorkload
  | BudgetWorkload
  | PremiumRequestsWorkload
  | UsageUnitsWorkload;
