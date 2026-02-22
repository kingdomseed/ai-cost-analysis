# OpenAI: ChatGPT + Codex entitlements (2026-02-22)

## Targets

- ChatGPT Pro: included models, modalities, and “unlimited” language.
- Codex (bundled with ChatGPT plans): what’s included, how usage is metered (credits/rate limits), and what the official docs say.

## Sources to verify (official)

- ChatGPT pricing page: `https://chatgpt.com/pricing`
- Codex pricing page: `https://developers.openai.com/codex/pricing/`
- OpenAI Help Center: ChatGPT plan/rate card pages (if they define model availability or guardrails)

## Notes

- Avoid third-party summaries for quotas/limits unless corroborated by OpenAI docs.
- If a doc is gated (requires login), record it as `authenticated_ui_capture` and keep the capture under `data/private/observations/`.

## Findings (official, retrieved 2026-02-22)

### Codex (bundled with ChatGPT plans)

From `https://developers.openai.com/codex/pricing/`:
- Codex is available across **web, CLI, IDE extension, and iOS** (plan-dependent wording).
- Plan table provides **usage windows** and ranges:
  - Local messages and cloud tasks share a **5-hour window**.
  - Example ranges (as published on the Codex pricing page):
    - Plus: local messages 45–225 / 5h; cloud tasks 10–60 / 5h; code reviews 10–25 / week
    - Pro: local messages 300–1500 / 5h; cloud tasks 50–400 / 5h; code reviews 100–250 / week
    - Enterprise/Edu: “no fixed limits” and usage scales with credits
- Credits overview includes **average credit costs**:
  - Local tasks: ~5 credits/message for GPT-5.3-Codex and GPT-5.2-Codex; ~1 credit/message for GPT-5.1-Codex-Mini
  - Cloud tasks / code reviews: ~25 credits per task/review (mini not available)
- The page also links to a **Codex usage dashboard** and recommends reducing AGENTS.md size to conserve limits.

### ChatGPT Pro pricing page

- `https://chatgpt.com/pricing` could not be fetched directly from this environment (HTTP 403). For now, keep the existing `authenticated_ui_capture` source as evidence for Pro plan pricing and model naming, and prefer replacing it with a public OpenAI source if/when accessible.

