# Findings: Backend architecture (2026-02-21)

## What’s already in place

- Pricing snapshot is versioned and sourced: `apps/public-calculator/data/pricing.2026-02-21.json`
- Research sweep captures official URLs + gaps: `docs/public-calculator/research/2026-02-21-pricing-sweep/`
- We now have an entitlements checklist (surfaces per service): `docs/public-calculator/entitlements-checklist.md`

## Key architecture decision

Treat “what it costs” and “what you get” as **separate datasets**:

1) **Pricing dataset** (token meters, credits/pools, subscription prices)
2) **Entitlements dataset** (features + surfaces + limits, tied to plan_id + region + evidence)

This prevents pricing tables from becoming overloaded with feature availability and reduces confusion when:
- a plan exists but a surface is region-gated
- a surface exists but is not included in certain tiers
- a page is blocked (Cloudflare) but we have authenticated UI evidence

## Risk to track

Some providers have Cloudflare blocks in this environment (notably OpenAI marketing/pricing). Our model must accept evidence types beyond “public URL” while still preferring public official sources.

