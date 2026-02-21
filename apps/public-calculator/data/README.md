# Pricing Data (Draft)

This folder is for **public, versioned** pricing metadata used by the calculator UI.

Key rules:
- Every number needs a `source` and dates (`retrieved_at`, `last_verified_at`).
- Unverified entries must be marked as such and should render with a “draft/unverified” label in the UI.
- Credit-based tools often require assumptions; store assumptions explicitly rather than burying them in code.

Current file:
- `apps/public-calculator/data/pricing.sample.json` — a starter dataset (intentionally incomplete + unverified).
- `apps/public-calculator/data/pricing.2026-02-21.json` — Feb 2026 pricing snapshot built from official sources (still incomplete; see notes + `verified` flags).

Entitlements (separate axis from cost):
- `apps/public-calculator/data/entitlements.sample.json` — starter entitlements dataset (intentionally incomplete).
- `apps/public-calculator/data/entitlements.2026-02-21.json` — Feb 2026 entitlements snapshot (what’s included, where), with region + evidence type.
