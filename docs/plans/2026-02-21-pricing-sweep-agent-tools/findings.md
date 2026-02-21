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
- Date scope: Feb 2026 (today is 2026-02-21)
- Vendors: Cursor, Windsurf, Warp, OpenRouter
- Prefer official sources:
  - Cursor: `cursor.com` (docs/pricing)
  - Windsurf: `windsurf.com` and `docs.windsurf.com`
  - Warp: `docs.warp.dev` (and official pricing page if separate)
  - OpenRouter: `openrouter.ai`
- For each vendor, capture:
  - Included usage pools/credits (what, how much, reset cadence)
  - Metering mechanics (tokens at API rates vs prompt credit vs AI credit)
  - Top-up pricing (if supported)
  - Explicit multipliers by model (if any)
- Corroborate numbers between pricing page + docs page where possible
- Deliverable: markdown content suitable for saving to `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-tools.md`

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
- Cursor (official docs + pricing page) uses a dollar-denominated included “API agent usage” pool per month:
  - Pro: “$20 of API agent usage + generous Auto and Composer usage”
  - Pro Plus: “$70 of API agent usage + generous Auto and Composer usage”
  - Ultra: “$400 of API agent usage + generous Auto and Composer usage”
- Cursor top-up: when you exceed included monthly usage, you can add “on-demand usage” (pay-as-you-go) at the same API rates; billed monthly; requests are never downgraded.
- Cursor metering: selecting a model directly incurs usage at that model’s “list API price”.
- Cursor multiplier: Max Mode uses token-based pricing at the model’s API rate plus a 20% upcharge.
- Windsurf uses “prompt credits” as the metering unit (per message), not per-token billing:
  - Prompt credits are consumed when sending a message to Cascade with a premium model.
  - “Every model has it’s own credit multiplier with the default message costing 1 credit.”
- Windsurf included monthly prompt credits (docs + pricing page corroborate):
  - Free: 25 prompt credits/month
  - Pro Trial (2 weeks): 100 prompt credits
  - Pro: 500 prompt credits/month ($15/month)
  - Teams: 500 prompt credits/user/month ($30/user/month; add-on credits pooled)
  - Enterprise: 1000 prompt credits/user/month ($60/user/month)
- Windsurf top-ups:
  - Pro: add-on prompt credits at $10 / 250 credits
  - Teams/Enterprise: add-on prompt credits at $40 / 1000 pooled credits
  - Add-on credits roll over month-to-month; monthly plan credits reset each billing cycle.
  - Automatic Credit Refills: auto top-up below 15 credits; increments in multiples of $10 (Pro) / $40 (Teams); default monthly caps $50 (Pro) / $160 (Teams).
- Warp uses “credits” to meter AI usage (Warp Agents and related AI features). Credits scale with token usage (and other factors), and each interaction consumes at least 1 credit; usage is non-deterministic.
- Warp included monthly credits (from Warp pricing page):
  - Free: includes free AI credits (amount not specified on pricing page content fetched)
  - Build: 1,500 credits/month, $18/month
  - Max: “12x credits per month”, $180/month
  - Business: $45/user/month (credit amount not specified on pricing page content fetched)
  - Enterprise: Custom pricing
- Warp top-ups (“Add-on Credits” / “Reload credits”):
  - Once plan credits are used, Warp draws from Add-on Credits; supports usage-based billing and auto reload.
  - Add-on credit packages (credits → price → effective $/credit):
    - 400 → $10 → $0.025 (base rate)
    - 1,000 → $20 → $0.020 (20% off)
    - 3,000 → $50 → $0.016 (~35% off)
    - 6,500 → $100 → $0.0153 (~40% off)
  - Auto reload triggers when balance hits 100 credits; default monthly spend limit $200 (adjustable).
  - Add-on credits roll over across billing cycles and remain valid for 12 months from purchase date.
- Warp model multipliers: no fixed per-model numeric multipliers published in the credits doc, but it explicitly notes model choice affects credit usage (larger/reasoning models tend to consume more credits), and gives an example ordering by higher credit usage (e.g., Claude Opus 4.1 > Claude Sonnet 4.5 > GPT-5 > Gemini 2.5 Pro).
- Warp BYOK: when you select a provider model via your own API key, Warp does not consume Warp credits; Auto models always consume Warp credits; BYOK does not apply to cloud agent runs (cloud agents always consume Warp credits).
- OpenRouter uses a prepaid “credits” balance (base currency USD) that is deducted per request based on model pricing (typically per 1M tokens, with different prompt vs completion rates; some models charge per request, images, or reasoning tokens).
- OpenRouter included/free usage:
  - New users receive a “very small free allowance” to test OpenRouter.
  - Many models can be used for free (including `:free` variants), but have low rate limits; free usage limits increase after purchasing credits.
  - Pricing page indicates “Pay-as-you-go has no minimums and no lock-in”, and “No minimum spend. Prices based on models.”
- OpenRouter top-ups / fees:
  - Purchasing credits incurs a 5.5% fee ($0.80 minimum); crypto payments are charged 5%.
  - Terms state minimum and maximum credit purchase amounts of $5 and $25,000 per transaction.
  - Users can top up manually or configure auto top-up when balance drops below a threshold.
  - Credits may expire after one year (OpenRouter reserves the right to expire unused credits).
- OpenRouter multipliers/variants:
  - No global model multiplier system; instead each model has its own published price schedule.
  - Model variants (e.g., `:free`, `:extended`, `:thinking`, plus routing shortcuts like `:nitro`/`:floor`) are explicitly documented.
  - BYOK: first 1M BYOK requests per month are free; subsequent BYOK usage is charged a 5% fee relative to what the same model/provider would normally cost on OpenRouter (deducted from OpenRouter credits).

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
| Use a consistent per-vendor section template | Makes differences in metering/top-ups easier to compare |
| Record sources as two links per vendor when possible (pricing + docs) | Matches “corroborate where possible” requirement |

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
| Skill path in prompt missing | Used skills list path to load planning-with-files instructions |

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
- Output path: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-tools.md`
- Cursor pricing page: `https://cursor.com/pricing`
- Cursor pricing docs: `https://cursor.com/docs/account/pricing`
- Windsurf pricing page: `https://windsurf.com/pricing`
- Windsurf credit usage docs: `https://docs.windsurf.com/windsurf/accounts/usage`
- Windsurf models doc (describes credit multipliers exist): `https://docs.windsurf.com/windsurf/models`
- Warp pricing page: `https://www.warp.dev/pricing`
- Warp pricing docs (overview): `https://docs.warp.dev/support-and-community/plans-and-billing/plans-and-pricing`
- Warp credits doc: `https://docs.warp.dev/support-and-community/plans-and-billing/credits`
- Warp add-on credits doc: `https://docs.warp.dev/support-and-community/plans-and-billing/add-on-credits`
- Warp BYOK doc: `https://docs.warp.dev/support-and-community/plans-and-billing/bring-your-own-api-key`
- OpenRouter pricing page: `https://openrouter.ai/pricing`
- OpenRouter FAQ: `https://openrouter.ai/docs/faq`
- OpenRouter terms: `https://openrouter.ai/terms`

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
