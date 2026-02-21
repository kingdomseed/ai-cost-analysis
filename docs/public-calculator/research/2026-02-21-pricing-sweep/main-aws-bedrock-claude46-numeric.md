# AWS Bedrock Claude 4.6 — numeric token rates (official price list)

**retrieved_at:** 2026-02-21  \n**last_verified_at:** 2026-02-21

## Official source (machine-readable)

AWS publishes Bedrock foundation model prices in an official public price list file:
- `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonBedrockFoundationModels/current/index.json`

This file’s `publicationDate` was **2026-02-19T10:27:05Z** in this sweep.

## Extracted on-demand rates (USD per 1M tokens)

These rates are from `terms.OnDemand` for **Amazon Bedrock Edition** SKUs.

Rates confirmed identical in **`us-east-1`**, **`us-east-2`**, and **`us-west-2`** for the “Global” meters.

### Claude Sonnet 4.6 (Amazon Bedrock Edition)

| Pricing scope | Input | Output | Cache write (5m) | Cache read | Cache write (1h) | Batch input | Batch output |
|---|---:|---:|---:|---:|---:|---:|---:|
| Global | 3.00 | 15.00 | 3.75 | 0.30 | 6.00 | 1.50 | 7.50 |
| Long context (Global) | 6.00 | 22.50 | 7.50 | 0.60 | 12.00 | 3.00 | 11.25 |

### Claude Opus 4.6 (Amazon Bedrock Edition)

| Pricing scope | Input | Output | Cache write (5m) | Cache read | Cache write (1h) | Batch input | Batch output |
|---|---:|---:|---:|---:|---:|---:|---:|
| Global | 5.00 | 25.00 | 6.25 | 0.50 | 10.00 | 2.50 | 12.50 |
| Long context (Global) | 10.00 | 37.50 | 12.50 | 1.00 | 20.00 | 5.00 | 18.75 |

## Notes for the calculator dataset

- Bedrock’s “Global” token rates for Claude 4.6 match Anthropic’s direct API token rates in this sweep (but Bedrock may still differ by region/tier for other meters).
- Bedrock includes both “Global” and “Long context (Global)” token meters as separate SKUs; treat these as distinct tiers in the dataset (like Anthropic’s >200k premium).
- Batch meters are explicitly present in the price list (generally 50% of the corresponding on-demand rates).

