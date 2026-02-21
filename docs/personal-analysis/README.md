# Personal Analysis Spec

## What we want to measure

### Yearly
- Total tokens (all sources where tokens are available)
- Total cost (actual billed or paid)
- Models used (distinct list + counts)

### Monthly (by model)
- Tokens by model
- Cost by model
- Monthly total cost

### By provider/platform
- Tokens by provider (when tokens exist)
- Cost by provider
- “Modal” totals (e.g., Raw API vs IDE subscriptions) as a separate, clearly labeled view

### Derived KPIs
- Total cost per token
- Cost per 1M tokens

## Cost-per-token reporting (we’ll support all three)

When data allows:
1) **Blended:** `total_cost / total_tokens`
2) **Split:** input and output costs/tokens separately
3) **Normalized estimate:** when input/output split is missing, optionally estimate using a fixed ratio (default: **3:1 input:output**) and label it as **estimated**

## Normalization rule (when a source is missing data)

Many tools do not expose full token breakdowns. When we need an estimate:
- Prefer explicit input/output token counts if available.
- If only “total tokens” exist, optionally estimate input/output using a fixed ratio (default proposal: **3:1 input:output**).
- Keep “estimated” metrics clearly labeled as such and separate from “actual billed cost”.

## Data sources (current)

Local exports are organized under `data/private/raw/`.
Derived charts/sheets are under `data/private/derived/`.

## Source-of-truth principle

For this repo:
- Raw exports are source-of-truth for token counts and event records.
- Costs are source-of-truth only when they come directly from invoices/billing exports.
- Any narrative report is treated as a draft unless it links to, and can be reproduced from, the raw exports.
