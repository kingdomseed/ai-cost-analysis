# Subscription Entitlements (What You Get, Where You Get It)

Token cost is necessary but not sufficient for deciding what plan/tool is “best” for a given user. For each subscription we model (ChatGPT, Claude, Google One AI, Kimi membership, etc.), we also track **entitlements**:

- **What is included** (tools/features)
- **Where it is available** (surfaces)
- **What the constraints are** (quotas/limits/guardrails)

This file defines the structure we will use. We will keep it **sourced and date-stamped** in the pricing sweep folders before integrating into the dataset.

## Entitlement categories

1) **Apps/Chat surfaces**
- Web app, desktop app, mobile app
- Model picker availability by plan

2) **Developer surfaces**
- CLI (e.g., Gemini CLI, Codex CLI)
- IDE extensions (VS Code/JetBrains)
- GitHub integrations (PR review bots, repo agents)

3) **Media/other**
- Image/video generation tools
- “Research” tools, browsing/search tools

4) **Admin/Security**
- SSO, SCIM, audit logs, data retention, data training opt-out defaults

## Data fields (per entitlement)

For each entitlement item we capture:
- `provider`, `plan_id`
- `feature_name`
- `surface` (web, desktop, mobile, cli, ide, github, api, etc.)
- `included` (boolean) and `notes`
- `limits` (if published) and reset windows
- `source_url` + `retrieved_at`

## Next step

Add a dated capture per provider inside `docs/public-calculator/research/YYYY-MM-DD-pricing-sweep/` before encoding entitlements into `apps/public-calculator/data/*.json`.

