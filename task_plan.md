# Task Plan: Personal usage and cost analysis

## Goal
Produce a verified summary of the user's private AI usage patterns from the repo's existing personal-analysis pipeline, including monthly token burn, top models, and a clear estimate of what that usage would cost on Cursor on average.

## Current Phase
Phase 1

## Phases

### Phase 1: Discovery
- [x] Confirm the repo area that handles personal usage analysis
- [x] Identify the raw/derived data that already exists
- [x] Record initial findings in `findings.md`
- **Status:** complete

### Phase 2: Understand the current rollups
- [x] Inspect the existing scripts, outputs, and schemas used for private analysis
- [x] Determine which dataset is the best source of truth for monthly tokens, model rankings, and costs
- [x] Document decision and caveats
- **Status:** complete

### Phase 3: Compute the requested summary
- [x] Extract monthly token totals
- [x] Extract top models and provider splits
- [x] Estimate Cursor-equivalent average monthly cost using the repo's pricing assumptions or current documented tiers
- **Status:** complete

### Phase 4: Verification
- [x] Re-run or validate the relevant analysis step where feasible
- [x] Cross-check derived numbers against generated artifacts and/or source files
- [x] Log validation results in `progress.md`
- **Status:** complete

### Phase 5: Delivery
- [ ] Summarize usage patterns clearly for the user
- [ ] Call out assumptions, uncertainty, and any gaps
- [ ] Deliver the final analysis with file references
- **Status:** in_progress

## Key Questions
1. Which derived file is the canonical source for monthly totals and model rankings?
2. Does the repo already encode a Cursor-equivalent estimate, or do I need to derive one from current pricing notes?
3. Which months are covered by the available private usage data?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use repo-derived private analysis outputs before reprocessing raw exports | Faster and lower risk if the existing pipeline already standardized the data |
| Keep Cursor estimates explicitly labeled as estimates unless backed by a direct repo source | The repo instructions prohibit silent guessing across plan/token mechanics |
| Use `records.csv` plus `dashboard_aggregates.json` as the canonical token totals | They match exactly month-by-month and reflect the current derived dataset without Bedrock double-counting |
| Use the spending report methodology selectively for cost interpretation, not for monthly token aggregation | Its Bedrock merge description appears stale relative to the current ingested `records.csv` contents |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `ls task_plan.md findings.md progress.md` failed because files did not exist yet | 1 | Created the required planning files in the repo root |

## Notes
- Re-read the plan before major decisions.
- Record external or generated findings in `findings.md`, not here.
- Stop and fix validation issues before moving to the next phase.
