# Findings & Decisions
<!-- 
  WHAT: Your knowledge base for the task. Stores everything you discover and decide.
  WHY: Context windows are limited. This file is your "external memory" - persistent and unlimited.
  WHEN: Update after ANY discovery, especially after 2 view/browser/search operations (2-Action Rule).
-->

## Requirements
<!-- 
  WHAT: What the user asked for, broken down into specific requirements.
  WHY: Keeps requirements visible so you don't forget what you're building.
  WHEN: Fill this in during Phase 1 (Requirements & Discovery).
  EXAMPLE:
    - Command-line interface
    - Add tasks
    - List all tasks
    - Delete tasks
    - Python implementation
-->
<!-- Captured from user request -->
- Produce a markdown research note for Feb 2026 (captured/verified on 2026-02-21).
- Extract official Anthropic API token pricing for:
  - Claude Opus 4.6
  - Claude Sonnet 4.6
  - Claude Haiku (latest/current Haiku SKU as of 2026-02-21)
- Include any relevant pricing modifiers:
  - prompt caching `cache_write` / `cache_read` pricing (or equivalent)
  - any long-context multipliers / special rates
- Capture official consumer subscription pricing:
  - Claude Pro
  - Claude Max 5x
  - Claude Max 20x
- Capture official usage-limit documentation for consumer plans:
  - rolling windows / reset timing
  - message limits (if stated)
  - notable caveats (model-dependent limits, peak-time behavior, etc.)
- Prefer official sources on `anthropic.com`, `platform.claude.com`, and Anthropic support docs; include `claude.ai` pricing if it is the official consumer signup page.
- Corroborate key numbers from at least two official pages where possible.
- Output format: tables + links + dates; saved to `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-anthropic.md`.

## Research Findings
<!-- 
  WHAT: Key discoveries from web searches, documentation reading, or exploration.
  WHY: Multimodal content (images, browser results) doesn't persist. Write it down immediately.
  WHEN: After EVERY 2 view/browser/search operations, update this section (2-Action Rule).
  EXAMPLE:
    - Python's argparse module supports subcommands for clean CLI design
    - JSON module handles file persistence easily
    - Standard pattern: python script.py <command> [args]
-->
<!-- Key discoveries during exploration -->
- API pricing page on Claude Developer Platform (`platform.claude.com/docs/en/about-claude/pricing`) includes a table with:
  - Base input token pricing, output token pricing, and prompt caching categories:
    - `5m Cache Writes`, `1h Cache Writes`, and `Cache Hits & Refreshes` (cache reads).
- Pricing table values (USD per 1M tokens / “MTok”) observed via `curl` (2026-02-21):
  - Claude Opus 4.6: input $5/MTok, output $25/MTok, 5m cache write $6.25/MTok, 1h cache write $10/MTok, cache hits & refreshes $0.50/MTok.
  - Claude Sonnet 4.6: input $3/MTok, output $15/MTok, 5m cache write $3.75/MTok, 1h cache write $6/MTok, cache hits & refreshes $0.30/MTok.
  - Claude Haiku (latest shown is Haiku 4.5): input $1/MTok, output $5/MTok, 5m cache write $1.25/MTok, 1h cache write $2/MTok, cache hits & refreshes $0.10/MTok.
- Long context pricing per the same pricing page:
  - Requests with fewer than 200K input tokens are charged at standard rates.
  - If a request exceeds 200K input tokens, *all* tokens incur premium pricing.
  - (Also surfaced elsewhere) Premium rates described as 2x for input and 1.5x for output.
- Prompt caching multipliers described on the pricing page:
  - 5-minute cache write tokens: 1.25x base input price
  - 1-hour cache write tokens: 2x base input price
  - Cache read tokens: 0.1x base input price
- Consumer plan pricing + limits are documented in the Claude Help Center (`support.claude.com`), including:
  - Pro plan: $20/month (and $200/year mentioned in plan comparison article); session-based limit resets every 5 hours; weekly limit resets 7 days after session starts; usage varies by message length, attachments, model/features.
  - Max plan: Max 5x $100/month; Max 20x $200/month; provides 5x or 20x more usage per session than Pro; limits reset 7 days after session starts and may have additional caps at Anthropic’s discretion.
  - Usage limits are described as a “conversation budget” over a time period (not a fixed message count); factors include conversation length/complexity, features used, and model choice.
  - Extra usage: after included limits, paid plan users can switch to consumption-based pricing at standard API rates to continue without interruption.

## Technical Decisions
<!-- 
  WHAT: Architecture and implementation choices you've made, with reasoning.
  WHY: You'll forget why you chose a technology or approach. This table preserves that knowledge.
  WHEN: Update whenever you make a significant technical choice.
  EXAMPLE:
    | Use JSON for storage | Simple, human-readable, built-in Python support |
    | argparse with subcommands | Clean CLI: python todo.py add "task" |
-->
<!-- Decisions made with rationale -->
| Decision | Rationale |
|----------|-----------|
| Record prices as USD | Keeps calculator dataset consistent; note billing currency if specified otherwise |
| Store per-source `retrieved_at` and `last_verified_at` as 2026-02-21 | Matches requested Feb 2026 sweep date |
| Treat “Haiku” as “Claude Haiku 4.5” | `platform.claude.com/docs/en/about-claude/pricing` lists Haiku 4.5 as the latest Haiku SKU as of 2026-02-21 |

## Issues Encountered
<!-- 
  WHAT: Problems you ran into and how you solved them.
  WHY: Similar to errors in task_plan.md, but focused on broader issues (not just code errors).
  WHEN: Document when you encounter blockers or unexpected challenges.
  EXAMPLE:
    | Empty file causes JSONDecodeError | Added explicit empty file check before json.load() |
-->
<!-- Errors and how they were resolved -->
| Issue | Resolution |
|-------|------------|
| `web.run open(...)` to `platform.claude.com/docs/...` returned `UnexpectedStatusCode` (likely 403/anti-bot) | Use `mcp__fetch__fetch` (or `curl`) to retrieve full page content for exact tables/wording |

## Resources
<!-- 
  WHAT: URLs, file paths, API references, documentation links you've found useful.
  WHY: Easy reference for later. Don't lose important links in context.
  WHEN: Add as you discover useful resources.
  EXAMPLE:
    - Python argparse docs: https://docs.python.org/3/library/argparse.html
    - Project structure: src/main.py, src/utils.py
-->
<!-- URLs, file paths, API references -->
-

## Visual/Browser Findings
<!-- 
  WHAT: Information you learned from viewing images, PDFs, or browser results.
  WHY: CRITICAL - Visual/multimodal content doesn't persist in context. Must be captured as text.
  WHEN: IMMEDIATELY after viewing images or browser results. Don't wait!
  EXAMPLE:
    - Screenshot shows login form has email and password fields
    - Browser shows API returns JSON with "status" and "data" keys
-->
<!-- CRITICAL: Update after every 2 view/browser operations -->
<!-- Multimodal content must be captured as text immediately -->
-

---
<!-- 
  REMINDER: The 2-Action Rule
  After every 2 view/browser/search operations, you MUST update this file.
  This prevents visual information from being lost when context resets.
-->
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
