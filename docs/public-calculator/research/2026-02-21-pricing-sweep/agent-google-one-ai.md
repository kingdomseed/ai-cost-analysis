# Google (consumer subscriptions) — Google One “Google AI plans” (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Scope clarification

These are **consumer subscription plans** (not API token pricing). They typically measure “usage” as access tiers and **daily credits** for certain experiences, rather than per-token billing.

## Plans (US pricing)

Official pricing is published both on the Google One marketing page and in a machine-readable pricing feed.

From the US pricing feed `one.google.com/intl/ALL_us/about/feeds/pricing_2026_01_27.json`:

| Plan | Monthly price (USD) | Promo shown on page | Notes (as published) |
|---|---:|---|---|
| Google AI Plus | **$7.99 / month** | **$3.99 / month for 2 months** | Includes cloud storage (marketing page shows **200 GB**). |
| Google AI Pro | **$19.99 / month** | **$0 for the first month** | Includes cloud storage (marketing page shows **2 TB**). |
| Google AI Ultra | **$249.99 / month** | **$124.99 / month for 3 months** | Includes cloud storage (marketing page shows **30 TB**). |

## Non-token usage meters (examples)

The marketing/subscriptions surfaces include features that are **not token-based**, e.g.:
- “AI credits” (quota currency used for specific experiences like video generation).
- Plan-by-plan daily limits for Gemini Apps are published in a Help Center table (prompts/day, Deep Research reports/day, videos/day, etc.).

For the public calculator dataset, treat these as **opaque quotas** (counts/day) unless we find an official conversion from credits → tokens or credits → USD.

## Sources

- Google AI plans (marketing): `https://one.google.com/about/google-ai-plans/`
- Google One pricing feed (US): `https://one.google.com/intl/ALL_us/about/feeds/pricing_2026_01_27.json`
- Google One Help: AI Plus benefits: `https://support.google.com/googleone/answer/16882689?hl=en`
- Google One Help: AI Pro benefits: `https://support.google.com/googleone/answer/14534406?hl=en`
- Google One Help: AI Ultra benefits: `https://support.google.com/googleone/answer/16286513?hl=en`
- Gemini Apps Help: limits & upgrades (quantified tables): `https://support.google.com/gemini/answer/16275805?hl=en`
- Purchase/management entrypoint (requires login): `https://one.google.com/ai`
