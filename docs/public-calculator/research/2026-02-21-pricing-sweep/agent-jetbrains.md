# Agent Notes: JetBrains AI (AI Assistant + Junie) (Feb 2026)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Official sources (pricing + mechanics)

- JetBrains AI Plans & Pricing (AI in IDEs): `https://www.jetbrains.com/ai-ides/buy/`
- JetBrains AI FAQ (AI Assistant + Junie + quota/top-ups/BYOK): `https://lp.jetbrains.com/ai-ides-faq/`
- AI Assistant docs — Licensing and subscriptions (quota, credits, top-ups, renewal, examples): `https://www.jetbrains.com/help/ai-assistant/licensing-and-subscriptions.html`
- JetBrains Console docs — AI management / AI credits / quota / top-up concepts (org controls): `https://www.jetbrains.com/help/jetbrains-console/ai-management.html`
- Junie docs — Junie IDE plugin (how Junie is accessed in IDEs + “Licensing and subscriptions” section): `https://junie.jetbrains.com/docs/junie-ide-plugin.html`
- Junie docs — Junie CLI (auth options: JetBrains Account vs `JUNIE_API_KEY` vs BYOK): `https://junie.jetbrains.com/docs/junie-cli.html`
- (Context) JetBrains blog — rationale for the credit/quota model + agentic workflows consuming more credits: `https://blog.jetbrains.com/ai/2025/09/faq-new-ai-quota/`

## What is “JetBrains AI” here?

JetBrains positions “JetBrains AI” as an AI service used inside JetBrains IDEs, which includes:

- **AI Assistant** (chat + in-editor workflows) and
- **Junie** (the more autonomous coding agent).

The FAQ describes the difference as primarily **autonomy level**: AI Assistant is assistive/interactive, Junie can execute multi-step tasks (including running tests) and then present results for review.

## Billing primitive (how to model this)

For public-calculator purposes, JetBrains AI is best modeled as:

- A **per-seat subscription** (per user) that includes a **monthly quota** of **AI Credits** (“AI quota”).
- Credits are consumed for **cloud / third-party LLM-powered** features (e.g., AI chat, smart in-editor suggestions, Junie).
- Some features **do not consume quota**, notably:
  - code completion powered by JetBrains’ Mellum model,
  - “next edit suggestions” (per FAQ),
  - use of **local models** connected via Ollama/LM Studio/OpenAI-compatible servers.
- **Overage** is handled via optional **Top-up AI Credits** (if available for the plan) which are used only after the monthly quota is exhausted.

## Plans and prices (Feb 2026)

Important notes:
- JetBrains pricing pages show **per user** pricing (“/per user, per month/year”).
- JetBrains pricing is country/currency dependent (taxes vary). The docs and pricing page explain the unit pricing in USD and that billing is in local currency.
- Billing cycles for quota resets are **every 30 days from first activation/first use**, not necessarily aligned to calendar months.

### Individuals (personal)

From the pricing page:

- **AI Pro**
  - Price: **$10/month** or **$100/year**
- **AI Ultimate**
  - Price: **$30/month** or **$300/year**
  - Notes: JetBrains blog gives an annual-plan example: **AI Ultimate (annual) gives 420 AI Credits for $300** (implies 35/month, but treat as informational until the quota table is captured).

### Organizations (commercial)

From the pricing page:

- **AI Pro**
  - Price: **$20/month** or **$200/year**
- **AI Ultimate**
  - Price: **$60/month** or **$600/year**

## Quota / credit values (status)

- JetBrains confirms a **quota / AI Credits** model, but the exact quota-by-tier table was **not extracted as plain HTML** in this sweep (the FAQ page is JS-rendered and the licensing doc did not contain an explicit per-tier quota table in the fetched HTML).
- Next verification target: find a stable, official page or export that lists quota sizes for each tier (and any explicit $/credit mapping for top-ups).

## Trial + free access notes

- **Free trial:** FAQ says first activation of JetBrains AI gives an **automatic 30-day free trial of AI Pro**.
- **AI Free availability varies by product:** FAQ notes AI Free is not available in some products (examples listed include Android Studio, ReSharper, and certain IDE configurations without paid IDE subscriptions).
- **AI Pro included in other subscriptions:** FAQ states AI Pro is included at no additional cost for some JetBrains bundles/programs (e.g., All Products Pack, dotUltimate; plus select programs), with important exceptions (e.g., some complimentary/student-style bundles).

## Credits / quota mechanics (usage limits)

### What consumes credits?

FAQ: monthly quota credits are consumed by **external cloud model** usage (examples called out include AI chat, smart in-editor suggestions, and Junie). Local model usage and Mellum-powered completion do not consume quota.

### Renewal and rollover

- **Quota renewal cadence:** quota resets every **30 days** from first use/activation (AI Assistant licensing doc + FAQ).
- **Rollover:** FAQ says **unused included quota does not roll over** to the next month.

### Top-up AI Credits (overage)

Across the pricing page, AI Assistant licensing docs, and JetBrains Console docs:

- Top-ups can be purchased **in any amount**.
- They are used **only after** the included monthly quota is exhausted.
- They are valid for **12 months** from purchase.
- Org admins can set **monthly top-up limits per user** in JetBrains Console; top-ups can be managed/reallocated across users (FAQ + Console docs).

## “Is it per-seat?” and “Is quota shared?”

- **Per-seat:** pricing is per user, and JetBrains Console describes “licenses with AI” being **assigned to individual users**.
- **Quota shared across IDEs/tools:** FAQ says AI subscriptions are linked to your JetBrains Account and the **quota is shared across supported IDEs** (not per-IDE).

## Junie: separate product or included?

### In JetBrains IDEs

- Junie is positioned as a **coding agent inside JetBrains IDEs** (selectable from the agent list inside AI Chat).
- The pricing page lists Junie as a feature across AI tiers and recommends AI Ultimate for more frequent “coding agents” usage.
- Junie’s IDE plugin docs state the recommended way to use Junie in IDEs is via **AI Chat**, with plugin installation only needed for a separate tool window.

Net: Junie is not presented as a separately priced add-on for IDE usage; it is accessed through the **JetBrains AI subscription/credits**.

### Junie CLI (outside IDEs)

Junie also ships as a CLI tool with multiple auth/billing modes:

- **Log in with JetBrains Account**: use Junie CLI as part of your JetBrains subscription plan.
- **`JUNIE_API_KEY`**: “usage-based billing” (pricing is not described on the docs page itself).
- **BYOK**: provide your own OpenAI/Anthropic/etc keys and bill directly with the provider.

Note: The Junie CLI page points to `https://junie.jetbrains.com/cli` to generate a `JUNIE_API_KEY`, but that path is disallowed for automated retrieval by that site’s `robots.txt`. This sweep therefore does **not** include verified numbers for Junie’s standalone usage-based billing.
