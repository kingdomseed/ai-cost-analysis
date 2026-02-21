# Task Plan: OpenAI pricing sweep (2026-02-21)

## Goal
Produce a sourced pricing/limits research note for:
- OpenAI API token pricing for `gpt-5.2` and `gpt-5.2-codex` (input/output/cached input) as of 2026-02-21.
- Official notes relevant to coding workloads (Batch API, caching, reasoning tokens billed as output).
- Official ChatGPT subscription pricing (Plus/Pro) and any official documentation on usage limits for Pro/Plus (what is specified vs not).

Deliverable: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-openai.md`

## Current Phase
Phase 5

## Phases

### Phase 1: Requirements & Discovery
- [x] Confirm target models and required fields
- [x] Locate official OpenAI sources (prefer developers.openai.com, help.openai.com)
- [x] Start capturing sources + quotes/snippets in `findings.md`
- **Status:** complete

### Phase 2: API Pricing Extraction
- [x] Extract `gpt-5.2` pricing (input/output/cached input)
- [x] Extract `gpt-5.2-codex` pricing (input/output/cached input)
- [x] Capture any official billing notes (Batch API, caching, reasoning tokens)
- **Status:** complete

### Phase 3: ChatGPT Plans & Limits
- [x] Extract official Plus/Pro prices (USD)
- [x] Extract official statements about usage limits (what is specified vs not)
- **Status:** complete

### Phase 4: Write Report
- [x] Write `agent-openai.md` with dated sources and “unknown/unspecified” callouts
- **Status:** complete

### Phase 5: Cross-check
- [x] Corroborate key token prices on at least one additional official page
- [x] Final pass for clarity, dates, and source links
- **Status:** complete

## Key Questions
1. Where is the canonical, official pricing table for `gpt-5.2` and `gpt-5.2-codex`?
2. Do official docs define “cached input” pricing consistently for these models?
3. What, specifically, does OpenAI officially say about ChatGPT Plus/Pro usage limits (and what is left unspecified)?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Keep report as repo markdown | Easy to version and re-verify later |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |
