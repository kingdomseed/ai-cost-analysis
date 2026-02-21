# Perplexity entitlements audit (sanity check) — 2026-02-21

**retrieved_at:** 2026-02-21  
**notes:** This file records what Perplexity returned when asked to list entitlements + official URLs. We use it as a cross-check, not as a source of truth.

## Summary

Perplexity’s response was **incomplete** and incorrectly claimed “no official URLs” exist for several tools where we already have authoritative documentation (e.g., GitHub Copilot, Cursor, Windsurf, Claude Help Center).

We therefore treat this as a “check we ran,” but we rely on:
- official provider docs already captured in this repo, and
- direct fetching from official domains.

## What Perplexity returned (high-level)

- OpenAI/ChatGPT: pointed to OpenAI blog posts about Codex/ChatGPT, but also included **unofficial** pricing blogs.
- Anthropic/Claude: claimed no official URLs were found (incorrect; Claude Help Center exists and is already in our sweep).
- Google AI plans: claimed no official URLs were found (incorrect; Google One marketing + Google for Developers docs exist and are already in our sweep).
- GitHub Copilot: claimed no official URLs were found (incorrect; docs.github.com pages exist and are already in our sweep).
- Cursor / Windsurf: similarly claimed no official URLs were found (incorrect; cursor.com and docs.windsurf.com exist).

## Action taken

We keep Perplexity as a discovery tool, but we verify entitlements using:

- `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-claude-entitlements.2026-02-21.md`
- `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-google-devtool-entitlements.2026-02-21.md`
- `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-copilot-entitlements.2026-02-21.md`
- `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-cursor-entitlements.2026-02-21.md`
- `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-windsurf-entitlements.2026-02-21.md`
- `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-openai-entitlements.2026-02-21.md` (partial; environment-limited)

