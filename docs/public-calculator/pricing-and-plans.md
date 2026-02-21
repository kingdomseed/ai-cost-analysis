# Pricing & Plans (Calculator Notes)

This calculator needs to compare costs across **different billing primitives**:

1) **Direct token pricing (API):** input/output tokens billed directly.
2) **Prepaid “API pool” plans:** a subscription includes a stated dollar amount of compute (e.g., “$200 plan includes $400 API usage”).
3) **Credit systems:** a subscription includes *credits* and/or you can buy top-ups; credits may map to dollars, tokens, or opaque “request units”.

## Key rule

We only output “cost across tools” when we can define a **conversion** from the user’s input (tokens) to the tool’s billing unit (USD pool or credits).

If the tool is opaque (credits don’t map cleanly to tokens), we still support it by:
- showing plan price + included credits + top-up price, and
- letting the user enter an “effective $/credit” assumption (or a “tokens per credit” assumption), which is clearly labeled as **user-provided**.

### “Effective tokens” (allowed)

For credit/compute-unit tools (Verdent, Qoder, Devin, etc.) the calculator may allow an **effective tokens** view:

- The user provides (or the tool publishes) an **effective $/credit** (or $/ACU).
- The user also provides a working **input:output split** (default can be 3:1 for agentic programming work).
- We compute the equivalent token spend as if it were billed at a chosen API meter.

This is explicitly an **assumption-driven conversion** unless the vendor publishes an official mapping.

### Promotions and temporary prices

When a tool publishes time-bounded promos (e.g., “$0 through Q1 2026 then $20/user”), represent them as a **promo block**:
- promo price, duration/period, and the regular price
- keep the promo end date explicit when it can be derived (e.g., Q1 2026 ends 2026-03-31)
- never assume the promo renews

## How we’ll represent pricing (data model)

Every plan/model/provider entry should include:
- `source` (where did this number come from)
- `retrieved_at` and `last_verified_at` (dates)
- `confidence` or `verified` (boolean/enum)

We will treat any unverified entries as “draft” and render them as such.

## Cursor-style API pool plans (example)

For plans that explicitly state an included **USD compute pool**, we can compute:

- **Compute value multiplier:** `included_pool_usd / subscription_price_usd`
- **Break-even vs API:** compare the user’s estimated monthly API spend to the subscription price
- **Overage behavior:** if the pool is exhausted, cost reverts to pay-as-you-go (we show both)

## Credit systems (Windsurf / Warp / Verdent / Qoder / etc.)

These vary, but we’ll support a consistent display:

- Subscription price
- Included credits
- Optional top-up packs (price + credits)
- **Implied $/credit** where possible (`topup_price / topup_credits` or `plan_price / included_credits`)
- “Equivalent API spend” only when we have (or the user provides) a mapping from credits → USD or credits → tokens.

## What we will not do

- No subjective language (“best”, “worst”, “you should…”).
- No pretending opaque credit systems are precise token pricing.
- No mixing “actual billed” with “estimated API-equivalent” without explicit labeling.
