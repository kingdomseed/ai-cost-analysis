# Pricing Research Workflow (Up-to-date Requirement)

This is the process we’ll use to keep pricing current (Feb 2026+).

## 1) Source-of-truth policy

Prefer, in order:
1. Official pricing pages / official docs
2. Official product docs describing plan mechanics (credits/pools/overage)
3. First-party announcements or changelogs
4. Everything else is “unverified” until corroborated

## 2) Data capture checklist (per provider/tool)

For each item we add to the dataset, capture:
- URL(s)
- `retrieved_at` (date we fetched it)
- `last_verified_at` (date we last re-checked it)
- pricing unit (token, credit, pool USD, message cap)
- caveats (e.g., long-context multipliers, caching tiers, batch discounts)

## 3) Normalization approach

We normalize into:
- **API rates** (input/output/cached) for direct billing meters
- **Plan mechanics** (subscription + pool/credits + overage)
- **Usage limit signals** (subscription caps/rate-limits when tokens aren’t published)

## 4) What “comprehensive” means (without becoming misleading)

We can include many tools, but comparisons only become “cost across tools” when:
- token pricing exists, or
- credit/pool conversion exists, or
- the user supplies an explicit assumption

Otherwise, we still list the plan but do not present token-equivalent costs as factual.

