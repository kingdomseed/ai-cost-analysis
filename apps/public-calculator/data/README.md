# Pricing Data (Draft)

This folder is for **public, versioned** pricing metadata used by the calculator UI.

Key rules:
- Every number needs a `source` and dates (`retrieved_at`, `last_verified_at`).
- Unverified entries must be marked as such and should render with a “draft/unverified” label in the UI.
- Credit-based tools often require assumptions; store assumptions explicitly rather than burying them in code.

Current file:
- `apps/public-calculator/data/pricing.sample.json` — a starter dataset (intentionally incomplete + unverified).
- `apps/public-calculator/data/pricing.2026-02-21.json` — initial Feb 2026 pricing snapshot.
- `apps/public-calculator/data/pricing.2026-02-22.json` — updated snapshot with additional plan coverage and refreshed sources (see `meta.last_verified_at`).

Entitlements (separate axis from cost):
- `apps/public-calculator/data/entitlements.sample.json` — starter entitlements dataset (intentionally incomplete).
- `apps/public-calculator/data/entitlements.2026-02-21.json` — initial entitlements snapshot.
- `apps/public-calculator/data/entitlements.2026-02-22.json` — expanded entitlements + new sources (developer tool surfaces + quota links).

FX (currency conversion):
- `apps/public-calculator/data/fx.sample.json` — starter FX dataset (placeholder).
- `apps/public-calculator/data/fx.2026-02-21.json` — FX snapshot (base USD; rates for common currencies).

## Schemas + validation

Public datasets are validated against JSON Schemas in:
- `apps/public-calculator/schemas/`

Run validation from the Next.js app folder:
- `cd apps/public-calculator/site && npm run validate:datasets`
