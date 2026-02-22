# Findings: Model ratings ingestion (Azure leaderboard) — 2026-02-22

## Azure export inventory

Found CSV exports in `/Users/jholt/Downloads/azure_model_leaderboard/`:
- `azure_foundry_model_leaderboard.csv` plus numbered duplicates.

Columns observed:
- `Rank` (integer)
- `Model` (string; Azure’s model label, e.g. `gpt-5.2`, `claude-opus-4-6`, `Kimi-K2.5`)
- `Provider` (string; e.g. `OpenAI`, `Anthropic`, `Moonshot AI`, `Microsoft`)
- `Quality_Index` (decimal 0–1 as printed)
- `Safety_Attack_Success_Rate` (percentage string, e.g. `1.87%`)
- `Throughput_tokens_per_sec` (integer-ish)
- `Estimated_Cost_USD_per_1M_tokens` (currency string, e.g. `$4.81`)

## Mapping notes

Proposed mapping → `apps/public-calculator/data/models.YYYY-MM-DD.json`:
- Ratings entries:
  - `system`: `azure-foundry-model-leaderboard`
  - `metric`: one of:
    - `quality_index` (scale `0-1`)
    - `safety_attack_success_rate_percent` (scale `percent`; lower is better but we do not invert)
    - `throughput_tokens_per_sec` (scale `tokens/sec`)
    - `estimated_cost_usd_per_1m_tokens` (scale `USD/1M`)
  - `score`: numeric parsed value (strip `%` and `$`)
  - `as_of`: file mtime date (2026-02-22) unless the CSV includes an explicit “as of” field (it does not)
- Model identity:
  - Preserve the Azure label as `azure_model_label` for traceability.
  - Map Azure provider names to our canonical providers where unambiguous:
    - `OpenAI` → `openai`
    - `Anthropic` → `anthropic`
    - `Moonshot AI` → `moonshot`
    - `Google` (if present later) → `google`
    - others (xAI, DeepSeek, Meta, Mistral, Cohere, etc.) will still be included in the models dataset, but may not have pricing entries in our `pricing.*.json`.

## Open questions / risks

- Model naming mismatches between leaderboard entries and our pricing model IDs may require explicit aliases.
- Some leaderboards publish composite scores without clear scaling; we must preserve the scale and avoid comparing across incompatible scales.
- Azure’s “Estimated_Cost_USD_per_1M_tokens” is an Azure-provided estimate and may not equal official provider API list prices; treat as a separate metric, not the pricing ground truth.
