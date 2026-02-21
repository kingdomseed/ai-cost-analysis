# Windsurf PR Reviews — Pricing/limits + export surfaces (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Official sources

- PR Reviews overview: `https://docs.windsurf.com/windsurf-reviews/windsurf-reviews`
- Plan pricing (Teams/Pro): `https://windsurf.com/pricing`
- Plans and credit usage (includes Teams add-on pricing + invoice download note): `https://docs.windsurf.com/windsurf/accounts/usage`
- Dashboard limits capture (authenticated UI; treated as authoritative for target region): `docs/public-calculator/research/2026-02-21-pricing-sweep/user-windsurf-prreviews-limits-capture.2026-02-21.md`

## What PR Reviews are

Windsurf PR Reviews is a GitHub PR integration that posts review comments on pull requests; it is described as beta for Teams and Enterprise customers using GitHub Cloud.

## Limits / constraints (official)

### Published docs (public)

The public PR Reviews doc includes operational constraints such as:

- **Max files per PR:** 50 files
- **Org-wide cap:** states **500 reviews/month**

### Authenticated dashboard (target region)

The repo owner captured a word-for-word statement from the authenticated Windsurf dashboard:

- Team rate limit = `min(50 reviews per team member, 1000 reviews total)`
- Applies to a rolling 30-day window (resets gradually)

For this repo’s target (US/global consumer tooling comparisons), we treat the authenticated dashboard statement as authoritative, and we treat the public docs’ “500 reviews/month” as potentially stale or region-specific until Windsurf clarifies.

## Billing mechanics (what we can verify from official docs)

- Windsurf plan pricing is credit-based for premium models (prompt credits and add-on credits).
- Teams plan includes per-seat monthly prompt credits and pooled add-on credits purchasable in $40 increments (1000 credits).
- The PR Reviews doc does not explicitly state whether PR Reviews consume prompt credits or are metered as a separate quota bucket.

## Where to download invoices / receipts (official)

The usage docs state invoices/receipts can be downloaded from the authenticated plan management page:
- `https://windsurf.com/subscription/manage-plan`
