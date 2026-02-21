# Cursor — Admin/Analytics export surfaces (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Why this matters for this repo

For personal analysis we need a repeatable way to export usage. For the public calculator we also want to be clear about what “included usage” means vs API-key usage vs usage-based overages.

## Official export/API surfaces (team/enterprise)

Cursor publishes team documentation for:

- **Admin API** (team administration surfaces)
- **Analytics API** (usage + productivity metrics)

The Analytics API docs describe:
- availability constraints (only for enterprise teams)
- authentication via API key (Basic Auth)
- endpoints that return daily usage aggregates and include fields like:
  - counts of different request types (e.g., subscription-included vs API key vs usage-based)
  - model usage summaries (e.g., “mostUsedModel”)
  - agent/chat/composer request counts

## Open questions / gaps

- For **individual** Cursor accounts (non-enterprise), we still need to confirm if there is an official self-serve **CSV export** for usage/spend.
- We also need a documented way to export “included API pool usage” vs overages at the account level (if Cursor exposes it in the UI or via API).

## Sources (official)

- Analytics API: `https://cursor.com/docs/account/teams/analytics-api`
- Admin API: `https://cursor.com/docs/account/teams/admin-api`

