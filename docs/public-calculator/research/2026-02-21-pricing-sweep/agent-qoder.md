# Qoder IDE — Pricing + Credit Mechanics (snapshot)

**retrieved_at:** 2026-02-21  \n**last_verified_at:** 2026-02-21

## Official sources

- `https://docs.qoder.com/account/pricing`
- `https://docs.qoder.com/Credits`
- `https://docs.qoder.com/user-guide/chat/model-tier-selector`
- `https://docs.qoder.com/account/teams/teams-pricing`
- `https://docs.qoder.com/account/Billing`
- `https://docs.qoder.com/events/discount`

## Pricing (individual plans, USD/month)

Qoder lists Free / Pro / Pro+ / Ultra. Quotas are expressed in **Credits** (premium models); if you run out, Qoder switches to basic models with a daily message limit (limit not specified in the pricing doc).

| Plan | Price | Included premium Credits / month | Notes |
|---|---:|---:|---|
| Free | $0 | (not specified) | “Basic models for limited user messages.” |
| Pro | $10/mo limited-time (regular $20/mo) | 2,000 | Includes unlimited completions/next edits; limited Credits for chat/agent; Quest Mode; Repo Wiki. |
| Pro+ | $30/mo limited-time (regular $60/mo) | 6,000 | Higher credit quota. |
| Ultra | $100/mo limited-time (regular $200/mo) | 20,000 | Highest credit quota. |

Discount docs note:
- 50% off plans active since 2025-09-23 (SGT), end date not yet announced.
- 50% off personal credit packs active since 2026-02-10 (SGT).

## Top-ups (Credit Packs for individuals)

- Unit price: $0.01 / credit (limited-time 50% off), regular $0.02 / credit
- Minimum purchase: 1,000 credits; increments of 1,000
- Validity: 1 month from purchase date; unused credits expire
- Refunds: not refundable
- Consumption: credits expiring soonest are consumed first

## Teams pricing (USD/seat/month)

- Teams: $30/seat/month
- Included: 2,000 credits/seat/month
- Seat credits are non-transferable and reset at cycle end
- Minimum 2 seats

## What a “Credit” is (and how it’s deducted)

Credits are used for: Inline Chat, Ask Mode, Agent Mode, Quest Mode, Repo Wiki.

Qoder credits are **usage-based**, not a flat “1 credit per message” rule:
- credits depend on the premium model used and the total input+output tokens processed
- Agent/Quest can trigger multiple premium model calls and consume more credits
- failed model requests do not deduct credits

## Consumption estimates (medians; not guarantees)

From the Credits guide (50K vs 200K context windows):

| Task | Median (50K context) | Median (200K context) |
|---|---:|---:|
| Ask | ~3 credits/request | ~4 credits/request |
| Agent | ~7 credits/request | ~12 credits/request |
| Quest | (not listed) | ~100 credits/quest task |
| Repo Wiki | (not listed) | ~50 credits/repository |

## Tier multipliers (model tier selector)

The Model Tier Selector defines approximate multipliers:
- Auto (Smart Routing): ~1.0×
- Ultimate: ~1.6×
- Performance: ~1.1×
- Efficient: ~0.3×
- Lite: 0× (Free), with limitations

## Gaps (not specified in the referenced official pages)

- No fixed “1 credit = N tokens” conversion.
- Docs don’t enumerate exactly which vendor models map to each tier.
- Basic model daily limit is referenced but not numerically specified here.
- Team shared add-on credit pricing is not stated in the team shared add-on credits doc (mechanics are described).

## User-observed examples (unverified; Feb 2026)

These examples were captured by the repo owner from Qoder usage history and are included to sanity-check the implied $/credit from Qoder’s official credit pack pricing (not as an official guarantee).

- Example entries include charges like `4.91 credits → $0.04`, `27.46 credits → $0.27`, `61.94 credits → $0.61`, consistent with roughly **$0.01/credit** under the documented discount pricing.
