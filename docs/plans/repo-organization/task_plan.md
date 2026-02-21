# Task Plan: Repo organization for personal analysis + public calculator

## Goal
Restructure this repository so it cleanly supports (1) Jason’s private AI spend/usage analysis and (2) a public-facing cost calculator, while quarantining unverified/LLM-generated drafts and keeping private data out of version control by default.

## Current Phase
Phase 5

## Phases

### Phase 1: Requirements & Discovery
- [x] Inventory current repo contents
- [x] Identify which artifacts are raw data vs derived vs drafts
- [x] Capture findings in findings.md
- **Status:** complete

### Phase 2: Planning & Structure
- [x] Define target folder structure
- [x] Decide what is “private” (gitignored) vs “public” (tracked)
- [x] Add repo conventions and manifests
- **Status:** complete

### Phase 3: Reorganization (Move/Archive)
- [x] Move raw exports + invoices into `data/private/`
- [x] Move generated charts/combined sheets into `data/private/derived/`
- [x] Move draft reports + prototype snippets into `archive/`
- **Status:** complete

### Phase 4: Documentation & Scaffolding
- [x] Add `README.md` with repo map and workflows
- [x] Add `apps/` placeholders for the two “products”
- [x] Add `docs/` notes for metrics + decision framework
- **Status:** complete

### Phase 5: Verification & Cleanup
- [x] Ensure no private data is accidentally tracked
- [x] Ensure repo is easy to navigate (tree + naming)
- **Status:** complete

## Key Questions
1. Should all current usage exports/invoices be treated as private by default (gitignored)? (Proposed: yes.)
2. Do you want a public GitHub Pages–style web app eventually, or a package/tool that can be embedded elsewhere? (Not required for this organization pass.)
3. Do you want to normalize “cost per token” using a fixed input:output ratio (e.g., 3:1) as a first-order estimate? (Proposed: yes, as an option.)

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Treat raw usage exports as private (`data/private/`) | Avoid accidental publication of emails, org IDs, invoices, and URLs. |
| Keep unverified LLM-generated reports in `archive/` | Preserve work, but prevent it from being mistaken for truth/source-of-record. |
| Keep public tool scaffolding in `apps/public-calculator/` | Clear boundary between “product” and data. |
| Keep unverified prototypes private by default | Reduces risk of shipping stale pricing/model tables as “the calculator”. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `cat .../planning-with-files/planning-with-files/SKILL.md: No such file or directory` | 1 | Corrected path to `/Users/jholt/.codex/skills/planning-with-files/SKILL.md`. |
