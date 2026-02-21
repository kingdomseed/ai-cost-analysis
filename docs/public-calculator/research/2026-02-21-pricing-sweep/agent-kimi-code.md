# Moonshot / Kimi — Kimi Code vs API pricing (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Distinctions we must keep separate

Moonshot/Kimi has (at least) three distinct “pricing surfaces”:

1) **Moonshot Open Platform API** — token-meter pricing (input/output; cache hit vs miss).  
2) **Kimi consumer app memberships** — usage is described in **counts/month** (e.g., “Agent uses/month”), and explicitly **does not include API token fees**.  
3) **Kimi Code** — a developer product/CLI agent experience on `kimi.com/code`; it is marketed separately from the Open Platform API.

## What Kimi Code is (what we can verify)

The Kimi Code marketing page describes Kimi Code as a developer toolkit / CLI-oriented code agent (SEO description references “Kimi Code (KFC)” and “Turbo” coding models). The page also links to Kimi Code documentation and to a membership pricing page.

What we **cannot** verify from public, fetchable sources in this sweep:
- A token-meter table for “Kimi Code” specifically.
- A clear statement that “Kimi Code” corresponds to a specific Open Platform API model ID with distinct per-token rates.

Because of that, Kimi Code should be represented in the dataset as a **separate tool/product** from the Moonshot Open Platform API, and should not inherit API token rates unless an official mapping is found.

## Related: Kimi memberships (counts/month; not API tokens)

Kimi memberships (Adagio/Allegretto/Allegro) publish **counts/month** for specific product features and state that membership benefits **do not include Open Platform API token fees**.

## Sources

- Kimi Code landing page: `https://www.kimi.com/code`
- Kimi Code docs (example): `https://www.kimi.com/code/docs/en/kimi-cli/guides/getting-started.html`
- Moonshot Open Platform API pricing: `https://platform.moonshot.ai/docs/pricing/chat`
- Kimi membership benefits (counts/month; membership ≠ API): `https://www.kimi.com/user/agreement/zh/membershipBenefits`

