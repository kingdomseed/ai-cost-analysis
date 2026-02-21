# Findings: Google One AI plans (2026-02-21)

## Sources reviewed (official preferred)
- Google One “Google AI plans” marketing page: https://one.google.com/about/google-ai-plans/
- Google One pricing feed used by the marketing page (localized): https://one.google.com/about/feeds/pricing_2026_01_27.json
- Google One pricing feed (US/USD): https://one.google.com/intl/ALL_us/about/feeds/pricing_2026_01_27.json
- Google One Help Center: Google AI Plus benefits: https://support.google.com/googleone/answer/16882689?hl=en
- Google One Help Center: Google AI Pro benefits: https://support.google.com/googleone/answer/14534406?hl=en
- Google One Help Center: Google AI Ultra benefits: https://support.google.com/googleone/answer/16286513?hl=en
- Gemini Help Center: “Gemini Apps limits & upgrades”: https://support.google.com/gemini/answer/16275805?hl=en
- Google One Help Center: Manage AI credits: https://support.google.com/googleone/answer/16287445?hl=en
- Google One Help Center: Restrictions for benefits: https://support.google.com/googleone/answer/16105039?hl=en
- Google One Additional Terms (AI credits section): https://one.google.com/terms-of-service#ai-credits

## Extracted facts (draft)
### Plan names (Google One)
- Google AI Plus (200 GB)
- Google AI Pro (2 TB)
- Google AI Ultra (30 TB)

### US prices (USD)
- Google AI Plus: $7.99/month (pricing feed key: `PRICE_GEN_AI_PLUS_MONTHLY`)
- Google AI Pro: $19.99/month (pricing feed key: `PRICE_GEN_AI_MONTHLY`)
- Google AI Ultra: $249.99/month (pricing feed key: `PRICE_GEN_AI_ULTRA_MONTHLY`)
- Promotions shown on the marketing page as of 2026-02-21:
  - AI Plus: $3.99/month for 2 months (feed key: `PRICE_GEN_AI_PLUS_MONTHLY_IP_50P`)
  - AI Pro: $0 for the first month (feed key: `PRICE_GEN_AI_MONTHLY_PROMOTION`)
  - AI Ultra: $124.99/month for 3 months (feed key: `PRICE_GEN_AI_ULTRA_MONTHLY_IP_50P`)

### Included AI usage (high level)
- AI Plus: Gemini app (3 Pro + Veo), Gemini in Gmail/Calendar/Meet, Flow, Whisk, NotebookLM, Deep Search (“AI Mode”), 200 monthly AI credits, 200 GB storage.
- AI Pro: includes Plus benefits + “Gemini in Gmail, Docs, Vids, and more”, Gemini CLI + Gemini Code Assist, Jules, higher limits in multiple products, 1,000 monthly AI credits, 2 TB storage.
- AI Ultra: includes Pro benefits + highest limits in several products, 25,000 AI credits/month, 30 TB storage, and additional benefits (e.g., YouTube Premium Individual — limited availability).

### Gemini Apps published usage limits (quantified)
- Gemini Help Center article includes an explicit plan-by-plan table covering:
  - Prompts/day for Pro 3.1 and Thinking models
  - Deep Research reports/day
  - Video generation videos/day
  - Music generation tracks/day
  - Image generation counts/day (Nano Banana / Nano Banana Pro)
  - Context window sizes (e.g., up to 1M tokens for Google AI Pro)

### Exclusions / constraints (needs careful wording in final note)
- Gemini Apps upgrades are described as “part of select Google One paid plans for personal accounts.”
- Many features are US-only and/or 18+; languages are limited for “Gemini in Gmail, Docs & more”.
- AI credits are only redeemable for designated AI features within Google’s ecosystem; no explicit statement found in reviewed sources that Gemini API usage is included.
