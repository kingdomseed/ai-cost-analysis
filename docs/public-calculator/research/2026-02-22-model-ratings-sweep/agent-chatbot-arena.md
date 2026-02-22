# Agent Notes: LMSYS / Chatbot Arena ratings (2026-02-22)

## Public sources (primary)

- LMSYS / Chatbot Arena (home): `https://lmarena.ai/`
- Hugging Face dataset (public): `mathewhe/chatbot-arena-elo`
  - Dataset API (file list + metadata): `https://huggingface.co/api/datasets/mathewhe/chatbot-arena-elo`
  - Main CSV file: `elo.csv` (contains `Arena Score`, CI, votes, org, etc.)

## Data shape in `elo.csv` (observed)

Columns include:
- `Model`, `Arena Score`, `95% CI`, `Votes`, `Organization`
- plus additional metadata columns like license and knowledge cutoff (as strings).

## Proposed ingestion approach

Add a script that fetches `elo.csv`, parses it, and merges ratings into our `models` snapshot:
- `system = "lmsys-chatbot-arena"`
- `metric = "arena_score_elo"`
- `score = <Arena Score>`
- `scale = "elo"`
- carry `95% CI` and `Votes` as additional fields (allowed by schema).

## Caveats

- This dataset is not an “official Microsoft/OpenAI/etc” source; it’s a public, reputable leaderboard signal. Keep `verified=false` and preserve attribution.
- Model naming in Arena often includes dated variants; do not alias those to provider API model IDs unless the mapping is explicitly sourced.

