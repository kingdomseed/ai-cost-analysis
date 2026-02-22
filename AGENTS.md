# Repository Guidelines

This repo supports two deliverables: **(1) private personal usage/spend analysis** and **(2) a public cost calculator**. Keep boundaries between “public” and “private” data clear, and treat pricing as **time-sensitive (Feb 2026+)**.

## Core Principles (Calculator)

- **Always return something computable** (baseline API-equivalent + plan price floor) while clearly labeling uncertainty.
- **Every number has provenance**: attach `source_id` evidence and record `retrieved_at` / `last_verified_at`.
- **No silent guessing**: do not invent credit↔token conversions; allow explicit user assumptions or sourced derivations.
- **Region-aware**: store region variants side-by-side; never collapse CN and US/global.
- **API-first**: keep the math in pure functions/types (`packages/core/`) and treat the UI as a renderer (no client-side guessing).
- **Always show a baseline**: when a workload is provided, call `/api/calculate` for token‑meter baseline; plan‑matrix alone is not sufficient.
- **Region = pricing tier**: expose simplified tiers (US/EU/etc), not cloud regions. Use `target_region` + `token_meter_default.region` for pricing logic.

## Project Structure & Module Organization

- `apps/public-calculator/site/` — Next.js 16 app (App Router) for the public calculator.
- `apps/public-calculator/data/` — public, versioned datasets (`pricing.*.json`, `entitlements.*.json`).
- `apps/personal-analysis/` — future scripts for private rollups (yearly/monthly totals, by model/provider).
- `docs/public-calculator/` — specs, decision rules, and research workflow.
- `docs/public-calculator/research/YYYY-MM-DD-pricing-sweep/` — dated sweep notes + source ledger + gaps.
- `data/private/` — raw exports/invoices + derived outputs (**gitignored**).
- `archive/private/` — drafts/unverified notes (**gitignored**).

Naming patterns:
- Raw exports: `data/private/raw/<source>/<source>-usage-YYYY-MM.csv`
- Draft reports: `archive/private/unverified-llm-reports/<topic>.md`

## Build, Test, and Development Commands

Public calculator (Next.js):
- `cd apps/public-calculator/site && npm install` — install dependencies.
- `npm run dev` — run locally.
- `npm run lint` — Biome checks (formatter + linter).
- `npm run build` — production build (use as smoke test).

Useful basics:
- `git check-ignore -v <path>` — confirm private data stays ignored.
- `jq -e . apps/public-calculator/data/pricing.2026-02-21.json` — quick JSON integrity check.

## Coding Style & Naming Conventions

- Markdown: short paragraphs, clear headings, avoid subjective language in public-facing docs/UI.
- JSON: 2-space indentation; include `source`, `retrieved_at`, and `last_verified_at` where applicable.
- Dates: use ISO (`YYYY-MM-DD`) in filenames and metadata (e.g., `pricing.2026-02-21.json`).

## Testing Guidelines

- `cd apps/public-calculator/site && npm run test:core` — runs backend engine unit tests (Node test runner via `tsx`).
- `cd apps/public-calculator/site && npm run build` — still the minimum end-to-end smoke check (typecheck + route compilation).

## Commit & Pull Request Guidelines

Commits in this repo use Conventional Commit-style prefixes (e.g., `docs:`, `chore:`). Keep commits scoped and avoid mixing public + private changes.

PRs should include:
- What changed + why.
- If datasets changed: the source(s) and verification date(s), plus any region caveats.

## Security & Data Handling

Do **not** commit invoices, raw usage exports, or any personal identifiers. Keep them under `data/private/` or `archive/private/`. If you need shareable examples, add redacted samples under `data/sample/`.

## Agent-Specific Notes

- Refresh Next.js docs index (from `apps/public-calculator/site/`): `npx @next/codemod@canary agents-md --output AGENTS.md`.

## Pricing Research Rules

- Prefer **official provider/tool pages**; add 1+ corroborating sources only if they’re reputable.
- Encode uncertainty explicitly: set `verified: false` and add an `availability_note` / `notes` field rather than guessing.
- Separate primitives: **API token meters** vs **credits/pools** vs **subscriptions/quotas** (do not conflate them).

## API Integration Notes

- **Catalog** (`GET /api/catalog`): provides `token_meters`, `tool_plans`, `subscriptions`, `options`, and `models_catalog`.
- **Plan matrix** (`POST /api/plan-matrix`): use for plan floors/effective costs, `fits_budget`, and multi‑provider bundles.
- **Baseline** (`POST /api/calculate`): use for token‑meter baseline cost and method/confidence labels.
