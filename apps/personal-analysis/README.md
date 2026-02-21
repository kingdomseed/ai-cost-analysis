# Personal Analysis (Private)

This area is for the tooling and outputs that answer:

- Yearly total tokens
- Yearly total cost
- Models used
- Monthly tokens by model
- Monthly cost by model
- Monthly total cost
- Breakdown by provider, plus a final overall total
- Total cost per token
  - Optionally: a simplified normalization assuming a fixed input:output ratio (e.g., **3:1**) when a source doesn’t expose both.

## Data Inputs (Local Only)

Raw exports live under `data/private/raw/` (gitignored).

## Output Shape (Target)

We’ll standardize on a few “source-of-truth” derived outputs (CSV/JSON) under `data/private/derived/` so downstream charts/reports are reproducible.

See `docs/personal-analysis/README.md` for definitions and a concrete metric checklist.

