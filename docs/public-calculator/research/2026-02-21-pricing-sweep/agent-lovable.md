# Lovable — Pricing + Credits (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Official sources

- Plans and credits (includes tier tables + top-ups): `https://docs.lovable.dev/introduction/plans-and-credits`
- Pricing page (referenced by docs): `https://lovable.dev/pricing`

## Billing primitive

Lovable uses a **usage-based credit system**. Credits are deducted per message and the cost depends on complexity (docs provide example credit costs).

## Free vs paid plan mechanics (high level)

From docs:
- Free plan: 5 daily credits, up to a maximum of 30 per month.
- Pro plan: 5 daily credits up to a maximum of 150 per month, plus monthly credits based on tier.
- Business plan: Pro features plus enterprise/admin features (SSO, restricted projects, opt-out of data training, design templates).

## Paid plan tiers (monthly credits ↔ price)

Lovable publishes tier tables for both **Pro** and **Business** plans (monthly billing and annual billing).

Pro (monthly billing, examples):
- 100 credits: $25/mo
- 800 credits: $200/mo
- 10,000 credits: $2,250/mo

Business (monthly billing, examples):
- 100 credits: $50/mo
- 800 credits: $400/mo
- 10,000 credits: $4,300/mo

See the docs page for the full tier list and annual billing equivalents.

## Top-ups

From docs:
- Available on Pro and Business plans
- Purchased in 50-credit increments (min 50, max 1,000; multiple purchases allowed)
- Pricing: Pro $15 per 50 credits; Business $30 per 50 credits
- Top-up credits valid for 12 months from most recent purchase

## Notes / gaps

- No stable credits↔tokens mapping is published; treat credits as **opaque** and let calculator users override assumptions if desired.

