# Public Cost Calculator Spec

## Problem statement

Users want to compare:
- “Pay per token” costs across different models/providers
- vs flat-rate plans (e.g., $100/mo, $200/mo)

…using an objective, structured approach that outputs clear math.

## Inputs (proposed)

Minimum:
- Model (single or multiple)
- Usage estimate (tokens/month)

Optional:
- Input/output split (explicit or ratio-based)
- Cached vs uncached assumptions (if the provider exposes caching pricing and the user wants to model it)

## Outputs

For each selection:
- Estimated monthly cost
- Cost per 1M tokens (input and output shown separately when applicable)
- Break-even threshold vs a user-entered flat monthly plan price (e.g., “$200/month”)

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

## Pricing pillars (what we mean by “empirical”)

See:
- `docs/public-calculator/pricing-pillars.md`
- `docs/public-calculator/pricing-research-workflow.md`
