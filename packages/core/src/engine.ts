import type { EntitlementsSnapshotV01, PricingSnapshotV01 } from "./types";
import type { WorkloadRequest } from "./workload";

export type ConfidenceLevel = "high" | "medium" | "low";
export type EstimateMethod = "direct" | "derived" | "assumed" | "heuristic";

export interface CalculationAssumption {
  id: string;
  value: string | number | boolean | null;
  notes?: string;
}

export interface EvidenceRef {
  source_id: string;
  evidence_type?: string;
}

export interface MoneyEstimate {
  currency: string;
  point_usd: number;
  low_usd?: number;
  high_usd?: number;
}

export interface EvidencedMoneyEstimate extends MoneyEstimate {
  method: EstimateMethod;
  confidence: ConfidenceLevel;
  confidence_reasons: string[];
  evidence: EvidenceRef[];
}

export interface CostLineItem {
  kind: string;
  label: string;
  amount: EvidencedMoneyEstimate;
  notes?: string;
}

export interface ScenarioResult {
  scenario_id: string;
  monthly_cost_estimate: EvidencedMoneyEstimate;
  line_items: CostLineItem[];
  assumptions: CalculationAssumption[];
  evidence: EvidenceRef[];
  warnings: string[];
}

export interface EngineInput {
  pricing: PricingSnapshotV01;
  entitlements: EntitlementsSnapshotV01;
  workload: WorkloadRequest;
  target_region?: string;
  evidence_policy?: "public_only" | "allow_private";
}

export interface EngineOutput {
  generated_at: string;
  scenarios: ScenarioResult[];
}

export function calculate(_input: EngineInput): EngineOutput {
  // Intentionally not implemented yet: this repo is currently “data + contracts first”.
  // The next implementation step is to add pure calculators per primitive:
  // - token-meter: input/output/cached
  // - credits/pools: packs + overage policies
  // - subscriptions: opaque quotas (cost-only comparisons + entitlement surfacing)
  throw new Error("Not implemented: calculator engine");
}
