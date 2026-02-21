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

## Dependency hygiene (public calculator site)

- Next.js is already on latest stable v16 (`next@16.1.6`, `eslint-config-next@16.1.6`).
- `npm audit` high findings were caused by a `minimatch <10.2.1` advisory in lint toolchains. We kept `eslint@9.x` (compatible with Next’s lint stack) and enforced `minimatch@10.2.1` via npm `overrides` to clear audit while keeping `npm run lint` working.
