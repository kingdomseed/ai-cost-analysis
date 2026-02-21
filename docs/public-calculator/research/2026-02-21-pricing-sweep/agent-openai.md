# Agent Notes: OpenAI (API + ChatGPT) — Pricing Sweep

**Agent focus:** OpenAI API token pricing for `gpt-5.2` and `gpt-5.2-codex` (input/output/cached input), plus official ChatGPT Plus/Pro pricing and usage-limit language.  
**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Summary

API pricing (USD per 1M tokens, “Standard”):
- **`gpt-5.2`**: input **$1.75**, cached input **$0.175**, output **$14.00**
- **`gpt-5.2-codex`**: input **$1.75**, cached input **$0.175**, output **$14.00**

ChatGPT subscriptions (USD):
- **ChatGPT Plus**: **$20/month**; Help Center includes a specific example of rolling message caps for GPT‑4o/GPT‑4 (and warns caps can be dynamically adjusted).
- **ChatGPT Pro**: **$200/month**; Help Center describes “unlimited access” for certain models, explicitly conditioned on abuse guardrails/Terms of Use and possible temporary restrictions.

## Primary sources (official)

OpenAI API (developers):
- Pricing table: `https://developers.openai.com/api/docs/pricing`
- Model pages:
  - `https://developers.openai.com/api/docs/models/gpt-5.2`
  - `https://developers.openai.com/api/docs/models/gpt-5.2-codex`
- Prompt caching guide: `https://developers.openai.com/api/docs/guides/prompt-caching/`
- Batch API guide: `https://developers.openai.com/api/docs/guides/batch`

ChatGPT (Help Center):
- Plus: `https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus`
- Pro: `https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro`

Note: `help.openai.com` and `openai.com` pages were blocked by Cloudflare when fetched directly from this environment (HTTP 403 / challenge). Content below for Help Center pages was retrieved via an indexing/crawl tool, but URLs remain official.

---

## 1) OpenAI API token pricing (Feb 2026)

All prices below are **USD per 1M tokens** (Text tokens, Standard tier).

### 1.1 `gpt-5.2`

From the OpenAI pricing table:

| Model | Input | Cached input | Output |
|---|---:|---:|---:|
| `gpt-5.2` | 1.75 | 0.175 | 14.00 |

Corroboration:
- `gpt-5.2` model page also lists Input **$1.75**, Cached input **$0.175**, Output **$14.00** per 1M tokens.

### 1.2 `gpt-5.2-codex`

From the OpenAI pricing table:

| Model | Input | Cached input | Output |
|---|---:|---:|---:|
| `gpt-5.2-codex` | 1.75 | 0.175 | 14.00 |

Corroboration:
- `gpt-5.2-codex` model page also lists Input **$1.75**, Cached input **$0.175**, Output **$14.00** per 1M tokens.

---

## 2) Official notes relevant to coding workloads

### 2.1 Batch API (discount + turnaround + practical limits)

OpenAI’s Batch guide describes Batch as:
- **50% lower costs** than synchronous APIs
- **24-hour completion window** (asynchronous; “completion_window” currently only `24h`)
- **separate (higher) rate limits**, and a note that Batch usage “will not consume tokens from your standard per-model rate limits”

Source: `https://developers.openai.com/api/docs/guides/batch`

Implication for a calculator:
- Batch pricing is not a separate token price table on the pricing page; instead, the guide describes a percentage discount. (If you encode Batch in a calculator, it’s a multiplier against Standard rates as documented: **0.5×**.)

### 2.2 Prompt caching (cached input pricing, thresholds, retention)

OpenAI’s Prompt Caching guide states (paraphrased + key specifics):
- Prompt caching works **automatically** (no code changes required) and “has no additional fees” beyond the normal token billing.
- “Caching is enabled automatically for prompts that are **1024 tokens or longer**.”
- Usage objects include `usage.prompt_tokens_details.cached_tokens` for cache hits.
- In-memory retention: cached prefixes generally remain active for **5–10 minutes of inactivity**, up to **1 hour**.
- Extended retention is available for a listed set of models (includes `gpt-5.2`) and can keep cached prefixes active up to **24 hours** by persisting key/value tensors to GPU-local storage.

Source: `https://developers.openai.com/api/docs/guides/prompt-caching/`

How this relates to “cached input” pricing:
- The pricing table explicitly includes a “Cached input” rate (e.g., `gpt-5.2` cached input **$0.175 / 1M tokens**), and the caching guide notes that cached prompts are reflected in a `cached_tokens` count.

### 2.3 Reasoning tokens billed as output

The pricing page states:
- “While reasoning tokens are not visible via the API, they still occupy space in the model’s context window and are billed as output tokens.”

Source: `https://developers.openai.com/api/docs/pricing`

Notes:
- Some API response schemas show `completion_tokens_details.reasoning_tokens` as a field; however, the pricing page’s billing statement is the authoritative guidance for cost accounting: treat any reasoning tokens as **output-billed**.

---

## 3) ChatGPT subscription pricing + usage limits (Plus / Pro)

### 3.1 ChatGPT Plus — price and usage limits language

From the ChatGPT Plus Help Center article:
- Price: “The ChatGPT Plus subscription covers usage on chatgpt.com only and costs **$20/month**.”
- API billing: “the ChatGPT API and ChatGPT Plus subscription are billed separately.”
- Usage limits (explicitly stated for specific models, with a dated reference):
  - “As of **May 13th 2024**, Plus users will be able to send **80 messages every 3 hours on GPT‑4o** and **40 messages every 3 hours on GPT‑4**.”
  - “In certain cases… we may **dynamically adjust** the message limit based on available capacity…”

Source: `https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus`

What this means for “Feb 2026” documentation:
- The Plus article provides **some** numeric caps, but only for the GPT‑4o/GPT‑4 examples stated in the article; it does **not** provide a single, plan-wide, stable cap for GPT‑5 / GPT‑5.2 usage.

### 3.2 ChatGPT Pro — price and “unlimited” constraints

From the ChatGPT Pro Help Center article:
- Price: “**$200/month** (billed monthly).”
- “Unlimited access” is explicitly conditioned:
  - “Unlimited access is subject to abuse guardrails.”
  - The article lists examples of prohibited usage and states temporary restrictions may occur, with support contact instructions if the user believes it’s a mistake.
- API billing: Pro does **not** include API usage; API is billed independently.

Source: `https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro`

### 3.3 Usage limits: what is specified vs what is not

**What’s officially specified (in the cited Help Center articles):**
- Plus has a **$20/month** price and includes at least one explicit example of rolling message caps (GPT‑4o/GPT‑4) plus a statement that caps may change dynamically.
- Pro has a **$200/month** price and describes “unlimited access” conditioned on guardrails/Terms and possible temporary restrictions.

**What is not specified (in those same sources):**
- No official, stable numeric message cap is stated for GPT‑5 / GPT‑5.2 usage across Plus or Pro in these Help Center articles.
- No official conversion is provided from ChatGPT plan usage to a token-based meter (ChatGPT plans are subscriptions; API is metered separately).

**What can be said empirically (but should be labeled as non-authoritative):**
- Users may observe practical caps or throttling in-product (especially under high demand), but unless those caps are explicitly documented in official sources, they should be treated as **variable and not guaranteed**.

