# Data Model (Public Calculator)

This repo models two independent axes:

1) **Cost** (pricing meters and plan mechanics)
2) **Entitlements** (what you get, where you get it)

They are linked via canonical IDs and **region + evidence**.

## Canonical IDs

IDs are stable strings used in datasets and code.

### `provider_id`

Lowercase slug: `openai`, `anthropic`, `google`, `aws`, `azure`, `moonshot`, `github`, `cursor`, `windsurf`, etc.

### `model_id`

Prefer the provider’s model ID when token-metered (e.g., `claude-sonnet-4.6`, `kimi-k2.5`).  
For opaque tools, use the tool’s surface model label (e.g., `kimi-for-coding`).

### `plan_id`

Stable plan slug scoped by provider/tool, e.g.:
- `claude-pro`, `claude-max-20x`
- `chatgpt-plus`, `chatgpt-pro`
- `windsurf-teams`, `cursor-ultra`
- `kimi-allegretto`

### `surface_id`

Where a feature is accessed:
- `web_app`, `desktop_app`, `mobile_app`
- `cli`, `ide_extension`
- `github_integration`
- `admin_console`, `billing_portal`
- `api`

### `feature_id`

The capability:
- `projects`, `artifacts`
- `pr_reviews`, `code_review`
- `coding_agent`, `background_agent`
- `gemini_cli`, `gemini_code_assist`, `claude_code`, `codex`

## Regions

We record region explicitly:
- Primary target: `us` (or `global_oversea`)
- Known variants: `cn`, `eu`, etc.

Rule: do not average or “pick one”; store region variants side-by-side.

## Evidence model

Every claim can be supported by:
- `public_url` (preferred)
- `authenticated_ui_capture` (acceptable when public docs conflict and region matters)
- `blocked_needs_refetch` (known official page but blocked in this environment)

Evidence is attached to each pricing/entitlement item and should be reflected in UI labels.

