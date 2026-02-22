import type {
  CalculateRequest,
  CalculateResponse,
  CatalogResponse,
  PlanMatrixRequest,
  PlanMatrixResponse,
} from "@/types/api";

const API_BASE = "";

export async function fetchCatalog(): Promise<CatalogResponse> {
  const res = await fetch(`${API_BASE}/api/catalog`);
  if (!res.ok) {
    throw new Error(`Failed to fetch catalog: ${res.status}`);
  }
  return res.json();
}

export async function calculate(request: CalculateRequest): Promise<CalculateResponse> {
  const res = await fetch(`${API_BASE}/api/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Calculation failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchPlanMatrix(request: PlanMatrixRequest): Promise<PlanMatrixResponse> {
  const res = await fetch(`${API_BASE}/api/plan-matrix`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Plan matrix failed: ${res.status}`);
  }
  return res.json();
}
