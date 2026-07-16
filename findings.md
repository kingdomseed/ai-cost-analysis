# Findings & Decisions

## Requirements
- Explain the user's actual usage patterns from the repo's existing personal-analysis area.
- Quantify monthly token burn.
- Identify the top models used.
- Estimate what that workload would cost on Cursor on average.
- Prefer existing repo data and scripts over rebuilding the pipeline from scratch.

## Research Findings
- The repo has a dedicated private-analysis area under `apps/personal-analysis/`.
- The repo also contains private data directories under `data/private/`.
- Existing scripts include dashboard/report generation and Bedrock integration helpers, which suggests the repo already has standardized rollups for tokens and costs.
- `data/private/derived/personal-analysis/README.md` describes the complete spending report methodology and says the dashboard spans Nov 2024 through Feb 2026.
- The methodology ranks data trust in three tiers:
  - Tier 1: pipeline-ingested `records.csv`
  - Tier 2: supplementary Bedrock CloudWatch exports in `data/private/bedrock-usage/processed/`
  - Tier 3: manual observations for costs that are not machine-parseable
- The methodology explicitly states that `spending_report.html` is more complete than `records.csv` alone because it merges supplementary Bedrock and manual observation data.
- `overall_summary.json` from the pipeline contains aggregate metrics such as:
  - `total_tokens` measured: 8,654,655,518
  - `total_tokens` estimated: 179,038,051
  - `estimated_api_cost_usd`: 11,038.60
  - `cost_usd`: 651.39
- The pipeline-derived CSVs have these shapes:
  - `monthly_by_model.csv`: `month,provider,source,model,metric,unit,estimated,value`
  - `monthly_by_provider.csv`: `month,provider,metric,unit,estimated,value`
  - `yearly_summary.csv`: `year,metric,unit,estimated,value`
- `records.csv` is long-form and contains 20,050 rows, so it is the detailed source behind the monthly/yearly rollups.
- `records.csv` already includes `aws-bedrock-daily-tokens` rows for Oct 2025 through Feb 2026, plus a small `aws-bedrock` Kimi K2.5 entry.
- The Bedrock methodology text in `data/private/derived/personal-analysis/README.md` is stale relative to the current ingest state:
  - It says `records.csv` only has a sparse Kimi test row and that daily-token Bedrock data has not yet been folded in.
  - In the current derived data, those daily-token Bedrock rows are already present in `records.csv`.
- Verification: summing `records.csv` monthly `total_tokens` matches `data/private/bedrock-usage/processed/dashboard_aggregates.json` exactly for every month from 2024-11 through 2026-02.
- For token analysis, the canonical current total is therefore the already-ingested derived data:
  - `records.csv` for detailed rollups
  - `dashboard_aggregates.json` for a matching pre-aggregated cross-check
- For Cursor-equivalent cost analysis, use:
  - pipeline `estimated_api_cost_usd` for Anthropic, Azure, and Cursor
  - AWS gross Bedrock usage charges from the local cost export / report constants for Dec 2025, Jan 2026, and Feb 2026
- Follow-up plan verification on 2026-03-09:
  - Cursor official docs currently describe individual plans as:
    - Pro: `$20/mo` with `$20` of API agent usage
    - Pro Plus: `$60/mo` with `$70` of API agent usage
    - Ultra: `$200/mo` with `$400` of API agent usage
  - Cursor also says Max Mode uses the model's API rate plus a 20% upcharge.
  - Anthropic pricing currently shows:
    - Pro: `$20/mo` billed monthly and includes Claude Code
    - Max: choose 5x or 20x more usage than Pro; the pricing page surfaces Max 20x as a separate individual tier and notes that usage limits apply
  - OpenAI currently shows:
    - ChatGPT Pro: `$200/month`
    - Codex is included with ChatGPT Plus / Pro / Business / Enterprise / Edu plans
    - API usage is billed separately from ChatGPT Pro
    - After included plan limits, OpenAI now offers optional credits that can extend Codex usage

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Start from existing derived outputs and dashboards | They likely already consolidate multiple raw sources and avoid double-counting pitfalls |
| Treat Cursor pricing as time-sensitive and verify against repo research or current docs before using it | The repo and higher-level instructions explicitly require freshness and provenance for pricing |
| Use current derived data as canonical when it conflicts with older methodology text | The derived data is the verified current output; the methodology note was not updated after Bedrock daily-token ingestion |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| The initial repository-wide text search returned too much output to use directly | Narrow follow-up inspection to `apps/personal-analysis/`, `data/private/`, and pricing research files |
| The report methodology described a Bedrock merge strategy that would now double-count daily-token rows | Verified `records.csv` against `dashboard_aggregates.json` and used the current ingested data as source of truth |

## Resources
- `apps/personal-analysis/`
- `data/private/`
- `docs/public-calculator/research/2026-02-21-pricing-sweep/`
- `docs/plans/personal-analysis-scripts-2026-02-22/`
- `data/private/derived/personal-analysis/README.md`
- `data/private/derived/personal-analysis/overall_summary.json`
- `data/private/derived/personal-analysis/monthly_by_model.csv`
- `data/private/derived/personal-analysis/monthly_by_provider.csv`
- `data/private/derived/personal-analysis/records.csv`
- `data/private/bedrock-usage/processed/dashboard_aggregates.json`
- `data/private/raw/aws-bedrock/costs.csv`
- `https://cursor.com/help/models-and-usage/usage-limits`
- `https://cursor.com/help/account-and-billing/pricing`
- `https://claude.com/pricing`
- `https://openai.com/index/introducing-chatgpt-pro/`
- `https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan`
- `https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro`

## Visual/Browser Findings
- No browser or image findings recorded yet.
