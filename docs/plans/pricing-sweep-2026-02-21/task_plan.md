# Task Plan: Pricing sweep (2026-02-21)

## Goal
Capture up-to-date (Feb 2026) pricing and plan mechanics for major providers and developer tools (API token meters, credits/pools, and subscriptions), using official sources and producing a versioned dataset for the public calculator.

## Current Phase
Phase 3 (extension + dataset integration) — in progress

## Phases

### Phase 1: Source collection
- [x] Identify official pricing pages
- [x] Capture sources per agent into `docs/public-calculator/research/2026-02-21-pricing-sweep/`
- **Status:** complete

### Phase 2: Normalize into dataset
- [x] Create a versioned pricing snapshot JSON
- [x] Record sources and known gaps
- **Status:** complete

### Phase 3: Extend sweep + integrate additions

- [x] Capture Devin pricing (ACU-based)
- [x] Capture Google consumer AI subscriptions (Google AI Plus/Pro/Ultra on Gemini subscriptions page)
- [x] Capture Cline pricing (open source + team seats + credit provider concept)
- [x] Capture Kimi Code product distinction (separate from Moonshot API token meter)
- [x] Integrate AWS Bedrock Claude 4.6 numeric rates (Price List API) into dataset
- [x] Integrate OpenCode Zen + Verdent + Qoder + Cline + Devin + Google AI plans into dataset
- [x] Add promo blocks and seat-based fields where applicable
- [x] Re-run dataset validation (JSON parse + required fields present)

### Phase 4: Next tools to research (official sources first)

- [x] GitHub Copilot (Premium Requests + overages)
- [x] JetBrains AI (AI in IDEs + Junie; quota model)
- [x] Amazon Q Developer
- [x] Replit (AI/Agent plans + usage-based billing)
- [x] Bolt / Lovable (separate category: app builders)
- [x] Tabnine (seat subscription + optional provider passthrough)
- [x] Sourcegraph (Enterprise Search pricing signal; Cody Free/Pro discontinued)

## Deliverables
- Research notes: `docs/public-calculator/research/2026-02-21-pricing-sweep/README.md`
- Sources ledger: `docs/public-calculator/research/2026-02-21-pricing-sweep/sources.md`
- Gaps: `docs/public-calculator/research/2026-02-21-pricing-sweep/gaps.md`
- Dataset: `apps/public-calculator/data/pricing.2026-02-21.json`

## Next steps (new)

### Phase 5: Subscription entitlements inventory (value beyond token cost)

- [x] Add an initial entitlements capture for Google developer tooling surfaces (Gemini Code Assist/CLI/Antigravity + Jules).
- [x] Add an initial entitlements capture for Claude subscriptions (Artifacts/Projects/Claude Code).
- [x] Add an initial entitlements capture for GitHub Copilot (code review + coding agent surfaces).
- [x] Add an initial entitlements capture for Cursor (Composer/Bugbot/Background Agent surfaces).
- [x] Add an initial entitlements capture for Windsurf (DeepWiki/Teams/PR Reviews surfaces).
- [ ] For each subscription provider (OpenAI/ChatGPT, Anthropic/Claude, Google One AI, Moonshot/Kimi), capture “what’s included” and “where it’s accessible” as of Feb 2026.
- [ ] Store per-provider notes in `docs/public-calculator/research/2026-02-21-pricing-sweep/` and then integrate into dataset as structured entitlements.
- [ ] Keep entitlements sourced + date-stamped; treat as time-sensitive just like pricing.
