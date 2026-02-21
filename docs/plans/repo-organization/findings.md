# Findings & Decisions

## Requirements
- Support two main “products”:
  - Private personal analysis of token usage + spend (yearly totals, monthly by model/provider, etc.)
  - Public cost calculator comparing models/providers and “flat-rate” plans using objective math (no subjective recommendations)
- Repo currently contains:
  - Raw exports (CSV/JSON/PDF invoices) at repo root
  - A `token-burn-rate/` directory with charts + combined sheets + reports
  - Several long, LLM-generated narrative reports containing likely-unverified pricing/model claims
  - A file named `index.html` that is actually React/JS code (not runnable HTML as-is)
- Organization goal: keep what’s useful, quarantine untrusted drafts, and create a clean structure for future work.

## Research Findings
- All current data + drafts are **untracked** in git (`git status` shows `??`), so we can reorganize without breaking history.
- Multiple data files contain **personal identifiers** (emails, org ids, URLs), so they should be treated as **private by default**.
- Moving unverified drafts out of `apps/` and into `archive/private/` noticeably reduces “what is real vs what is a draft” confusion.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Put raw exports/invoices under `data/private/raw/` (gitignored) | Reduces risk of publishing personal data when the public calculator is open-sourced. |
| Put derived charts/summaries under `data/private/derived/` (gitignored) | Derived outputs may still leak sensitive totals/context; keep alongside raw. |
| Put LLM-generated narrative docs under `archive/private/unverified/` (gitignored) | Keep for reference but remove from “source-of-truth” docs. |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Some existing filenames are misleading (e.g., `index.html` is JS/React) | Move into `apps/public-calculator/prototypes/` and rename to reflect what it is. |

## Resources
- Repo root currently contains raw usage exports + invoices + draft reports (to be relocated).

## Visual/Browser Findings
- N/A (no images/PDFs opened via tool view in this session; only file headers inspected).
