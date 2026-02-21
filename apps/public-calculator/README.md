# Public Cost Calculator

Goal: a public-facing calculator that lets a user:

1) Select one or more **models**
2) Select one or more **providers/platforms** (where relevant)
3) Enter an estimated **usage** (tokens or a proxy metric)
4) See objective cost outputs:
   - estimated cost for each selection
   - effective cost per token
   - break-even comparison vs flat-rate plans (e.g., “$200/month”)

## Non-Goals (for now)

- Building the full MVP UI
- Making subjective recommendations (“best”, “worst”, “you should…”)

## Prototypes

See `apps/public-calculator/prototypes/` for quarantined drafts and exploration artifacts.
They are not treated as source-of-truth and may contain outdated/inaccurate pricing claims.

## Spec

See `docs/public-calculator/README.md`.

## Next.js site

UI lives in `apps/public-calculator/site/`.

## Pricing Coverage (Important)

This tool is intended to compare costs across:

- Token-priced APIs (input/output)
- Cursor-style “API pool” subscriptions (plan price vs included compute pool)
- Credit-based plans (Windsurf, Warp, Verdent, Qoder, etc.) using explicit conversion assumptions when needed
