# Progress: Backend architecture (2026-02-21)

- Started backend-architecture plan folder (3-file pattern).
- Defined public calculator data model + engine boundaries in `docs/public-calculator/`.
- Confirmed Next.js is on latest stable v16 and kept `npm audit` clean without npm `overrides` by switching linting to Biome (see `docs/public-calculator/research/2026-02-21-deps-linting/findings.md`).
- Implemented “unknown/opaque” handling: computation always returns a baseline + explicit `method/confidence/evidence`, never silent conversions.
- Expanded backend scenario support: quotas, compute units, premium requests (best-effort), break-even vs token-meter, budget→token capacity.
