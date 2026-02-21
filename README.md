# AI Cost Analysis (Personal + Public)

This repo is organized around **two related but separate goals**:

1) **Personal analysis (private):** understand *your* token usage + spend (yearly + monthly, by model and provider, and overall totals).
2) **Public cost calculator:** an objective tool to compare token costs across models/providers and compare against flat-rate plans (e.g. “$200/month”) using structured math (no subjective recommendations).

## Core Principles (Calculator)

- **API-first**: define data contracts + validation gates before UI work.
- **Always return something computable**: at minimum, return a **token-meter baseline** (API-equivalent) and any **known plan price floor**.
- **Honesty over false precision**: every computed number must carry `method` (`direct|derived|assumed|heuristic`), `confidence` (`high|medium|low`), and short `confidence_reasons[]`.
- **Evidence-bound outputs**: calculations reference snapshot `source_ids` so results can be traced back to official pages or documented captures.
- **No guessing unit conversions**: credit/quota systems stay opaque unless we can derive from sourced pack prices or the user supplies assumptions.
- **Region is first-class**: store and compare region variants side-by-side; never silently average CN vs US/global.
- **Freshness matters**: pricing is time-variant; snapshots are dated and validated before use (`cd apps/public-calculator/site && npm run validate:datasets`).
- **Backend correctness first**: core engine has unit tests (`cd apps/public-calculator/site && npm run test:core`) and the Next.js build is the end-to-end smoke check (`npm run build`).

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

## Pricing Snapshot (2026-02-21)

The current public pricing snapshot lives in:
- `apps/public-calculator/data/pricing.2026-02-21.json`

This is a **date-stamped dataset** built from official sources (see `docs/public-calculator/research/2026-02-21-pricing-sweep/`). Pricing changes fast; do not treat these values as timeless.

Quick reference (selected developer tools; USD, retrieved 2026-02-21):

| Tool | Plan | Price | Billing primitive | Notes |
| --- | --- | --- | --- | --- |
| Cursor | Pro | $20/mo | USD pool | Includes ~$20 API pool; availability may be limited (see sweep notes) |
| Cursor | Individual | $60/mo | USD pool | Includes ~$70 API pool |
| Cursor | Ultra | $200/mo | USD pool | Includes ~$400 API pool |
| Windsurf | Pro | $15/mo | Credits | Credit multipliers vary by model |
| Windsurf | Teams | $30/seat-mo | Credits | Includes 500 credits/seat-mo; add-on top-ups $40/1000 pooled credits; PR Reviews doc notes a 500 reviews/mo org cap |
| Warp | Build | $18/mo | Credits | Opaque credits; supports some BYOK paths |
| Verdent | Starter / Pro / Max | $19 / $59 / $179 | Credits | Opaque credits; top-ups supported |
| Qoder | Pro / Pro+ / Ultra | $10 / $30 / $100 | Credits | Credits have tier multipliers; packs imply $/credit but not token conversion |
| GitHub Copilot | Pro / Pro+ | $10 / $39 | Premium requests | Multiplier table applies per model; overage $0.04/request |
| Amazon Q Developer | Pro | $19/user-month | Seat + overage | Java transform pooled LOC + $0.003/LOC overage; quotas published |
| Replit | Core | $25/mo | USD credits | Credits apply to usage-based billing (Agent checkpoints, deployments, etc.) |
| Replit | Teams | $40/user-month | Seat + credits | **Announced change:** Teams sunset → Pro effective 2026-02-24 |
| JetBrains AI | Pro / Ultimate | $10 / $30 | Credits | AI Credits quota: 10 / 35 per 30 days; 1 AI Credit = $1 USD; top-ups expire after 12 months |
| Bolt.new | Pro | $25/mo | Token quota | Starts at 10M tokens/month; rollover; no explicit $/token overage published |
| Lovable | Pro (100 credits) | $25/mo | Credits | Usage-based credits; top-ups $15 per 50 credits (Pro); no token conversion |
| Tabnine | Code Assistant | $39/user-month | Seat + BYOK | Annual subscription; Tabnine-provided LLM access is provider prices + 5% handling fee |
| OpenCode | Zen (Pay-as-you-go) | $0/mo | Prepaid USD | Pay-per-token rates deducted from a USD balance; auto-reload supported |
| Devin | Core | $20+ | ACUs | Metered in ACUs (not tokens); pay-as-you-go pricing published |
| Google One | Google AI Pro / Ultra | $19.99 / $249.99 | Opaque quotas | Includes higher limits for Gemini app and dev tools (Gemini CLI, Code Assist, Jules, etc.) |
| Kimi | Moderato (overseas signal) | $19/mo | Opaque quotas | Official event rules state Moderato renews at $19/mo (outside mainland China); other tiers vary by region |
