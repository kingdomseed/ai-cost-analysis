# AI Cost Analysis (Personal + Public)

This repo is organized around **two related but separate goals**:

1) **Personal analysis (private):** understand *your* token usage + spend (yearly + monthly, by model and provider, and overall totals).
2) **Public cost calculator:** an objective tool to compare token costs across models/providers and compare against flat-rate plans (e.g. “$200/month”) using structured math (no subjective recommendations).

## Repo Map

- `apps/personal-analysis/` — the (future) private analysis app/scripts (design + entrypoints live here)
- `apps/public-calculator/` — the (future) public-facing calculator app (design + prototypes live here)
- `data/` — data layout (private exports live in `data/private/`, which is gitignored)
- `docs/` — requirements, definitions, and decision framework notes
- `archive/` — drafts, scratch work, and unverified LLM outputs (private by default)

## Privacy Defaults (Important)

By default, **`data/private/` and `archive/private/` are gitignored**.
That’s intentional: the current exports include emails, org IDs, URLs, invoices, etc.

If you later want parts of this repo to be public, you can keep the calculator app + public docs tracked while keeping personal data untracked.

## Where to Start

- Personal metrics/spec: `docs/personal-analysis/README.md`
- Calculator requirements/spec: `docs/public-calculator/README.md`

## Calculator Scope (Cost Across Tools)

The public calculator is intended to support *both*:

- **Raw token pricing** (true pay-per-token APIs)
- **Programmer-tool plans** that use **credits**, **included “API pool” dollars**, or other prepaid mechanics
  - Example: Cursor-style plans where a $20 subscription includes ~$20 of API usage, and higher tiers include larger prepaid pools.

For credit/pool tools, we’ll show costs using **explicit assumptions** and clearly label:
- what is measured vs estimated
- what inputs the user can override (e.g., effective $/credit, assumed cache hit rate, input:output split)
