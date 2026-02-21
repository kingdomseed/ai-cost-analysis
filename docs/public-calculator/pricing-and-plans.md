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

