# Progress: Backend architecture (2026-02-21)

- Started backend-architecture plan folder (3-file pattern).
- Defined public calculator data model + engine boundaries in `docs/public-calculator/`.
- Confirmed Next.js is on latest stable v16 and resolved `npm audit` without breaking `npm run lint` (see `apps/public-calculator/site/package.json` overrides).
- Next: define “unknown/opaque” handling rules (what UI collects vs what we refuse to infer).
