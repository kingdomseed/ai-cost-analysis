# Task Plan: Bedrock usage ingest (2026-02-22)

## Goal

Ingest the AWS Bedrock usage data from `/Users/jholt/Downloads/bedrock_data` (CSV + screenshots), normalize it into private data folders, and produce a concise derived summary that can be used later for personal usage analysis.

## Constraints

- Treat all raw exports as private (`data/private/`).
- Do not publish anything from screenshots/CSVs to public datasets.
- Preserve provenance: record where each number came from (CSV vs screenshot).

## Current Phase

Phase 3

## Phases

### Phase 1 — Intake + triage
- [x] Inventory files in `/Users/jholt/Downloads/bedrock_data`
- [x] Identify usable CSV(s) vs screenshots
- [x] Locate Claude Code session data if present
- **Status:** complete

### Phase 2 — Normalize + store
- [x] Copy raw files into `data/private/raw/aws-bedrock/`
- [x] Extract summary metrics into `data/private/derived/aws-bedrock/`
- [x] Record provenance in an observations note
- **Status:** complete

### Phase 3 — Validate + handoff
- [x] Sanity-check totals vs screenshots
- [x] Update progress + findings
- **Status:** complete

## Errors Encountered

| Error | Attempt | Resolution |
| --- | --- | --- |
| `cp` failed on `CostReportBedrock-Manifest(1).json` due to shell globbing | 1 | Re-ran with quoted path. |
