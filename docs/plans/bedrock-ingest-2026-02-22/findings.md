# Findings: Bedrock ingest (2026-02-22)

## Summary

- Extracted February 2026 Bedrock billing export totals and usage breakdowns (see derived CSV + summary).
- Recorded Cost Explorer tooltip values for Dec 2025–Feb 2026 from screenshots; these do not reconcile with export totals and are kept as a separate signal.
- Found Claude Code session logs with input/output token counts in `~/.claude/projects/*.jsonl` and captured aggregated totals privately.

## Sources

- Raw input: `/Users/jholt/Downloads/bedrock_data`
- Destination (private): `data/private/raw/aws-bedrock/`
- Claude Code logs: `/Users/jholt/.claude/projects/*.jsonl` (private)

## Key outputs (private)

- `data/private/derived/aws-bedrock/bedrock_feb_2026_summary.md`
- `data/private/derived/aws-bedrock/bedrock_feb_2026_usage_by_model.csv`
- `data/private/derived/aws-bedrock/bedrock_feb_2026_usage_by_usage_type.csv`
- `data/private/observations/aws-bedrock-cost-explorer-screenshots.2026-02-22.md`
- `data/private/derived/anthropic/claude_code_session_tokens_summary.md`
