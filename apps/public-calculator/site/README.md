# Public Calculator Site (Next.js)

This folder contains the **public cost calculator UI**, built with **Next.js (App Router)**.

## Dev commands

From `apps/public-calculator/site`:

- Install: `npm install`
- Run dev: `npm run dev`
- Lint: `npm run lint`

## Data inputs (versioned JSON)

This app reads public datasets from the sibling folder:

- Pricing: `apps/public-calculator/data/pricing.YYYY-MM-DD.json`
- Entitlements: `apps/public-calculator/data/entitlements.YYYY-MM-DD.json`

Quick sanity view:
- `http://localhost:3000/datasets`

## AGENTS.md docs index (required)

We use Vercel’s official `agents-md` codemod so agents can locate Next.js docs via `.next-docs/` without loading them into context.

Re-run (from this folder) if needed:

```bash
npx @next/codemod@canary agents-md --output AGENTS.md
```

Notes:
- `.next-docs/` is generated.
- The codemod injects a compressed docs index into this folder’s `AGENTS.md` (not the repo root).

