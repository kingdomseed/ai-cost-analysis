# Findings: OpenAI pricing sweep (2026-02-21)

## Requirements (from user)
- Feb 2026: official OpenAI API token pricing for `gpt-5.2` and `gpt-5.2-codex`:
  - input tokens
  - output tokens
  - cached input tokens
- Official notes relevant to coding workloads:
  - Batch API
  - caching
  - reasoning tokens billed as output
- Official ChatGPT subscription pricing:
  - Plus
  - Pro
- Official documentation on usage limits for Pro/Plus:
  - what can be said empirically
  - what is not specified
- Prefer developers.openai.com and help.openai.com; corroborate key prices with ≥1 additional official page if possible.

## Research Findings
### API pricing (prices per 1M tokens)
- `gpt-5.2`: input $1.75, cached input $0.175, output $14.00 (developers pricing table).
- `gpt-5.2-codex`: input $1.75, cached input $0.175, output $14.00 (developers pricing table).
- Corroboration: corresponding model pages on developers.openai.com list the same token prices.

### Billing notes relevant to coding workloads
- Pricing page notes: “reasoning tokens … are billed as output tokens” and are not visible via the API.
- Batch API guide states: asynchronous “24-hour turnaround time” and “50% lower costs”.
- Prompt caching guide: mentions cost reductions “up to 90%” for input token costs and latency reductions “up to 80%”.
- Prompt caching guide: in-memory retention typically 5–10 minutes of inactivity (up to ~1 hour).
- Flex processing guide: tokens priced at Batch API rates; also mentions additional discounts from prompt caching.

### ChatGPT plans: prices + limit language (Help Center)
- Plus:
  - Price (explicit): “costs $20/month.”
  - Explicit message caps (as stated for GPT-4o/GPT-4 in the article): “80 messages every 3 hours on GPT-4o” and “40 messages every 3 hours on GPT-4”.
  - Limit variability: “we may dynamically adjust the message limit based on available capacity…”.
- Pro:
  - Price (explicit): “$200/month (billed monthly).”
  - “Unlimited access” is explicitly conditioned: “Unlimited access is subject to abuse guardrails.” Article also describes possible temporary restrictions to prevent misuse.

## Resources (official)
- OpenAI API pricing table: https://developers.openai.com/api/docs/pricing
- OpenAI API model pages:
  - https://developers.openai.com/api/docs/models/gpt-5.2
  - https://developers.openai.com/api/docs/models/gpt-5.2-codex
- OpenAI API prompt caching guide: https://developers.openai.com/api/docs/guides/prompt-caching/
- OpenAI API Batch guide: https://developers.openai.com/api/docs/guides/batch
- OpenAI API reference (Batch): https://platform.openai.com/docs/api-reference/batch
- OpenAI API pricing (public marketing page): https://openai.com/api/pricing/
- ChatGPT Plus article: https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus
- ChatGPT Pro article: https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro
- Credits add-on article (Plus/Pro): https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-freegopluspro-sora

## Notes on “Specified vs Not Specified”
- Specified (Plus): the help article provides explicit per-3-hour message caps for GPT-4o and GPT-4, and states limits may be dynamically adjusted.
- Specified (Pro): the help article describes “unlimited access” and explicitly conditions it on abuse guardrails / Terms of Use; it also states temporary restrictions may occur.
- Not specified (Plus/Pro): no global numeric caps are stated for GPT-5 / GPT-5.2 usage in these help articles (as retrieved via Exa on 2026-02-21).
