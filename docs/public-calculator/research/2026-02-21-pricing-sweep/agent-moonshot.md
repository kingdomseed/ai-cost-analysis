# Agent Notes: Moonshot / Kimi — Pricing Sweep

**Agent focus:** Moonshot (Kimi) official API pricing + Kimi app subscription plans.  \n**retrieved_at:** 2026-02-21  \n**last_verified_at:** 2026-02-21

## Official pages referenced

- Moonshot Open Platform pricing (ZH): `https://platform.moonshot.cn/docs/pricing/chat` (updated 2026-02-01 per page)
- Moonshot Open Platform pricing (EN): `https://platform.moonshot.ai/docs/pricing/chat` (updated 2026-02-01 per page)
- Kimi membership benefits (ZH): `https://www.kimi.com/user/agreement/zh/membershipBenefits` (updated 2026-02-10 per page)

## Kimi Open Platform API pricing — K2 / K2.5

The official pricing tables bill Chat Completion API by:
- input tokens (split into **cache hit** vs **cache miss**)
- output tokens

### Pricing (CNY) — as shown on `platform.moonshot.cn`

Units: price per **1M tokens**.

| Model | Context | Input (cache hit) / 1M | Input (cache miss) / 1M | Output / 1M |
|---|---:|---:|---:|---:|
| `kimi-k2.5` | 256k | ¥0.70 | ¥4.00 | ¥21.00 |
| `kimi-k2-0905-preview` | 256k | ¥0.56 | ¥4.00 | ¥16.00 |
| `kimi-k2-turbo-preview` | 256k | ¥1.00 | ¥8.00 | ¥58.00 |
| `kimi-k2-0711-preview` | 128k | ¥0.56 | ¥4.00 | ¥16.00 |
| `kimi-k2-thinking` | 256k | ¥0.70 | ¥4.00 | ¥16.00 |
| `kimi-k2-thinking-turbo` | 256k | ¥1.00 | ¥8.00 | ¥58.00 |

### Corroboration (USD) — `kimi-k2.5` on `platform.moonshot.ai`

Units: price per **1M tokens**.

| Model | Context | Input (cache hit) / 1M | Input (cache miss) / 1M | Output / 1M |
|---|---:|---:|---:|---:|
| `kimi-k2.5` | 256k | $0.10 | $0.60 | $3.00 |

Notes:
- The platform describes some file extraction/storage features as temporarily free (implementation detail; do not assume permanent).
- The cache hit/miss distinction is part of Moonshot’s automatic context caching billing.
- Pricing docs state prices are per **1M tokens** and **inclusive of tax**.

## Kimi membership pricing (consumer subscription surface)

Kimi membership pricing is rendered on an official SSR page and should be treated as the source of truth for plan names/prices in this sweep.

### Plan summary (CNY, annual)

| Plan | Price |
|---|---:|
| Andante | ¥468 / year |
| Moderato | ¥948 / year |
| Allegretto | ¥1,908 / year |

Notes:
- This page includes plan feature lists referencing Kimi Code, but does not provide a token↔quota conversion. For Kimi Code quota mechanics, see `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-kimi-code-update.2026-02-21.md`.

## Calculator implications

- Moonshot/Kimi has a clearer “included usage” concept via **counts/month** (not tokens) for the consumer app subscriptions, and a separate token-meter for the API.
- AWS Bedrock pricing for Kimi can differ materially from Moonshot’s direct API pricing; in the calculator, these should be separate providers with separate sources.
