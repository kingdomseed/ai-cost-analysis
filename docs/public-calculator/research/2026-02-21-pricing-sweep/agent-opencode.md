# OpenCode — pricing & billing mechanics (Zen + BYOK)

**retrieved_at:** 2026-02-21  \n**last_verified_at:** 2026-02-21

## Official sources

- Zen landing page: `https://opencode.ai/zen`
- Zen docs (including per-1M token prices table): `https://opencode.ai/docs/zen/`
- Providers overview (75+ providers + BYOK config): `https://opencode.ai/docs/providers/`

## OpenCode (the tool) vs OpenCode Zen (paid gateway)

- OpenCode (CLI/app) supports 75+ providers via BYOK (you pay the provider directly).
- OpenCode Zen is an optional OpenCode-operated gateway/provider that sells access to a curated model set.

## OpenCode Zen — billing mechanics

From Zen docs:
- Pay-as-you-go pricing with prices listed **per 1M tokens** (input/output, sometimes cached read/write).
- Auto-reload: if balance goes below **$5**, Zen automatically reloads **$20** (configurable/disableable).
- Monthly limits can be set per workspace/member (note: auto-reload can still exceed a strict $20 limit depending on how it’s configured).
- BYOK inside OpenCode: you can use your own OpenAI/Anthropic keys for those providers while still using other Zen models.

## OpenCode Zen — prices (examples)

Zen publishes a table of prices per 1M tokens in `https://opencode.ai/docs/zen/`.
Examples relevant to your calculator scope:

- GPT 5.2: input $1.75, output $14.00, cached read $0.175
- GPT 5.2 Codex: input $1.75, output $14.00, cached read $0.175
- Claude Opus 4.6 (≤200K): input $5.00, output $25.00, cached read $0.50, cached write $6.25
- Claude Opus 4.6 (>200K): input $10.00, output $37.50, cached read $1.00, cached write $12.50
- Kimi K2.5: input $0.60, output $3.00, cached read $0.08
- Gemini 3 Pro (≤200K): input $2.00, output $12.00, cached read $0.20

## OpenCode Zen — “$20 balance” and fees

The Zen landing page includes a UI action “Add $20 Pay as you go balance (+$1.23 card processing fee)”.

## Notes for the calculator

- OpenCode Zen is a distinct “provider/tool” with its own published token pricing table (useful for cross-tool comparisons).
- OpenCode (BYOK) itself is effectively “$0 tool cost + provider token meter” unless the user opts into Zen.

