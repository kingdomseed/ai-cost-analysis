# Agent Notes: Azure AI Foundry model leaderboards (2026-02-22)

## What we have locally

- Local export folder: `/Users/jholt/Downloads/azure_model_leaderboard/`
- CSV columns observed:
  - `Rank`, `Model`, `Provider`
  - `Quality_Index` (0–1)
  - `Safety_Attack_Success_Rate` (percent string)
  - `Throughput_tokens_per_sec`
  - `Estimated_Cost_USD_per_1M_tokens` (currency string)

## Public sources (official)

- Azure AI Foundry (model leaderboards entry point): `https://ai.azure.com/`
- Microsoft Learn: “Model benchmarks in Azure AI Foundry” (defines leaderboards + what “quality/safety/cost/throughput” mean): `https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/model-benchmarks`
  - Notes from page text: quality index is a composite indicator across reasoning/coding/math/knowledge tasks; leaderboards can be viewed by single metric (quality/safety/cost/throughput).

## How this maps into our dataset

- Ingestion script: `apps/public-calculator/site/scripts/ingest-azure-model-leaderboard.mjs`
- Output: `apps/public-calculator/data/models.2026-02-22.json`
- Ratings are stored as `ratings[]` with:
  - `system = "azure-foundry-model-leaderboard"`
  - metrics: `quality_index`, `safety_attack_success_rate_percent`, `throughput_tokens_per_sec`, `estimated_cost_usd_per_1m_tokens`

## Caveats (must keep explicit)

- Azure’s “Estimated_Cost_USD_per_1M_tokens” is **not** guaranteed to equal official provider API list prices; treat it as a benchmark/estimate metric only.
- The CSV has no explicit “as of” field; we currently use the file mtime date (2026-02-22) as `as_of`.

