"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculate, fetchCatalog, fetchPlanMatrix } from "@/lib/api";
import type {
  CatalogResponse,
  EvidencedMoneyEstimate,
  PlanMatrixResponse,
  ScenarioResult,
} from "@/types/api";

const BUDGET_MARKS = [0, 10, 20, 50, 100, 200, 500, 1000];

export default function Home() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"budget" | "tokens">("budget");

  // Budget mode state
  const [budget, setBudget] = useState<number>(50);
  const [outputCurrency, setOutputCurrency] = useState<string>("USD");

  // Token mode state
  const [inputTokens, setInputTokens] = useState<string>("1000000");
  const [outputTokens, setOutputTokens] = useState<string>("500000");
  const [selectedTokenMeterKey, setSelectedTokenMeterKey] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [requiredProviders, setRequiredProviders] = useState<string[]>([]);

  const tokenMeterOptions = useMemo(() => {
    if (!catalog) return [];
    return catalog.token_meters.map((meter) => ({
      key: `${meter.provider}:${meter.channel}:${meter.model}`,
      label: `${meter.provider} ${meter.model} (${meter.channel})`,
      provider: meter.provider,
      channel: meter.channel,
      model: meter.model,
    }));
  }, [catalog]);

  const subscriptionProviders = useMemo(() => {
    if (!catalog) return [];
    const providers = catalog.subscriptions.map((sub) => sub.provider);
    return Array.from(new Set(providers)).sort();
  }, [catalog]);

  useEffect(() => {
    if (tokenMeterOptions.length === 0) return;
    const exists = tokenMeterOptions.some((opt) => opt.key === selectedTokenMeterKey);
    if (!selectedTokenMeterKey || !exists) {
      setSelectedTokenMeterKey(tokenMeterOptions[0].key);
    }
  }, [tokenMeterOptions, selectedTokenMeterKey]);

  useEffect(() => {
    if (!catalog) return;
    if (catalog.regions.length === 0) return;
    if (!selectedRegion) {
      setSelectedRegion(catalog.regions[0]);
    }
  }, [catalog, selectedRegion]);

  useEffect(() => {
    if (!catalog) return;
    if (catalog.currencies.length === 0) return;
    if (!outputCurrency) {
      setOutputCurrency(catalog.base_currency || catalog.currencies[0]);
      return;
    }
    if (!catalog.currencies.includes(outputCurrency)) {
      setOutputCurrency(catalog.base_currency || catalog.currencies[0]);
    }
  }, [catalog, outputCurrency]);

  const selectedTokenMeter = useMemo(() => {
    return tokenMeterOptions.find((opt) => opt.key === selectedTokenMeterKey) ?? null;
  }, [tokenMeterOptions, selectedTokenMeterKey]);

  const [planMatrix, setPlanMatrix] = useState<PlanMatrixResponse | null>(null);
  const [baselineScenario, setBaselineScenario] = useState<ScenarioResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch((err) => setCatalogError(err.message));
  }, []);

  // Fetch results when inputs change
  useEffect(() => {
    if (!catalog) return;

    const timeout = setTimeout(() => {
      setIsLoading(true);

      const request: Parameters<typeof fetchPlanMatrix>[0] = {
        output_currency: outputCurrency,
      };
      if (activeTab === "budget") {
        request.budget = { amount: budget, currency: outputCurrency };
      } else {
        request.workload = {
          kind: "tokens_per_month",
          input_tokens: Number(inputTokens) || 0,
          output_tokens: Number(outputTokens) || 0,
          cached_input_tokens: 0,
        };
      }
      if (selectedTokenMeter) {
        request.token_meter_default = {
          provider: selectedTokenMeter.provider,
          channel: selectedTokenMeter.channel,
          model: selectedTokenMeter.model,
          region: selectedRegion === "global" ? undefined : selectedRegion || undefined,
        };
      }
      if (selectedRegion && selectedRegion !== "global") {
        request.target_region = selectedRegion;
      }
      if (requiredProviders.length > 0) {
        request.requirements = { providers: requiredProviders };
      }
      fetchPlanMatrix(request)
        .then(setPlanMatrix)
        .catch(() => setPlanMatrix(null))
        .finally(() => setIsLoading(false));

      if (activeTab === "tokens" && selectedTokenMeter) {
        calculate({
          output_currency: outputCurrency,
          workload: {
            kind: "tokens_per_month",
            input_tokens: Number(inputTokens) || 0,
            output_tokens: Number(outputTokens) || 0,
            cached_input_tokens: 0,
          },
          scenarios: [
            {
              kind: "token_meter",
              provider: selectedTokenMeter.provider,
              channel: selectedTokenMeter.channel,
              model: selectedTokenMeter.model,
              region: selectedRegion === "global" ? undefined : selectedRegion || undefined,
            },
          ],
          target_region: selectedRegion === "global" ? undefined : selectedRegion || undefined,
        })
          .then((res) => {
            const scenario = res.scenarios[0] ?? null;
            setBaselineScenario(scenario);
          })
          .catch(() => setBaselineScenario(null));
      } else {
        setBaselineScenario(null);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [
    budget,
    inputTokens,
    outputTokens,
    activeTab,
    catalog,
    selectedTokenMeter,
    selectedRegion,
    requiredProviders,
    outputCurrency,
  ]);

  const totalTokens = (Number(inputTokens) || 0) + (Number(outputTokens) || 0);

  const sortedPlans = useMemo(() => {
    if (!planMatrix) return [];
    return [...planMatrix.plans].sort((a, b) => planCostValue(a) - planCostValue(b));
  }, [planMatrix]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold tracking-tight uppercase">AI Cost Calculator</h1>
          <p className="text-muted-foreground mt-2">Compare AI tools by budget or usage</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {catalogError && (
          <Alert className="mb-6 border-2 border-black rounded-none">
            <AlertDescription>{catalogError}</AlertDescription>
          </Alert>
        )}

        <Card className="border-2 border-black rounded-none shadow-none mb-6">
          <CardHeader className="border-b-2 border-black">
            <CardTitle className="text-xl font-bold uppercase tracking-wide">
              Pricing Context
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6 space-y-4">
            <div>
              <Label className="font-bold uppercase text-sm block mb-2">Output currency</Label>
              <select
                value={outputCurrency}
                onChange={(e) => setOutputCurrency(e.target.value)}
                className="w-full p-3 border-2 border-black rounded-none bg-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-black"
                disabled={!catalog || catalog.currencies.length === 0}
              >
                {(catalog?.currencies ?? ["USD"]).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="font-bold uppercase text-sm block mb-2">Billing region</Label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full p-3 border-2 border-black rounded-none bg-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-black"
                disabled={!catalog || catalog.regions.length === 0}
              >
                {(catalog?.regions ?? ["global"]).map((region) => (
                  <option key={region} value={region}>
                    {region.toUpperCase()}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Region is a pricing tier (US/EU/etc). Currency conversion uses FX snapshots.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex border-2 border-black mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("budget")}
            className={`flex-1 py-3 font-bold uppercase tracking-wide ${
              activeTab === "budget" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            Find by Budget
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tokens")}
            className={`flex-1 py-3 font-bold uppercase tracking-wide border-l-2 border-black ${
              activeTab === "tokens" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            Find by Token Usage
          </button>
        </div>

        {/* Budget Mode */}
        {activeTab === "budget" && (
          <Card className="border-2 border-black rounded-none shadow-none mb-8">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="text-xl font-bold uppercase tracking-wide">
                Monthly Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-6">
                <span className="text-6xl font-bold">
                  {formatAmount(budget, outputCurrency)}
                </span>
                <span className="text-xl text-muted-foreground ml-2">/month</span>
              </div>

              <input
                type="range"
                min="0"
                max="1000"
                step="5"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-4 bg-gray-200 rounded-none appearance-none cursor-pointer border-2 border-black"
                style={{
                  background: `linear-gradient(to right, black ${(budget / 1000) * 100}%, #e5e7eb ${(budget / 1000) * 100}%)`,
                }}
              />

              <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                {BUDGET_MARKS.map((mark) => (
                  <button
                    key={mark}
                    type="button"
                    onClick={() => setBudget(mark)}
                    className="hover:text-black font-medium"
                  >
                    ${mark}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Token Mode */}
        {activeTab === "tokens" && (
          <Card className="border-2 border-black rounded-none shadow-none mb-8">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="text-xl font-bold uppercase tracking-wide">
                Monthly Token Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-sm">Input Tokens</Label>
                  <Input
                    type="number"
                    value={inputTokens}
                    onChange={(e) => setInputTokens(e.target.value)}
                    className="rounded-none border-2 border-black text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    {Number(inputTokens).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-sm">Output Tokens</Label>
                  <Input
                    type="number"
                    value={outputTokens}
                    onChange={(e) => setOutputTokens(e.target.value)}
                    className="rounded-none border-2 border-black text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    {Number(outputTokens).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Token meter selector */}
              <div className="mt-6 pt-4 border-t-2 border-black">
                <Label className="font-bold uppercase text-sm block mb-2">
                  Token meter (for plan math)
                </Label>
                <select
                  value={selectedTokenMeterKey}
                  onChange={(e) => setSelectedTokenMeterKey(e.target.value)}
                  className="w-full p-3 border-2 border-black rounded-none bg-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={tokenMeterOptions.length === 0}
                >
                  {tokenMeterOptions.length === 0 ? (
                    <option>Loading token meters...</option>
                  ) : (
                    tokenMeterOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  {tokenMeterOptions.length > 0
                    ? "Selected token meter is used for break-even and pool plan calculations."
                    : "Loading token meter options..."}
                </p>
              </div>

              {catalog?.regions?.length ? (
                <div className="mt-6 pt-4 border-t-2 border-black">
                  <Label className="font-bold uppercase text-sm block mb-2">Region</Label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full p-3 border-2 border-black rounded-none bg-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {catalog.regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Used to select regional token rates when available.
                  </p>
                </div>
              ) : null}

              <div className="mt-6 pt-6 border-t-2 border-black text-center">
                <p className="text-sm text-muted-foreground uppercase">Total Monthly Tokens</p>
                <p className="text-4xl font-bold">{totalTokens.toLocaleString()}</p>
              </div>

              {baselineScenario?.monthly_cost_estimate ? (
                <div className="mt-6 pt-6 border-t-2 border-black">
                  <p className="text-sm text-muted-foreground uppercase">Token-meter baseline</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(baselineScenario.monthly_cost_estimate)}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
                    <Badge className="rounded-none border-black" variant="outline">
                      {baselineScenario.monthly_cost_estimate.method}
                    </Badge>
                    <Badge className="rounded-none border-black" variant="outline">
                      {baselineScenario.monthly_cost_estimate.confidence}
                    </Badge>
                  </div>
                  {baselineScenario.warnings?.length ? (
                    <div className="mt-2 text-xs text-yellow-800">
                      {baselineScenario.warnings.slice(0, 2).map((warning) => (
                        <div key={warning}>• {warning}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {subscriptionProviders.length > 0 ? (
          <Card className="border-2 border-black rounded-none shadow-none mb-8">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="text-xl font-bold uppercase tracking-wide">
                Provider Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {subscriptionProviders.map((provider) => {
                  const checked = requiredProviders.includes(provider);
                  return (
                    <label key={provider} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => {
                          setRequiredProviders((prev) =>
                            checked
                              ? prev.filter((p) => p !== provider)
                              : [...prev, provider],
                          );
                        }}
                      />
                      <span>{provider}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Selecting 2+ providers enables subscription bundle comparisons.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Calculating costs...</p>
          </div>
        )}

        {!isLoading && activeTab === "tokens" && (
          <div className="space-y-4">
            <div className="border-2 border-black p-4 bg-black text-white">
              <h2 className="text-lg font-bold uppercase">Plans (Best Available Cost)</h2>
              <p className="text-sm text-gray-400 mt-1">
                Effective estimates shown when workload + token meter are available; otherwise price floors.
              </p>
            </div>
            {sortedPlans.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-black p-8">
                <p>No matching options found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPlans.map((plan) => (
                  <PlanCard key={planKey(plan)} plan={plan} />
                ))}
              </div>
            )}
          </div>
        )}

        {!isLoading && activeTab === "budget" && planMatrix && (
          <div className="space-y-6">
            <div className="border-2 border-black p-4 bg-black text-white">
              <h2 className="text-lg font-bold uppercase">Budget Coverage</h2>
              {planMatrix.budget?.conversion_warnings?.length ? (
                <p className="text-sm text-yellow-200 mt-2">
                  {planMatrix.budget.conversion_warnings.join(" ")}
                </p>
              ) : null}
            </div>

            {renderBudgetSection("Within Budget", sortedPlans.filter((p) => p.fits_budget === true))}
            {renderBudgetSection("Over Budget", sortedPlans.filter((p) => p.fits_budget === false))}
            {renderBudgetSection("Budget Unknown", sortedPlans.filter((p) => p.fits_budget == null))}

            {sortedPlans.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-black p-8">
                <p>No matching options found</p>
              </div>
            ) : null}

            {planMatrix.bundles.length > 0 ? (
              <div className="space-y-3">
                <div className="border-2 border-black p-3 bg-white">
                  <h3 className="text-base font-bold uppercase">Bundles (Multi-provider)</h3>
                </div>
                <div className="space-y-3">
                  {planMatrix.bundles.map((bundle) => (
                    <div key={bundle.subscription_keys.join("|")} className="border-2 border-black p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 text-sm">
                          <div className="font-semibold">{bundle.providers.join(" + ")}</div>
                          <div className="text-muted-foreground">
                            {bundle.subscription_keys.join(", ")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {formatCurrency({
                              currency: bundle.total_monthly_cost.currency,
                              point: bundle.total_monthly_cost.point,
                              method: "derived",
                              confidence: "medium",
                              confidence_reasons: [],
                              evidence: [],
                            })}
                          </div>
                          {bundle.fits_budget != null ? (
                            <div className="text-xs text-muted-foreground">
                              {bundle.fits_budget ? "Within budget" : "Over budget"}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>

      <footer className="border-t-2 border-black mt-12">
        <div className="max-w-4xl mx-auto px-6 py-4 text-sm text-muted-foreground text-center">
          Data from official provider pricing • Updated {catalog?.snapshot_dates.pricing || "—"}
        </div>
      </footer>
    </div>
  );
}

type PlanEntry = PlanMatrixResponse["plans"][number];

type PlanCostBasis = {
  kind: "effective" | "floor" | "none";
  scenario: ScenarioResult | null;
  estimate: EvidencedMoneyEstimate | null;
};

function renderBudgetSection(title: string, plans: PlanEntry[]) {
  if (plans.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="border-2 border-black p-3 bg-white">
        <h3 className="text-base font-bold uppercase">{title}</h3>
      </div>
      <div className="space-y-3">
        {plans.map((plan) => (
          <PlanCard key={planKey(plan)} plan={plan} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: PlanEntry }) {
  const costBasis = getPlanCostBasis(plan);
  const estimate = costBasis.estimate;
  const planName = formatPlanName(plan.plan_id);
  const toolName = plan.kind === "subscription" ? plan.provider : plan.tool;
  const companyName = getCompanyName(plan);
  const warnings = costBasis.scenario?.warnings ?? [];
  const modelAccess = plan.capabilities.model_access ?? [];
  const modalities = plan.capabilities.modalities ?? [];
  const providers = plan.capabilities.providers ?? [];
  const notes = plan.capabilities.notes ?? [];

  return (
    <div className="border-2 border-black p-4 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-bold text-lg">{planName}</h3>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium">{toolName}</span>
            {companyName !== toolName && (
              <>
                <span className="text-muted-foreground">→</span>
                <span className="text-sm text-muted-foreground">{companyName}</span>
              </>
            )}
          </div>

          {estimate ? (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className="rounded-none border-black" variant="outline">
                {costBasis.kind === "effective" ? "effective" : "floor"}
              </Badge>
              <Badge className="rounded-none border-black" variant="outline">
                {estimate.method}
              </Badge>
              <Badge className="rounded-none border-black" variant="outline">
                {estimate.confidence}
              </Badge>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-2">No computable cost yet</div>
          )}

          <div className="mt-2 text-sm text-muted-foreground space-y-1">
            {plan.kind === "tool_plan" && plan.pricing_type ? (
              <div>Pricing type: {plan.pricing_type}</div>
            ) : null}
            {providers.length > 0 ? <div>Providers: {providers.join(", ")}</div> : null}
            {modalities.length > 0 ? <div>Modalities: {modalities.join(", ")}</div> : null}
            {modelAccess.length > 0 ? (
              <div>Models: {modelAccess.slice(0, 4).join(", ")}{modelAccess.length > 4 ? "…" : ""}</div>
            ) : null}
          </div>

          {warnings.length > 0 ? (
            <div className="mt-3 text-xs text-yellow-800">
              {warnings.slice(0, 2).map((warning) => (
                <div key={warning}>• {warning}</div>
              ))}
            </div>
          ) : null}
          {notes.length > 0 ? (
            <div className="mt-2 text-xs text-muted-foreground">
              {notes.slice(0, 2).map((note) => (
                <div key={note}>• {note}</div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="text-right flex-shrink-0">
          {estimate ? (
            <>
              <p className="text-3xl font-bold">{formatCurrency(estimate)}</p>
              <p className="text-xs text-muted-foreground">/month</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No price data</p>
          )}
        </div>
      </div>
    </div>
  );
}

function planKey(plan: PlanMatrixResponse["plans"][0]): string {
  return `${plan.kind}-${plan.kind === "subscription" ? plan.provider : plan.tool}-${plan.plan_id}`;
}

function formatPlanName(planId: string): string {
  return planId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getCompanyName(plan: PlanMatrixResponse["plans"][0]): string {
  const companyMap: Record<string, string> = {
    Cursor: "Anysphere",
    "GitHub Copilot": "GitHub",
    Copilot: "GitHub",
    Devin: "Cognition",
    Cline: "Cline",
    "Bolt.new": "StackBlitz",
    Windsurf: "Codeium",
    Warp: "Warp",
    Replit: "Replit",
    Amazon: "AWS",
    "Amazon Q": "AWS",
    Claude: "Anthropic",
    ChatGPT: "OpenAI",
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    azure: "Microsoft",
  };

  const name = plan.kind === "subscription" ? plan.provider : plan.tool;
  if (!name) return "";
  return companyMap[name] || name;
}

function getPlanCostBasis(plan: PlanEntry): PlanCostBasis {
  if (plan.monthly_cost_effective) {
    return {
      kind: "effective",
      scenario: plan.monthly_cost_effective,
      estimate: plan.monthly_cost_effective.monthly_cost_estimate,
    };
  }
  if (plan.monthly_cost_floor) {
    return {
      kind: "floor",
      scenario: plan.monthly_cost_floor,
      estimate: plan.monthly_cost_floor.monthly_cost_estimate,
    };
  }
  return { kind: "none", scenario: null, estimate: null };
}

function planCostValue(plan: PlanEntry): number {
  const estimate =
    plan.monthly_cost_effective?.monthly_cost_estimate ??
    plan.monthly_cost_floor?.monthly_cost_estimate ??
    null;
  return estimate ? estimate.point : Number.POSITIVE_INFINITY;
}

function formatCurrency(estimate: EvidencedMoneyEstimate): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: estimate.currency,
      maximumFractionDigits: estimate.point < 10 ? 2 : 0,
    }).format(estimate.point);
  } catch {
    return `${estimate.currency} ${estimate.point.toFixed(estimate.point < 10 ? 2 : 0)}`;
  }
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: amount < 10 ? 2 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(amount < 10 ? 2 : 0)}`;
  }
}
