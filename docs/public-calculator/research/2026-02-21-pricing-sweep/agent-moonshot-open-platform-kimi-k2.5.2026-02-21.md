# Moonshot Open Platform — kimi-k2.5 API pricing (Feb 2026)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Scope

This note captures **official Moonshot Open Platform** token pricing for `kimi-k2.5`.

Keep this separate from:

- **Kimi membership / Kimi Code** (subscription quota surface), and
- any **third-party wrappers** (AWS Bedrock, OpenCode Zen, OpenRouter, etc.) which may have different pricing.

## Official pricing table (USD, per 1M tokens)

The Moonshot pricing doc (“Model Inference Pricing Explanation”) lists `kimi-k2.5` with:

- **Prompt / input (cache miss):** **$0.60** per 1M tokens
- **Caching / input (cache hit):** **$0.10** per 1M tokens
- **Completion / output:** **$3.00** per 1M tokens

The doc also states prices are **inclusive of tax**, and clarifies “1M = 1,000,000”.

## How this was extracted (reproducible)

The pricing page is a Next.js app and renders the table via a JS chunk. One reproducible path:

1) Load the doc page: `https://platform.moonshot.ai/docs/pricing/chat`
2) Fetch the `webpack-*.js` runtime to map chunk IDs → file names.
3) Fetch the chunk for the `kimi-k2.5` pricing table (`7232.<hash>.js` as of this sweep) and read the embedded `en-US` price constants.

This approach uses Moonshot’s own published content (still “official”), but is more reliable than trying to scrape rendered HTML.

## Sources (official)

- Moonshot Open Platform pricing doc (chat): `https://platform.moonshot.ai/docs/pricing/chat`

