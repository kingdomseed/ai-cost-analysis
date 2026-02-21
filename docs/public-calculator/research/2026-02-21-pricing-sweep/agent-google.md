# Agent Notes: Google (Gemini API + Vertex AI) — Pricing Sweep

**Agent focus:** Gemini Developer API and Vertex AI Generative AI pricing for coding-relevant Gemini models.  \n**retrieved_at:** 2026-02-21  \n**last_verified_at:** 2026-02-21

## Primary sources (official)

- Gemini Developer API pricing: `https://ai.google.dev/gemini-api/docs/pricing`
- Vertex AI Generative AI pricing: `https://cloud.google.com/vertex-ai/generative-ai/pricing`
- Vertex AI context caching overview: `https://cloud.google.com/vertex-ai/generative-ai/docs/context-cache/context-cache-overview`

## Gemini Developer API (ai.google.dev) — token pricing (Paid tier)

Notes:
- Prices are USD per **1,000,000 tokens** unless stated otherwise.
- Output price explicitly includes **thinking tokens** (reasoning).
- Context caching has two cost components on this page:
  1) cached input token price (per 1M cached tokens used)
  2) cache storage price (per 1M tokens stored per hour)

### Standard (Paid tier)

| Model | Model ID(s) | Input (<=200k) | Input (>200k) | Output (<=200k) | Output (>200k) | Cached input (<=200k) | Cached input (>200k) | Cache storage (per 1M tokens/hr) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview`, `gemini-3.1-pro-preview-customtools` | 2.00 | 4.00 | 12.00 | 18.00 | 0.20 | 0.40 | 4.50 |
| Gemini 3 Pro Preview | `gemini-3-pro-preview` | 2.00 | 4.00 | 12.00 | 18.00 | 0.20 | 0.40 | 4.50 |
| Gemini 3 Flash Preview | `gemini-3-flash-preview` | 0.50 (text/image/video) / 1.00 (audio) | — | 3.00 | — | 0.05 (text/image/video) / 0.10 (audio) | — | 1.00 |
| Gemini 2.5 Pro | `gemini-2.5-pro` | 1.25 | 2.50 | 10.00 | 15.00 | 0.125 | 0.25 | 4.50 |
| Gemini 2.5 Flash | `gemini-2.5-flash` | 0.30 (text/image/video) / 1.00 (audio) | — | 2.50 | — | 0.03 (text/image/video) / 0.10 (audio) | — | 1.00 |
| Gemini 2.5 Flash-Lite | `gemini-2.5-flash-lite` | 0.10 (text/image/video) / 0.30 (audio) | — | 0.40 | — | 0.01 (text/image/video) / 0.03 (audio) | — | 1.00 |

`—` means the pricing row does not split <=200k vs >200k for that model on this page.

### Batch (Paid tier)

The Gemini Developer API pricing page also lists “Batch” pricing (generally a **50% cost reduction** vs Standard for input/output). The agent did not extract the full Batch table in this pass; follow-up extraction recommended if we want Batch in the public calculator by default.

## Vertex AI (cloud.google.com) — token pricing (Standard)

Notes:
- Prices are USD per **1,000,000 tokens**.
- Vertex AI presents long-context pricing as **<=200K input tokens** vs **>200K input tokens**, and also lists cached input pricing.

### Standard

| Model | Input (<=200K) | Input (>200K) | Output (<=200K) | Output (>200K) | Cached input (<=200K) | Cached input (>200K) |
|---|---:|---:|---:|---:|---:|---:|
| Gemini 3.1 Pro Preview | 2.00 | 4.00 | 12.00 | 18.00 | 0.20 | 0.40 |
| Gemini 3 Pro Preview | 2.00 | 4.00 | 12.00 | 18.00 | 0.20 | 0.40 |
| Gemini 3 Flash Preview | 0.50 (text/image/video) / 1.00 (audio) | same | 3.00 | same | 0.05 (text/image/video) / 0.10 (audio) | same |
| Gemini 2.5 Pro | 1.25 | 2.50 | 10.00 | 15.00 | 0.125 | 0.250 |
| Gemini 2.5 Flash | 0.30 (text/image/video) / 1.00 (audio) | same | 2.50 | same | 0.030 (text/image/video) / 0.100 (audio) | same |
| Gemini 2.5 Flash Lite | 0.10 (text/image/video) / 0.30 (audio) | same | 0.40 | same | 0.010 (text/image/video) / 0.030 (audio) | same |

Long-context rule (as described on Vertex pricing page): if **input context > 200K**, then **all tokens (input and output)** are charged at the long-context rates.

## Context caching & storage (Vertex AI)

From the context caching overview:
- Implicit caching: enabled by default; **~90% discount** on cached tokens vs standard input tokens.
- Explicit caching: you create/reference caches; pay standard input token cost to create, then discounted cached-token pricing when reusing.
- Storage costs: explicit caching has storage costs; implicit caching has no storage costs. For the Gemini Developer API, the pricing page lists the cache storage prices numerically (see table above).

## Corroboration note

For the models listed, the agent observed that Standard per-1M token prices and cached input prices on `ai.google.dev` align with the Vertex AI Standard token pricing table for the same model families.

