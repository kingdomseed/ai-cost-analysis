# Agent Notes: OpenAI Codex (ChatGPT plan + credits) — Pricing Sweep

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## What this page covers

This note captures the official Codex pricing mechanics when used via **ChatGPT plans**:

- Rolling-window usage limits (local messages + cloud tasks)
- Weekly code review limits
- “Credits” as the overflow mechanism, and average credit costs by task type
- Time-sensitive promotions called out on the Codex pricing page (if present)

This is separate from **OpenAI API token billing**, which is priced per-token on `developers.openai.com` / `platform.openai.com`.

## Official usage limits (rolling 5-hour window)

The Codex pricing page states local message and cloud task usage limits share a **5-hour window** and depend on task complexity.

| Plan | Local messages / 5h | Cloud tasks / 5h | Code reviews / week |
| --- | --- | --- | --- |
| ChatGPT Plus | 45–225 | 10–60 | 10–25 |
| ChatGPT Pro | 300–1500 | 50–400 | 100–250 |
| ChatGPT Business | 45–225 | 10–60 | 10–25 |
| ChatGPT Enterprise & Edu | No fixed limits — usage scales with credits | | |

## Credits (overflow pricing primitive)

The page describes “credits” as the mechanism to continue using Codex after included limits are reached. Credit cost varies by complexity; the table below is described as **average credit costs** and may evolve.

| Task type | Unit | GPT-5.3-Codex / GPT-5.2-Codex | GPT-5.1-Codex-Mini |
| --- | --- | --- | --- |
| Local tasks | 1 message | ~5 credits | ~1 credit |
| Cloud tasks | 1 message | ~25 credits | Not available |
| Code review | 1 pull request | ~25 credits | Not available |

Important: the page does **not** provide a public $/credit conversion in the content accessible during this sweep.

## Promotions / time-sensitive notes

The Codex pricing page includes time-sensitive promotional language (e.g., limited-time free access on lower tiers and/or increased Codex rate limits). Treat these as **promotions** and re-verify if/when we build the calculator UX that models them.

## Sources (official)

- Codex pricing (ChatGPT plans + credits): `https://developers.openai.com/codex/pricing/`
