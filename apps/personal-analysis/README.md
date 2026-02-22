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

## How to Run

```bash
python3 apps/personal-analysis/scripts/run_personal_analysis.py
```

Then generate the HTML dashboard (all data by default):

```bash
python3 apps/personal-analysis/scripts/generate_dashboard.py
```

Optional overrides:

```bash
python3 apps/personal-analysis/scripts/run_personal_analysis.py \
  --raw-dir data/private/raw \
  --derived-dir data/private/derived/personal-analysis
```

```bash
python3 apps/personal-analysis/scripts/generate_dashboard.py --start-month 2024-11
```

## Outputs (Derived)

Generated under `data/private/derived/personal-analysis/`:

- `records.csv` — long‑form metrics (month/provider/source/model/metric/unit/value)
- `monthly_by_model.csv`
- `monthly_by_provider.csv`
- `yearly_summary.csv`
- `overall_summary.json`
- `ingest_report.json` (file list + warnings)

## Output Shape (Target)

We’ll standardize on a few “source-of-truth” derived outputs (CSV/JSON) under `data/private/derived/` so downstream charts/reports are reproducible.

See `docs/personal-analysis/README.md` for definitions and a concrete metric checklist.
