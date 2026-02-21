import type { EntitlementsSnapshotV01, PricingSnapshotV01 } from "./types";
import type { WorkloadRequest } from "./workload";

export interface CalculationAssumption {
  id: string;
  value: string | number | boolean | null;
  notes?: string;
}

export interface EvidenceRef {
  source_id: string;
  evidence_type?: string;
}

export interface CostLineItem {
  kind: string;
  label: string;
  amount_usd: number;
  notes?: string;
}

export interface ScenarioResult {
  scenario_id: string;
  monthly_cost_estimate_usd: number | null;
  currency: string;
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

