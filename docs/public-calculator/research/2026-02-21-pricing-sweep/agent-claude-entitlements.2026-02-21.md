# Claude subscriptions — entitlements (what’s included, where) (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Scope

This note captures **non-token entitlements** of Claude subscriptions (Free/Pro/Max/Team/Enterprise), focusing on **feature availability** and **surfaces**. API billing remains separate (token-metered).

## Surfaces (where you can use it)

- Claude web app: `https://claude.ai`
- Claude subscription landing/pricing: `https://claude.com/pricing`
- Claude Code (CLI) is documented as usable with **Pro/Max**, and can be enabled for Enterprise teams.

## Key feature entitlements (official statements)

- **Artifacts:** Claude Help Center states Artifacts are available on **all Claude.ai plans**.
- **Projects:** Help Center states Projects are available on **Claude Pro** and **Claude for Work** (Team & Enterprise).
- **Project sharing:** Help Center states Project sharing is a **Claude for Work** feature (Team & Enterprise).
- **Claude Code (CLI):** Help Center documents usage with **Pro or Max**, and separate docs describe enabling it for Enterprise teams.

## Limits / quotas (how to model)

Claude plans are generally described in terms of **usage budgets** (e.g., 5-hour session windows; weekly rolling usage), not a fixed token allowance. Treat as **opaque quotas** unless a specific, published numeric table is available for a given feature.

## Sources (official)

- Claude pricing: `https://claude.com/pricing`
- Projects overview: `https://support.claude.com/en/articles/9945648-intro-to-projects`
- Project visibility/sharing: `https://support.claude.com/en/articles/9519189-project-visibility-and-sharing`
- “Claude for Product Management” (feature availability bullets): `https://support.claude.com/en/articles/9999062-claude-for-product-management`
- Max plan: `https://support.claude.com/en/articles/11049741-what-is-the-max-plan`
- Team plan: `https://support.claude.com/en/articles/9266767-what-is-the-team-plan`
- Claude Code with Pro/Max: `https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan`
- Enable Claude Code for Enterprise: `https://claude.com/resources/tutorials/how-to-enable-claude-code-for-your-enterprise-team`

