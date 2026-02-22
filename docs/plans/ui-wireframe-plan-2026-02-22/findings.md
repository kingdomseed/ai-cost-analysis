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
- Wireframe-like UI: minimal color, focus on function, no visual distraction
- Neo-brutalist style preference (bold lines, high contrast, blocky layout)
- Next.js app; use a complete, simple UI framework
- Use Font Awesome icons (pro license available)

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
- Official docs identified for Next.js install guides: shadcn/ui at https://ui.shadcn.com/docs/installation/next and Mantine at https://mantine.dev/guides/next/ (open attempts failed with UnexpectedStatusCode; will retry with fetch or alternate access).
- Official Next.js App Router docs exist for Chakra UI and MUI; HeroUI (formerly NextUI) has its own installation docs. Favor these over third-party blog posts.
- shadcn/ui Next.js setup uses an `init` command for new or existing projects, and components are added via CLI (e.g., add a Button, import from `@/components/ui/...`). Source: shadcn/ui install docs.
- Mantine provides Next.js templates (app/pages router, minimal/full) and requires `MantineProvider` + `ColorSchemeScript` in App Router (`app/layout.tsx`) per its Next.js guide.
- Context7 confirms Mantine App Router setup: `ColorSchemeScript` in `<head>` and `MantineProvider` in `app/layout.tsx`; optimizePackageImports can be used for tree-shaking.
- Chakra UI Next.js App Router guide specifies Node 20+, install `@chakra-ui/react` + `@emotion/react`, and wrap the app in a generated `Provider` in `app/layout.tsx`; it also recommends `optimizePackageImports` for bundle size.
- MUI’s Next.js App Router guide uses `AppRouterCacheProvider` in `app/layout.tsx` and recommends theming setup (e.g., `ThemeProvider`, font optimization).
- HeroUI (NextUI) install docs note HeroUI v2 deprecation; v3 recommended for new projects. It uses CLI init/add flows and is built on Tailwind CSS with `HeroUIProvider` at app root.
- Font Awesome React docs recommend the official `@fortawesome/react-fontawesome` component plus `@fortawesome/fontawesome-svg-core` and icon packages; Pro+ requires a Kit with package installation enabled.
- Tailwind CSS has an official Next.js installation guide; if we choose a utility-first stack, this is the canonical setup reference.
- Radix UI is an official primitives library with its own documentation; useful if we pick a headless + Tailwind approach.
- HeroUI search results primarily surface HeroUI Native v3 docs; treat as a caution signal for web UI until verified against official web docs.

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
|          |           |

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
| web.run open failed (UnexpectedStatusCode) for shadcn/ui + Mantine docs | Retry with fetch tool or alternate access; prefer official URLs |

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
- https://ui.shadcn.com/docs/installation/next (shadcn/ui Next.js install)
- https://mantine.dev/guides/next/ (Mantine Next.js guide)
- https://www.chakra-ui.com/docs/get-started/frameworks/next-app (Chakra UI Next.js App Router)
- https://mui.com/material-ui/integrations/nextjs/ (MUI Next.js integration)
- https://www.heroui.com/docs/guide/installation (HeroUI / NextUI install)
- https://ui.shadcn.com/docs/installation/next (shadcn/ui install steps)
- https://mantine.dev/guides/next/ (Mantine templates + provider setup)
- https://docs.fontawesome.com/web/use-with/react/ (Font Awesome React setup)
- https://tailwindcss.com/docs/installation/framework-guides/nextjs (Tailwind Next.js guide)
- https://www.radix-ui.com/ (Radix UI official site)

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
