# Cursor plan naming/availability discrepancy (needs resolution)

**retrieved_at:** 2026-02-21  \n**last_verified_at:** 2026-02-21

## What we observed (official sources disagree on “what plans exist”)

### Cursor docs (explicitly list 3 individual tiers)

Cursor’s docs page lists individual tiers as **Pro / Pro Plus / Ultra** with included USD usage pools:
- Pro: **$20** of API agent usage
- Pro Plus: **$70** of API agent usage
- Ultra: **$400** of API agent usage

Source: `https://cursor.com/docs/account/pricing`

### Cursor marketing pricing page (shows a single “Individual $60/mo” tier)

Cursor’s marketing pricing page prominently shows:
- Hobby (Free)
- Individual **$60/mo** with **$70/mo included usage**
- Teams **$40/user/mo**

Source: `https://cursor.com/pricing`

This aligns with the **Pro Plus** numbers (price $60, included usage $70), but does not visibly present a $20 “Pro” tier.

### Cursor blog (historical context)

Cursor’s blog posts explain the shift from request limits to compute/usage pools for Pro, and mention “at least $20 of model inference at API prices per month”.

Sources:
- `https://cursor.com/blog/june-2025-pricing`
- `https://cursor.com/blog/new-tier`

### Cursor checkout links (what tiers are purchasable on the pricing page)

The `cursor.com/pricing` page includes checkout links that explicitly reference:
- `tier=pro_plus`
- `tier=ultra`

In this sweep we did **not** observe a `tier=pro` checkout link on the public pricing page.

Source: `https://cursor.com/pricing`

## Implication for the public calculator dataset

Until we confirm current availability:
- Represent Cursor plans as a set of plan definitions sourced from **both** docs + pricing pages.
- Add a field like `publicly_listed_on_pricing_page` (true/false) and/or `availability_note`.
- Default UI to the plans visible on `cursor.com/pricing`, but allow advanced users to include hidden/legacy tiers if still purchasable.

## Next verification step (recommended)

Find an official Cursor page that clearly answers whether “Pro $20” is still purchasable in Feb 2026 (e.g., account checkout links, billing portal docs, or a pricing FAQ that enumerates all tiers).

If Pro is not purchasable for new users, encode it as `availability: legacy/grandfathered` (still useful for users comparing an existing plan).
