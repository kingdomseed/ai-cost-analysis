export type ISODate = `${number}-${number}-${number}`;

export type EvidenceType = "public_url" | "authenticated_ui_capture" | "blocked_needs_refetch";

export type PricingUnit = "usd_per_1m_tokens" | string;

export interface SourceRef {
  id: string;
  url: string;
  retrieved_at: ISODate;
  verified: boolean;
  notes?: string | null;
}

export interface PricingMetaV01 {
  schema_version: string;
  retrieved_at: ISODate;
  last_verified_at: ISODate;
  default_currency: string;
  notes?: string | null;
  [k: string]: unknown;
}

export interface EntitlementsMetaV01 {
  version_date: ISODate;
  target_region?: string | null;
  notes?: string | null;
  [k: string]: unknown;
}

export interface ApiRateV01 {
  provider: string;
  channel: string;
  model: string;
  unit: PricingUnit;
  source_ids: string[];
  verified: boolean;
  notes?: string | null;

  // One of:
  rates?: Record<string, number>;
  tiers?: Array<{
    name: string;
    applies_when?: string | null;
    rates: Record<string, number>;
    [k: string]: unknown;
  }>;
  regional_rates?: Array<{
    regions: string[];
    input?: number;
    output?: number;
    notes?: string | null;
    [k: string]: unknown;
  }>;

  [k: string]: unknown;
}

export interface SubscriptionV01 {
  provider: string;
  plan_id: string;
  source_ids: string[];
  verified: boolean;
  product?: string | null;
  price_usd_per_month?: number | null;
  usage_limits?: string | null;
  notes?: string | null;
  [k: string]: unknown;
}

export interface ToolPlanV01 {
  tool: string;
  plan_id: string;
  pricing_type: string;
  source_ids: string[];
  verified: boolean;

  subscription_price_usd?: number | null;
  subscription_price_usd_per_seat?: number | null;
  included_pool_usd?: number | null;
  credits_per_month?: number | null;
  included_credits_per_month_per_seat?: number | null;
  topups_pricing?: Record<string, unknown> | null;
  overage_policy?: string | null;
  metering?: string | null;
  availability_note?: string | null;
  notes?: string | null;
  [k: string]: unknown;
}

export interface PricingSnapshotV01 {
  meta: PricingMetaV01;
  sources: SourceRef[];
  api_rates: ApiRateV01[];
  subscriptions: SubscriptionV01[];
  tool_plans: ToolPlanV01[];
}

export interface EntitlementEvidence {
  type: EvidenceType | string;
  source_ids: string[];
  [k: string]: unknown;
}

export interface EntitlementV01 {
  provider_id: string;
  plan_id: string;
  region: string;
  feature_id: string;
  surface_id: string;
  included: boolean;
  evidence: EntitlementEvidence;
  product?: string | null;
  limits?: string | null;
  notes?: string | null;
  [k: string]: unknown;
}

export interface EntitlementsSnapshotV01 {
  meta: EntitlementsMetaV01;
  sources: SourceRef[];
  entitlements: EntitlementV01[];
}

