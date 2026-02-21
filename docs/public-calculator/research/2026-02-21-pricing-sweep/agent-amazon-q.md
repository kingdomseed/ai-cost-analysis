# Agent Notes: Amazon Q Developer (Feb 2026)

Retrieved at: **2026-02-21**
`retrieved_at`: `2026-02-21`

## Official sources

- AWS pricing page (primary): `https://aws.amazon.com/q/developer/pricing/`
- AWS docs: Tiers overview: `https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/q-tiers.html`
- AWS docs: Service quotas/limits: `https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/quotas.html`
- AWS docs: Cost + billing across orgs: `https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/tracking-across-org-cost-usage.html`

## Plan tiers (Free / Pro / “Enterprise”)

AWS publishes **two** pricing tiers for Amazon Q Developer: **Free** and **Pro** (no separate “Enterprise” tier is listed on the official pricing page or tier docs as of `retrieved_at=2026-02-21`).

If you need an “enterprise” concept for modeling, the closest official distinction is **how Pro is provisioned**:
- **Pro via IAM Identity Center** adds admin dashboards/controls and org-level billing behavior.
- **Pro via Builder ID (personal)** is billed monthly to the linked AWS account and does **not** include some admin features.

## Per-user cost

From the AWS pricing page:
- **Free tier:** `$0`
- **Pro tier:** **$19 per month per user**

## Included features (selected from pricing page)

### Free tier

- “Limited agentic requests per month” (see quotas below)
- “Access latest Claude models”
- “Use in the IDE or CLI”
- **Reference tracking:** Yes
- **Suppress public code suggestions:** Yes
- **Data collection:** Opt-out available
- **IP indemnity:** No
- **AWS Console:** General Q&A + diagnose common console errors

### Pro tier

Everything in Free tier, plus:
- “Increased limits of agentic requests”
- “Increased limits for Java and .NET app transformation”
- **IAM Identity Center support** with “admin dashboards and controls”
- **IP indemnity:** Yes

## Quotas / limits (officially published)

### Free tier limits (from pricing page)

- **Agentic requests (Q&A chat, agentic coding):** **50 agentic requests per month**
- **Java upgrades (transformation capability):** **1,000 lines of code per month** (per user)

Notes from the pricing page:
- AWS indicates limits “might be updated depending on regional factors, payment history, fraudulent usage, or approval of a quota increase request” and refers to the service limits documentation.
- Free tier limit scope differs by login type (IAM user vs Builder ID).

### Pro tier quotas (from AWS service quotas doc)

In IDEs and CLI:
- **Agentic requests:** **10,000 inference calls per month** (AWS states this is “equivalent of roughly 1,000 user inputs”) per user
- **Agent for code transformation (Java):** **4,000 lines of code per month per Pro subscription, pooled at the account level**

In the AWS Management Console:
- **Generative SQL:** **1,000 queries per month** per user
- **Analyze network reachability:** **20 requests per day** per user

In Amazon CodeCatalyst:
- **Agent for software development:** **30 per month** per user
- **Pull request summaries:** **20 per month** per user

.NET transformation quotas (from AWS service quotas doc):
- **Pro subscription:** **1,000,000 LOC per supported Region** (per user)
- **Concurrent .NET jobs (Visual Studio extension, Pro):** **10 jobs per supported Region** (per user)
- **Builder ID usage (Visual Studio extension):** **1,000 LOC per supported Region** + **1 concurrent job per supported Region** (per user)

## Billing primitive (what to model)

Amazon Q Developer Pro is primarily a **seat-based subscription**:
- **Unit:** user-month (“per user, per month”)
- **Price:** **$19 / user-month**
- **Activation-based billing start:** the pricing FAQ states that simply signing in to Q chat (console/IDE) or downloading the toolkit does not start billing; billing starts when the user performs specific Q Developer activities (agentic coding plans, transformation plans, or code completions).
- **Who gets billed:** the pricing FAQ states only the specific user who activates their subscription is billed; other users are not billed unless they also perform subscription-activating actions.
- **Proration:** the pricing FAQ states the first month is **pro-rated** based on days remaining when activated.
- **Cancellation:** the pricing FAQ states canceling before month-end still charges the **full month** fee (access ends immediately on cancellation).

There is also a **usage-based overage component** for transformation:
- Pro includes **4,000 LOC per month per Pro subscription (pooled at payer account)** for Java transformation.
- Overages are charged at **$0.003 per line of code submitted** (beyond included allocations).

### Org billing behavior (IAM Identity Center + AWS Organizations)

From AWS docs on tracking costs across an org:
- For **Builder ID (personal) Pro**, the linked **AWS account** receives the monthly bill.
- For **IAM Identity Center workforce users**, billing is monthly for each subscribed user.
- If **AWS Organizations** is in use, billing is “per AWS organization” and the **management account** receives the bill; if the same user is subscribed in multiple accounts within the same org, AWS states they are **not double-billed**.

### Cost attribution primitive (resource IDs)

AWS docs note you can attribute Q subscription cost to specific users by exporting billing data with **resource IDs** (via AWS Billing and Cost Management → Data Exports / CUR export with “Include resource IDs”).
