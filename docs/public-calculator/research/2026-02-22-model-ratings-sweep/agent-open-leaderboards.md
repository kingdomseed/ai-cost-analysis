# Agent Notes: Other open leaderboards (2026-02-22)

## Hugging Face: Open LLM Leaderboard

- Hugging Face org: `open-llm-leaderboard`
- Results dataset (large; parquet/JSONL depending on split): `https://huggingface.co/datasets/open-llm-leaderboard/results`
- Notes:
  - Useful for open-weight models.
  - Typically includes multiple task benchmarks (e.g., MT-Bench/MMLU-style families depending on the era).

## Ingestion strategy (recommended)

- Do **not** pull the entire `open-llm-leaderboard/results` dataset into the repo directly.
- Instead:
  - define a small ingestion script that fetches a bounded “top-N” slice (or specific tasks we care about),
  - stores only the derived `ratings[]` per model, and
  - records the exact dataset revision / retrieval date in `sources[]`.

## Caveats

- Licenses and evaluation versions vary; record them per-rating (extra fields allowed).
- Avoid comparing “scores” across different benchmarks without explaining scale and directionality.

