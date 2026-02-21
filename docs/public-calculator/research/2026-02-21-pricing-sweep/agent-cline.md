# Cline — pricing & billing mechanics (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Billing primitives (what Cline can bill)

Cline supports two broad approaches:

1) **BYOK (Bring Your Own Key):** you connect a provider key and pay that provider directly (token-metered by the provider).  
2) **Cline Provider:** Cline offers a managed provider option that uses **credits** (you add credits and they work “across all available models”).

## Plans (as shown on Cline pricing page)

From `cline.bot/pricing`:

| Plan | Price | Notes |
|---|---:|---|
| Open Source | Free | “For individual developers” (as published). |
| Teams | **$0/mo** *(through Q1 2026)* | Page states “then **$20/mo/user**”. |
| Enterprise | Custom | Mentions “SSO, SLA & Dedicated Support”. |

## Credit system notes

From Cline docs:
- “Credits work across all available models.”

The public pricing page indicates credit purchases may be available “at no markup”, but **it does not publish a token↔credit conversion** on the pricing page itself.

For the calculator dataset:
- Represent Cline Provider as **credits (opaque)** until we can capture official credit pack pricing and any multipliers.
- Represent BYOK as **$0 tool cost + provider token pricing**.

## Sources

- Cline pricing: `https://cline.bot/pricing`
- Cline authorization & model selection (Cline Provider + “Adding Credits”): `https://docs.cline.bot/getting-started/authorizing-with-cline`

