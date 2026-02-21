# Kimi Code (Kimi membership perk) — Update (Feb 2026)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## What “Kimi Code” is (official descriptions)

Kimi Code is described in official docs as a **coding-focused benefit inside the Kimi membership plan**, intended to support personal development workflows and to integrate with:

- Kimi Code CLI / VS Code flows (login + API key), and
- selected third-party coding agents (explicitly mentions Claude Code and Roo Code in the docs).

## Billing primitive (how to model it)

Kimi Code is **not presented as token-metered API billing**. Instead:

- Kimi Code usage is deducted from a **subscription quota** included with your Kimi membership.
- For enterprise needs, the docs direct you to the **Moonshot AI Open Platform** (prepaid/usage-based billing, model selection, broader integrations).

This means “Kimi Code” should be modeled separately from Moonshot Open Platform API token pricing.

## Quotas / reset mechanics (official)

From the benefits doc:

- **Quota refresh:** 7-day rolling cycle starting from subscription activation date (D1–D7, then D8–D14, etc.).
- **No rollover:** unused quotas do not carry over.
- **Where quota applies:** API key requests and direct login usage both consume the plan quota.

From the docs overview:

- Describes a “**5-hour token quota**” supporting approximately **300–1,200 API calls** and a **max concurrency of 30**.

Note: the relationship between the “5-hour token quota” description and the 7-day rolling quota refresh is not fully explained in the public docs; treat them as separately stated constraints until clarified by Moonshot/Kimi.

## Model identity (official UI text)

The public `kimi.com/code` page includes UI text showing:

- `Model: kimi-for-coding (powered by kimi-k2.5)`

Interpretation for the dataset:

- Treat `kimi-for-coding` as a **Kimi Code product model ID** (subscription/quota surface).
- Do **not** assume it is billable at Open Platform per-token rates unless Moonshot publishes an explicit mapping.

## Membership pricing (official, SSR page)

The `kimi.com/membership/landing` page renders plan names and prices in HTML (CNY, annual):

- **Andante:** ¥468 / year
- **Moderato:** ¥948 / year
- **Allegretto:** ¥1,948 / year

This page also references Kimi Code as part of membership features (e.g., “Kimi Code 20× quota” appears in the plan feature list), but does not provide a token↔quota conversion.

## Membership quotas + monthly pricing (official, machine-readable markdown)

Kimi also publishes a membership benefits markdown file (loaded by the `kimi.com/user/agreement/*/membershipBenefits` pages) which includes:

- **Monthly prices:** ¥49 / ¥99 / ¥199 / ¥699 (Andante/Moderato/Allegretto/Allegro)
- **Annual prices:** ¥468 / ¥948 / ¥1948 / ¥6788
- Monthly quotas for Agent, Deep Research, and PPT, plus feature flags like Agent swarm and Kimi Claw availability.

This is the most precise official source we’ve found so far for membership quotas, and should be preferred over UI scraping.

## Sources (official)

- Kimi Code docs (overview): `https://www.kimi.com/coding/docs/en/`
- Kimi Code docs (benefits + quota refresh): `https://www.kimi.com/coding/docs/en/benefits.html`
- Kimi Code landing page (model text): `https://www.kimi.com/code`
- Kimi membership pricing landing (SSR): `https://www.kimi.com/membership/landing`
- Kimi membership benefits markdown (quotas + CNY monthly/annual pricing): `https://kimi-img.moonshot.cn/prod-chat-kimi/kimi/member_benefits_v2.md`
