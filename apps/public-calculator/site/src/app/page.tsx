"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculate, fetchCatalog, fetchPlanMatrix } from "@/lib/api";
import type {
  EvidencedMoneyEstimate,
  PlanMatrixResponse,
  ScenarioResult,
} from "@/types/api";

const BUDGET_MARKS = [0, 10, 20, 50, 100, 200, 500, 1000];
const DEFAULT_RATIO = 3;

// ─── Model helpers ────────────────────────────────────────────────────────────

function modelDisplayName(model: string): string {
  return model
    .replace(/-preview$/, " (Preview)")
    .replace(/-/g, " ")
    .replace(/\b(\w)/g, (c) => c.toUpperCase())
    .replace(/\bAi\b/, "AI")
    .replace(/\bGpt\b/, "GPT")
    .replace(/\bApi\b/, "API");
}

const PROVIDER_PRIORITY: Record<string, number> = {
  anthropic: 0, openai: 1, google: 2, moonshot: 3,
  azure: 10, aws: 11, opencode: 12,
};

function providerFamily(provider: string): string {
  switch (provider) {
    case "anthropic": return "Claude";
    case "openai": return "GPT / OpenAI";
    case "azure": return "Azure OpenAI";
    case "google": return "Gemini";
    case "moonshot": return "Kimi";
    case "opencode": return "OpenCode";
    case "aws": return "AWS Bedrock";
    default: return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}

// ─── Provider group classification ───────────────────────────────────────────

type ProviderGroupId =
  | "pay_as_you_go"    // BYOK, PAYG — no subscription, pure API cost
  | "api_pool"         // Subscription + USD token pool (Cursor style)
  | "credits"          // Subscription + opaque credits
  | "quota"            // Subscription + fixed request/token quota
  | "flat_sub"         // Consumer subscription (Claude Pro, ChatGPT, Google AI)
  | "other";           // Free tiers, enterprise, compute units

interface ProviderGroup {
  id: ProviderGroupId;
  label: string;
  description: string;
}

const PROVIDER_GROUPS: ProviderGroup[] = [
  {
    id: "pay_as_you_go",
    label: "Pay-as-you-go / BYOK",
    description: "No subscription fee. You pay direct API rates for every token. Cost scales exactly with usage.",
  },
  {
    id: "api_pool",
    label: "Subscription + token pool",
    description: "Flat monthly fee includes a USD-denominated token allocation. Use any supported model at its API rate against the pool.",
  },
  {
    id: "credits",
    label: "Subscription + credits",
    description: "Flat monthly fee includes a credit allowance. Credits are consumed per task at rates that vary by model and complexity.",
  },
  {
    id: "quota",
    label: "Subscription + usage quota",
    description: "Flat monthly fee with a fixed monthly quota — measured in premium requests, token volume, or similar units.",
  },
  {
    id: "flat_sub",
    label: "Consumer subscription",
    description: "Flat monthly fee for product access. Usage limits are soft or session-based, not published as hard token counts.",
  },
  {
    id: "other",
    label: "Other",
    description: "Free tiers, enterprise pricing, and compute-unit plans.",
  },
];

/**
 * Free-tier plans have $0 cost and fixed capacity limits.
 * They should always be shown separately regardless of budget —
 * they're not "within budget" in the meaningful sense of the word.
 */
function isFreeTierPlan(plan: PlanEntry): boolean {
  const pt = plan.pricing_type ?? "";
  // Explicitly typed as free
  if (pt === "free_with_limits") return true;
  // Any tool plan with $0 subscription and a fixed quota/credits — it's a free tier
  if (plan.kind === "tool_plan") {
    const cost = plan.monthly_cost_floor?.monthly_cost_estimate?.point;
    // Only count as "free tier" if cost is exactly $0 and the plan has
    // a real quota/credits limit (not BYOK/PAYG which also have $0 floor)
    if (cost === 0 && (
      pt === "premium_requests" ||
      pt === "token_quota" ||
      pt === "credits"
    )) return true;
  }
  return false;
}

function planGroupId(plan: PlanEntry): ProviderGroupId {
  // Subscriptions (kind=subscription) are consumer flat subs
  if (plan.kind === "subscription") return "flat_sub";

  const pt = plan.pricing_type ?? "";
  const isByok = plan.viability === "viability_unknown" &&
    (pt === "subscription" || pt === "seat_subscription");

  if (pt === "prepaid_usd_credits" || isByok) return "pay_as_you_go";
  if (pt === "api_pool_usd" || pt === "usd_credits_pool") return "api_pool";
  if (
    pt === "credits" ||
    pt === "seat_subscription_with_credits" ||
    pt === "team_subscription_with_credits"
  ) return "credits";
  if (
    pt === "token_quota" ||
    pt === "seat_subscription_with_token_quota" ||
    pt === "premium_requests" ||
    pt === "seat_subscription_with_usage_overage"
  ) return "quota";
  if (pt === "subscription" || pt === "seat_subscription") return "flat_sub";

  return "other";
}

// ─── Model access filter ──────────────────────────────────────────────────────

/**
 * Returns true if this plan can plausibly provide access to the given model.
 * PAYG/BYOK and API pool plans can access any model at its API rates.
 * Subscription plans are checked against their entitlements.
 */
function planSupportsModel(plan: PlanEntry, modelProvider: string, modelId: string): boolean {
  const pt = plan.pricing_type ?? "";

  // PAYG and BYOK can access any model at API rates
  if (pt === "prepaid_usd_credits") return true;
  if (pt === "api_pool_usd" || pt === "usd_credits_pool") return true;
  if (plan.viability === "viability_unknown" && (pt === "subscription" || pt === "seat_subscription")) {
    return true; // BYOK
  }

  // Explicit model access entitlement
  const modelKey = `${modelProvider}:${modelId}`;
  if (plan.capabilities.model_access?.some((m) => m === modelKey)) return true;

  // Provider access implies model access from that provider
  if (plan.capabilities.providers?.includes(modelProvider)) return true;

  return false;
}

function planSupportsAllModels(
  plan: PlanEntry,
  selected: Array<{ provider: string; model: string }>,
): boolean {
  if (selected.length === 0) return true;
  return selected.every((m) => planSupportsModel(plan, m.provider, m.model));
}

// ─── Pricing type label ───────────────────────────────────────────────────────

function pricingTypeLabel(pricingType: string): string {
  const map: Record<string, string> = {
    api_pool_usd: "API pool — token-metered",
    usd_credits_pool: "USD credit pool",
    credits: "Credits",
    seat_subscription_with_credits: "Subscription + credits",
    seat_subscription_with_token_quota: "Subscription + token quota",
    token_quota: "Token quota",
    premium_requests: "Premium requests",
    compute_units: "Compute units",
    prepaid_usd_credits: "Pay-as-you-go",
    seat_subscription: "Seat subscription",
    seat_subscription_with_usage_overage: "Subscription + usage",
    subscription: "Subscription",
    free_with_limits: "Free tier",
    custom_enterprise: "Enterprise",
    team_subscription_with_credits: "Team subscription + credits",
  };
  return map[pricingType] ?? pricingType.replace(/_/g, " ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [catalog, setCatalog] = useState<PlanMatrixResponse["plans"] extends Array<infer _> ? import("@/types/api").CatalogResponse | null : never>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"budget" | "tokens">("budget");
  const [outputCurrency, setOutputCurrency] = useState<string>("USD");

  // Budget
  const [budget, setBudget] = useState<number>(50);

  // Token input mode
  const [tokenInputMode, setTokenInputMode] = useState<"specific" | "aggregate">("specific");
  const [inputTokens, setInputTokens] = useState<string>("1000000");
  const [outputTokens, setOutputTokens] = useState<string>("500000");
  const [totalTokensInput, setTotalTokensInput] = useState<string>("1500000");
  const [inputOutputRatio, setInputOutputRatio] = useState<number>(DEFAULT_RATIO);

  // Multi-model selection (replaces single token meter)
  const [selectedModelKeys, setSelectedModelKeys] = useState<string[]>([]);
  // Track whether the user has explicitly cleared the selection to avoid re-defaulting
  const [modelSelectionInitialized, setModelSelectionInitialized] = useState(false);

  // Results
  const [planMatrix, setPlanMatrix] = useState<PlanMatrixResponse | null>(null);
  const [baselineScenarios, setBaselineScenarios] = useState<Array<{ key: string; label: string; result: ScenarioResult }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Deduplicated model options by model name (best/most-direct provider)
  const modelOptions = useMemo(() => {
    if (!catalog) return [];
    const bestByModel = new Map<string, {
      key: string; label: string; family: string;
      provider: string; channel: string; model: string;
    }>();
    for (const meter of catalog.token_meters) {
      const existing = bestByModel.get(meter.model);
      const priority = PROVIDER_PRIORITY[meter.provider] ?? 99;
      const existingPriority = existing ? (PROVIDER_PRIORITY[existing.provider] ?? 99) : 999;
      if (!existing || priority < existingPriority) {
        bestByModel.set(meter.model, {
          key: `${meter.provider}:${meter.channel}:${meter.model}`,
          label: modelDisplayName(meter.model),
          family: providerFamily(meter.provider),
          provider: meter.provider,
          channel: meter.channel,
          model: meter.model,
        });
      }
    }
    return Array.from(bestByModel.values());
  }, [catalog]);

  // Group model options by family for display
  const modelsByFamily = useMemo(() => {
    const groups = new Map<string, typeof modelOptions>();
    for (const opt of modelOptions) {
      if (!groups.has(opt.family)) groups.set(opt.family, []);
      groups.get(opt.family)!.push(opt);
    }
    return groups;
  }, [modelOptions]);

  // Selected model objects (for filtering + API calls)
  const selectedModels = useMemo(
    () => modelOptions.filter((o) => selectedModelKeys.includes(o.key)),
    [modelOptions, selectedModelKeys],
  );

  // Primary model = first selected (or first available) for token meter API calls
  const primaryModel = useMemo(
    () => selectedModels[0] ?? modelOptions[0] ?? null,
    [selectedModels, modelOptions],
  );

  // Default: select Claude Sonnet once catalog loads — but only once, never re-apply after user clears
  useEffect(() => {
    if (modelOptions.length === 0 || modelSelectionInitialized) return;
    const sonnet = modelOptions.find((o) => o.model.includes("sonnet"));
    if (sonnet) setSelectedModelKeys([sonnet.key]);
    setModelSelectionInitialized(true);
  }, [modelOptions, modelSelectionInitialized]);

  // Currency init
  useEffect(() => {
    if (!catalog) return;
    if (!outputCurrency || !catalog.currencies.includes(outputCurrency)) {
      setOutputCurrency(catalog.base_currency || catalog.currencies[0] || "USD");
    }
  }, [catalog, outputCurrency]);

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch((err) => setCatalogError(err.message));
  }, []);

  // Resolved tokens from whichever input mode
  const resolvedTokens = useMemo(() => {
    if (tokenInputMode === "specific") {
      return { input: Number(inputTokens) || 0, output: Number(outputTokens) || 0 };
    }
    const total = Number(totalTokensInput) || 0;
    const input = Math.round((total * inputOutputRatio) / (inputOutputRatio + 1));
    return { input, output: total - input };
  }, [tokenInputMode, inputTokens, outputTokens, totalTokensInput, inputOutputRatio]);

  const totalTokens = resolvedTokens.input + resolvedTokens.output;

  // Fetch plan matrix
  useEffect(() => {
    if (!catalog) return;
    const timeout = setTimeout(() => {
      setIsLoading(true);
      const request: Parameters<typeof fetchPlanMatrix>[0] = {
        output_currency: outputCurrency,
        target_region: "us",
      };
      if (activeTab === "budget") {
        request.budget = { amount: budget, currency: outputCurrency };
      } else {
        request.workload = {
          kind: "tokens_per_month",
          input_tokens: resolvedTokens.input,
          output_tokens: resolvedTokens.output,
        };
      }
      if (primaryModel) {
        request.token_meter_default = {
          provider: primaryModel.provider,
          channel: primaryModel.channel,
          model: primaryModel.model,
          region: "us",
        };
      }
      fetchPlanMatrix(request)
        .then(setPlanMatrix)
        .catch(() => setPlanMatrix(null))
        .finally(() => setIsLoading(false));

      // Baseline costs for all selected models (token tab only)
      if (activeTab === "tokens" && selectedModels.length > 0) {
        Promise.all(
          selectedModels.map((m) =>
            calculate({
              output_currency: outputCurrency,
              target_region: "us",
              workload: {
                kind: "tokens_per_month",
                input_tokens: resolvedTokens.input,
                output_tokens: resolvedTokens.output,
              },
              scenarios: [{
                kind: "token_meter",
                provider: m.provider,
                channel: m.channel,
                model: m.model,
                region: "us",
              }],
            })
              .then((res) => ({ key: m.key, label: m.label, result: res.scenarios[0] }))
              .catch(() => null),
          ),
        ).then((results) => {
          setBaselineScenarios(results.filter(Boolean) as typeof baselineScenarios);
        });
      } else {
        setBaselineScenarios([]);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [budget, resolvedTokens, activeTab, catalog, primaryModel, selectedModels, outputCurrency]);

  // Filter plans to those supporting all selected models
  const allPlans = useMemo(() => (planMatrix ? planMatrix.plans : []), [planMatrix]);

  // Free tier plans always shown — bypass model filter (they don't have API entitlements)
  const allFreeTierViable = useMemo(
    () => allPlans.filter((p) => (p.viability ?? "viable") === "viable" && isFreeTierPlan(p)),
    [allPlans],
  );

  // Model filter applies only to paid plans
  const filteredPlans = useMemo(() => {
    const nonFree = allPlans.filter((p) => !isFreeTierPlan(p));
    if (selectedModels.length === 0) return nonFree;
    return nonFree.filter((p) => planSupportsAllModels(p, selectedModels));
  }, [allPlans, selectedModels]);

  // Split by viability (paid plans only)
  const viablePlans = useMemo(
    () => filteredPlans.filter((p) => (p.viability ?? "viable") === "viable"),
    [filteredPlans],
  );
  const unknownViabilityPlans = useMemo(() => filteredPlans.filter((p) => p.viability === "viability_unknown"), [filteredPlans]);
  const nonViablePlans = useMemo(() => filteredPlans.filter((p) => p.viability === "non_viable"), [filteredPlans]);
  const priceUnavailablePlans = useMemo(() => filteredPlans.filter((p) => p.viability === "price_unavailable"), [filteredPlans]);

  // Group viable plans by provider type
  const viableByGroup = useMemo(() => {
    const groups = new Map<ProviderGroupId, PlanEntry[]>();
    for (const g of PROVIDER_GROUPS) groups.set(g.id, []);
    for (const plan of viablePlans) {
      const gid = planGroupId(plan);
      groups.get(gid)?.push(plan);
    }
    return groups;
  }, [viablePlans]);

  const modelSelectorLabel = selectedModels.length === 0
    ? "All models"
    : selectedModels.length === 1
      ? selectedModels[0].label
      : `${selectedModels.length} models selected`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">AI Cost Calculator</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Compare AI tools by budget or usage</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">Currency</label>
            <select
              value={outputCurrency}
              onChange={(e) => setOutputCurrency(e.target.value)}
              disabled={!catalog || catalog.currencies.length === 0}
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
            >
              {(catalog?.currencies ?? ["USD"]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {catalogError && (
          <Alert className="mb-6 border-2 border-black rounded-none">
            <AlertDescription>{catalogError}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="flex border-2 border-black mb-6">
          {(["budget", "tokens"] as const).map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 font-bold uppercase tracking-wide text-sm ${
                i > 0 ? "border-l-2 border-black" : ""
              } ${activeTab === tab ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
            >
              {tab === "budget" ? "Budget" : "Token Usage"}
            </button>
          ))}
        </div>

        {/* ── Budget tab ── */}
        {activeTab === "budget" && (
          <div className="border-2 border-black mb-8">
            <div className="border-b-2 border-black px-6 py-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">What can I afford?</p>
              <h2 className="text-lg font-bold uppercase mt-0.5">Monthly Budget</h2>
            </div>
            <div className="px-6 pt-8 pb-8">
              <div className="text-center mb-6">
                <span className="text-6xl font-bold">{formatAmount(budget, outputCurrency)}</span>
                <span className="text-xl text-muted-foreground ml-2">/month</span>
              </div>
              <input
                type="range" min="0" max="1000" step="5"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-4 rounded-none appearance-none cursor-pointer border-2 border-black"
                style={{ background: `linear-gradient(to right, black ${(budget / 1000) * 100}%, #e5e7eb ${(budget / 1000) * 100}%)` }}
              />
              <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                {BUDGET_MARKS.map((mark) => (
                  <button key={mark} type="button" onClick={() => setBudget(mark)} className="hover:text-black font-medium">
                    ${mark}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Token Usage tab ── */}
        {activeTab === "tokens" && (
          <div className="border-2 border-black mb-8">
            <div className="border-b-2 border-black px-6 py-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">What's the cheapest path?</p>
              <h2 className="text-lg font-bold uppercase mt-0.5">Monthly Token Usage</h2>
            </div>
            <div className="px-6 pt-6 pb-6 space-y-6">

              {/* Token input mode */}
              <div>
                <div className="flex gap-0 border-2 border-black mb-4 w-fit">
                  {(["specific", "aggregate"] as const).map((mode, i) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTokenInputMode(mode)}
                      className={`px-4 py-1.5 text-xs font-bold uppercase ${
                        i > 0 ? "border-l-2 border-black" : ""
                      } ${tokenInputMode === mode ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
                    >
                      {mode === "specific" ? "Input / Output" : "Total + Ratio"}
                    </button>
                  ))}
                </div>

                {tokenInputMode === "specific" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="font-bold uppercase text-sm">Input Tokens</Label>
                      <Input type="number" value={inputTokens} onChange={(e) => setInputTokens(e.target.value)} className="rounded-none border-2 border-black text-base" />
                      <p className="text-xs text-muted-foreground">{Number(inputTokens).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold uppercase text-sm">Output Tokens</Label>
                      <Input type="number" value={outputTokens} onChange={(e) => setOutputTokens(e.target.value)} className="rounded-none border-2 border-black text-base" />
                      <p className="text-xs text-muted-foreground">{Number(outputTokens).toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="font-bold uppercase text-sm">Total Monthly Tokens</Label>
                      <Input type="number" value={totalTokensInput} onChange={(e) => setTotalTokensInput(e.target.value)} className="rounded-none border-2 border-black text-base" />
                      <p className="text-xs text-muted-foreground">{Number(totalTokensInput).toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold uppercase text-sm">Input : Output Ratio</Label>
                        <span className="text-sm font-bold">{inputOutputRatio} : 1</span>
                      </div>
                      <input
                        type="range" min="1" max="10" step="0.5"
                        value={inputOutputRatio}
                        onChange={(e) => setInputOutputRatio(Number(e.target.value))}
                        className="w-full h-3 rounded-none appearance-none cursor-pointer border border-black"
                        style={{ background: `linear-gradient(to right, black ${((inputOutputRatio - 1) / 9) * 100}%, #e5e7eb ${((inputOutputRatio - 1) / 9) * 100}%)` }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1:1</span><span>3:1 (typical)</span><span>10:1</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        → {resolvedTokens.input.toLocaleString()} input / {resolvedTokens.output.toLocaleString()} output
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Totals + baseline costs per selected model */}
              <div className="border-t-2 border-black pt-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase font-bold text-muted-foreground">Total tokens/month</span>
                  <span className="text-xl font-bold">{totalTokens.toLocaleString()}</span>
                </div>
                {baselineScenarios.map(({ key, label, result }) => (
                  result.monthly_cost_estimate && (
                    <div key={key} className="flex items-baseline justify-between">
                      <span className="text-xs uppercase font-bold text-muted-foreground">{label} direct API</span>
                      <span className="text-xl font-bold">{formatCurrency(result.monthly_cost_estimate)}<span className="text-xs text-muted-foreground ml-1">/mo</span></span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Model selector (shown on both tabs) ── */}
        {modelOptions.length > 0 && (
          <div className="border-2 border-black mb-8">
            <div className="border-b-2 border-black px-6 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase">
                  {activeTab === "tokens" ? "Models" : "Filter by model access"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeTab === "tokens"
                    ? "Select models to see access paths and compare direct API cost."
                    : "Show only plans that give access to the selected models."}
                </p>
              </div>
              {selectedModelKeys.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setSelectedModelKeys([]); setModelSelectionInitialized(true); }}
                  className="text-xs text-muted-foreground underline hover:text-black"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="px-6 py-4">
              {Array.from(modelsByFamily.entries()).map(([family, models]) => (
                <div key={family} className="mb-4 last:mb-0">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-2">{family}</p>
                  <div className="flex flex-wrap gap-2">
                    {models.map((m) => {
                      const checked = selectedModelKeys.includes(m.key);
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => {
                            setSelectedModelKeys((prev) =>
                              checked ? prev.filter((k) => k !== m.key) : [...prev, m.key],
                            );
                          }}
                          className={`px-3 py-1.5 text-sm font-medium border-2 transition-colors ${
                            checked
                              ? "border-black bg-black text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-black"
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {selectedModelKeys.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3 border-t border-gray-100 pt-3">
                  Showing plans that provide access to: <strong>{selectedModels.map((m) => m.label).join(", ")}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">Calculating…</div>
        )}

        {/* ── Results ── */}
        {!isLoading && planMatrix && (
          <div className="space-y-8">
            {/* ─ Budget tab: separate free tiers from paid plans ─ */}
            {activeTab === "budget" && (() => {
              // Free tier plans come from the unfiltered pool (they bypass model filter)
              const freeTierPlans = allFreeTierViable;
              const paidViablePlans = viablePlans; // already excludes free tiers
              const withinBudget = paidViablePlans.filter((p) => p.fits_budget === true);
              const overBudget = paidViablePlans.filter((p) => p.fits_budget === false);
              const unknownBudget = paidViablePlans.filter((p) => p.fits_budget == null);

              // Group within-budget by provider type
              const withinByGroup = new Map<ProviderGroupId, PlanEntry[]>();
              for (const g of PROVIDER_GROUPS) withinByGroup.set(g.id, []);
              for (const p of withinBudget) {
                const gid = planGroupId(p);
                withinByGroup.get(gid)?.push(p);
              }

              return (
                <>
                  {/* What your budget gets you */}
                  <div className="border-2 border-black p-4 bg-black text-white">
                    <h2 className="text-base font-bold uppercase">
                      What {formatAmount(budget, outputCurrency)}/month gets you
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Paid plans within your budget, grouped by billing model.
                    </p>
                  </div>

                  {withinBudget.length === 0 ? (
                    <p className="text-sm text-muted-foreground border-2 border-black p-6 text-center">
                      No paid plans found within {formatAmount(budget, outputCurrency)}/month.
                      {budget < 20 && " Try a higher budget to see paid options."}
                    </p>
                  ) : (
                    PROVIDER_GROUPS.map((group) => {
                      const plans = withinByGroup.get(group.id) ?? [];
                      if (plans.length === 0) return null;
                      return (
                        <ProviderGroupSection
                          key={group.id}
                          group={group}
                          plans={plans}
                          activeTab="budget"
                          budget={budget}
                          outputCurrency={outputCurrency}
                          showBudgeFit={false}
                        />
                      );
                    })
                  )}

                  {/* Always free */}
                  {freeTierPlans.length > 0 && (
                    <div className="space-y-2">
                      <div className="border-2 border-black p-4">
                        <h3 className="text-sm font-bold uppercase">Always free</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          These plans cost nothing, regardless of your budget. What you get is limited — capacity details shown below.
                        </p>
                      </div>
                      {freeTierPlans.map((plan) => (
                        <PlanCard
                          key={planKey(plan)}
                          plan={plan}
                          showBudgetBadge={false}
                          showFreeTierCapacity
                        />
                      ))}
                    </div>
                  )}

                  {/* Over budget */}
                  {overBudget.length > 0 && (
                    <CollapsibleSection
                      title={`Over ${formatAmount(budget, outputCurrency)}/month`}
                      description="Paid plans above your current budget — shown for reference."
                      plans={overBudget}
                    />
                  )}

                  {/* Budget unknown */}
                  {unknownBudget.length > 0 && (
                    <CollapsibleSection
                      title="Budget fit unknown"
                      description="Plans where we can't determine if cost fits your budget."
                      plans={unknownBudget}
                      dim
                    />
                  )}
                </>
              );
            })()}

            {/* ─ Token tab: all viable plans by provider group ─ */}
            {activeTab === "tokens" && (
              <>
                <div className="border-2 border-black p-4 bg-black text-white">
                  <h2 className="text-base font-bold uppercase">
                    Access paths{selectedModels.length > 0 ? ` for ${modelSelectorLabel}` : ""}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Grouped by billing model. Effective cost at your token volume where computable.
                  </p>
                </div>
                {PROVIDER_GROUPS.map((group) => {
                  const plans = viableByGroup.get(group.id) ?? [];
                  if (plans.length === 0) return null;
                  return (
                    <ProviderGroupSection
                      key={group.id}
                      group={group}
                      plans={plans}
                      activeTab="tokens"
                      budget={budget}
                      outputCurrency={outputCurrency}
                    />
                  );
                })}
              </>
            )}

            {/* Viability unknown */}
            {unknownViabilityPlans.length > 0 && (
              <CollapsibleSection
                title="Estimated cost unknown"
                description={
                  activeTab === "budget"
                    ? "No subscription cost, but you pay per-token API costs. Switch to Token Usage tab to estimate."
                    : "These tools use opaque metering — we can't compute cost from token volume alone."
                }
                plans={unknownViabilityPlans}
                dim
              />
            )}

            {/* Non-viable */}
            {nonViablePlans.length > 0 && (
              <CollapsibleSection
                title="Insufficient capacity"
                description="These plans can't plausibly serve the token volume you entered."
                plans={nonViablePlans}
                dim
              />
            )}

            {/* Price unavailable */}
            {priceUnavailablePlans.length > 0 && (
              <CollapsibleSection
                title="Check vendor for pricing"
                description="Pricing not publicly available for these plans."
                plans={priceUnavailablePlans}
                dim
              />
            )}

            {viablePlans.length === 0 && unknownViabilityPlans.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border-2 border-black p-8">
                <p>No matching plans found.</p>
                {selectedModelKeys.length > 0 && (
                  <p className="text-xs mt-2">Try clearing the model filter to see all plans.</p>
                )}
              </div>
            )}

            {/* Bundles (budget mode only) */}
            {activeTab === "budget" && planMatrix.bundles.length > 0 && (
              <div className="space-y-2">
                <div className="border-2 border-black p-3">
                  <h3 className="text-sm font-bold uppercase">Multi-provider bundles</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Combined subscription costs for plans requiring multiple providers.</p>
                </div>
                {planMatrix.bundles.map((bundle) => (
                  <div key={bundle.subscription_keys.join("|")} className="border-2 border-black p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-sm">{bundle.providers.join(" + ")}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{bundle.subscription_keys.join(", ")}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          {formatCurrency({ currency: bundle.total_monthly_cost.currency, point: bundle.total_monthly_cost.point, method: "derived", confidence: "medium", confidence_reasons: [], evidence: [] })}
                        </div>
                        {bundle.fits_budget != null && (
                          <div className="text-xs text-muted-foreground">{bundle.fits_budget ? "Within budget" : "Over budget"}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t-2 border-black mt-12">
        <div className="max-w-4xl mx-auto px-6 py-4 text-xs text-muted-foreground text-center">
          Pricing data from official sources • Updated {planMatrix?.snapshot_dates.pricing || "—"}
        </div>
      </footer>
    </div>
  );
}

// ─── Provider group section ───────────────────────────────────────────────────

function ProviderGroupSection({
  group, plans, activeTab, budget, outputCurrency, showBudgeFit = true,
}: {
  group: ProviderGroup;
  plans: PlanEntry[];
  activeTab: "budget" | "tokens";
  budget: number;
  outputCurrency: string;
  showBudgeFit?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="border-2 border-black p-4">
        <h3 className="text-sm font-bold uppercase">{group.label}</h3>
        <p className="text-xs text-muted-foreground mt-1">{group.description}</p>
      </div>
      <div className="space-y-2">
        {plans.map((plan) => (
          <PlanCard
            key={planKey(plan)}
            plan={plan}
            showBudgetBadge={activeTab === "budget" && showBudgeFit}
            budget={budget}
            outputCurrency={outputCurrency}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Collapsible section (viability unknown / non-viable / price unavailable) ─

function CollapsibleSection({ title, description, plans, dim }: {
  title: string; description: string; plans: PlanEntry[]; dim?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full border border-gray-200 p-3 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100"
      >
        <div>
          <span className="text-sm font-bold uppercase text-gray-400">{title}</span>
          <span className="ml-2 text-xs text-gray-400">({plans.length})</span>
          {!open && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        <span className="text-gray-400 text-xs ml-4">{open ? "▲ Hide" : "▼ Show"}</span>
      </button>
      {open && (
        <div className={`space-y-2 ${dim ? "opacity-60" : ""}`}>
          {plans.map((plan) => <PlanCard key={planKey(plan)} plan={plan} showBudgetBadge={false} />)}
        </div>
      )}
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, showBudgetBadge, budget, outputCurrency, showFreeTierCapacity = false }: {
  plan: PlanEntry;
  showBudgetBadge: boolean;
  budget?: number;
  outputCurrency?: string;
  showFreeTierCapacity?: boolean;
}) {
  const costBasis = getPlanCostBasis(plan);
  const estimate = costBasis.estimate;
  const planName = formatPlanName(plan.plan_id);
  const toolName = plan.kind === "subscription" ? (plan.provider ?? "") : (plan.tool ?? "");
  const companyName = getCompanyName(plan);
  const warnings = costBasis.scenario?.warnings ?? [];

  // For free tier plans, show the Metering: warning as the capacity description
  const meteringNote = showFreeTierCapacity
    ? warnings.find((w) => w.startsWith("Metering:"))?.replace(/^Metering:\s*/, "")
    : null;

  const NOISE_PREFIXES = [
    "Metering:", "No markup provided", "Per-seat pricing",
    "Some entitlements were omitted", "Provider/model access is unknown",
    "Modalities are unknown", "Some capabilities are sourced",
    "Provider coverage is derived", "Specific model access",
    "Tool plan not found", "No USD/credit provided",
    "Subscription fee missing", "Included USD pool not found",
    "Selected long-context tier", "Tool plan price missing",
    "Subscription price missing", "No included_tokens_per_month",
    "Break-even", "break-even",
  ];
  const surfacedWarnings = warnings.filter(
    (w) => !NOISE_PREFIXES.some((prefix) => w.startsWith(prefix)),
  );

  const budgetFit = showBudgetBadge && plan.fits_budget != null
    ? plan.fits_budget ? "within" : "over"
    : null;

  return (
    <div className="border-2 border-black p-4 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <h3 className="font-bold text-base">{planName}</h3>
            {toolName && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-muted-foreground font-medium">{toolName}</span>
              </>
            )}
            {companyName && companyName !== toolName && (
              <span className="text-xs text-gray-400">({companyName})</span>
            )}
            {budgetFit && (
              <span className={`text-xs font-bold px-1.5 py-0.5 ml-1 ${
                budgetFit === "within"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {budgetFit === "within" ? "✓ fits" : "over budget"}
              </span>
            )}
          </div>

          {/* Pricing type + estimated badge */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {plan.kind === "tool_plan" && plan.pricing_type && (
              <span className="text-xs text-gray-500">{pricingTypeLabel(plan.pricing_type)}</span>
            )}
            {estimate && costBasis.kind === "effective" && (
              <Badge variant="outline" className="rounded-none border-black text-xs h-5 px-1.5">
                estimated
              </Badge>
            )}
          </div>

          {/* Model/provider access */}
          {(plan.capabilities.providers?.length ?? 0) > 0 && (
            <div className="mt-1.5 text-xs text-muted-foreground">
              Access: {plan.capabilities.providers!.join(", ")}
              {(plan.capabilities.modalities?.length ?? 0) > 0 &&
                plan.capabilities.modalities!.join(",") !== "text" && (
                  <span className="ml-2 text-gray-400">· {plan.capabilities.modalities!.join(", ")}</span>
                )}
            </div>
          )}

          {/* Credit rate */}
          {plan.kind === "tool_plan" && plan.credit_rate && (
            <div className="mt-1.5 text-xs text-blue-700">
              ~${plan.credit_rate.usd_per_credit.toFixed(3)}/credit
            </div>
          )}

          {/* Free tier capacity — shown in "Always free" section */}
          {meteringNote && (
            <div className="mt-2 text-xs text-green-800 bg-green-50 border border-green-200 px-2 py-1.5">
              <span className="font-bold">What you get: </span>{meteringNote}
            </div>
          )}

          {/* Viability reason */}
          {plan.viability_reason && plan.viability !== "viable" && (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1">
              {plan.viability_reason}
            </div>
          )}

          {/* User-relevant warnings */}
          {surfacedWarnings.length > 0 && (
            <div className="mt-1.5 text-xs text-muted-foreground">
              {surfacedWarnings.slice(0, 2).map((w) => <div key={w}>• {w}</div>)}
            </div>
          )}
        </div>

        {/* Cost */}
        <div className="text-right flex-shrink-0">
          {estimate ? (
            <>
              <p className="text-2xl font-bold">{formatCurrency(estimate)}</p>
              <p className="text-xs text-muted-foreground">/month</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Types & helpers ──────────────────────────────────────────────────────────

type PlanEntry = PlanMatrixResponse["plans"][number];

type PlanCostBasis = {
  kind: "effective" | "floor" | "none";
  scenario: ScenarioResult | null;
  estimate: EvidencedMoneyEstimate | null;
};

function planKey(plan: PlanEntry): string {
  return `${plan.kind}-${plan.kind === "subscription" ? plan.provider : plan.tool}-${plan.plan_id}`;
}

function formatPlanName(planId: string): string {
  return planId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getCompanyName(plan: PlanEntry): string {
  const map: Record<string, string> = {
    Cursor: "Anysphere", "GitHub Copilot": "GitHub", Copilot: "GitHub",
    Devin: "Cognition", "Bolt.new": "StackBlitz", Windsurf: "Codeium",
    "Amazon Q Developer": "AWS", anthropic: "Anthropic", openai: "OpenAI",
    google: "Google", azure: "Microsoft", moonshot: "Moonshot AI",
  };
  const name = plan.kind === "subscription" ? (plan.provider ?? "") : (plan.tool ?? "");
  return map[name] ?? name;
}

function getPlanCostBasis(plan: PlanEntry): PlanCostBasis {
  if (plan.monthly_cost_effective) {
    return { kind: "effective", scenario: plan.monthly_cost_effective, estimate: plan.monthly_cost_effective.monthly_cost_estimate };
  }
  if (plan.monthly_cost_floor) {
    return { kind: "floor", scenario: plan.monthly_cost_floor, estimate: plan.monthly_cost_floor.monthly_cost_estimate };
  }
  return { kind: "none", scenario: null, estimate: null };
}

function formatCurrency(estimate: EvidencedMoneyEstimate): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: estimate.currency,
      maximumFractionDigits: estimate.point < 10 ? 2 : 0,
    }).format(estimate.point);
  } catch {
    return `${estimate.currency} ${estimate.point.toFixed(estimate.point < 10 ? 2 : 0)}`;
  }
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency,
      maximumFractionDigits: amount < 10 ? 2 : 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}
