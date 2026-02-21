# Public Calculator Site (Next.js)

This folder contains the **public cost calculator UI**, built with **Next.js (App Router)**.

## Dev commands

From `apps/public-calculator/site`:

- Install: `npm install`
- Run dev: `npm run dev`
- Lint: `npm run lint`
- Validate datasets: `npm run validate:datasets`

## Data inputs (versioned JSON)

This app reads public datasets from the sibling folder:

- Pricing: `apps/public-calculator/data/pricing.YYYY-MM-DD.json`
- Entitlements: `apps/public-calculator/data/entitlements.YYYY-MM-DD.json`

Quick sanity view:
- `http://localhost:3000/datasets`

## API endpoints (current)

- `GET /api/datasets/pricing` — latest pricing snapshot envelope
- `GET /api/datasets/entitlements` — latest entitlements snapshot envelope
- `GET /api/datasets/fx` — latest FX snapshot envelope (base USD; used for currency conversion)
- `GET /api/catalog` — supported selections derived from snapshots (models/plans/currencies/regions)
- `POST /api/calculate` — baseline calculator (API-first; see `docs/public-calculator/api-contract.md`)

## AGENTS.md docs index (required)

We use Vercel’s official `agents-md` codemod so agents can locate Next.js docs via `.next-docs/` without loading them into context.

Re-run (from this folder) if needed:

```bash
npx @next/codemod@canary agents-md --output AGENTS.md
```

Notes:
- `.next-docs/` is generated.
- The codemod injects a compressed docs index into this folder’s `AGENTS.md` (not the repo root).
