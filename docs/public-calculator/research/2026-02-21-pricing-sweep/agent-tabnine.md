# Tabnine — Pricing + LLM Access Model (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Official source

- `https://www.tabnine.com/pricing/`

## Billing primitive

Tabnine is primarily described as a **seat subscription** (annual subscription), with two major offerings:
- “Tabnine Code Assistant” platform (chat + completions)
- “Tabnine Agentic Platform” (adds agentic workflows + Context Engine + CLI)

The pricing page also describes:
- Unlimited usage when using **your own LLM** on-prem or via your own cloud endpoint (BYOK).
- When using **Tabnine-provided LLM access**, token consumption is priced based on provider prices **plus a 5% handling fee**, and may require “reserved token consumption quota” (exact quota mechanics not fully published on the pricing page).

## Published prices (annual subscription)

| Product | Price (USD) | Unit | Notes |
|---|---:|---|---|
| Tabnine Code Assistant | $39 | per user per month (annual subscription) | Includes chat + completions |
| Tabnine Agentic Platform | $59 | per user per month (annual subscription) | Adds agentic workflows + CLI + Context Engine |

## Notes / gaps

- The pricing page does not publish a simple token↔quota conversion when using Tabnine-provided LLM access.
- If we model Tabnine in the calculator, treat it as “seat subscription + (optional) provider-token passthrough + handling fee” until we capture a more explicit quota contract.

