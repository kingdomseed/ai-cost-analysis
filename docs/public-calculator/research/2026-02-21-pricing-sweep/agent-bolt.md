# Bolt.new — Pricing + Token Quotas (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Official source

- `https://bolt.new/pricing`

## Billing primitive

Bolt plans are described in terms of **token quotas** (daily/monthly limits) plus non-AI product limits (file upload size, web requests, hosting, etc.).

## Plans (as published on pricing page)

| Plan | Price | Token limits | Notes |
|---|---:|---|---|
| Free | $0 | 300K tokens/day; 1M tokens/month | Includes hosting; Bolt branding; 10MB uploads; up to 333k web requests |
| Pro | $25/month | “Start at 10M tokens/month”; no daily token limit | Tokens roll over; custom domain; 100MB uploads; up to 1M web requests |
| Teams | $30/month/member | (inherits Pro token rules) | Centralized billing + admin controls; tokens roll over |
| Enterprise | Custom | Not disclosed | Quote-based; security/compliance and support |

## Notes / gaps

- The pricing page describes “start at 10M tokens/month” for Pro but does not enumerate higher tiers or an explicit per-token overage rate.
- Treat token quotas as **opaque** unless Bolt publishes a stable token↔USD conversion (or explicit overage pricing).

