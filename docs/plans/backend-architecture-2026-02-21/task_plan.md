# Task Plan: Public calculator backend architecture (2026-02-21)

## Goal

Define a backend-ready **data model + compute engine contract** for the public calculator so future implementation is straightforward and avoids mixing:
- token-metered API pricing
- credit/pool systems
- subscriptions/opaque quotas
- entitlements (“what you get, where you get it”)

## Constraints

- US/global self-serve is the primary target; record region variants explicitly.
- No subjective language; output is computed values + differences.
- Pricing and entitlements are time-sensitive; everything is versioned and sourced.
- Data collection is complete except AWS Bedrock (pending 2026-02-22).

## Phases

### Phase 1 — Data contracts
- [x] Define canonical IDs (provider/model/plan/surface/feature)
- [x] Define entitlements dataset schema + sample
- [x] Define workload input schema (tokens/credits/pool/subscription)
- [x] Define calculator output schema (cost lines + break-evens + evidence)

### Phase 2 — Engine boundaries
- [x] Define pure calculation modules (token meter, pool, credits, subscriptions)
- [x] Define evidence rules (public URL vs authenticated capture vs blocked)
- [ ] Define “unknown/opaque” handling (never guess; surface user override fields)

### Phase 3 — Repo structure for implementation
- [x] Decide where code will live (packages/core vs apps/public-calculator/)
- [x] Add minimal validation commands (JSON sanity + schema checks)

## Deliverables

- `docs/public-calculator/backend-architecture.md`
- `docs/public-calculator/data-model.md`
- `apps/public-calculator/data/entitlements.2026-02-21.json` (+ sample)
- Update: `apps/public-calculator/data/README.md`, `docs/public-calculator/subscription-entitlements.md`
