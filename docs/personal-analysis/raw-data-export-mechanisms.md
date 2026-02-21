# Raw Data Export Mechanisms (Links + Notes)

This file lists **known official export paths** for usage/cost data so we can automate ingestion later.

## OpenAI (API usage + cost)

Official cookbook describes pulling historical usage/cost via admin APIs (requires an **Admin Key**):
- `https://developers.openai.com/cookbook/examples/completions_usage_api/`

Practical takeaway:
- Prefer API-driven exports for reproducibility (daily buckets → pandas → CSV).
- We still want invoices/receipts separately for finance reconciliation when possible.

## Anthropic (API usage + cost)

Anthropic publishes an official **Usage & Cost Admin API** (requires an Admin API key; not available for individual accounts):
- `https://docs.anthropic.com/en/api/usage-cost-api`
- Mirror path often referenced from console docs: `https://platform.claude.com/docs/en/build-with-claude/usage-cost-api`

## OpenRouter (token usage + spend export)

OpenRouter documents exporting aggregated usage reports:
- Activity Export: `https://openrouter.ai/docs/guides/guides/activity-export`

Notes:
- OpenRouter also reports prompt/completion token counts and costs in API responses (“Usage Accounting”); useful when we have raw request logs.

## Windsurf / Codeium (prompt credits + org analytics)

Windsurf docs describe usage tracking and (for orgs) an analytics API:
- Plans and credit usage: `https://docs.windsurf.com/windsurf/accounts/usage`
- Example org analytics endpoint: `https://docs.windsurf.com/windsurf/accounts/api-reference/user-page-analytics`

## Verdent (credits + dashboard usage detail)

Verdent docs claim dashboard-level monitoring including “detailed token consumption across sessions”:
- `https://docs.verdent.ai/verdent/resource-management/monitoring`

Status:
- We still need to find whether Verdent supports **exporting** that detail (CSV/JSON) or only viewing it in the UI.

## Lovable (credits + top-ups)

Lovable documents plan tiers, credit behavior, and top-ups:
- `https://docs.lovable.dev/introduction/plans-and-credits`

Status:
- This doc explains credit behavior clearly, but does not (yet) document an export API/CSV report.

## Bolt.new (token quotas)

Bolt publishes plan quotas on pricing page:
- `https://bolt.new/pricing`

Status:
- Need an official export path (usage dashboard export or API) to compute real burn-rate.

