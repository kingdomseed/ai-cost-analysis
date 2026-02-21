# Agent Notes: Azure OpenAI / Azure AI Foundry (Pricing Sweep)

**Agent focus:** Azure token pricing for GPT‑5.2 and GPT‑5.2‑Codex (Global/Data Zone/Batch)  \n**retrieved_at:** 2026-02-21  \n**last_verified_at:** 2026-02-21

## Summary

Azure’s public pricing page lists GPT‑5.2 but renders token prices as `$-` in the static HTML, so it is **not usable as a numeric source**. The **Azure Retail Prices API** provides the numeric meters and is treated as the **source of truth** for prices.

Key findings (USD per 1M tokens):
- **GPT‑5.2 Global Standard:** input **$1.75**, cached input **$0.175**, output **$14.00**
- **Data Zone Standard is +10%** vs Global for GPT‑5.2 / GPT‑5.2‑Codex.
- **Batch is −50%** vs the corresponding Standard meters (found for GPT‑5.2 base).

## Primary sources (official)

- Azure OpenAI pricing page (catalog reference; numeric fields show `$-`): `https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`
- Azure Retail Prices API overview: `https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices`
- Retail Prices API endpoint (used directly in queries below): `https://prices.azure.com/api/retail/prices`

## Extracted prices (USD / 1M tokens)

**Source of truth:** Azure Retail Prices API (sampled with `armRegionName='eastus'`).

### GPT‑5.2 (base)

| Deployment type | Mode | Input | Cached input | Output |
| --- | --- | ---:| ---:| ---:|
| Global | Standard | 1.75 | 0.175 | 14.00 |
| Data Zone | Standard | 1.925 | 0.1925 | 15.40 |
| Global | Batch | 0.875 | 0.0875 | 7.00 |
| Data Zone | Batch | 0.9625 | 0.09625 | 7.70 |

Notes:
- Data Zone is **+10%** vs Global.
- Batch is **−50%** vs Standard.
- Retail Prices API also contains GPT‑5.2‑chat meters; sampled values match base GPT‑5.2 meters.

### GPT‑5.2 Codex

| Deployment type | Mode | Input | Cached input | Output |
| --- | --- | ---:| ---:| ---:|
| Global | Standard | 1.75 | 0.175 | 14.00 |
| Data Zone | Standard | 1.925 | 0.1925 | 15.40 |

Notes:
- No GPT‑5.2‑Codex Batch meters found in the Retail Prices API as of 2026-02-21.

### “Regional” deployment type

Azure documents a “Regional deployment” category, but **no Regional GPT‑5.2 / GPT‑5.2‑Codex meters** were found in Retail Prices API queries during this sweep.

## Corroboration (local data in this repo)

Your Azure usage export includes meter names like `GPT 5.2 cd inp Gl 1M Tokens`, which match the Retail Prices API meter naming scheme used here:
- `data/private/raw/azure/azure-foundry-gpt-spend-ai-model-spend.csv`

That file’s **quantities** are usage; the Retail Prices API provides the **unit price**.

## Repro: Retail Prices API queries used

```text
# GPT-5.2 (Global / Standard)
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20inp%20Gl%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20cd%20inp%20Gl%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20opt%20Gl%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27

# GPT-5.2 (Data Zone / Standard)
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20inp%20Dz%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20cd%20inp%20Dz%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20opt%20Dz%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27

# GPT-5.2 (Global / Batch)
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20Batch%20inp%20Gl%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20Batch%20cd%20inp%20Gl%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20Batch%20opt%20Gl%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27

# GPT-5.2 (Data Zone / Batch)
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20Batch%20inp%20Dz%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20Batch%20cd%20inp%20Dz%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%27GPT%205.2%20Batch%20opt%20Dz%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27

# GPT-5.2 Codex (Global / Standard)
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%275.2%20codex%20inp%20Gl%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%275.2%20codex%20cd%20inp%20Gl%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%275.2%20codex%20opt%20Gl%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27

# GPT-5.2 Codex (Data Zone / Standard)
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%275.2%20codex%20inp%20Dz%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%275.2%20codex%20cd%20inp%20Dz%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
https://prices.azure.com/api/retail/prices?$top=1&$filter=meterName%20eq%20%275.2%20codex%20opt%20Dz%201M%20Tokens%27%20and%20armRegionName%20eq%20%27eastus%27
```

## Dataset guidance (what to store)

For Azure entries, store token prices as lines keyed by:
- provider/service: `azure/azure-openai`
- model: `gpt-5.2`, `gpt-5.2-codex`
- deployment type: `global`, `data_zone` (and `regional` only when verifiable)
- mode: `standard`, `batch` (when verifiable)
- token type: `input`, `output`, `cached_input`

Also store Azure traceability fields:
- `azure_product_name`, `azure_sku_name`, `azure_meter_name`, `effectiveStartDate`, and the API query URL used.

