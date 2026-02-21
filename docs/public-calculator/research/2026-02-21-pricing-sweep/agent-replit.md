# Agent Notes: Replit (Feb 2026)

Retrieved at: **2026-02-21**

## Official sources (pricing + billing)

- Pricing page (plan names, benefits, comparison table): `https://replit.com/pricing`
- Blog announcement (pricing changes effective **2026-02-24**): `https://blog.replit.com/pro-plan`
- AI billing overview (Agent effort-based pricing + “all interactions are billable”): `https://docs.replit.com/billing/ai-billing`
- Usage-based billing (publishing: outbound transfer, compute units, requests; when billing occurs): `https://docs.replit.com/billing/about-usage-based-billing`
- Deployment pricing (publishing charges deducted from monthly credits first): `https://docs.replit.com/billing/deployment-pricing`
- Starter plan (free plan limits; Plan Mode requires Core): `https://docs.replit.com/billing/plans/starter-plan`
- Core plan (high-level features; points to pricing page for limits/cost): `https://docs.replit.com/billing/plans/replit-core`
- Teams billing overview (seats + usage-based; credit packs): `https://docs.replit.com/billing/teams-billing/overview`
- Managing spend (credit packs; budgets/alerts): `https://docs.replit.com/billing/managing-spend`
- Replit AI Integrations (managed access to OpenAI/Anthropic/Google/OpenRouter; billed to Replit credits at public API price; BYOK option): `https://docs.replit.com/replitai/replit-ai-integrations`

## Billing primitive (how to model it)

Replit is best modeled as:

1. **Subscription plans** (Starter / Core / Teams / Enterprise) with monthly vs yearly billing (where applicable).
2. A built-in account/org “currency” called **credits**, denominated in **USD** (e.g., “$100 credits”, “$25 of monthly credits”).
3. **Usage-based billing** for multiple product surfaces (Agent, publishing/deployments, production databases, AI integrations), with charges deducted from credits first.

### Credits (USD-denominated)

From the Teams billing + managing spend docs, credit packs are expressed as “$X credits” with corresponding USD price (e.g., “$100 credits” costs $100), implying **1 credit ~= $1 USD**:

- $100 credits → $100
- $300 credits → $290
- $500 credits → $480
- $1,000 credits → $950

Credit packs:
- Expire **6 months** after purchase.
- Do **not** renew.
- Are consumed from the pack that expires soonest.

### When you get charged (timing)

From the usage-based billing doc:
- Billing occurs **monthly** or once accumulated costs **exceed your monthly credits**.

### What “usage-based” includes (selected)

Agent (Replit AI):
- **Effort-based pricing**; Agent produces **checkpoints**; “all Agent interactions are billable” (including Plan Mode conversations).

Publishing / deployments:
- Usage-based billing primitives called out explicitly:
  - Outbound data transfer (egress)
  - Autoscale compute units (CPU + RAM time)
  - Requests
- Deployment pricing doc notes: **publishing costs are deducted from monthly credits first**; you pay usage-based fees after credits are used.

Databases:
- Usage-based for **production** PostgreSQL (compute time + storage), per the usage-based billing doc.

AI Integrations (third-party models via Replit-managed credentials):
- Billed to Replit credits at the **public API price**; optional “bring your own API key” shifts billing to the provider instead.

## Plans & prices (USD)

### Starter (Free)

Pricing page positions Starter as **Free** with:
- “Replit Agent trial included”
- Limited build time / limited autonomy (no “long full autonomy”)

Starter plan doc adds:
- Daily credits for Agent (up to a monthly cap) and monthly credits for cloud usage (no numeric values published on that page at retrieval time).
- Plan Mode requires **Core**.

### Core

From the pricing page UI:
- **$25/month** when billed monthly.
- **$20/month billed annually** (i.e., **$240/year**).
- Includes **$25 of monthly credits**.

Key inclusions called out on the pricing page (selected):
- “Full Replit Agent access”
- “Access to latest models”
- “Autonomous long builds”
- “Pay-as-you-go for additional usage”

Implementation detail (useful for verification / scraping):
- The pricing page HTML includes embedded `__NEXT_DATA__` / Apollo state with `subscriptionPlans.pro.stripe.*.costInUsdCents`:
  - Monthly: `2500`
  - Yearly: `24000`

### Teams

From the pricing page UI:
- **$40/user/month** when billed monthly.
- **$35/user/month billed annually** (i.e., **$420/user/year**).
- Includes **$40/month in usage credits** (and notes credits are granted upfront on annual plan).

Key inclusions called out on the pricing page (selected):
- “Everything included with Replit Core”
- Centralized billing
- Role-based access control
- Private deployments
- “50 Viewer seats”
- “Pay-as-you-go for additional usage”

Teams billing doc clarifies the billing structure:
- Teams has two parts: **seat pricing** (fixed fee per user per period) + **usage-based costs**.

Implementation detail (useful for verification / scraping):
- The pricing page embedded Apollo state includes `subscriptionPlans.teams.orb.*.costInUsdCents`:
  - Monthly: `4000`
  - Yearly: `42000`

### Enterprise

- Pricing page indicates **Custom pricing**.
- The plan comparison table includes larger dev resources (e.g., “Up to 64 vCPUs”, “Up to 128 GiB RAM”) and enterprise controls (SSO, etc.), but no public list price.

## AI / Agent: included vs separate

### What’s “included” with plans (capability access)

From the pricing page plan cards + plan comparison table:
- Starter includes **limited Agent** and **basic autonomy**.
- Core/Teams/Enterprise include more advanced Agent/autonomy capability (table shows “Advanced” for autonomy/code generation/debugger on paid tiers).

Starter plan doc also explicitly gates:
- **Plan Mode** behind Core
- “Autonomous Mode” behind paid plans
- Third-party connectors behind Core

### What’s billed separately (usage-based)

Even when a plan includes “Agent access”, costs are still usage-based:
- Agent uses **effort-based pricing** and bills per request / checkpoint (credits apply first).
- Publishing/deployments, outbound transfer, autoscale compute units, requests, and production databases are billed usage-based (credits apply first).

### AI Integrations (provider APIs via Replit-managed credentials)

From the Replit AI Integrations doc:
- Replit provides managed access to external model providers (OpenAI/Anthropic/Google/OpenRouter).
- Usage is billed to **Replit credits** at the **public API price**.
- Users can switch to **BYOK** (their own API key) to be billed directly by the provider instead of via Replit credits.

## Forward-looking change (announced, not yet effective on 2026-02-21)

Replit announced a pricing restructure effective **2026-02-24**:
- A new **Pro** plan starting at **$100/month** for teams (with tiered credits, up to 15 builders, pooled credits/budget controls, and other benefits).
- **Teams** plan will be sunset; Teams users migrate to Pro per the announcement.
- Core is upgraded to include collaboration (up to 5 people) “for no change in price”.

Source: `https://blog.replit.com/pro-plan`

## Notes / gaps for calculator modeling

- Several Replit docs pages render some numeric values as blanks at retrieval time (e.g., exact monthly credit allowances in `ai-billing` and `teams-billing/overview`, and budget increments in `managing-spend`). For numeric plan credit amounts, the pricing page UI text currently provides:
  - Core: **$25 of monthly credits**
  - Teams: **$40/month in usage credits included per seat**
- If you want an automated, stable extraction path for the calculator dataset, the pricing page embedded Apollo state contains the definitive **subscription** prices in USD cents (see “Implementation detail” notes above).
