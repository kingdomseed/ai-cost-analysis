# Data

## Layout

- `data/private/raw/` — raw exports (Cursor CSVs, Azure exports, invoices, Devin exports, etc.)
- `data/private/derived/` — charts/combined sheets derived from the raw exports

## Gitignore

`data/private/` is intentionally gitignored to prevent accidental publication of personal identifiers and invoices.

If you want to share sample data publicly later, create `data/sample/` with redacted/minimal examples.

