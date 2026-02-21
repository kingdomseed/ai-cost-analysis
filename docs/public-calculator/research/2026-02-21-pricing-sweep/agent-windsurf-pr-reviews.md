# Windsurf PR Reviews — Pricing/limits + export surfaces (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Official sources

- PR Reviews overview: `https://docs.windsurf.com/windsurf-reviews/windsurf-reviews`
- Plan pricing (Teams/Pro): `https://windsurf.com/pricing`
- Plans and credit usage (includes Teams add-on pricing + invoice download note): `https://docs.windsurf.com/windsurf/accounts/usage`

## What PR Reviews are

Windsurf PR Reviews is a GitHub PR integration that posts review comments on pull requests; it is described as beta for Teams and Enterprise customers using GitHub Cloud.

## Limits / constraints (official)

The PR Reviews doc includes operational constraints such as:
- max files per PR review (50 files)
- an org-wide “AI review” rate cap per month (the docs mention a numeric cap; re-check when building UX)

Note: This doc does not publish a per-seat “included reviews per month” number in the text captured in this sweep; treat any “50 code reviews included” seen in billing portals as plan/UI-specific and re-verify.

## Billing mechanics (what we can verify from official docs)

- Windsurf plan pricing is credit-based for premium models (prompt credits and add-on credits).
- Teams plan includes per-seat monthly prompt credits and pooled add-on credits purchasable in $40 increments (1000 credits).
- The PR Reviews doc does not explicitly state whether PR Reviews consume prompt credits or are metered as a separate quota bucket.

## Where to download invoices / receipts (official)

The usage docs state invoices/receipts can be downloaded from the authenticated plan management page:
- `https://windsurf.com/subscription/manage-plan`

