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
- Extract official Amazon Bedrock token pricing as of Feb 2026, focusing on Anthropic Claude models.
- Confirm whether Claude Opus 4.6 / Sonnet 4.6 exist on Bedrock; if not, capture latest available Claude SKUs and prices.
- Extract any OpenAI and Moonshot (Kimi) token prices shown on the Bedrock pricing page.
- Capture differences by region and by tier (Standard/Priority/Flex/Batch) where documented.
- Prefer `aws.amazon.com/bedrock/pricing` and `docs.aws.amazon.com` sources; corroborate prices with at least one additional official AWS source if possible.
- Deliver as markdown intended for `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-aws-bedrock.md`.

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
- `aws.amazon.com/bedrock/pricing/` explicitly lists service tiers (Standard, Flex, Priority, Reserved) and links to a dedicated “service tiers” page; it also documents Batch inference as “50% lower” vs on-demand and links to AWS docs for Batch inference and Batch-supported models.
- The Bedrock pricing page HTML includes provider sections for Anthropic, OpenAI, and Moonshot AI; many tables are rendered via token placeholders like `{priceOf!...}` but some regions are also hard-coded as static tables (e.g., Moonshot/Kimi and parts of OpenAI).
- Official AWS Price List API includes Bedrock offers (public JSON, no auth) including `AmazonBedrock` and `AmazonBedrockFoundationModels` with a `publicationDate` in Feb 2026; these can be used to extract per-region/per-tier token rates programmatically.
- In the Feb 2026 Bedrock foundation models price list, Claude model names include “Claude Sonnet 4.6” and “Claude Opus 4.6”, indicating these SKUs exist on Bedrock by that date.

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
| Use AWS Price List API JSON to extract prices | Avoids relying on dynamic `{priceOf!...}` placeholders on the marketing pricing page; still official AWS pricing data. |
| Use pricing page + docs for tier semantics | Marketing pricing page and AWS docs are the official narrative sources for tier meanings (Priority premium, Flex/Batch discount, etc.). |

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
| Dynamic price tables on `aws.amazon.com/bedrock/pricing/` use `{priceOf!...}` placeholders | Use AWS Price List API (`pricing.us-east-1.amazonaws.com/offers/...`) to obtain the numeric prices for those tokens. |
| Pricing page provider label “Moonshot AI” vs Price List API provider label “Kimi AI” | Treat “Kimi AI” in the offer as the pricing-system representation of Moonshot/Kimi models; corroborate against the pricing page’s Moonshot section where possible. |

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
- `https://aws.amazon.com/bedrock/pricing/`
- `https://aws.amazon.com/bedrock/service-tiers/`
- `https://docs.aws.amazon.com/bedrock/latest/userguide/batch-inference.html`
- `https://docs.aws.amazon.com/bedrock/latest/userguide/batch-inference-supported.html`
- AWS Price List API offer index: `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/index.json`
- AWS Price List API (Bedrock foundation models): `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonBedrockFoundationModels/current/index.json`
- AWS Price List API (Bedrock): `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonBedrock/current/index.json`

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
- The Bedrock pricing page provider list includes “OpenAI” and “Moonshot AI”, and its service-tier notes state: Priority pricing is a premium to Standard; Flex is a discount to Standard; Batch inference is discounted vs on-demand and is documented in linked AWS docs.

---
<!-- 
  REMINDER: The 2-Action Rule
  After every 2 view/browser/search operations, you MUST update this file.
  This prevents visual information from being lost when context resets.
-->
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
