# Kimi membership benefits — official quotas + pricing (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Scope

This note captures **official Kimi membership benefits** (pricing + included quotas) from the membership benefits markdown published by Moonshot/Kimi. This is a better “source of truth” than scraping the Kimi app UI because it includes an explicit effective date and a structured table.

Keep this separate from:
- Moonshot Open Platform API token pricing (token-metered), and
- Kimi Code as a membership perk (quota/reset semantics).

## Official membership benefits doc (CNY, monthly + annual)

The published membership benefits table defines four paid tiers (Andante, Moderato, Allegretto, Allegro) plus a free tier (Adagio), and includes:

- **Monthly prices:** ¥49 / ¥99 / ¥199 / ¥699
- **Annual prices:** ¥468 / ¥948 / ¥1948 / ¥6788
- Included monthly quotas for **Agent**, **Deep Research**, and **PPT**
- Feature flags (e.g., Agent swarm / Kimi Claw availability)
- Concurrency limits (e.g., whether 2 concurrent tasks are supported for Agent/Deep Research/PPT)

The doc also notes:
- API usage is not part of membership benefits (paid separately via the Open Platform).
- Monthly and annual plans allocate benefits on a monthly cycle; unused benefits expire (no rollover).

## Overseas USD pricing signal (Moderato)

Separately, Kimi publishes “New User First-Month Deal” event rules which explicitly state a **$19/month** regular price for **Moderato Monthly Membership** (outside mainland China), and provides a quota appendix for Moderato (Deep Research, Agent, and Kimi Code requests/week).

We treat this as an official oversea pricing signal for Moderato, but we have not yet found a similarly official oversea tier table for Allegretto/Allegro/Vivace.

## Sources (official)

- Membership benefits markdown (loaded by `kimi.com/user/agreement/*` pages): `https://kimi-img.moonshot.cn/prod-chat-kimi/kimi/member_benefits_v2.md`
- New user first-month deal rules + Moderato $19/month (overseas event page): `https://www.kimi.com/user/agreement/black-friday`

