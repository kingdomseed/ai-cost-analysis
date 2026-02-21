# Sourcegraph — Cody plan availability + pricing signals (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Official sources

- Pricing (Enterprise Search): `https://sourcegraph.com/pricing`
- Cody plan changes (blog): `https://sourcegraph.com/blog/changes-to-cody-free-pro-and-enterprise-starter-plans`
- Cody plan changes (changelog): `https://sourcegraph.com/changelog/cody-plan-changes`
- Cody FAQ (BYOK + provider details): `https://sourcegraph.com/docs/cody/faq`

## What’s priced (and what isn’t)

As of the official June/July 2025 plan-change announcements:
- **Cody Free** and **Cody Pro** were discontinued effective **2025-07-23**.
- New signups for Cody Free/Pro were closed starting **2025-06-25**.
- “Cody Enterprise” is explicitly stated as **not affected** (enterprise plan remains available), but self-serve public pricing for Cody Enterprise is not published in these sources.

Sourcegraph’s public pricing page (retrieved 2026-02-21) lists:
- **Enterprise Search** at **$49 per user per month** (spelled “monthy” on the page).

## Billing primitives to model

- Enterprise Search: **seat subscription** (published $/user-month).
- Cody (enterprise): likely **custom enterprise pricing** (no public self-serve numeric pricing).
- Cody usage: Cody FAQ describes an architecture where Sourcegraph retrieves context and sends snippets to an LLM provider (Anthropic by default; OpenAI supported), and BYOK is supported in Enterprise.

## Notes / gaps

- If we include Sourcegraph in the public calculator, we should separate “Enterprise Search” (seat subscription) from “Cody Enterprise” (custom) and clearly mark Cody Free/Pro as **historical / discontinued**.

