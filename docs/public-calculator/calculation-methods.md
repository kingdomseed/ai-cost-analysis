# Calculation Methods (API-first)

Simple goal (public calculator): given a user’s usage estimate, return **objective cost comparisons** across models/providers/tools and **break-even math** vs subscription plans—**without** subjective recommendations.

This document defines which calculations are allowed, what they require, and how they must be reported through the API so the UI can remain an honest renderer.

## Core principles (non-negotiable)

1) **Always return something computable**
- At minimum: an **API-equivalent token-meter baseline** (when token prices exist) and a **plan price floor** (when a subscription fee exists).

2) **Every number is labeled**
- `method`: `direct | derived | assumed | heuristic`
- `confidence`: `high | medium | low`
- `confidence_reasons[]`: explicit why confidence is not `high`
- `evidence[]`: snapshot `source_id` references

3) **No silent guessing**
- We never invent credit↔token conversions. If we use a heuristic, we must label it and include the exact assumption.

4) **Region and time are first-class**
- Region variants must not be averaged together.
- Snapshots are dated; stale/unverified numbers must downgrade confidence and/or produce warnings.

## Standard workload inputs

### A) Tokens/month (preferred)

`tokens_per_month`: `{ input_tokens, output_tokens, cached_input_tokens? }`

Optional modeling knobs (API can accept later; engine must echo if used):
- `input_to_output_ratio` (heuristic, if user provides only “total tokens”)
- `cache_hit_rate` (heuristic unless tool/provider defines it)

### B) Credits/month (tool-native)

`credits_per_month`: `{ credits }`

Optional:
- `usd_per_credit` (assumed unless derived from an official pack price)
- `effective_credits_per_request` (assumed unless sourced)

### C) Budget/month

`budget_per_month`: `{ budget_usd }`

Used mainly for “how much usage do I get for $X?” or comparing within a fixed budget.

## Pricing primitives (how we model tools)

Each product/plan is categorized by a “billing primitive”. Calculations are defined per primitive.

### 1) Token-meter (API list prices)

**Inputs required**
- Token workload (input/output; optional cached input)
- Token rates (input/output; optional cached input)

**Computation (point estimate)**
- `cost_input = (input_tokens / 1e6) * rate_input`
- `cost_output = (output_tokens / 1e6) * rate_output`
- `cost_cached = (cached_input_tokens / 1e6) * rate_cached` (if available)

**Back-calculation allowed**
- Break-even tokens vs a subscription fee (see “Break-even” section)

**Special cases**
- **Tiered rates** (e.g., long-context thresholds): selection must be explicit:
  - method: `derived` (because it’s conditional logic, even if deterministic)
  - confidence: usually `medium`
  - include the threshold rule in `confidence_reasons[]` or `warnings[]`
- **Regional rates**: pick the user’s region; otherwise default to first known region with a warning.
- **Cache variants**: some providers publish cache hit/miss pricing differently than “cached_input”. Preserve the exact fields in datasets and map to workload with explicit assumptions.

### 2) Subscription price floor (opaque quotas)

This is for plans with a monthly price but **no computable token/credit quota**.

**Inputs required**
- Subscription price (USD/month)

**Computation**
- `monthly_cost_estimate = subscription_price_usd` (floor)

**Back-calculation allowed (very important)**
- Break-even: “If you used $X in token-meter cost, subscription is cheaper once $X ≥ subscription_fee.”
- Budget framing: “For $SUB/mo, your API-equivalent token spend would have to be at least $SUB to ‘break even’.”

**What we must *not* claim**
- We do not claim “included tokens” or “unlimited tokens” as a numeric quota unless the vendor publishes a token-equivalent quota.

### 3) USD pool plans (prepaid API credits)

Example: “$60/mo includes $70 API usage; then pay as you go”.

**Inputs required**
- Subscription price (USD/month)
- Included pool (USD/month)
- Overage policy (payg vs stop vs throttle)
- Metering rule / markup (e.g., “+20% in Max mode”)

**Computation (plan-effective cost)**
- First compute API-equivalent token-meter cost for the chosen model(s): `api_cost_usd`
- Apply tool markup if published: `metered_cost_usd = api_cost_usd * (1 + markup)`
- `overage = max(0, metered_cost_usd - included_pool_usd)`
- `monthly_total = subscription_fee + overage`

**Back-calculation allowed**
- Break-even tokens for a plan tier:
  - Solve for tokens where `subscription_fee + max(0, metered_cost - pool) == api_cost` (depends on markup)

### 4) Credit packs (USD ↔ credits)

This is the key lever for many tools.

**Inputs required**
- A credit pack price: `{ pack_price_usd, pack_credits }` (official or authenticated UI)

**Derived values**
- `usd_per_credit = pack_price_usd / pack_credits` (method: `derived`)

**Plan-effective cost (credits workload)**
- If user provides credits/month: `cost = credits * usd_per_credit`
- If plan includes credits: treat subscription fee as floor; optionally compute “implied value”:
  - `included_credits_value = included_credits * usd_per_credit` (derived; still not token-equivalent)

**Caution**
- Tools may apply **multipliers per model** or per “agent mode”. If multipliers are published, model them as:
  - `effective_credits = credits * multiplier`
- If multipliers are not fully specified, confidence is `low` and results should become a range if possible.

### 5) Per-request metering (“premium requests”, “messages”, etc.)

Some tools publish $/request for overage and/or include a request allowance.

**Inputs required**
- Cost per request (USD/request)
- User-provided requests/month, OR a declared assumption to approximate requests from tokens

**Back-calculation allowed**
- If the user only knows tokens/month, we can *optionally* derive requests/month using an explicit heuristic:
  - `requests = total_tokens / tokens_per_request_assumption`
  - method: `heuristic`, confidence: `low`
  - this should be opt-in or at least clearly surfaced

### 6) Compute units (ACUs/seconds/LOC)

Examples: “agent compute units”, “LOC transformed”, “minutes of agent runtime”.

**Inputs required**
- Published unit price + definition
- User-provided units/month

**Back-calculation allowed**
- Converting tokens→ACUs is *not allowed* unless the vendor publishes a mapping.
- But you can still return an API-equivalent token baseline separately for the underlying model where applicable.

## Back-calculation methods (allowed, bounded)

Back-calculation exists to give users actionable comparisons while staying honest.

### A) Break-even vs token-meter baseline

**Definition**
Break-even is “the token-meter spend where subscription cost equals token-meter cost”.

**Outputs**
- break-even expressed as:
  - `break_even_usd_per_month` (always computable if subscription price is known)
  - optionally `break_even_tokens` (only if a token-meter price is selected)

**Rules**
- If quota is opaque, we can still compute `break_even_usd_per_month` with high confidence.
- If we convert break-even USD to tokens, confidence drops if token prices are unverified or if multiple models are mixed.

### B) Implied $/credit (from packs)

See “Credit packs” section. This is a safe, sourced derivation.

### C) Derived ranges (when uncertainty is structural)

When a tool’s credit burn varies by model/mode, represent uncertainty as a **range**:
- `low_usd`, `high_usd` on `MoneyEstimate`
- confidence: `low`
- reasons must include what drives the range (e.g., “model multiplier unknown; using min/max observed”)

### D) “Best-effort” mapping from *private observed logs* (optional mode)

For private analysis (not public by default), we can support:
- estimating `credits_per_token` using user-exported logs where both credits and tokens are observable

Rules:
- must be gated behind an explicit `evidence_policy: allow_private`
- must label `method: derived` + `confidence: medium/low` depending on coverage
- must never be presented as vendor-published truth

## How results should be returned (API)

At minimum, for any selected tool/plan the engine should be able to return:

1) **Baseline token-meter scenario** (if a token price exists)
2) **Plan price floor** (if a subscription fee exists)

Then layer in:
- pool-effective costs
- credit-effective costs
- per-request costs
- break-evens

This is codified in `docs/public-calculator/api-contract.md`.

