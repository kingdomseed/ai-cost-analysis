# Anthropic (Claude) pricing + limits — snapshot (2026-02-21)

This note captures **official** Anthropic pricing/limits as of **2026-02-21** for use in the public calculator dataset.

## Metadata

| Field | Value |
|---|---|
| `retrieved_at` | 2026-02-21 |
| `last_verified_at` | 2026-02-21 |
| Currency | USD |
| Token unit | `MTok` = 1,000,000 tokens |

---

## 1) Anthropic API pricing (tokens + prompt caching)

Primary official source: [Claude API Docs — Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### 1.1 Per-model token pricing (USD per 1M tokens)

> The Claude API docs pricing tables list **Base Input Tokens**, **Output Tokens**, and prompt caching categories (**5m Cache Writes**, **1h Cache Writes**, **Cache Hits & Refreshes**). See: [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) and corroboration on [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).

| Model | Base input ($/MTok) | Output ($/MTok) | 5m cache writes ($/MTok) | 1h cache writes ($/MTok) | Cache hits & refreshes ($/MTok) | Notes |
|---|---:|---:|---:|---:|---:|---|
| Claude Opus 4.6 | 5.00 | 25.00 | 6.25 | 10.00 | 0.50 | “research preview” is referenced for Opus 4.6 fast mode; see modifiers below |
| Claude Sonnet 4.6 | 3.00 | 15.00 | 3.75 | 6.00 | 0.30 |  |
| Claude Haiku 4.5 *(Haiku)* | 1.00 | 5.00 | 1.25 | 2.00 | 0.10 | Latest Haiku SKU shown on pricing table as of 2026-02-21 |

**Corroboration sources**
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### 1.2 Prompt caching: what the “cache” columns mean + multipliers

Prompt caching is officially documented here: [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

Key pricing multipliers called out in official docs (relative to **base input token price**):

| Item | Multiplier vs base input | Where documented |
|---|---:|---|
| 5-minute cache write tokens | 1.25× | [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) (also reflected in prompt caching table) |
| 1-hour cache write tokens | 2× | [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) (also reflected in prompt caching table) |
| Cache read tokens (“cache hits & refreshes”) | 0.1× | [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) |

Other prompt-caching notes from official docs:
- Default cache lifetime is **5 minutes**; an optional **1-hour TTL** exists. ([Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching))
- The pricing pages describe cache behavior as: *cache is refreshed at no additional cost each time the cached content is used* (5-minute cache). ([Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching))

---

## 2) Long-context pricing (200K+ threshold) and related multipliers

### 2.1 200K input-token threshold (premium long-context pricing)

Official sources:
- [Claude API Docs — Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Claude API Docs — Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)

**Documented behavior**
- Pricing tier is determined by **input tokens**; the docs explicitly note the 200K threshold is based on **input tokens (including cache reads/writes)**, and that output count does **not** affect tier selection. ([Pricing](https://platform.claude.com/docs/en/about-claude/pricing))
- Requests exceeding **200K** tokens are charged at **premium rates**. The context-windows doc explicitly describes premium rates as: **2× input** and **1.5× output** pricing. ([Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows))
- The pricing docs also state: if a request exceeds **200K input tokens**, **all tokens** incur premium pricing (not just the portion above 200K). ([Pricing](https://platform.claude.com/docs/en/about-claude/pricing))

### 2.2 Other pricing multipliers documented in API pricing docs (may affect calculator scope)

These are not strictly “long context” or “prompt caching”, but they are explicit token-price multipliers noted in the official API pricing docs and may matter for a public calculator.

| Modifier | Effect | Source |
|---|---|---|
| Regional / data residency endpoints | Docs describe a **10% premium** over global endpoints, using a **1.1× multiplier** on all token pricing categories when applicable. | [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) |
| Fast mode (Opus 4.6 research preview) | Docs describe **6× standard rates** for fast mode; also note it applies across the full context window (including long context). | [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) and [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) |

---

## 3) Consumer subscription pricing (Claude Pro / Max 5x / Max 20x)

Primary official sources:
- [Choosing a Claude plan](https://support.claude.com/en/articles/11049762-choosing-a-claude-plan)
- [What is the Pro plan?](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan)
- [What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)
- Corroboration for Max price points: [Max plan pricing page](https://claude.com/pricing/max)

### 3.1 Plan prices (USD)

| Plan | Price | Billing | Notes / “usage included” framing | Official sources |
|---|---:|---|---|---|
| Pro | $20 | per month | Usage limits vary by demand and usage patterns; Pro is described as providing **at least ~5× more usage than Free during peak hours**. | [What is the Pro plan?](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan), [Choosing a Claude plan](https://support.claude.com/en/articles/11049762-choosing-a-claude-plan) |
| Pro | $200 | per year | Annual option shown in plan comparison. *(Effective monthly price is $200/12; not always shown explicitly as a single “$X/mo” figure.)* | [Choosing a Claude plan](https://support.claude.com/en/articles/11049762-choosing-a-claude-plan) |
| Max 5x | $100 | per month | Described as “5× more usage per session than Pro”. | [What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan), [Max plan pricing page](https://claude.com/pricing/max) |
| Max 20x | $200 | per month | Described as “20× more usage per session than Pro”. | [What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan), [Max plan pricing page](https://claude.com/pricing/max) |

**Corroboration sources for Max pricing**
- [What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)
- [Max plan pricing page](https://claude.com/pricing/max)

---

## 4) Consumer usage limits: what’s officially documented (rolling windows, “message limits”, reset timing)

Anthropic’s consumer-plan documentation generally describes limits as **budgets** that vary based on how you use Claude (not fixed “N messages/day” quotas).

### 4.1 How usage limits are described

Official sources:
- [Understanding usage and length limits](https://support.claude.com/en/articles/11647753-understanding-usage-and-length-limits)
- [Usage limit best practices](https://support.claude.com/en/articles/9797557-usage-limit-best-practices)

Key points:
- Usage limits are described as a **conversation budget** over a defined time period, and the number of messages you can send varies based on factors like message length/complexity and features used. ([Understanding usage and length limits](https://support.claude.com/en/articles/11647753-understanding-usage-and-length-limits))
- The help docs explicitly describe **two usage limits** you can hit: a **5-hour session limit** and a **weekly usage limit**. ([Usage limit best practices](https://support.claude.com/en/articles/9797557-usage-limit-best-practices))

### 4.2 Reset timing / rolling windows

Official sources:
- [Understanding usage and length limits](https://support.claude.com/en/articles/11647753-understanding-usage-and-length-limits)
- [Usage limit best practices](https://support.claude.com/en/articles/9797557-usage-limit-best-practices)
- [What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)

| Limit type | What it is | Reset behavior (as documented) |
|---|---|---|
| Session limit | A per-session usage budget | Resets every **5 hours**. |
| Weekly usage limit | A longer-horizon usage budget | Resets **7 days after the start of the session** (rolling weekly window). The Help Center describes the weekly timer as tied to the start of a session, rather than resetting at a fixed calendar boundary. |

### 4.3 Extra usage beyond included limits (paid plans)

Official sources:
- [Extra usage for paid Claude plans](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)

Documented option:
- After reaching included usage limits, paid users can enable **consumption-based pricing** to continue using Claude; the docs describe this as billed at **standard API pricing**. ([Extra usage for paid Claude plans](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans))

---

## 5) Source index (official links)

### API pricing and modifiers
- https://platform.claude.com/docs/en/about-claude/pricing
- https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- https://platform.claude.com/docs/en/build-with-claude/context-windows

### Consumer plan pricing and limits
- https://support.claude.com/en/articles/11049762-choosing-a-claude-plan
- https://support.claude.com/en/articles/8325606-what-is-the-pro-plan
- https://support.claude.com/en/articles/11049741-what-is-the-max-plan
- https://support.claude.com/en/articles/11647753-understanding-usage-and-length-limits
- https://support.claude.com/en/articles/9797557-usage-limit-best-practices
- https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans
- https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan
- https://claude.com/pricing/max

---

## 6) Ambiguities / not explicitly specified (as of 2026-02-21)

- **Consumer “message limits” are not a single fixed number**: the Help Center frames limits as a *usage budget* whose message count varies by conversation length/complexity, model/features used, and other factors. ([Understanding usage and length limits](https://support.claude.com/en/articles/11647753-understanding-usage-and-length-limits))
- **Long-context premium rates vs cache token categories**: docs clearly define premium long-context multipliers for input/output (2×/1.5×) and state the 200K threshold is based on input tokens including cache reads/writes; however, the docs don’t (in the sections referenced here) spell out a separate long-context multiplier specifically for cache read/write categories. ([Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows))
