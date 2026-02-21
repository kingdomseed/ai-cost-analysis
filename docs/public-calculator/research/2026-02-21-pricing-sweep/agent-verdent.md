# Verdent AI — pricing & billing mechanics (snapshot)

**retrieved_at:** 2026-02-21  \n**last_verified_at:** 2026-02-21

## Sources (official)

- `https://docs.verdent.ai/verdent/pricing/overview`
- `https://docs.verdent.ai/verdent/resource-management/monitoring`
- `https://docs.verdent.ai/verdent-for-vscode/reference/resources`
- `https://docs.verdent.ai/verdent-for-vscode/resource-management/monitoring`
- `https://docs.verdent.ai/verdent-for-vscode/configuration/tuning`
- `https://docs.verdent.ai/verdent-for-vscode/help-support/faqs`
- `https://www.verdent.ai/credits-detail`

## Subscription pricing (credits/month)

Verdent’s docs describe a limited-time **2× credit bonus** on subscription credits and state they’ll give **15+ days notice** before it ends.

| Plan | Price | Credits / month (base) | Credits / month (with 2× bonus) |
|---|---:|---:|---:|
| Free Trial | $0 | 100 | (not specified as doubled) |
| Starter | $19/mo | 320 | 640 (if bonus active) |
| Pro | $59/mo | 1,000 | 2,000 (if bonus active) |
| Max | $179/mo | 3,000 | 6,000 (if bonus active) |

## Top-ups (credits)

| Top-up price | Credits |
|---:|---:|
| $20 | 240 |
| $60 | 720 |
| $80 | 960 |
| $100 | 1,200 |
| $200 | 2,400 |

## Billing mechanics (what credits mean, carryover, pauses)

- Credits are Verdent’s usage currency; tasks consume credits based on “model type and workload.”
- Credits are shared across Verdent desktop app and VS Code (single pool).
- Subscription credits refresh monthly per billing cycle.
- Top-up credits:
  - take effect immediately
  - **never expire**
  - can be purchased repeatedly (stacking/accumulate)
- When credits are exhausted, access/processing pauses until top-up or refresh.

## Per-model multipliers / efficiency (what’s explicitly stated)

Verdent’s docs include partial “efficiency” statements (not a full multiplier table):
- Claude Sonnet 4.5: “1× baseline”
- Claude Haiku 4.5: “3.2× more efficient than Sonnet”
- GPT‑5 / GPT‑5‑Codex (beta): “1.3× more efficient than Sonnet”
- Claude Sonnet 4.5 “1m” (extended context): “0.5× efficiency, 2× cost when input exceeds 200k tokens”

Verdent also describes preset-level multipliers (credit usage):
- Performance preset: “1–2× credit usage”
- Balance preset: “1× credit usage”
- Efficiency preset: “~0.3× credit usage”

## What we still cannot verify (from accessible official text)

- Exact token→credit conversion formula (credits per token) and whether it varies per provider/model beyond relative “efficiency” statements.
- A complete per-model multiplier table for all available models.
- Whether the 2× bonus applies beyond subscription credits (e.g., top-ups).

