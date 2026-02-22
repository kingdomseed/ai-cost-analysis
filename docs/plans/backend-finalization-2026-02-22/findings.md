# Findings: Backend finalization + entitlements coverage (2026-02-22)

## Summary

- Keep findings here as decisions are made (schemas, mappings, and evidence rules).
- Research artifacts should be stored under `docs/public-calculator/research/<date>-<topic>/`.

## Evidence / Sourcing Rules

- Prefer official provider/tool pages.
- If only authenticated UI is available, record it as `authenticated_ui_capture` and keep the capture under `archive/private/` unless it’s shareable.
- If a site is region-specific (CN vs US/global), store region variants side-by-side and label region explicitly.

## Notes

- 3:1 input:output is supported as a **heuristic** for “total tokens” workloads; never present it as a measured fact.
- The public calculator already supports currency conversion using a sourced FX snapshot (`apps/public-calculator/data/fx.*.json`) and `output_currency` in API requests.

## Dataset updates made in this phase

- Added new “latest” snapshots:
  - `apps/public-calculator/data/pricing.2026-02-22.json` (adds Claude Max 5x plan; refreshed selected sources)
  - `apps/public-calculator/data/entitlements.2026-02-22.json` (expands entitlements to include Claude Pro/Max, Google AI Pro/Ultra developer surfaces, Copilot CLI surface, and Codex surfaces)
- Added model alias mapping to help resolve UI model labels:
  - `openai:gpt-5.2` now aliases ChatGPT-style variants (`gpt-5.2-instant`, `gpt-5.2-thinking`, `gpt-5.2-pro`) so ratings/metadata can still resolve without asserting API pricing equivalence.
