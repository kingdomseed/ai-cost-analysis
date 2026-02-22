# Task Plan: Model ratings ingestion (Azure leaderboard) — 2026-02-22

## Goal

Ingest model rating/benchmark data (starting with the user-provided Azure leaderboard export) into the public calculator’s `models` dataset so the backend can surface:
- per-model ratings (where sourced)
- “has ratings” flags in catalog
- plan-matrix enrichment when entitlements reference specific models

## Constraints

- No subjective judgments; treat ratings as *external* signals.
- Every rating must be source-bound (`source_ids`) and date-stamped (`as_of`).
- Do not commit raw private exports unless the user explicitly wants them tracked; prefer derived, normalized outputs.
- Keep model naming stable; if aliases are needed, add them explicitly (no guessing).

## Phases

### Phase 1 — Inventory
- [ ] Inspect `/Users/jholt/Downloads/azure_model_leaderboard` for file formats + fields
- [ ] Identify “overall” vs task-specific metrics
- [ ] Identify model ID fields + any provider naming conventions

### Phase 2 — Mapping
- [ ] Define mapping from Azure fields → `models.schema.v0.1.json` ratings objects
- [ ] Decide how to represent scales (0–1, 0–100, ELO, etc.)
- [ ] Decide how to handle duplicates / multiple snapshots

### Phase 3 — Implementation
- [ ] Add ingestion script (node) that generates `apps/public-calculator/data/models.YYYY-MM-DD.json`
- [ ] Add sources entry with official URL + local export notes
- [ ] Run `npm run validate:datasets`, `npm run lint`, `npm run test:core`, `npm run build`

### Phase 4 — Wire-up checks
- [ ] Verify `GET /api/catalog` returns `has_ratings=true` where expected
- [ ] Verify `POST /api/plan-matrix` includes model_details.has_ratings where entitlements model_access matches

## Deliverables

- New snapshot: `apps/public-calculator/data/models.2026-02-22.json`
- Ingestion script: `apps/public-calculator/site/scripts/ingest-azure-model-leaderboard.mjs`
- Notes: `docs/plans/model-ratings-azure-2026-02-22/findings.md`

