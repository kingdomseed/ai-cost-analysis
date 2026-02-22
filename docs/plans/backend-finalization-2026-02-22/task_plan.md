# Task Plan: Backend finalization + entitlements coverage (2026-02-22)

## Goal

Finish the **backend API** for the public calculator and leave this repo cleanly organized so future UI work is straightforward. “Backend complete” here means:
- all math is computable and traceable to sources
- uncertainty is explicit (method/confidence/evidence)
- subscription/tool “what you get” (entitlements) is representable and queryable
- currency conversion is supported from USD via a sourced FX snapshot

## Constraints

- **No subjective recommendations**: return computed comparisons + coverage facts only.
- **Time-sensitive pricing (Feb 2026+)**: everything is dated, sourced, and (ideally) corroborated.
- **Unknown handling**: never guess credit↔token conversions; allow user assumptions and label outputs as low confidence.
- **Privacy**: keep personal exports/invoices gitignored (`data/private/`, `archive/private/`).

## Current Phase

Phase 4

## Phases

### Phase 1 — Plan + repo hygiene
- [x] Confirm current repo status and pending changes
- [x] Move any stray artifacts into the right folder (public docs vs private/archive)
- [x] Ensure `.gitignore` covers all private exports + build artifacts
- **Status:** complete

### Phase 2 — Entitlements + model identity
- [x] Define/encode “what you get” for key subscriptions/tools (providers, models, modalities, surfaces)
- [x] Implement/standardize model alias mapping (UI labels → canonical model IDs)
- [x] Update datasets + schemas to support these fields without guessing
- **Status:** complete

### Phase 3 — Calculation rules + back-calculation methods
- [x] Document calculation primitives (token meter, USD pool, credits, premium requests, compute units)
- [x] Document back-calculation methods + when they’re allowed (with confidence rules)
- **Status:** complete

### Phase 4 — Verification + commit
- [x] Run `npm audit`, dataset validation, lint, tests, build
- [x] Commit changes with a scoped message
- **Status:** complete

## Open Questions (defer until needed)

1. Canonical mapping for ChatGPT UI model labels (e.g. `gpt-5.2-thinking` → which API model?) — can be aliases without asserting equivalence.
2. How to represent “unlimited” quotas: string limits vs numeric capacity ranges (likely keep as descriptive `limits` strings + `included=true`).
3. How to model “surfaces” consistently across tools: `web`, `desktop`, `cli`, `ide`, `github`, `api`.

## Errors Encountered

| Error | Attempt | Resolution |
| --- | --- | --- |
| `spawn_agent` failed (agent thread limit reached) | 1 | Proceeded without sub-agents; captured research in separate `docs/public-calculator/research/.../agent-*.md` files. |
| `chatgpt.com/pricing` blocked (HTTP 403) | 1 | Used `authenticated_ui_capture` evidence + replaced/augmented with accessible official docs (e.g., Codex pricing page). |
