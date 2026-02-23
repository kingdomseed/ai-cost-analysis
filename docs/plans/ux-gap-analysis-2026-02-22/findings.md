# Findings: UX Gap Analysis — Calculator vs. StackSense PRD

## Requirements (from StackSense PRD)

- Workflow profile builder (usage intensity, workflow type, must-haves, constraints) — under 60 seconds
- Cost engine handling flat-rate plans with soft limits AND pay-per-token APIs
- Feature parity matrix with BYOK degradation warnings
- Breakeven analyzer with crossover indicator
- Ranked recommendation stack ("Best Overall Value", "Best Budget", "Best Flexibility")
- Quality/value scoring (HumanEval, MBPP, SWE-bench)
- Team mode with per-seat modeling
- Shareable URLs and PDF/image export
- Time to first recommendation: < 60 seconds from landing
- Pricing data freshness: < 30 days stale

## What the Repo Already Does Well

These areas have strong PRD alignment and need minimal work:

| Area | Evidence |
|------|----------|
| Budget vs. token input toggle | `page.tsx` has budget slider + token fields, matches PRD Features 1-2 |
| Cost engine math | `POST /api/calculate`, `POST /api/plan-matrix`, `GET /api/catalog` all wired |
| Breakeven math (backend) | `break_even_vs_token_meter` scenario type exists in engine |
| Credit system nuance | Opaque credits handled with explicit user-overridable assumptions |
| Data freshness | Date-stamped snapshots with `source_ids`, `verified`, `retrieved_at` |
| Entitlements data model | `model_access:*`, `provider_access:*`, `modality_access:*` per plan/surface |
| Multi-provider bundles | Plan-matrix API computes multi-subscription bundles |
| Platform coverage | 14+ tools, 4+ API providers, consumer subscriptions |
| Confidence/evidence trail | Every estimate carries method, confidence, confidence_reasons[], source_ids[] |

## Critical Gaps (Reviewer 1 — UX-focused analysis)

### Gap 1: Identity Problem — Calculator vs. Advisor

The PRD describes *"a strategic AI tooling advisor"* that returns *"ranked tool combination recommendations."* What's built is a **pricing catalog browser** with two filter modes. The tool never answers "What should I use?" — it shows everything and asks the user to figure it out.

**Severity: Critical.** This is the foundational UX gap. Everything else flows from this.

### Gap 2: No Workflow Context = No Relevance Filtering

Zero workflow input exists. The tool doesn't know if you're an autocomplete-heavy VS Code user or a terminal-first agentic developer. Without this, every plan is shown with equal weight — Bolt.new alongside Cursor alongside raw API access.

**Impact:** The indie dev persona sees 50+ plan cards and must mentally filter which ones even *apply* to how they work. That's the exact manual research the tool was supposed to eliminate.

**Severity: Critical.** Blocks the "advisor" identity entirely.

### Gap 3: Results Are a Wall, Not a Recommendation

Current output is a flat, exhaustive list sorted by price. Every plan gets the same card treatment. No hierarchy, no "why this one for you," no editorial voice. The PRD explicitly designs for a short, opinionated, ranked output with labels and rationale.

**Severity: Critical.** The output format is the product. A wall of cards is not a recommendation.

### Gap 4: No Feature Parity Warnings

Plans show "Pricing type" labels and generic warnings like "Provider/model access is unknown." There's no mechanism to warn: *"Switching from Cursor Pro to Cline+API saves $20/mo but you lose Tab autocomplete and @codebase indexing."*

The PRD's problem statement literally describes this as the core pain point. The entitlements data model exists but no warning logic is built.

**Severity: High.** Without this, users risk false economy decisions — the exact problem the tool should prevent.

### Gap 5: No Breakeven Visualization

The engine has `break_even_vs_token_meter` but the UI doesn't expose it. No crossover chart, no "at your usage level you are below/above the breakeven point."

**Severity: High.** One of the most actionable insights in the PRD, completely invisible.

### Gap 6: Team Lead Persona Unserved

Per-seat plans show "assuming seat_count=1" with no seat count input. Can't model "What does Cursor cost for 8 developers?"

**Severity: Medium.** PRD Phase 4 item, not blocking v1.

### Gap 7: Combination Recommendations Missing

Plan-matrix API supports bundles but UI doesn't surface tool *combinations*. Every result is a single plan in isolation. The PRD's core value prop — "optimal *combination* of AI tools" — isn't delivered.

**Severity: High.** The PRD envisions "Copilot + DeepSeek V3 API = $14/mo" outputs.

### Gap 8: Evidence Metadata Overwhelms the User

Confidence badges (floor/direct/heuristic/high/medium/low) plus warnings appear on every card. The indie dev persona doesn't know what these mean. This should be progressive disclosure.

**Severity: Medium.** Noise over signal; fixable with UI reorganization.

### Gap 9: No Guided Funnel / Time-to-Recommendation Path

Current path: Land -> see everything -> scroll 50+ cards -> ???. No guided flow. PRD designs for < 60 seconds to first recommendation.

**Severity: High.** The user journey has no structure.

### Gap 10: No Shareability or Export

No shareable URLs, no PDF/image export. Team lead can't present options to stakeholders.

**Severity: Medium.** PRD Phase 4.

## Critical Gaps (Reviewer 2 — Data/Feature-focused analysis)

### Gap R2-1: "No Subjective Recommendations" Policy Conflicts With PRD

`docs/public-calculator/README.md` states: *"No subjective judgments. No persuasive recommendations."* The PRD explicitly wants ranked recommendations with labels like "Best Overall Value" and workflow-specific guidance.

**RESOLVED: Hybrid approach chosen.**

The tool offers both modes:
- **Calculator mode** — objective engine, every number has provenance, no editorial voice. For users who know what they're looking at and want raw data.
- **Advisor mode** — same engine data, filtered through user's workflow profile, presented as ranked recommendations with savings deltas and feature trade-offs. For users who need help making a decision and want a clear view of what their money buys.

The key framing: the advisor layer doesn't invent opinions — it computes "what do these numbers get you" and "how much can you save" from the same empirical data. The README policy should be updated to reflect this: engine stays empirical, advisor layer adds computed recommendations (not subjective endorsements).

### Gap R2-2: No Quality/Value Score

PRD calls for HumanEval/MBPP/SWE-bench quality-per-dollar scoring. `models.*.json` ratings are empty. Without quality data, you can only rank by "cheapest" — not "best value."

### Gap R2-3: No Throttle/Soft-Limit Warnings

PRD calls out flagging when a flat plan throttles at the user's usage level. No "you will hit the throttle at X tokens" warning computed from usage input.

## Logic Bug: Free Plans Show Infinite Capacity

### Reproduction
1. Switch to "Find by Token Usage" mode
2. Enter any token volume (1M, 10M, 1B — doesn't matter)
3. Observe: Amazon Q Free, Cline Open Source, Copilot Free, and other free-with-limits plans appear at $0/month regardless of token volume

### Root Cause
Free plans have a floor cost of $0. The plan-matrix sorts by cost. Since $0 fits any budget and the engine doesn't model *capacity exhaustion* for free-tier plans, they always appear as valid options — even at absurd usage levels.

### User Impact
This is a **false signal**. A user entering 10M tokens/month sees "Amazon Q Free — $0/month" and thinks it's a viable option. It isn't — Amazon Q Free has hard limits on agentic requests. Similarly, Copilot Free gives 2,000 completions/month — nowhere near 10M tokens.

### Affected Plans (observed)
- Amazon Q Free
- Bolt Free
- Cline Open Source
- Cline Teams ($0 floor — BYOK billing)
- Copilot Free
- Devin Core ($0 floor — likely free trial)
- JetBrains AI Free
- Lovable Business/Pro ($0 floor — price missing)
- OpenAI Codex Credits ($0 floor — price missing)
- OpenCode Zen PAYG ($0 floor)
- OpenRouter PAYG ($0 floor)
- Replit Starter
- Sourcegraph entries ($0 floor — price missing)
- Tabnine entries ($0 floor — price missing)

### Design Questions to Resolve
1. Should free plans with unknown/unmodeled capacity limits be shown with a prominent warning?
2. Should plans with `price_missing` be filtered out entirely, or shown with a "price unknown" indicator?
3. When the user enters a token volume, should plans that can't plausibly serve that volume be deprioritized or hidden?
4. What does "fits budget" mean when the budget is in tokens and the plan meters in credits/requests/compute units?

## Visual/Browser Findings (Phase 3 — Post-Fix State)

Phase 3 fixed the viability model, total-cost for BYOK/PAYG plans, credit rate surfacing, and engine price normalization. The UI now correctly groups plans into viable / viability_unknown / non_viable / price_unavailable sections. However, live testing revealed the following UX issues that require a deeper redesign (Phase 4+):

### Issue 1: "Pricing Context" Card — Remove Entirely
- Shows billing region (only US/AP — meaningless for most users) and currency selector
- Billing region adds no user value and implies the tool has more regional granularity than it does
- Currency selector is valid but doesn't need a full card — a small dropdown anywhere is sufficient
- **Decision:** Remove the card. Add a small unobtrusive currency switcher (top-right or similar).

### Issue 2: "Provider Requirements" Section — Remove Entirely
- Shows four checkboxes: Anthropic, Google, Moonshot, OpenAI
- These are subscription/API providers only — not the full universe of "providers"
- The word "provider" is ambiguous: it can mean the model creator (Anthropic), the API access point (Anthropic's API, OpenRouter, OpenCode), or a subscription service (Cursor, Windsurf)
- OpenRouter is a provider — offers hundreds of models at API pricing. Not listed.
- Cursor is not listed but it's a key tool with its own subscription
- The section implies these 4 are the only choices, which is wrong and confusing
- **Decision:** Remove entirely. The model-centric design in the Usage tab makes this unnecessary.

### Issue 3: Token Meter Dropdown — Conceptually Wrong
- Currently shows: `anthropic claude-haiku-4.5 (api)` style strings
- Forces the user to pick a specific provider+model+channel combination before seeing results
- This is backwards — users think in model names, not provider+channel combos
- You lose the ability to compare "what does Claude Sonnet cost across all providers?"
- **Decision:** Replace with a model picker (human-readable name). The tool then enumerates every provider/plan that offers that model.

### Issue 4: BYOK/Pass-Through Tools Show $0 in Budget Mode
- Cline Open Source, OpenRouter PAYG show $0 in budget mode
- For pass-through tools, the subscription cost is irrelevant — the API cost IS the cost
- A user with a $50 budget who sees "$0" for Cline doesn't understand they're about to spend their entire budget on API calls
- Phase 3 fixed this in token mode (shows $3.50 effective at 1.5M tokens)
- Budget mode still doesn't account for this — showing $0 and "Within Budget" for BYOK plans
- **Decision:** Budget mode should show estimated API cost for BYOK/PAYG plans, not $0 subscription floor.

---

## Two-Tab Redesign Vision (Agreed Design Direction)

The fundamental redesign: two tabs serving two genuinely different user questions.

### Tab 1 — Budget Mode: "I have $X/month — what can I do with it?"

**User question:** Given a fixed monthly spend, what models can I access and how much capacity do I get?

**Input:** Dollar budget (slider)

**Output:** Organized by model access and capacity
- "At $50/mo: Cursor Pro ($20) → Claude Sonnet/Opus in $X API pool → ~Ym tokens/mo at list rates"
- "At $50/mo: Claude Pro ($20) → Claude Sonnet/Opus, usage-based with session limits"
- Sorted by value: capacity per dollar, not just price
- Plans that are only pass-through shown with estimated API cost at some representative usage level

**What to remove:** Pricing Context card, Provider Requirements, billing region

### Tab 2 — Usage Mode: "I use X tokens/month — what's the cheapest path?"

**User question:** Given a fixed usage pattern (tokens/month) on a specific model, what is the cheapest way to access it?

**Input 1 — Token volume (two modes):**
- Specific: input tokens + output tokens (raw numbers)
- Aggregate: total tokens + input:output ratio slider (e.g., 3:1)

**Input 2 — Model picker:**
- Human-readable list: "Claude Sonnet 4.6", "GPT-5.2", "Gemini 2.5 Pro", "Kimi K2.5"
- No provider prefix needed in the label
- Tool resolves which providers/plans offer access to that model

**Output:** All access paths for the selected model, cost-ranked at the user's volume:
- Direct API — Anthropic: $X/month
- Direct API — OpenRouter: $Y/month (with routing markup)
- Cursor Pro ($20/mo) — model included in pool: effectively $Z/month at this usage
- Claude Pro ($20/mo) — model included in subscription: effectively $W/month
- Sorted cheapest → most expensive
- Breakeven callout: "At your usage, Cursor Pro breaks even with direct API at Xm tokens/mo"

**What to remove:** Token meter dropdown (replaced by model picker), Pricing Context card, Provider Requirements

---

## What "Provider" Actually Means (Clarification)

The current UI uses "provider" to mean only the 4 companies who own the underlying models (Anthropic, OpenAI, Google, Moonshot). This is too narrow. In practice, a "provider" is anything that gives you API access to a model:

| Type | Examples |
|------|----------|
| Model creator (direct API) | Anthropic, OpenAI, Google, Moonshot |
| Aggregator / router | OpenRouter, OpenCode/Zen |
| Subscription with API pool | Cursor, Windsurf, Replit |
| Subscription with opaque credits | Warp, Verdent, Qoder, JetBrains |
| Consumer subscription (chat-only) | Claude Pro, ChatGPT Plus, Google AI Pro |

The model picker design naturally handles this — pick "Claude Sonnet" and you see all the ways to access it, regardless of which "type" of provider they are.

## Resources

- PRD: StackSense Product Requirements Document (user-provided, Feb 2026)
- Current UI: `apps/public-calculator/site/src/app/page.tsx`
- Engine: `packages/core/src/engine.ts`
- API routes: `apps/public-calculator/site/src/app/api/`
- Pricing data: `apps/public-calculator/data/pricing.2026-02-22.json`
- Entitlements: `apps/public-calculator/data/entitlements.2026-02-22.json`
- Public calculator README: `docs/public-calculator/README.md` (contains "no subjective language" policy)
- Entitlements spec: `docs/public-calculator/subscription-entitlements.md`
