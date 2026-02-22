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
- Review uncommitted UI/API changes for correctness and API-first compliance.
- Remove client-side guessing (plan limits, unlimited heuristics) and rely on API outputs.
- Fix build-breaking imports (Radix) and contract drift in catalog API.

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
- Uncommitted UI changes introduce hard-coded plan limits and “unlimited” logic in `src/app/page.tsx`, violating no-guessing policy.
- UI components import from `radix-ui` instead of `@radix-ui/react-*`, which will break at build/runtime.
- Catalog API response shape and region list were modified without contract update.
- `page.tsx` also fetches pricing data directly (`/api/datasets/pricing`) to build model rates, bypassing core engine outputs.
- `catalog` now returns `models` + `models_catalog` + `options`, and hard-codes regions `["us","eu","cn"]`.
- UI kit files import from `radix-ui` (e.g., `src/components/ui/button.tsx`), which should be `@radix-ui/react-*` packages; current imports will fail.
- Core engine adds explicit estimate metadata (method/confidence/evidence) and flags heuristic assumptions (seat_count, input/output ratio), which aligns with “no silent guessing” if surfaced by API.
- `package.json` includes `radix-ui` (monorepo meta package). Shadcn UI components expect `@radix-ui/react-*` deps; need to replace to build.
- `src/types/api.ts` expects `options` and `models_catalog` in catalog response; `api-contract.md` doesn’t mention these fields explicitly, so contract docs may need update if kept.
- Plan-matrix contract examples include `token_meter_default`, but UI does not pass it.
- Entitlements `provider_id` values are limited to `anthropic`, `cursor`, `github`, `google`, `openai`, `windsurf`; mapping from `plan.tool` via `toLowerCase().replace(/\s+/g, "-")` will miss providers whose tool name doesn’t match these IDs.
- Tool plan names include `Amazon Q Developer`, `GitHub Copilot`, `JetBrains AI`, `OpenAI Codex`, etc., which won’t map to provider IDs without a canonical mapping table.
- Plan matrix response already includes capability/ratings summaries per plan; UI can render these directly instead of calculating local “effective cost” heuristics.
- `page.tsx` includes extensive client-side heuristics (`PLAN_LIMITS`, `calculateEffectiveCost`, `isUnlimitedPlan`, `isApiMeterPlan`) that override API outputs and guess limits/costs.
- Plan-matrix backend computes effective costs only when `workload` + `token_meter_default` are provided (for API pool plans) and includes `fits_budget` flags; UI can rely on these directly.
- Shadcn UI components are standard and can be kept; imports just need to point to the correct Radix packages (Root/Indicator APIs align).
- No existing tool→provider_id mapping in codebase; catalog route currently guesses via slugify which won’t match entitlements for most tools.
- `button.tsx`/`badge.tsx` use `Slot.Root`; with `@radix-ui/react-slot` the component is `Slot` (no `.Root`), so usage needs adjustment.
- Pricing schema includes `api_rates[].regional_rates[].regions`, so catalog regions can be derived instead of hard-coded.
- Current regional rate data includes AWS-style region codes (e.g., `us-east-1`, `ap-south-1`), not simple `us/eu/cn` tiers.
- No additional UI issues found beyond Radix import adjustments.
- `page.tsx` still references removed plan-limit heuristics and API-rate-based model cost estimates; these will be removed in implementation.
- State and effects in `page.tsx` can be simplified to rely solely on catalog + plan-matrix responses.
- `page.tsx` now only retains total token display; heuristics and direct pricing fetch will be removed.
- Package deps updated to `@radix-ui/react-*` packages; `radix-ui` removed.
- All UI component imports now reference `@radix-ui/react-*`.
- Engine update adds simplified region matching (e.g., `us` → `us-east-1`) and warns when no match; catalog regions should align with this to avoid confusion.
- `biome.json` and `layout.tsx` changes are minimal and consistent (no action needed).
- Line-number references captured for reporting.
- API contract line references captured for catalog additions.
- Tool→provider entitlement mapping now falls back to plan_id-based provider inference when unambiguous.
- Catalog regions now normalized to simplified tiers (us/eu/...) with a `global` fallback; UI treats region as pricing tier and exposes output currency selector.

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
| Keep shadcn UI scaffolding, but remove client-side heuristics | UI can remain while API-first logic is enforced in server responses |
| Use `token_meters` from catalog for model selector | Avoid direct dataset fetch and ensure API-first data flow |
| Replace `radix-ui` with `@radix-ui/react-*` deps | Align with Radix usage expected by shadcn components |

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
| UI guesses limits/costs client-side | Remove client heuristics; render API outputs only |
| Radix imports incorrect | Replace with `@radix-ui/react-*` packages or remove UI kit |
| Catalog contract drift | Revert response shape or update docs contract |

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
- `docs/public-calculator/api-contract.md`
- `apps/public-calculator/site/src/app/api/catalog/route.ts`
- `apps/public-calculator/site/src/app/page.tsx`

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
