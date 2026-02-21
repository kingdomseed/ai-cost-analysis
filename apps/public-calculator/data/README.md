# Pricing Data (Draft)

This folder is for **public, versioned** pricing metadata used by the calculator UI.

Key rules:
- Every number needs a `source` and dates (`retrieved_at`, `last_verified_at`).
- Unverified entries must be marked as such and should render with a “draft/unverified” label in the UI.
- Credit-based tools often require assumptions; store assumptions explicitly rather than burying them in code.

Current file:
- `apps/public-calculator/data/pricing.sample.json` — a starter dataset (intentionally incomplete + unverified).

