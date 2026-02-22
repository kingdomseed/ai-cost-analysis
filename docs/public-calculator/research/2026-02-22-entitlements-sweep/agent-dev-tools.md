# Developer tools entitlements sweep (2026-02-22)

Targets (non-exhaustive, from this repo’s pricing snapshot):
- Cursor, Windsurf, GitHub Copilot, JetBrains AI, Amazon Q Developer
- OpenCode, OpenRouter, Replit, Warp, Verdent, Qoder
- Devin, Tabnine
- Sourcegraph (keep as “mention” unless it provides agentic/LLM services similar to Devin)

For each tool, capture:
- plan tiers + “billing primitive” (credits/pool/premium requests/seat)
- what surfaces are included (IDE extension, CLI, web app, GitHub PR reviews, etc.)
- any explicit model/provider coverage (only if documented)

## Quick findings (official, retrieved 2026-02-22)

### GitHub Copilot

- GitHub’s Copilot plans page documents a “monthly premium requests” allowance by plan (Pro/Pro+/Business/Enterprise) and indicates Copilot can be used across IDEs and GitHub. Treat this page as the primary entitlement source for plan existence and “premium request” metering primitive. (`https://github.com/features/copilot/plans`)
- GitHub’s billing docs include explicit overage pricing for premium requests: **$0.04 per premium request** once the plan’s included allotment is exceeded. (`https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-copilot/about-billing-for-github-copilot`)

Additional details from the plans page (useful for entitlements, not pricing):
- Copilot Free: 50 premium requests/month; agent mode limited (plans page shows 50/month).
- Copilot Pro: 300 premium requests/month; includes code review and “coding agent” assignment features; shows “Unlimited” for some experiences (agent mode, model interactions), but still uses premium requests for many features (treat as: “included but metered”).
- Copilot Pro+: 1500 premium requests/month; includes delegating tasks to third-party coding agents (Claude by Anthropic and OpenAI Codex) per plans page wording.

