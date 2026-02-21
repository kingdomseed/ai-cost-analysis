# Agent Notes: Dev Tools Pricing Mechanics (Cursor, Windsurf, Warp, OpenRouter) — Pricing Sweep

**Agent focus:** Official (Feb 2026) pricing *mechanics* for developer tools that wrap/route LLM usage, with emphasis on (a) included pools/credits, (b) metering unit, (c) top-ups, and (d) explicit model multipliers.  
**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Summary

Common patterns across tools:
- **Cursor:** token-metered at model list API prices (dollar-denominated included “API agent usage” pool); optional pay-as-you-go “on-demand usage”; **Max Mode is +20%** over model API rate.
- **Windsurf:** **prompt-credit** system (per message) with **per-model credit multipliers**; monthly plan credits reset; add-on credits roll over; explicit top-up prices + auto-refill rules.
- **Warp:** **credit** system that scales with tokens and tool usage (non-deterministic); add-on credits sold in packages with volume discounts + auto reload; BYOK can bypass Warp credits for provider-model requests.
- **OpenRouter:** prepaid USD credits deducted at per-model prices (prompt/output, sometimes per request/image/reasoning tokens); no inference markup, but **credit purchase fee**; free models + small free allowance; BYOK has a 5% fee after a monthly free BYOK quota.

## Primary sources (official)

Cursor:
- Pricing docs (usage mechanics): `https://cursor.com/docs/account/pricing`
- Pricing page (plan pricing / plan “usage” fields embedded in the shipped page bundle): `https://cursor.com/pricing`

Windsurf:
- Pricing page: `https://windsurf.com/pricing`
- Plans and credit usage docs: `https://docs.windsurf.com/windsurf/accounts/usage`
- Models page (overview + links to usage): `https://docs.windsurf.com/windsurf/models`

Warp:
- Pricing page: `https://www.warp.dev/pricing`
- Plans overview: `https://docs.warp.dev/support-and-community/plans-and-billing/plans-and-pricing`
- Credits: `https://docs.warp.dev/support-and-community/plans-and-billing/credits`
- Add-on credits: `https://docs.warp.dev/support-and-community/plans-and-billing/add-on-credits`
- BYOK: `https://docs.warp.dev/support-and-community/plans-and-billing/bring-your-own-api-key`

OpenRouter:
- FAQ (billing, fees, free tier, variants): `https://openrouter.ai/docs/faq`
- Pricing page (plan/rate limit mechanics): `https://openrouter.ai/pricing`
- Terms (credit purchase bounds, refunds): `https://openrouter.ai/terms`

Note: Some marketing/pricing pages are heavily JS-rendered. In those cases, the content was retrieved by inspecting the official HTML payload or the official static bundles served by the same domain.

---

## 1) Cursor — included pools, metering, on-demand, multipliers

### 1.1 Included usage pools / credits

Cursor’s docs describe a monthly included “API agent usage” allowance (dollar-denominated), plus “Auto and Composer” usage:
- **Pro:** $20 of API agent usage (monthly) + generous Auto/Composer usage
- **Pro Plus:** $70 of API agent usage (monthly) + generous Auto/Composer usage
- **Ultra:** $400 of API agent usage (monthly) + generous Auto/Composer usage

Cursor’s pricing page also exposes a plan object that includes:
- **Pro:** $20/month (or $16/month on annual) and “usage” $20 (or $16)
- **Pro+:** $60/month (or $48/month on annual) and “usage” $70
- **Ultra:** $200/month (or $160/month on annual) and “usage” $400

Sources:
- `https://cursor.com/docs/account/pricing`
- `https://cursor.com/pricing`

Teams / Enterprise (Cursor):
- Cursor’s pricing docs also describe team plans: **Teams ($40/user/mo)** and **Enterprise (Custom)**, with Enterprise aimed at needs like pooled usage, invoicing, and advanced security controls.

Source: `https://cursor.com/docs/account/pricing`

### 1.2 How usage is metered

Cursor describes token-based billing when using explicit model selection:
- If you select a model directly, usage is incurred at the model’s **list API price**.

Cursor also explicitly calls out that “Max Mode” is token-based pricing (see multiplier below).

Source: `https://cursor.com/docs/account/pricing`

### 1.3 Top-ups / on-demand usage

When you exceed the included monthly usage, Cursor says you can choose to:
- **Add on-demand usage**: continue at the **same API rates** with pay-as-you-go billing.
- **Upgrade your plan**: move to a higher tier for more included usage.

Cursor additionally notes:
- “On-demand usage is billed monthly at the same rates as your included usage.”

Source: `https://cursor.com/docs/account/pricing`

### 1.4 Explicit multipliers by model

Cursor’s “Max Mode” (larger context window) is explicitly priced as:
- token-based pricing at the model’s API rate **plus a 20% upcharge**.

Source: `https://cursor.com/docs/account/pricing`

### 1.5 Notes for calculator modeling

Recommended public-calculator abstraction:
- Treat Cursor’s “API agent usage” as a **USD budget** that is consumed at **token pricing** (model list API rate), plus a **Max Mode multiplier** (1.20×) when Max Mode is used.
- Treat “on-demand usage” as **pay-as-you-go** at the same underlying token pricing, billed monthly.

---

## 2) Windsurf — prompt credits, per-model multipliers, top-ups

### 2.1 Included usage pools / credits

Windsurf uses monthly-issued **prompt credits** (plus separate “add-on” credits):
- **Free:** 25 prompt credits / month
- **Pro Trial (2 weeks):** 100 prompt credits
- **Pro:** 500 prompt credits / month (priced at $15/month)
- **Teams:** 500 prompt credits / user / month (priced at $30/user/month)
- **Enterprise:** 1000 prompt credits / user / month (priced at $60/user/month)

Corroboration:
- Plan prices + monthly credits appear on `https://windsurf.com/pricing`.
- Plan quotas and credit/billing behavior are described in `https://docs.windsurf.com/windsurf/accounts/usage`.

### 2.2 How usage is metered

Windsurf meters premium model usage primarily **per message** (not per token):
- Prompt credits are consumed when a message is sent to Cascade with a premium model.
- Each model has a **credit multiplier**; the “default message” costs **1 credit**.
- The docs explicitly illustrate that, for the default case, “1 Prompt credit is consumed” per premium-model message, regardless of how many actions Cascade takes.

Source: `https://docs.windsurf.com/windsurf/accounts/usage`

### 2.3 Top-ups (add-on credits) and auto-refill

Manual top-ups (add-on credits):
- **Pro:** $10 / 250 credits
- **Teams/Enterprise:** $40 / 1000 pooled credits

Carryover/reset rules:
- Monthly plan credits reset each billing cycle and **do not roll over**.
- Add-on credits **do not expire** (carried until used), and the pricing page also states unused add-on credits “roll over month to month.”

Automatic Credit Refills (auto top-ups):
- Auto top-up triggers when you drop below **15 credits**.
- Purchases are in configurable increments (multiples of **$10** for Pro and **$40** for Teams).
- Default monthly budget caps are **$50** (Pro) and **$160** (Teams) per calendar month.

Sources:
- `https://docs.windsurf.com/windsurf/accounts/usage`
- `https://windsurf.com/pricing`

### 2.4 Explicit multipliers by model

Windsurf’s model multiplier mechanism is explicit:
- “Every model has it’s own credit multiplier …”
- Users are directed to the models page to view “associated costs”.

Sources:
- `https://docs.windsurf.com/windsurf/accounts/usage`
- `https://docs.windsurf.com/windsurf/models`

### 2.5 Notes for calculator modeling

Recommended public-calculator abstraction:
- Windsurf “prompt credits” are best modeled as a **per-message** meter with a **per-model multiplier**, rather than token-based billing.
- Add-on credits behave like a **stored balance** (carryover), while monthly plan credits behave like a **monthly quota** (reset).

---

## 3) Warp — credits scale with tokens, add-on packages, BYOK bypass

### 3.1 Included usage pools / credits

Warp’s pricing page describes plans that include monthly credits:
- **Build:** 1,500 credits per month, $18/month (pay-as-you-go starting at)
- **Max:** 12× credits per month, $180/month (pay-as-you-go starting at)
- **Free:** includes free AI credits (the pricing page copy is qualitative; the billing docs reference a 150-credit Free plan limit in a refund policy example)
- **Business:** $45/user/month
- **Enterprise:** custom

Sources:
- `https://www.warp.dev/pricing`
- `https://docs.warp.dev/support-and-community/plans-and-billing/plans-and-pricing`

### 3.2 How usage is metered

Warp bills “credits” for AI Agent interactions:
- A credit is “a unit of work” and scales with the number of tokens processed (not “one user message”).
- Each interaction consumes at least 1 credit, but can consume multiple credits depending on complexity, model choice, tool calls, context size, etc.
- Usage is explicitly described as non-deterministic.

Source: `https://docs.warp.dev/support-and-community/plans-and-billing/credits`

### 3.3 Top-ups: Add-on Credits (pricing + auto reload)

Warp sells Add-on Credits in packages (with volume discounts):
- 400 credits for $10 (base rate $0.025/credit)
- 1,000 credits for $20 ($0.020/credit, 20% off)
- 3,000 credits for $50 ($0.016/credit, ~35% off)
- 6,500 credits for $100 (~$0.0153/credit, ~40% off)

Auto reload behavior:
- Auto reload triggers when balance reaches 100 credits.
- Default monthly spend limit is $200 (adjustable); limit resets at the start of each calendar month.
- Add-on credits roll over across billing cycles and remain valid for 12 months from purchase date.

Source: `https://docs.warp.dev/support-and-community/plans-and-billing/add-on-credits`

### 3.4 Explicit multipliers by model

Warp does not publish a single numeric multiplier table per model in the credits doc, but it explicitly states model choice changes credit consumption:
- Smaller models typically consume fewer credits; larger/reasoning models consume more.
- The doc provides an example ordering by higher credit usage (e.g., Claude Opus 4.1 higher than Claude Sonnet 4.5, GPT‑5, Gemini 2.5 Pro).

Source: `https://docs.warp.dev/support-and-community/plans-and-billing/credits`

### 3.5 BYOK (Bring Your Own API Key)

Warp’s BYOK behavior is explicit and relevant to cost mechanics:
- Selecting a provider model via your own API key routes requests to the provider and **does not consume Warp credits**.
- “Auto” models always consume Warp credits (even if BYOK is configured).
- BYOK keys are stored locally and are not available to cloud agent runs; cloud agents always consume Warp credits.

Sources:
- `https://docs.warp.dev/support-and-community/plans-and-billing/bring-your-own-api-key`
- `https://docs.warp.dev/support-and-community/plans-and-billing/credits`

### 3.6 Notes for calculator modeling

Recommended public-calculator abstraction:
- Warp credits behave like a **token-and-tool-call-weighted** meter (non-deterministic; not a pure “tokens × price” formula in public docs).
- Add-on credits behave like a **prepaid pack** with volume discount tiers + auto reload.
- BYOK requests are a separate “meter” where Warp credits are **0**, and costs are paid to the provider directly.

---

## 4) OpenRouter — prepaid USD credits, per-model token rates, fees, variants

### 4.1 Included usage pools / credits

OpenRouter is a credit-based prepaid system (USD-denominated):
- New users receive a “very small free allowance” to test.
- There are many “free models” available (including `:free` variants), but with low rate limits.
- Pricing page states pay-as-you-go has “no minimums and no lock-in” and “no minimum spend” (prices based on models).

Sources:
- `https://openrouter.ai/docs/faq`
- `https://openrouter.ai/pricing`

### 4.2 How usage is metered

OpenRouter meters usage by **provider-reported token counts** and the model’s published pricing:
- Pricing is displayed per 1M tokens, usually different for prompt vs completion.
- Some models charge per request, images, and reasoning tokens; those details are shown on the models pages.
- OpenRouter receives the total token counts from the provider, calculates cost, and deducts from credits.
- OpenRouter states there is **no markup on inference pricing** (fees apply to credit purchases).

Source: `https://openrouter.ai/docs/faq`

### 4.3 Top-ups / fees / expiry

Credit purchase fees:
- 5.5% fee ($0.80 minimum) when purchasing credits.
- Crypto payments fee: 5%.

Purchase bounds (Terms):
- Minimum and maximum credit purchase amount: $5 and $25,000 per transaction.

Credit lifecycle:
- Users can top up manually or configure auto top-up when balance drops below a threshold.
- Credits may be expired after one year (OpenRouter reserves the right to expire unused credits after one year).

Sources:
- `https://openrouter.ai/docs/faq`
- `https://openrouter.ai/terms`

### 4.4 Explicit multipliers by model (and variants)

OpenRouter does not define a single “credit multiplier” system. Instead:
- Each model has its own published pricing schedule (prompt/output, and sometimes per-request/image/reasoning tokens).
- It documents **model variants** such as `:free`, `:extended`, `:thinking`, and routing shortcuts like `:nitro` and `:floor`.

Additionally, OpenRouter’s BYOK has an explicit “fee multiplier” mechanic:
- First 1M BYOK requests/month are free; subsequent BYOK usage has a 5% fee relative to normal OpenRouter model/provider cost (deducted from OpenRouter credits).

Source: `https://openrouter.ai/docs/faq`

### 4.5 Notes for calculator modeling

Recommended public-calculator abstraction:
- OpenRouter pay-as-you-go is **token-priced by model**, with credit purchase fees as a separate line item.
- Treat `:free` as a **rate-limit constrained** variant (not a discount multiplier).
- BYOK introduces a separate “OpenRouter fee” meter (0% up to quota, then 5% of equivalent cost), in addition to provider billing.
