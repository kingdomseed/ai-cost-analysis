# Raw Data Needed (Personal Analysis)

This repo’s personal rollups are only as good as the **raw exports** we can reliably re-import later. This file is a checklist of what we **already have** and what we still need to collect.

## What we already have in this repo (gitignored)

Raw / ledger-like exports already present under `data/private/`:

- Cursor: monthly usage CSVs in `data/private/raw/cursor/` (2025-07 → 2026-02)
- Devin: usage/session JSON exports in `data/private/raw/devin/`
- Azure (Foundry/OpenAI spend): CSV in `data/private/raw/azure/azure-foundry-gpt-spend-ai-model-spend.csv`
- Qoder: small real-world credit charge samples in `data/private/observations/qoder-credit-samples.2026-02-21.md`
- Personal working snapshot (not a raw export): `data/private/observations/jason-usage-notes.2026-02-21.md`

Derived artifacts (not source-of-truth, but useful):
- Token burn-rate spreadsheets/charts in `data/private/derived/token-burn-rate/`

## What raw data we still need (high value)

### 1) Pay-per-token APIs (best for “tokens ↔ cost” accuracy)

Goal: per-request usage logs (tokens in/out/cache) **and** billing exports/invoices.

- OpenAI API (direct)
- Anthropic API (direct)
- Google Gemini API / Vertex AI (direct)
- Moonshot (Kimi Open Platform API)
- OpenRouter (if used as the billing surface; include BYOK vs credits distinction)

### 2) Cloud marketplaces / reseller meters (Azure/AWS/GCP)

Goal: cost exports that can be joined to model meters.

- Azure Cost Management exports (per meter/SKU), plus any AI Foundry usage detail available
- AWS CUR (Cost & Usage Report) and/or Cost Explorer exports for Bedrock
- GCP Billing Export (BigQuery) for Vertex AI usage and cost

### 3) Credit / quota-based developer tools (needs “ledger” exports)

Goal: a credit ledger with timestamps + model/tier + credits used + $ charged (if any).

- Windsurf / Codeium (prompt credits + multipliers)
  - Warp (credits per turn; export mechanism unclear)
  - Verdent (credits + “detailed token consumption across sessions” claims in docs)
- Qoder (full usage/ledger beyond the small samples we have)
- Lovable (usage-based credits; top-ups + expiry)
- Bolt.new (token quotas; need usage export to compute burn-rate)

Personal context (to prioritize collection):
- Windsurf: Jason used Teams plan in Feb 2026 ($30 plan + $40 + $40 top-ups) totaling 2,500 credits and “50 code reviews” shown in-plan; we still need a usage ledger export.

### 5) “Credit pool” programs (usage is cost-only unless logs exist)

If we used cloud credits (e.g., AWS credits) without detailed request logging enabled, we need:
- billing exports (CUR / cost exports) to ground cost
- current on-demand token rates for the meters we used to estimate effective tokens (explicitly labeled as estimated)

Personal context (to prioritize collection):
- Anthropic console spend ~ $500 (Dec 2024 → Mar 2025), mostly via Cline; we should export Anthropic Usage/Cost logs for that window.

### 4) Subscriptions (“all you can eat” / quota-like)

Goal: invoice/receipt + plan tier + region/currency + any published quota indicators.

- ChatGPT subscriptions (Plus/Pro/etc.)
- Claude subscriptions (Pro/Max/etc.)
- Kimi memberships (Andante/Moderato/Allegretto) + Kimi Code quota indicators

## Minimum fields we want per “usage event”

If a tool/provider can export per-request/per-message usage, we want:
- Timestamp (UTC preferred)
- Tool + provider + model identifier
- Input tokens, output tokens (and cached tokens if present)
- Any “unit” consumed (credits, premium requests, ACUs, etc.)
- Effective cost charged for that event (if available) + currency
- Project/org/user (if relevant) — keep private; we can redact later

## Recommended export cadence

- Monthly: invoices/receipts + plan tier metadata (seat count if applicable)
- Weekly/monthly: usage ledgers (CSV/JSON) for tools that cap history
- Whenever changing plans: capture a “plan snapshot” (price + included quota + rollover/expiry rules)
