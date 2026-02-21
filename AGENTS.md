# Repository Guidelines

This repo supports two deliverables: **(1) private personal usage/spend analysis** and **(2) a public cost calculator**. Keep boundaries between “public” and “private” data clear, and treat pricing as **time-sensitive (Feb 2026+)**.

## Project Structure & Module Organization

- `apps/personal-analysis/` — future scripts/apps for your private rollups (yearly/monthly totals, by model/provider).
- `apps/public-calculator/` — future public calculator app (UI + pricing dataset).
- `apps/public-calculator/data/` — public, versioned pricing metadata (must be sourced + dated).
- `docs/public-calculator/research/YYYY-MM-DD-pricing-sweep/` — dated sweep notes + source ledger + gaps.
- `docs/` — specs and decision rules (`docs/personal-analysis/`, `docs/public-calculator/`).
- `data/private/` — raw exports/invoices + derived outputs (**gitignored**).
- `archive/private/` — drafts/unverified notes (**gitignored**).

Naming patterns:
- Raw exports: `data/private/raw/<source>/<source>-usage-YYYY-MM.csv`
- Draft reports: `archive/private/unverified-llm-reports/<topic>.md`

## Build, Test, and Development Commands

No standard build/test harness is established yet. When adding one, document it in `README.md`.

Useful basics:
- `git status` — verify only public files are staged/tracked.
- `git check-ignore -v <path>` — confirm private data stays ignored.
- `jq -e . apps/public-calculator/data/pricing.2026-02-21.json` — quick JSON integrity check.

## Coding Style & Naming Conventions

- Markdown: short paragraphs, clear headings, avoid subjective language in “calculator” docs.
- JSON: 2-space indentation; include `source`, `retrieved_at`, and `last_verified_at` for pricing entries.
- Dates: use ISO (`YYYY-MM-DD`) in filenames and metadata.

## Testing Guidelines

No tests yet. If you introduce code (Node/Python/etc.), add:
- a single, documented test command (e.g., `npm test`), and
- a minimal smoke test for the pricing dataset (schema + required fields).

## Commit & Pull Request Guidelines

Git history currently contains only an “Initial commit”, so conventions are not established.
Recommended going forward:
- Use Conventional Commits (e.g., `docs:`, `feat:`, `chore:`).
- PRs must include: what changed, why, and—if pricing changed—links to sources + the dates you verified them.

## Security & Data Handling

Do **not** commit invoices, raw usage exports, or any personal identifiers. Keep them under `data/private/` or `archive/private/`. If you need shareable examples, add redacted samples under `data/sample/`.

## Pricing Research Rules

- Prefer **official provider/tool pages**; add 1+ corroborating sources only if they’re reputable.
- Encode uncertainty explicitly: set `verified: false` and add an `availability_note` / `notes` field rather than guessing.
- Separate primitives: **API token meters** vs **credits/pools** vs **subscriptions/quotas** (do not conflate them).
