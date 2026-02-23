# Task Plan: UX Gap Analysis — Calculator vs. StackSense PRD

## Goal

Redesign the AI Cost Calculator into a two-tab tool that answers two distinct user questions:
1. **Budget tab:** "I have $X/month — what models can I access and how much capacity do I get?"
2. **Usage tab:** "I use X tokens/month of [specific model] — what is the cheapest way to access it?"

## Current Phase

Phase 3 complete — Phase 4 (UI redesign) is next, requires design hand-off first

## Phases

### Phase 1: Codify the UX Gap Analysis
- [x] Live-test both UI modes (Budget, Token Usage) via Playwright
- [x] Map every PRD user story against current UI affordances
- [x] Identify logic bugs (free-plan-fits-any-budget)
- [x] Capture two independent reviewer analyses
- [x] Write this planning doc
- **Status:** complete

### Phase 2: Resolve Philosophy Question (Objective Tool vs. Advisory Tool)
- [x] Decide whether to add an opinionated advisor layer or keep purely empirical
- [x] If advisor: define separation between objective engine output and advisory interpretation
- [ ] Update `docs/public-calculator/README.md` "no subjective language" policy accordingly
- [x] Document decision in findings.md
- **Status:** complete
- **Decision:** **Hybrid.** The tool offers both modes. The objective engine stays empirical — every number has provenance, no invented scores. On top of that, an advisor layer helps users who need a clear answer: what do these numbers get me, and how much can I save? The advisory output is computed from the same engine data, filtered through the user's workflow profile, and presented as ranked recommendations with savings deltas. Users who want raw numbers can still get them. Users who want guidance get a clear view of what their money buys and what they'd lose by switching.

### Phase 3: Fix Logic Bugs (Free Plans, Budget Semantics)
- [x] Define what "fits budget" actually means for free plans with usage caps
- [x] Define what token budget input means for plans that don't meter tokens
- [x] Implement viability model: plans that can't serve the workload are non-viable, grouped with other non-viable plans
- [x] Implement total-cost model: BYOK/PAYG plans now show token-meter effective cost (subscription $0 + API spend = total); upgraded from viability_unknown to viable when effective cost computable
- [x] Implement credit conversion: `deriveUsdPerCredit()` extracts $/credit from 4 data shapes across platforms; surfaced in plan cards as "credit rate ~$X.XX/credit". Cannot compute tokens→credits without fabricating a ratio, so floor is shown with credit rate for user context.
- [x] Handle missing-price plans: "here's a tool, check it out yourself" treatment
- [x] Research missing pricing data — agent confirmed all data already accurate (Tabnine $39-59, Sourcegraph $49, Lovable $25-50)
- [x] Fix engine price field normalization: added `resolvePlanPrice()` helper to handle `subscription_price_usd_per_seat_per_month` and `credit_tiers` variants across all 7 scenario handlers
- [x] Remove OpenAI Codex as standalone plan (deleted from pricing snapshot — it's part of ChatGPT Plus/Pro, model accessible via API at normal rates)
- **Status:** complete
- **Design decisions (all four resolved):**
  1. **Non-viable plans grouped together.** If a free plan can't serve the workload (e.g., Amazon Q Free's 50 agentic requests vs. 10M token workload), it's non-viable. Don't show it alongside real options.
  2. **Total cost is the metric, not subscription floor.** "$50/month gets you X tokens on Y model" — compute API-level token cost AND monthly budget capacity. Subscription price alone is misleading for PAYG/BYOK plans.
  3. **Attempt credit conversion with confidence levels.** Use the extensive collected pricing data to estimate. Some are tractable (Qoder ~1 cent/credit), some are harder (Windsurf: ~25 tool calls per credit, 10x multiplier for Opus 4.6). Show the tool's cost + type + confidence. If we can't convert, say so honestly.
  4. **Missing price = "check vendor."** If we genuinely can't get pricing, show the tool but say "you have to check it out yourself." OpenAI Codex is not a standalone plan — it's usage included with OpenAI Pro. Try to source more data where possible.

### Phase 4: UI Redesign — Two-Tab Architecture
**Requires design hand-off before implementation. Owner: Jason.**

Core interaction model changes:

#### Tab 1 — Budget Mode: "What can I afford?"
- Input: monthly dollar budget (slider + presets, as today)
- Output: organized by **model access** — at this budget, here are the models you can reach and the capacity you get
  - Example: "$50/mo → Cursor Pro ($20): Claude Sonnet + Opus in pool, ~Xm tokens included; Claude Pro ($20): Claude Sonnet/Opus, usage-based"
  - Plans sorted by value: capacity per dollar, not just price
- Remove: "Pricing Context" card (billing region is noise)
- Remove: "Provider Requirements" section (confusing, incomplete, wrong mental model)
- Keep: currency switcher — but as a small, unobtrusive dropdown (top-right or similar), not a full card
- BYOK/pass-through tools: show estimated API cost at budget, not $0

#### Tab 2 — Usage Mode: "What's the cheapest path for my workload?"
- Input 1: token volume — two sub-options:
  - Specific: input tokens + output tokens (as today)
  - Aggregate: total tokens + ratio slider (e.g., 3:1 input:output)
- Input 2: **model picker** — human-readable model name list, not `provider:model:channel` technical IDs
  - e.g., "Claude Sonnet 4.6", "GPT-5.2", "Gemini 2.5 Pro", "Kimi K2.5"
  - No provider prefix required; the tool resolves which providers offer it
- Output: cost-ranked list of **every way to access that model** at the user's token volume:
  - Direct API (Anthropic, OpenAI, Google, etc.)
  - Through aggregators (OpenRouter, OpenCode — at their routing cost)
  - Included in subscription plans (Cursor Pro pool, Claude Pro subscription, etc.)
  - Sorted cheapest to most expensive
  - Answer: "is the subscription worth it vs. direct API at my usage level?"
- Remove: "Pricing Context" card and "Provider Requirements" section (same as Tab 1)
- Remove: token meter dropdown as currently designed — replaced by model picker above

#### Shared changes (both tabs)
- [ ] Remove "Pricing Context" card entirely — billing region adds no value, confuses users
- [ ] Replace with a small currency switcher (top-right, no card, just a `<select>`)
- [ ] Remove "Provider Requirements" section — concept is wrong, label is wrong, list is incomplete
- [ ] BYOK/pass-through tools show API cost, not $0 subscription floor
- [ ] Progressive disclosure for confidence badges / technical metadata (collapse by default)
- **Status:** pending — awaiting design hand-off

### Phase 5: Model-Centric Results (Usage Tab)
- [ ] Build model catalog picker (human-readable names, grouped by family)
- [ ] For a given model + token volume, enumerate all access paths: direct API, aggregator, subscription plan
- [ ] Rank by effective $/token at the stated usage
- [ ] Show breakeven crossover: "at your usage, subscription breaks even vs. direct API at X tokens"
- [ ] Feature notes for subscription plans: what you get/lose vs. direct API (BYOK warnings)
- **Status:** pending

### Phase 6: Budget Tab Model-Access View
- [ ] For a given dollar budget, enumerate models accessible and token capacity per plan
- [ ] Group results by model family / capability tier, not just price
- [ ] Show capacity clearly: "Cursor Pro $20 → Claude Sonnet included in $X pool → ~Ym tokens/mo at list rates"
- **Status:** pending

### Phase 7: Advisor Layer, Team Mode, Export
- [ ] Ranked recommendation output ("Best Value", "Best Budget", "Best Flexibility") using computed deltas
- [ ] Feature parity / BYOK degradation warnings (PRD Feature 3)
- [ ] Seat count input for per-seat plans
- [ ] Shareable URL and PDF/image export
- **Status:** pending

## Key Questions

1. **Philosophy:** ~~Objective vs advisory?~~ **RESOLVED: Hybrid.** See Phase 2.
2. **Free plan semantics:** ~~What does "fits budget" mean?~~ **RESOLVED.** See Phase 3.
3. **Token budget for non-token plans:** ~~What to show?~~ **RESOLVED.** See Phase 3.
4. **Quality scoring source:** PRD calls for HumanEval/MBPP/SWE-bench scores. `models.*.json` ratings empty. **(Still open — defer to later.)**
5. **PAYG total cost:** ~~Subscription floor or total cost?~~ **RESOLVED.** See Phase 3.
6. **Missing-price plans:** ~~Hide or show?~~ **RESOLVED.** See Phase 3.
7. **Model picker design:** How should the model list be organized? By family (Claude / GPT / Gemini / etc.)? By capability tier? Show deprecated models? **Needs design decision.**
8. **Budget tab output structure:** How to display model access + capacity clearly? Table? Cards grouped by model? **Needs design decision.**
9. **"Provider" terminology:** The word "provider" means different things (model creator vs. API access point vs. aggregator). What term/concept should the UI use? **Needs design decision.**

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Two-reviewer analysis merged into single planning doc | Captures both UX-focused and data/feature-focused perspectives |
| **Hybrid: objective engine + advisory layer** | Some users want raw numbers; some need help deciding. Engine stays empirical; advisor layer adds computed recommendations based on user-stated workflow. |
| README "no subjective language" policy needs update | Engine stays empirical; advisor adds computed suggestions, not opinions. |
| **Non-viable plans grouped separately** | Plans that can't serve the workload aren't real options. |
| **Total cost = subscription + token spend** | Subscription floor alone is misleading for PAYG/BYOK. |
| **Attempt credit-to-token conversion** | Use topup pack data to derive $/credit. Show rate; cannot compute tokens→credits without fabricating a ratio. |
| **Missing price = "check vendor"** | Show tool exists, separate from main results, don't fake $0. |
| **OpenAI Codex removed as standalone plan** | It's a feature of ChatGPT plans, not a purchasable standalone. |
| **Two-tab architecture** | Budget tab answers "what can I afford?" (capacity/reach). Usage tab answers "what's the cheapest path?" (model-centric cost comparison). These are genuinely different questions requiring different UX. |
| **Budget tab: organize by model access, not plan name** | The user's real question is "what models can I use?" not "what plan names exist?" |
| **Usage tab: model picker first, not token meter dropdown** | Users think in model names ("Claude Sonnet"), not technical IDs ("anthropic:claude-sonnet-4.6:api"). The tool should resolve which providers offer that model. |
| **Usage tab: show all access paths for a model** | Direct API, aggregators (OpenRouter), subscriptions (Cursor pool) — ranked cheapest to most expensive at the user's volume. This answers "is the subscription worth it?" |
| **Remove "Pricing Context" card** | Billing region is noise (only US/AP). Currency switcher belongs as a small unobtrusive element, not a configuration card. |
| **Remove "Provider Requirements" section** | Confusing and wrong. "Provider" is ambiguous (model creator vs API access point vs aggregator). OpenRouter is a provider; Cursor is a provider. The current list only shows 4 subscription providers and is misleading. |
| **BYOK/pass-through tools: show API cost, not $0** | If a tool is a pass-through to an API, the tool subscription cost is irrelevant. Show the API cost at the user's usage level. |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | — | — |

## Notes

- Phase 2 (philosophy decision) is now resolved. Implementation planning can proceed for Phases 3+.
- Update phase status as you progress: pending -> in_progress -> complete
- Re-read this plan before major decisions
