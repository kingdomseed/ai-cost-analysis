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

## Cursor (usage exports via team APIs)

Cursor publishes official team APIs that can serve as an export surface for usage analytics (notably, **enterprise teams only** for Analytics API).

- Analytics API: `https://cursor.com/docs/account/teams/analytics-api`
- Admin API: `https://cursor.com/docs/account/teams/admin-api`

Status:
- Need to confirm what export surfaces exist for **individual** Cursor accounts (CSV download, billing exports, etc.), if any.

## Warp (credits)

Warp documents how credits are consumed, but we have not yet captured an official **export** mechanism for a per-interaction credit ledger.

- Credits explanation: `https://docs.warp.dev/support-and-community/plans-and-billing/credits`

Status:
- Find official guidance for exporting credit usage history (if available) and document it here.

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

## AWS Billing (Bedrock cost backfill when request logs are missing)

If detailed Bedrock request logs weren’t enabled at the time of usage, the next-best raw data is the **AWS Cost and Usage Report** (CUR/CUR 2.0 via Data Exports), which can be joined to Bedrock meters/SKUs.

- Creating reports (AWS Data Exports / CUR): `https://docs.aws.amazon.com/cur/latest/userguide/cur-create.html`
