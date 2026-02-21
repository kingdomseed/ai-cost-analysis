---
title: Cursor pricing capture (user-provided)
retrieved_at: 2026-02-21
last_verified_at: 2026-02-21
notes:
  - This file was captured manually by the repo owner and moved into the sweep folder for organization.
  - Treat URLs inside as the canonical sources; do not rely on third-party summaries.
---

Here is a comprehensive outline of Cursor's complete usage-based pricing model, explaining exactly how your subscription translates to API costs.

Cursor has shifted away from a flat "number of messages" model to a **prepaid token economy** where your monthly subscription fee acts as a bucket of API credits consumed by the underlying AI models. [cursor](https://cursor.com/docs/models#model-pricing)

## 1. The Core Subscription (Prepaid Buckets)
Your base subscription tier determines how much upfront API credit you receive each month before hitting pay-as-you-go overages.
- **Hobby (Free):** Basic trial access with strictly limited capabilities.
- **Pro ($20/month):** Provides exactly $20 worth of included model usage. [cursor](https://cursor.com/docs/models#model-pricing)
- **Pro Plus ($60/month):** Provides $70 worth of included model usage (a $10 bonus value).
- **Ultra ($200/month):** Provides $400 worth of included model usage (a $200 bonus value).

## 2. How Your Bucket Drains (Model Pricing)
Every time you prompt an agent or chat, tokens are deducted from your monthly bucket based on the exact API rates of the model you are using. Prices are calculated per 1 million (1M) tokens. [cursor](https://cursor.com/docs/models#model-pricing)

**Premium Frontier Models (High Burn Rate)**
- **Claude 4.6 Opus:** $5 Input | $25 Output  [cursor](https://cursor.com/docs/models#model-pricing).
- **Claude 4.6 Sonnet:** $3 Input | $15 Output  [cursor](https://cursor.com/docs/models#model-pricing).
- **Cursor Composer 1.5:** $3.50 Input | $17.50 Output  [cursor](https://cursor.com/docs/models#model-pricing).

**Standard Frontier Models (Medium Burn Rate)**
- **GPT-5.3 Codex & GPT-5.2:** $1.75 Input | $14 Output  [cursor](https://cursor.com/docs/models#model-pricing).
- **Gemini 3.1 Pro:** $2 Input | $12 Output  [cursor](https://cursor.com/docs/models#model-pricing).

**Fast / Cost-Effective Models (Low Burn Rate)**
- **Gemini 3 Flash:** $0.50 Input | $3 Output  [cursor](https://cursor.com/docs/models#model-pricing).
- **xAI Grok Code:** $0.20 Input | $1.50 Output  [cursor](https://cursor.com/docs/models#model-pricing).

## 3. "Auto" Mode (The Flat Rate Alternative)
Instead of manually selecting a model, you can enable "Auto." Cursor will dynamically select the best model for the task based on current demand and reliability. [cursor](https://cursor.com/docs/models#model-pricing)
- **Auto Pricing:** $1.25 Input | $6.00 Output  [cursor](https://cursor.com/docs/models#model-pricing).
- **Why it matters:** This acts as a blended, predictable rate. It is significantly cheaper than forcing Claude 4.6 Sonnet or Opus for every query, stretching your monthly bucket much further. [cursor](https://cursor.com/docs/models#model-pricing)

## 4. Context Windows and "Max Mode"
The amount of context (your codebase, prompt, and attached files) heavily impacts input token costs. [cursor](https://cursor.com/docs/models#model-pricing)
- **Standard Context:** Models support up to 200k–272k tokens by default. [cursor](https://cursor.com/docs/models#model-pricing)
- **Max Mode:** Extends the context window to the model's absolute limit (up to 1M tokens for Claude and Gemini). [cursor](https://cursor.com/docs/models#model-pricing)
- **The Catch:** Using Max Mode incurs the model's standard token API rate **plus a 20% upcharge**, which will drain your usage bucket extremely fast on large codebases. [cursor](https://cursor.com/docs/models#model-pricing)

## 5. Overages and Add-Ons
Once your monthly bucket (e.g., $70 on Pro Plus) hits zero, your service does not stop.
- **On-Demand Usage:** You transition to pay-as-you-go billing. You are billed in arrears at the exact per-token API rates listed above for whatever models you continue to use. [cursor](https://cursor.com/docs/account/pricing)
- **Bugbot (Optional):** Automated code review on pull requests is billed entirely separately at $40/month. [cursor](https://cursor.com/docs/account/pricing)
- **Cloud Agents:** Autonomous background agents run on their own compute and consume your standard token API limits, requiring you to set a hard spend limit to prevent runaway costs. [cursor](https://cursor.com/docs/account/pricing)\


## Model Pricing Page Contents:
Models
Cursor supports all frontier coding models from all major model providers.

Name	Default Context	Max Mode	
Capabilities

Anthropic
Claude 4.6 Opus

200k	1M	




Anthropic
Claude 4.6 Sonnet

200k	1M	



Cursor
Composer 1.5
200k	-	



Google
Gemini 3 Flash
200k	1M	



Google
Gemini 3.1 Pro
200k	1M	




OpenAI
GPT-5.2

272k	-	




OpenAI
GPT-5.3 Codex

272k	-	




xAI
Grok Code
256k	-	


Show more models
Model pricing
Cursor plans include usage at the model API rates. For example, $20 of included usage on the Pro plan will be consumed based on your model selection and its price.

Usage limits are shown in editor based on your current consumption. All prices are per million tokens.

Name	
Input

Cache Write

Cache Read

Output

Anthropic
Claude 4.6 Opus

$5	$6.25	$0.5	$25

Anthropic
Claude 4.6 Sonnet

$3	$3.75	$0.3	$15
Cursor
Composer 1.5
$3.5	-	$0.35	$17.5
Google
Gemini 3 Flash
$0.5	-	$0.05	$3
Google
Gemini 3.1 Pro
$2	-	$0.2	$12

OpenAI
GPT-5.2

$1.75	-	$0.175	$14

OpenAI
GPT-5.3 Codex

$1.75	-	$0.175	$14

xAI
Grok Code
$0.2	-	$0.02	$1.5
Show more models

These prices are from the model's API documentation:

OpenAI Pricing
Anthropic Pricing
Google Gemini Pricing
xAI Pricing
Auto
Enabling Auto allows Cursor to select the model best fit for the immediate task and with the highest reliability based on current demand. This feature can detect degraded output performance and automatically switch models to resolve it.

Auto consumes usage at the following API rates:

Input + Cache Write: $1.25 per 1M tokens
Output: $6.00 per 1M tokens
Cache Read: $0.25 per 1M tokens
Both the editor and dashboard will show your usage, which includes Auto. If you prefer to select a model directly, usage is incurred at that model's list API price.

Context windows
A context window is the maximum span of tokens (text and code) an LLM can consider at once, including both the input prompt and output generated by the model.

Each chat in Cursor maintains its own context window. The more prompts, attached files, and responses included in a session, the more context is added, filling up the available context window.

Learn more about working with context in Cursor.

Max Mode
Max Mode extends the context window to the maximum a model supports. More context gives models deeper understanding of your codebase, leading to better results on complex tasks. The models table above shows each model's maximum context size.

Max Mode uses token-based pricing at the model's API rate plus a 20% upcharge. Learn more about Max Mode.

FAQ

Where are models hosted?
Models are hosted on US, Canada, & Iceland based infrastructure by the model's provider, a trusted partner, or Cursor directly.

When Privacy Mode is enabled, neither Cursor nor model providers store your data. All data is deleted after each request. For details see our Privacy Policy and Security pages.


## Pricing Page Contents
Pricing
You can try Cursor for free or purchase an individual or team plan.

Individual
All individual plans include:

Unlimited tab completions
Extended agent usage limits on all models
Access to Bugbot
Access to Cloud Agents
Each plan includes usage charged at model inference API prices:

Pro includes $20 of API agent usage + generous Auto and Composer usage
Pro Plus includes $70 of API agent usage + generous Auto and Composer usage
Ultra includes $400 of API agent usage + generous Auto and Composer usage
We work hard to grant additional bonus capacity beyond the guaranteed included usage. Since different models have different API costs, your model selection affects token output and how quickly your included usage is consumed. You can view usage and token breakdowns on your dashboard. Limit notifications are routinely shown in the editor.

To understand how usage is calculated, see our guide on tokens and pricing.

How much usage do I need?
For individual plans, here are typical usage levels based on our data:

Daily Tab users: Always stay within $20
Limited Agent users: Often stay within the included $20
Daily Agent users: Typically $60–$100/mo total usage
Power users (multiple agents/automation): Often $200+/mo total usage
What happens when I reach my limit?
When you exceed your included monthly usage, you'll be notified in the editor and can choose to:

Add on-demand usage: Continue using Cursor at the same API rates with pay-as-you-go billing
Upgrade your plan: Move to a higher tier for more included usage
On-demand usage is billed monthly at the same rates as your included usage. Requests are never downgraded in quality or speed.

Teams
There are two teams plans: Teams ($40/user/mo) and Enterprise (Custom).

Team plans provide additional features like:

Privacy Mode enforcement
Admin Dashboard with usage stats
Centralized team billing
SAML/OIDC SSO
We recommend Teams for any customer that is happy self-serving. We recommend Enterprise for customers that need priority support, pooled usage, invoicing, SCIM, or advanced security controls.

Learn more about Teams pricing.

Auto
Enabling Auto allows Cursor to select the model best fit for the immediate task and with the highest reliability based on current demand. This feature can detect degraded output performance and automatically switch models to resolve it.

Model picker
Auto consumes usage at the following API rates:

Input + Cache Write: $1.25 per 1M tokens
Output: $6.00 per 1M tokens
Cache Read: $0.25 per 1M tokens
Both the editor and dashboard will show your usage, which includes Auto. If you prefer to select a model directly, usage is incurred at that model's list API price.

Max Mode
Max Mode extends the context window to the maximum a model supports. It uses token-based pricing at the model's API rate plus a 20% upcharge, so it consumes usage faster than the default context window. Max Mode is designed for users who want the best possible experience, regardless of cost.

Bugbot
Bugbot is a separate product from Cursor subscriptions and has its own pricing plan.

Pro ($40/mo): Unlimited reviews on up to 200 PRs/month, unlimited access to Cursor Ask, integration with Cursor to fix bugs, and access to Bugbot Rules
Teams ($40/user/mo): Unlimited code reviews across all PRs, unlimited access to Cursor Ask, pooled usage across your team, and advanced rules and settings
Enterprise (Custom): Everything in Teams plus advanced analytics and reporting, priority support, and account management
Learn more about Bugbot pricing.

Cloud Agent
Cloud Agents are charged at API pricing for the selected model. You'll be asked to set a spend limit for Cloud Agents when you first start using them.

## Simple Pricing Page Contents
Individual Plans
Hobby
Free

Includes:

✓
No credit card required
✓
Limited Agent requests
✓
Limited Tab completions
Download
Pro
$20
 / mo.

Everything in Hobby, plus:

✓
Extended limits on Agent
✓
Unlimited Tab completions
✓
Cloud Agents
✓
Maximum context windows
Get Pro
Pro+
Recommended

$60
 / mo.

Everything in Pro, plus:

✓
3x usage on all OpenAI, Claude, Gemini models
Get Pro+
Ultra
$200
 / mo.

Everything in Pro, plus:

✓
20x usage on all OpenAI, Claude, Gemini models
✓
Priority access to new features
Get Ultra
Business Plans
Teams
$40
 / user / mo.

Everything in Pro, plus:

✓
Shared chats, commands, and rules
✓
Centralized team billing
✓
Usage analytics and reporting
✓
Org-wide privacy mode controls
✓
Role-based access control
✓
SAML/OIDC SSO
Get Teams
Enterprise
Custom

Everything in Teams, plus:

✓
Pooled usage
✓
Invoice/PO billing
✓
SCIM seat management
✓
AI code tracking API and audit logs
✓
Granular admin and model controls
✓
Priority support and account management
Contact Sales
Trusted every day by teams that build world-class software.








Bugbot Add-on
Free
$0

Includes:

✓
Limited code reviews each month
✓
Unlimited access to Cursor Ask
✓
Cursor connection to auto-fix bugs
✓
GitHub integration
Try Bugbot
Pro
$40
 / user / mo.

Everything in Free, plus:

✓
14 day individual trial
✓
Unlimited reviews on up to 200 PRs/month
✓
Access to Bugbot Rules
Get Bugbot Pro
Teams
$40
 / user / mo.

Everything in Pro, plus:

✓
14-day team trial
✓
Unlimited code reviews on all PRs
✓
Analytics and reporting dashboard
✓
Advanced rules and settings
Get Bugbot Teams
Enterprise
Custom

Everything in Teams, plus:

✓
30-day org-wide trial
✓
Advanced analytics and reporting
✓
Priority support and account management
Contact Sales
Questions & Answers
What is the right plan for me?
↑
We recommend Pro+ for daily agent users, and Ultra for agent power users. The Teams plan is recommended for professionals collaborating with others, and larger organizations that need invoicing, pooled usage, or advanced security should choose Enterprise.

What are my payment options?
↑
Self-serve plans support all major credit and debit cards. For invoice-based billing and wire transfers, please contact us to discuss the Enterprise plan.

How does usage-based pricing work?
↑
Every plan includes a set amount of model usage. On-demand usage allows you to continue using models after your included amount is consumed, billed in arrears. See our docs for more details.

How can I see and manage Cursor's usage in my organization?
↑
Admins can access usage information and key metrics through the Admin Dashboard.

How does Cursor use my data?
↑
Privacy mode can be enabled in settings or by a team admin. When it is enabled, we guarantee that code data is never stored by our model providers or used for training. You can learn more on our Security page.

Can I buy Cursor from a reseller or third party?
↑
No. Cursor subscriptions are only sold directly through cursor.com. We do not authorize any resellers or third-party sellers. Subscriptions purchased from any other source are unauthorized and may be fraudulent, insecure, or obtained through abuse of our systems. These accounts may be suspended or terminated at any time. To protect your access and security, purchase Cursor only through our official website.

Where can I ask more questions?
↑
You're welcome to join our forum and share your thoughts! If you prefer a private conversation, feel free to email us directly at hi@cursor.com.

## Yearly Pricing Simple\
Hobby
Free

Includes:

✓
No credit card required
✓
Limited Agent requests
✓
Limited Tab completions
Download
Pro
$16
 / mo.

Everything in Hobby, plus:

✓
Extended limits on Agent
✓
Unlimited Tab completions
✓
Cloud Agents
✓
Maximum context windows
Get Pro
Pro+
Recommended

$48
 / mo.

Everything in Pro, plus:

✓
3x usage on all OpenAI, Claude, Gemini models
Get Pro+
Ultra
$160
 / mo.

Everything in Pro, plus:

✓
20x usage on all OpenAI, Claude, Gemini models
✓
Priority access to new features
Get Ultra
Business Plans
Teams
$32
 / user / mo.

Everything in Pro, plus:

✓
Shared chats, commands, and rules
✓
Centralized team billing
✓
Usage analytics and reporting
✓
Org-wide privacy mode controls
✓
Role-based access control
✓
SAML/OIDC SSO
Get Teams
Enterprise
Custom

Everything in Teams, plus:

✓
Pooled usage
✓
Invoice/PO billing
✓
SCIM seat management
✓
AI code tracking API and audit logs
✓
Granular admin and model controls
✓
Priority support and account management
Contact Sales
