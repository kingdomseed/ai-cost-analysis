# API Contract (Public Calculator)

This repo is **API-first**: the calculator engine must always return **something computable**, while being explicit about:
- what is **directly supported by sources**
- what is **derived** (back-calculated)
- what is **assumed** (user-provided or defaults)
- how confident we are, and why

The UI should be a thin renderer of this contract (no hidden math).

Related:
- `docs/public-calculator/calculation-methods.md`

## API surfaces

### 1) Dataset read API (snapshot retrieval)

Already present:
- `GET /api/datasets/pricing`
- `GET /api/datasets/entitlements`

Response shape:
- `kind` (`pricing` | `entitlements`)
- `snapshot_date`
- `data` (raw snapshot JSON)

### 2) Calculation API (engine execution)

Proposed endpoint (not implemented yet):
- `POST /api/calculate`

Input is a workload + one or more scenarios to evaluate. Output is a list of scenario results.

#### Current implementation (baseline-only)

The current implementation supports these scenario kinds:
- `token_meter` (API-equivalent baseline for a specific provider/channel/model)
- `tool_plan_floor` (subscription fee floor for a tool plan, if a monthly price exists)
- `subscription_floor` (subscription fee floor for a provider plan, if a monthly price exists)
- `tool_plan_api_pool_effective` (plan-effective estimate for USD pool plans; requires a token-meter reference)
- `tool_plan_credits_effective` (plan-effective estimate for credit plans; derives USD/credit from a sourced pack when possible)

## Core design rule: always return a computable baseline

Even when a tool/plan is “opaque” (no published token quota) or “unknown” (no credit↔token mapping), the engine still returns:

1) **Token-meter baseline** (`baseline_api_equivalent`)
   - What the workload costs using published token meter prices for the selected model/provider.
2) **Plan price floor** (if a subscription exists)
   - The recurring subscription fee, and any known add-ons, as a minimum monthly cost.

If we can compute “plan-effective cost” (pool, overage, top-ups, packs), we return that too.

## Example requests (API-first)

### Token-meter baseline (API-equivalent)

```json
{
  "workload": { "kind": "tokens_per_month", "input_tokens": 3000000, "output_tokens": 1000000 },
  "scenarios": [{ "kind": "token_meter", "provider": "openai", "channel": "api", "model": "gpt-5.2" }]
}
```

### USD pool plan-effective (Cursor-style)

```json
{
  "workload": { "kind": "tokens_per_month", "input_tokens": 3000000, "output_tokens": 1000000 },
  "scenarios": [
    {
      "kind": "tool_plan_api_pool_effective",
      "tool": "Cursor",
      "plan_id": "cursor-individual",
      "token_meter": { "provider": "openai", "channel": "api", "model": "gpt-5.2" },
      "markup_multiplier": 0.2
    }
  ]
}
```

### Credits plan-effective (Windsurf-style) from a credit pack

```json
{
  "workload": { "kind": "credits_per_month", "credits": 2500 },
  "scenarios": [{ "kind": "tool_plan_credits_effective", "tool": "Windsurf", "plan_id": "windsurf-teams" }]
}
```

## “Unknown” vs “Opaque”

- **Unknown mapping**: we do not have enough information to convert units.
  - Example: “credits” where we don’t have **USD per credit** or **credits per request**.
- **Opaque quota**: vendor provides plan price but not a numeric usage quota.
  - Example: “usage varies” / “fair use” / “extended quota”.

Both can still be compared honestly by returning a baseline + explicit uncertainty.

## Evidence and confidence (required fields)

Every numeric output must carry:

- `method`
  - `direct` — directly from a source (official price list, published token meter).
  - `derived` — back-calculated from sourced numbers (e.g., USD/credit from a credit pack).
  - `assumed` — user-provided assumption (or a declared default).
  - `heuristic` — a rule-of-thumb we ship as a default; must be labeled and overridable.

- `confidence`
  - `high` — direct official sources; no extra assumptions needed.
  - `medium` — derived from official sources or requires minor assumptions.
  - `low` — depends on heuristics, incomplete docs, or single weak sources.

- `confidence_reasons[]`
  - short strings explaining exactly what reduces confidence (e.g., “credit burn multipliers vary by model”).

- `evidence[]`
  - `source_id` references to the snapshot’s `sources[]`.
  - optionally `evidence_type` (public URL vs authenticated UI capture vs blocked).

## What “back-calculation” means (allowed)

Back-calculation is allowed **only** when it is anchored in sourced numbers. Examples:

- **USD per credit** from a published pack:
  - `usd_per_credit = pack_price_usd / pack_credits`
  - method: `derived`, confidence: `medium` (if pack mechanics are clear)

- **Break-even tokens** for a subscription vs token-meter baseline:
  - “How many tokens would you have to use before subscription price equals token-meter cost?”
  - method: `derived`, confidence: `high` (math is deterministic), plus warning: “quota not published”

Back-calculation does **not** permit guessing credit→token conversion unless the vendor publishes it.

## Output model (engine)

Each scenario returns:

- `monthly_cost_estimate_usd` (always present as an estimate)
  - can be `point` only, or `range` if uncertainty exists
- `line_items[]` (subscription fee, top-ups, token-meter lines, etc.)
- `assumptions[]` (input:output ratio, cache hit rate, USD/credit assumption, etc.)
- `warnings[]` (human-readable flags suitable for UI display)
- `evidence[]` (source IDs + evidence types)

## Public vs private analysis

The public calculator should default to **public evidence only**. Private analysis can optionally incorporate:
- authenticated dashboard captures
- user-exported logs

If/when we support that, it must be an explicit input flag (e.g., `evidence_policy: public_only | allow_private`), and the output must label when private evidence contributed to a number.
