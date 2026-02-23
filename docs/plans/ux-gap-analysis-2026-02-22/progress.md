# Progress Log: UX Gap Analysis

## Session: 2026-02-22

### Phase 1: Codify the UX Gap Analysis
- **Status:** complete
- **Started:** 2026-02-22

- Actions taken:
  - Started Next.js dev server via Playwright
  - Navigated to `http://localhost:3000` and captured full-page screenshot of Budget mode (default)
  - Switched to "Find by Token Usage" tab and captured full-page screenshot of Token mode
  - Read `page.tsx` to understand interaction model and state management
  - Explored full repo structure via agent (36 tool calls, read package.json, configs, API routes, engine, data files, docs)
  - Compared current UI against all 6 PRD user stories
  - Compared against all 6 PRD core features
  - Identified free-plan-infinite-capacity logic bug via Playwright interaction
  - Captured independent reviewer analysis (data/feature-focused perspective)
  - Wrote task_plan.md, findings.md, progress.md

- Files created:
  - `docs/plans/ux-gap-analysis-2026-02-22/task_plan.md`
  - `docs/plans/ux-gap-analysis-2026-02-22/findings.md`
  - `docs/plans/ux-gap-analysis-2026-02-22/progress.md`

- Key observations from live testing:
  - Budget mode: slider works, presets work, cards render, but output is an undifferentiated wall of 50+ cards
  - Token mode: input/output fields work, token meter selector populates dynamically, baseline cost displays correctly with confidence badges
  - Bug confirmed: free plans (Amazon Q Free, Cline Open Source, Copilot Free, etc.) show as $0/month regardless of token volume entered — even at implausible usage levels
  - Evidence metadata (method/confidence badges, warnings) clutter every card equally — no progressive disclosure
  - No workflow input, no recommendation ranking, no feature warnings, no breakeven visualization in UI

## Test Results

| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Budget mode loads | Navigate to / | Budget slider + plan cards | Works | Pass |
| Token mode loads | Click "Find by Token Usage" | Token inputs + plan cards | Works | Pass |
| Free plan at 1M tokens | Set 1M input tokens | Free plans flagged or deprioritized | Amazon Q Free shows at $0, no warning | **Fail** |
| Free plan at 1B tokens | (inferred from card behavior) | Free plans filtered or warned | Still $0, still shown as viable | **Fail** |
| Breakeven visible | Token mode with workload | Crossover indicator | Not in UI | **Missing** |
| Workflow profile | Landing page | Guided input flow | Not built | **Missing** |
| Ranked output | Any mode | "Best Value / Best Budget / Best Flexibility" | Flat price-sorted list | **Missing** |

### Phase 2: Resolve Philosophy Question
- **Status:** complete
- **Started:** 2026-02-22

- Actions taken:
  - User resolved the philosophy question: **Hybrid approach**
  - Some users just need help making a decision and knowing the numbers — they need a clear view of what those numbers get them and how much money they can save
  - Other users want raw data and will draw their own conclusions
  - Updated task_plan.md with decision and rationale
  - Updated findings.md Gap R2-1 with resolution
  - Marked Phase 2 complete, Phase 3 is next

- Files modified:
  - `docs/plans/ux-gap-analysis-2026-02-22/task_plan.md` (Phase 2 resolved, decisions table updated)
  - `docs/plans/ux-gap-analysis-2026-02-22/findings.md` (Gap R2-1 resolution documented)
  - `docs/plans/ux-gap-analysis-2026-02-22/progress.md` (this file)

### Phase 3: Fix Logic Bugs (complete)
- Viability model implemented and tested — all 4 categories working correctly
- Engine price normalization — `resolvePlanPrice()` handles all field variants
- BYOK/PAYG total-cost model — Cline/OpenRouter/OpenCode show real API cost
- Credit rate surfacing — `deriveUsdPerCredit()` extracts $/credit from 4 data shapes
- OpenAI Codex removed as standalone plan
- Production build clean, all 6 tests pass

### Phase 3 → Phase 4 Transition: UX Redesign
- Live-tested the app post-Phase-3 fixes
- User identified 4 major remaining UX issues:
  1. "Pricing Context" card — remove it (billing region = noise)
  2. "Provider Requirements" section — remove it (wrong concept, wrong list, wrong label)
  3. Token meter dropdown — replace with model picker (human-readable names)
  4. BYOK tools showing $0 in budget mode — show API cost instead
- Agreed on two-tab architecture (see findings.md for full spec):
  - **Budget tab:** "What can I afford?" → model access + capacity at this budget
  - **Usage tab:** "What's the cheapest path?" → model picker first, then all access paths ranked by cost at user's token volume
- Planning docs updated to capture all decisions
- Phase 4 awaiting design hand-off (Jason doing design work)

## 5-Question Reboot Check

| Question | Answer |
|----------|--------|
| Where am I? | Phase 3 complete — Phase 4 awaiting design hand-off |
| Where am I going? | Phase 4: UI redesign — two-tab architecture, model picker, remove noise |
| What's the goal? | Two-tab tool: budget capacity view + model-centric cost comparison |
| What have I learned? | See findings.md — full two-tab spec, provider taxonomy, 4 UX issues to fix |
| What have I done? | Fixed all logic bugs, captured redesign vision in planning docs |
