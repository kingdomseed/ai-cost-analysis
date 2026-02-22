# Public Cost Calculator Spec

## Problem statement

Users want to compare:
- “Pay per token” costs across different models/providers
- vs flat-rate plans (e.g., $100/mo, $200/mo)
 - vs tool subscriptions with credits/pools/quotas, within a fixed monthly budget

…using an objective, structured approach that outputs clear math.

## Inputs (proposed)

Minimum:
- Model (single or multiple)
- Either a usage estimate (tokens/month) **or** a monthly budget

Optional:
- Input/output split (explicit or ratio-based)
- Cached vs uncached assumptions (if the provider exposes caching pricing and the user wants to model it)
 - Requirements (e.g., “I need OpenAI + Anthropic”, or “I need video modality”) to surface when multiple subscriptions are necessary

## Outputs

For each selection:
- Estimated monthly cost
- Cost per 1M tokens (input and output shown separately when applicable)
- Break-even threshold vs a user-entered flat monthly plan price (e.g., “$200/month”)
 - For budgets: which plans fit (price floor and best-effort effective cost), plus multi-subscription bundles when the user needs multiple providers

## Language constraints

- No subjective judgments.
- No persuasive “recommendations.”
- Present comparisons as computed values and deltas.

## Pricing data policy (important)

Pricing changes frequently.
The calculator should treat pricing as a versioned data file with:
- a source link
- a retrieval date
- an explicit “last verified” date

(We are not implementing the pricing data pipeline in this organization pass; this is just the intended policy.)

## Support for “programmer tool” plans (credits / pools)

Many programming tools don’t bill purely by tokens. The calculator will support:

- **Direct token APIs** (cleanest comparison)
- **API pool plans** (subscription includes a stated USD compute pool; show effective multiplier and overage behavior)
- **Credit systems** (subscription includes credits + optional top-ups; compute implied $/credit when possible)

Details and rules: `docs/public-calculator/pricing-and-plans.md`.

## Datasets (public)

All calculator decisions are snapshot-driven:
- `apps/public-calculator/data/pricing.YYYY-MM-DD.json`
- `apps/public-calculator/data/entitlements.YYYY-MM-DD.json` (includes `model_access:*`, `provider_access:*`, `modality_access:*` when sourced)
- `apps/public-calculator/data/models.YYYY-MM-DD.json` (model metadata + optional ratings; ratings may be empty until sourced)
- `apps/public-calculator/data/fx.YYYY-MM-DD.json`

## Pricing pillars (what we mean by “empirical”)

See:
- `docs/public-calculator/pricing-pillars.md`
- `docs/public-calculator/pricing-research-workflow.md`
