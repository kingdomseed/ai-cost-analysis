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
- `feature_id` (stable) and `surface_id` (stable)
- `included` (boolean) and `notes`
- `limits` (if published) and reset windows
- `source_url` + `retrieved_at`

### Stable ID conventions (required)

To support “what LLMs do I get?” and “which modalities do I have?”, we encode these as entitlements too:

- Provider coverage: `feature_id = provider_access:<provider>` (e.g., `provider_access:openai`)
- Model coverage: `feature_id = model_access:<provider>:<model>` (e.g., `model_access:openai:gpt-5.2`)
- Modality coverage: `feature_id = modality_access:<modality>` (e.g., `modality_access:video`)

`surface_id` examples:
- `web_app`, `desktop_app`, `mobile_app`, `cli`, `ide`, `github`, `api`

If we cannot source a specific model/modality list, we omit it (unknown), rather than guessing.

## Next step

Add a dated capture per provider inside `docs/public-calculator/research/YYYY-MM-DD-pricing-sweep/` before encoding entitlements into `apps/public-calculator/data/*.json`.

## Where entitlements live (public dataset)

We maintain entitlements as a separate, versioned dataset:

- `apps/public-calculator/data/entitlements.YYYY-MM-DD.json`

This allows the calculator engine to answer:
- “What does plan X include?” (surfaces/features)
- independently of: “What does plan X cost?” (pricing primitives)
