# Windsurf PR Reviews — Pricing/limits + export surfaces (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Official sources

- PR Reviews overview: `https://docs.windsurf.com/windsurf-reviews/windsurf-reviews`
- PR Reviews overview (Chinese locale; contains explicit limit note): `https://docs.windsurf.com/zh/windsurf-reviews/windsurf-reviews`
- Plan pricing (Teams/Pro): `https://windsurf.com/pricing`
- Plans and credit usage (includes Teams add-on pricing + invoice download note): `https://docs.windsurf.com/windsurf/accounts/usage`
 - User-provided limits capture (unverified): `docs/public-calculator/research/2026-02-21-pricing-sweep/user-windsurf-prreviews-limits-capture.2026-02-21.md`

## What PR Reviews are

Windsurf PR Reviews is a GitHub PR integration that posts review comments on pull requests; it is described as beta for Teams and Enterprise customers using GitHub Cloud.

## Limits / constraints (official)

The PR Reviews docs include operational constraints:

- **Max files per PR:** 50 files
- **Org-wide cap:** 500 PR reviews per month (org-wide)

Note: A separate limit statement was provided by the repo owner (“min(50 reviews per member, 1000 total) rolling 30 days”), but we have not yet found an official Windsurf URL that publishes it. Treat it as **unverified** until corroborated; see the user capture file above.

## Billing mechanics (what we can verify from official docs)

- Windsurf plan pricing is credit-based for premium models (prompt credits and add-on credits).
- Teams plan includes per-seat monthly prompt credits and pooled add-on credits purchasable in $40 increments (1000 credits).
- The PR Reviews doc does not explicitly state whether PR Reviews consume prompt credits or are metered as a separate quota bucket.

## Where to download invoices / receipts (official)

The usage docs state invoices/receipts can be downloaded from the authenticated plan management page:
- `https://windsurf.com/subscription/manage-plan`
