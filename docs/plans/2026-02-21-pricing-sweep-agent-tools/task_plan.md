# Task Plan: Feb 2026 Agent Tools Pricing Mechanics (Cursor, Windsurf, Warp, OpenRouter)
<!-- 
  WHAT: This is your roadmap for the entire task. Think of it as your "working memory on disk."
  WHY: After 50+ tool calls, your original goals can get forgotten. This file keeps them fresh.
  WHEN: Create this FIRST, before starting any work. Update after each phase completes.
-->

## Goal
<!-- 
  WHAT: One clear sentence describing what you're trying to achieve.
  WHY: This is your north star. Re-reading this keeps you focused on the end state.
  EXAMPLE: "Create a Python CLI todo app with add, list, and delete functionality."
-->
Create `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-tools.md` summarizing official (Feb 2026) pricing mechanics for Cursor, Windsurf, Warp, and OpenRouter: included usage pools/credits, metering method, top-up pricing, and explicit model multipliers (with sources).

## Current Phase
<!-- 
  WHAT: Which phase you're currently working on (e.g., "Phase 1", "Phase 3").
  WHY: Quick reference for where you are in the task. Update this as you progress.
-->
Phase 4

## Phases
<!-- 
  WHAT: Break your task into 3-7 logical phases. Each phase should be completable.
  WHY: Breaking work into phases prevents overwhelm and makes progress visible.
  WHEN: Update status after completing each phase: pending → in_progress → complete
-->

### Phase 1: Requirements & Discovery
<!-- 
  WHAT: Understand what needs to be done and gather initial information.
  WHY: Starting without understanding leads to wasted effort. This phase prevents that.
-->
- [x] Capture explicit requirements from prompt
- [x] Identify official pricing + docs URLs per vendor
- [x] Document findings in findings.md (2-action rule)
- **Status:** complete
<!-- 
  STATUS VALUES:
  - pending: Not started yet
  - in_progress: Currently working on this
  - complete: Finished this phase
-->

### Phase 2: Planning & Structure
<!-- 
  WHAT: Decide how you'll approach the problem and what structure you'll use.
  WHY: Good planning prevents rework. Document decisions so you remember why you chose them.
-->
- [x] Define markdown structure for final deliverable
- [x] Decide fields to capture per vendor
- [x] Document any ambiguities + resolution approach
- **Status:** complete

### Phase 3: Implementation
<!-- 
  WHAT: Actually build/create/write the solution.
  WHY: This is where the work happens. Break into smaller sub-tasks if needed.
-->
- [x] Extract mechanics from official pages (pricing + docs)
- [x] Cross-check numbers between pages where possible
- [x] Write final markdown to requested path
- **Status:** complete

### Phase 4: Testing & Verification
<!-- 
  WHAT: Verify everything works and meets requirements.
  WHY: Catching issues early saves time. Document test results in progress.md.
-->
- [x] Verify each vendor section has all required fields
- [x] Verify each claim has at least one official URL reference
- [x] Note any unresolved ambiguities explicitly
- **Status:** complete

### Phase 5: Delivery
<!-- 
  WHAT: Final review and handoff to user.
  WHY: Ensures nothing is forgotten and deliverables are complete.
-->
- [x] Final proofread for clarity and scanability
- [x] Ensure output stays “public” (no private data)
- [x] Deliver file path + summary
- **Status:** complete

## Key Questions
<!-- 
  WHAT: Important questions you need to answer during the task.
  WHY: These guide your research and decision-making. Answer them as you go.
  EXAMPLE: 
    1. Should tasks persist between sessions? (Yes - need file storage)
    2. What format for storing tasks? (JSON file)
-->
1. For each vendor, what *included* monthly usage pool/credits exist (if any), and how do they reset?
2. How is usage metered: tokens at API rates, prompt credits, “AI credits”, or something else?
3. Is there top-up / pay-as-you-go beyond the included pool? If so, what are the mechanics and price?
4. Are there explicit per-model multipliers or differing “credit costs” by model?

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
| Use official pages only when possible | User request prioritizes vendor docs; reduces risk of stale/incorrect third-party summaries |
| Put all URLs in code spans | System instruction: do not write URLs directly unless in code |

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
| planning-with-files skill path from prompt did not exist | 1 | Used actual skill path from skills list (`~/.codex/skills/planning-with-files/SKILL.md`) |

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
