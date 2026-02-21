# Task Plan: AWS Bedrock token pricing sweep (2026-02-21)
<!-- 
  WHAT: This is your roadmap for the entire task. Think of it as your "working memory on disk."
  WHY: After 50+ tool calls, your original goals can get forgotten. This file keeps them fresh.
  WHEN: Create this FIRST, before starting any work. Update after each phase completes.
-->

## Goal
Extract official token pricing (Feb 2026) for key coding-relevant models on Amazon Bedrock (especially Anthropic Claude), including any region/tier differences, and write a sourced markdown research note for `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-aws-bedrock.md`.

## Current Phase
Phase 1

## Phases
<!-- 
  WHAT: Break your task into 3-7 logical phases. Each phase should be completable.
  WHY: Breaking work into phases prevents overwhelm and makes progress visible.
  WHEN: Update status after completing each phase: pending → in_progress → complete
-->

### Phase 1: Primary source extraction (aws.amazon.com)
- [ ] Extract token pricing from `aws.amazon.com/bedrock/pricing`
- [ ] Identify available Claude SKUs + regions + tiers (Standard/Priority/Flex/Batch if present)
- [ ] Note whether Claude Opus/Sonnet 4.6 exist on Bedrock; if not, identify latest Claude SKUs
- [ ] Capture any OpenAI or Moonshot (Kimi) token prices shown on the Bedrock pricing page
- [ ] Document findings in `findings.md`
- **Status:** in_progress
<!-- 
  STATUS VALUES:
  - pending: Not started yet
  - in_progress: Currently working on this
  - complete: Finished this phase
-->

### Phase 2: Corroboration (second official AWS source)
- [ ] Find at least one additional official AWS source corroborating token prices (prefer `docs.aws.amazon.com`)
- [ ] Resolve conflicts (if any) and record verification notes
- [ ] Document findings in `findings.md`
- **Status:** pending

### Phase 3: Synthesis (research note)
- [ ] Create/overwrite `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-aws-bedrock.md`
- [ ] Include dated sources + “last verified” timestamp
- [ ] Present pricing in compact tables (by model / region / tier)
- **Status:** pending

### Phase 4: QA pass
- [ ] Verify all user requirements are addressed (models, regions, tiers, corroboration)
- [ ] Ensure no private data is included
- [ ] Document verification notes in `progress.md`
- **Status:** pending

### Phase 5: Delivery
- [ ] Provide final markdown (and file path) to user
- **Status:** pending

## Key Questions
1. Are “Claude Opus 4.6” / “Claude Sonnet 4.6” offered on Bedrock as of 2026-02-21? If not, what are the latest Claude SKUs and prices on Bedrock?
2. Does Bedrock pricing document tiers like Standard/Priority/Flex/Batch for these models? If so, what are the differences and where are they documented?
3. Are any OpenAI or Moonshot (Kimi) models listed on the Bedrock pricing page? If so, what are the official token prices and regions?

## Decisions Made
<!-- 
  WHAT: Technical and design decisions you've made, with the reasoning behind them.
  WHY: You'll forget why you made choices. This table helps you remember and justify decisions.
  WHEN: Update whenever you make a significant choice (technology, approach, structure).
  EXAMPLE:
    | Use JSON for storage | Simple, human-readable, built-in Python support |
-->
| Decision | Rationale |
|----------|-----------|
|          |           |

## Errors Encountered
<!-- 
  WHAT: Every error you encounter, what attempt number it was, and how you resolved it.
  WHY: Logging errors prevents repeating the same mistakes. This is critical for learning.
  WHEN: Add immediately when an error occurs, even if you fix it quickly.
  EXAMPLE:
    | FileNotFoundError | 1 | Check if file exists, create empty list if not |
    | JSONDecodeError | 2 | Handle empty file case explicitly |
-->
| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes
<!-- 
  REMINDERS:
  - Update phase status as you progress: pending → in_progress → complete
  - Re-read this plan before major decisions (attention manipulation)
  - Log ALL errors - they help avoid repetition
  - Never repeat a failed action - mutate your approach instead
-->
- Update phase status as you progress: pending → in_progress → complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors - they help avoid repetition
