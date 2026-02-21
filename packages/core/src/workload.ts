export type WorkloadKind =
  | "tokens_per_month"
  | "credits_per_month"
  | "budget_per_month";

export interface TokenWorkload {
  kind: "tokens_per_month";
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens?: number;
  assumptions?: {
    input_to_output_ratio?: string;
    cache_hit_rate?: number;
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
  budget_usd: number;
}

export type WorkloadRequest = TokenWorkload | CreditWorkload | BudgetWorkload;

