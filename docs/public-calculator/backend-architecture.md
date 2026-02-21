# Backend Architecture (Public Calculator)

Goal: a pure, deterministic “calculator engine” that consumes versioned datasets and outputs objective comparisons (no subjective recommendations).

## Inputs

### 1) Pricing snapshot

- File: `apps/public-calculator/data/pricing.YYYY-MM-DD.json`
- Contains:
  - token-metered API rates (input/output/cache)
  - tool plan mechanics (credits/pools/top-ups/overages)
  - subscription prices + limit wording (opaque)

### 2) Entitlements snapshot

- File: `apps/public-calculator/data/entitlements.YYYY-MM-DD.json`
- Contains: plan-gated features and **surfaces** (web/desktop/mobile/CLI/IDE/GitHub/admin).
- Includes **region** and **evidence type** (public URL vs dashboard capture vs blocked).

### 3) Workload request (user input)

The engine should accept either:
- **Tokens/month** (input + output, optional cached tokens)
- **Credits/month** (when user has a tool-only estimate)
- **Budget/month** (for break-even calculations)

Plus optional modeling knobs:
- input:output ratio (default 3:1, labeled “estimated”)
- cache hit rate (when applicable)
- “effective credits per request” (only for tools without credit↔token mapping)

## Core modules (pure functions)

### A) Token meter calculator

Given `{input_tokens, output_tokens, cached_input_tokens}` and a model’s rates → cost lines.

### B) Pool calculator (USD-included usage)

Given plan subscription price + included USD pool + overage policy → effective multiplier and cost curve.

### C) Credit calculator (opaque credits)

Given plan subscription price + credits + top-ups → compute implied $/credit (if pack exists).  
Do **not** convert to tokens unless a sourced mapping exists; allow user-supplied assumptions.

### D) Subscription comparator (opaque quotas)

Given a subscription price and an API-equivalent token-meter cost for the same workload:
- output the delta vs token-meter cost
- output “limits opaque” signals and surfaced entitlements

## Outputs (engine result)

For each scenario, return:
- `monthly_cost_estimate` (always present as an estimate + confidence metadata)
- `line_items[]` (subscription fee, overage, top-ups, token meter lines)
- `assumptions[]` (ratio, cache hit rate, $/credit assumptions)
- `evidence[]` (source IDs and evidence types)
- `entitlements[]` (surfaces/features included for that plan + region)

See also: `docs/public-calculator/api-contract.md` (required “unknown/opaque” rules).

## Evidence + region rules

- Prefer **public URL** evidence.
- If public docs conflict with an authenticated dashboard for the user’s region, allow “dashboard capture” evidence and label it clearly.
- Region variants are first-class; never collapse CN vs US/global into one number.

## Implementation layout (proposed)

We are implementing the UI as a **Next.js site**:

- UI (Next.js App Router): `apps/public-calculator/site/`
- Versioned datasets (public): `apps/public-calculator/data/`

When we factor out reusable computation:
- `packages/core/` (pure calculation + types; no web/UI)
