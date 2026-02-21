# Sources ledger (Pricing Sweep — 2026-02-21)

This file is a quick index of the **official sources** used in the sweep and where we captured them.

## OpenAI

- API pricing: `https://developers.openai.com/api/docs/pricing`
- Prompt caching: `https://developers.openai.com/api/docs/guides/prompt-caching/`
- Batch API: `https://developers.openai.com/api/docs/guides/batch`
- Codex pricing (ChatGPT plans + credits): `https://developers.openai.com/codex/pricing/`
- ChatGPT pricing (Cloudflare-blocked in this environment): `https://chatgpt.com/pricing`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-openai.md`
  - Codex addendum: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-openai-codex.md`
  - ChatGPT pricing (user-provided): `docs/public-calculator/research/2026-02-21-pricing-sweep/user-chatgpt-pricing-capture.2026-02-21.md`
  - Entitlements addendum (partial; environment-limited): `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-openai-entitlements.2026-02-21.md`

## Anthropic

- Consumer plan pricing + API pricing: `https://www.anthropic.com/pricing`
- API pricing docs: `https://platform.claude.com/docs/en/about-claude/pricing`
- Consumer usage limits: `https://support.claude.com/` (multiple articles; see agent note)
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-anthropic.md`
  - Entitlements addendum: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-claude-entitlements.2026-02-21.md`

## Azure (Azure OpenAI / Azure AI Foundry)

- Pricing page (catalog reference; numeric fields may render as `$-`): `https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`
- Retail Prices API overview: `https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices`
- Retail Prices API endpoint: `https://prices.azure.com/api/retail/prices`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-azure.md`

## Google

- Gemini Developer API pricing: `https://ai.google.dev/gemini-api/docs/pricing`
- Vertex AI GenAI pricing: `https://cloud.google.com/vertex-ai/generative-ai/pricing`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-google.md`

## AWS Bedrock

- Bedrock pricing: `https://aws.amazon.com/bedrock/pricing/`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-aws-bedrock.md`
- AWS Price List API (Bedrock foundation models; machine-readable): `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonBedrockFoundationModels/current/index.json`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/main-aws-bedrock-claude46-numeric.md`

## Moonshot (Kimi)

- Moonshot API pricing: `https://platform.moonshot.ai/docs/pricing/chat` (and CN mirror `https://platform.moonshot.cn/docs/pricing/chat`)
- Kimi membership benefits: `https://www.kimi.com/user/agreement/zh/membershipBenefits`
- Kimi membership benefits markdown (machine-readable; includes CNY monthly + annual pricing + quotas): `https://kimi-img.moonshot.cn/prod-chat-kimi/kimi/member_benefits_v2.md`
- Kimi oversea Moderato $19/month signal (event rules; includes quota appendix): `https://www.kimi.com/user/agreement/black-friday`
- Kimi membership pricing landing (SSR): `https://www.kimi.com/membership/landing`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-moonshot.md`
  - Update note: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-moonshot-open-platform-kimi-k2.5.2026-02-21.md`
  - Membership benefits addendum: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-kimi-membership-benefits.2026-02-21.md`

## Dev tools / wrappers

- Cursor pricing docs: `https://cursor.com/docs/account/pricing`
- Cursor model pricing (per-token rate table + Auto/Max Mode): `https://cursor.com/docs/models#model-pricing`
- Cursor marketing pricing page: `https://cursor.com/pricing`
- Cursor Analytics API (enterprise teams; usage export surface): `https://cursor.com/docs/account/teams/analytics-api`
- Cursor Admin API (enterprise teams; admin surface): `https://cursor.com/docs/account/teams/admin-api`
- Windsurf pricing: `https://windsurf.com/pricing`
- Windsurf credit usage docs: `https://docs.windsurf.com/windsurf/accounts/usage`
- Windsurf PR Reviews: `https://docs.windsurf.com/windsurf-reviews/windsurf-reviews`
- Windsurf PR Reviews (Chinese locale; region-variant reference only, not authoritative for US/global): `https://docs.windsurf.com/zh/windsurf-reviews/windsurf-reviews`
- Codeium pricing (corroborates Windsurf tiers): `https://codeium.com/pricing`
- Warp pricing: `https://www.warp.dev/pricing`
- Warp add-on credits: `https://docs.warp.dev/support-and-community/plans-and-billing/add-on-credits`
- Warp credits (how credits are consumed): `https://docs.warp.dev/support-and-community/plans-and-billing/credits`
- OpenRouter FAQ (fees): `https://openrouter.ai/docs/faq`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-tools.md`
  - PR Reviews addendum: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-windsurf-pr-reviews.md`
  - Cursor analytics addendum: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-cursor-analytics-export.2026-02-21.md`
  - Warp credits addendum: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-warp-credits.2026-02-21.md`
  - Cursor entitlements addendum: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-cursor-entitlements.2026-02-21.md`
  - Windsurf entitlements addendum: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-windsurf-entitlements.2026-02-21.md`

## OpenCode (Zen gateway)

- OpenCode Zen token pricing table: `https://opencode.ai/zen/pricing`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-opencode.md`

## Verdent

- Verdent pricing: `https://verdent.ai/pricing`
- Verdent docs (credits / presets): `https://verdent.ai/docs`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-verdent.md`

## Qoder

- Qoder pricing: `https://qoder.com/pricing`
- Qoder docs: `https://docs.qoder.com`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-qoder.md`

## Devin (Cognition)

- Devin pricing: `https://devin.ai/pricing`
- Devin billing docs: `https://docs.devin.ai/billing`
- Cognition terms: `https://www.cognition.ai/pages/terms-of-service`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-devin.md`

## Google (consumer subscriptions)

- Google AI plans (marketing): `https://one.google.com/about/google-ai-plans/`
- Google One pricing feed (US): `https://one.google.com/intl/ALL_us/about/feeds/pricing_2026_01_27.json`
- Google One Help: AI Plus benefits: `https://support.google.com/googleone/answer/16882689?hl=en`
- Google One Help: AI Pro benefits: `https://support.google.com/googleone/answer/14534406?hl=en`
- Google One Help: AI Ultra benefits: `https://support.google.com/googleone/answer/16286513?hl=en`
- Gemini Apps Help: limits & upgrades (quantified tables): `https://support.google.com/gemini/answer/16275805?hl=en`
- Purchase/management entrypoint (requires login): `https://one.google.com/ai`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-google-one-ai.md`
  - Developer tooling entitlements addendum: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-google-devtool-entitlements.2026-02-21.md`

Additional official developer-tooling sources used in the entitlements addendum:
- Gemini Code Assist (individuals; locations + plan availability): `https://developers.google.com/gemini-code-assist/resources/available-locations`
- Jules (landing): `https://jules.google/`
- Jules announcement: `https://blog.google/innovation-and-ai/models-and-research/google-labs/jules/`
- Gemini Code Assist for GitHub: `https://developers.google.com/gemini-code-assist/docs/github`
- Gemini Code Assist code reviews: `https://developers.google.com/gemini-code-assist/docs/code-review`

## Kimi Code

- Kimi Code: `https://www.kimi.com/code`
- Kimi Code docs (overview): `https://www.kimi.com/coding/docs/en/`
- Kimi Code docs (benefits + quota refresh): `https://www.kimi.com/coding/docs/en/benefits.html`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-kimi-code.md`
  - Update note: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-kimi-code-update.2026-02-21.md`

## Cline

- Cline pricing: `https://cline.bot/pricing`
- Cline docs (Cline Provider + “Adding Credits”): `https://docs.cline.bot/getting-started/authorizing-with-cline`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-cline.md`

## GitHub Copilot

- Individual plans + included premium request allowances: `https://docs.github.com/en/copilot/concepts/billing/individual-plans`
- Premium request mechanics + model multipliers: `https://docs.github.com/en/copilot/concepts/billing/copilot-requests`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-copilot.md`
  - Entitlements addendum: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-copilot-entitlements.2026-02-21.md`

## Amazon Q Developer

- Pricing: `https://aws.amazon.com/q/developer/pricing/`
- Tiers: `https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/q-tiers.html`
- Quotas/service limits: `https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/quotas.html`
- Org billing attribution: `https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/tracking-across-org-cost-usage.html`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-amazon-q.md`

## Replit

- Pricing: `https://replit.com/pricing`
- AI billing (Agent checkpoints): `https://docs.replit.com/billing/ai-billing`
- Usage-based billing overview: `https://docs.replit.com/billing/about-usage-based-billing`
- Deployment pricing: `https://docs.replit.com/billing/deployment-pricing`
- Teams billing: `https://docs.replit.com/billing/teams-billing/overview`
- AI Integrations billing (Replit-managed provider access, billed at public API price): `https://docs.replit.com/replitai/replit-ai-integrations`
- Pricing change announcement: `https://blog.replit.com/pro-plan`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-replit.md`

## JetBrains AI (AI Assistant + Junie)

- Pricing (AI in IDEs): `https://www.jetbrains.com/ai-ides/buy/`
- AI Assistant licensing overview: `https://www.jetbrains.com/help/ai-assistant/licensing-and-subscriptions.html`
- AI Credits terms (expiry + usage): `https://www.jetbrains.com/legal/docs/terms/jetbrains-ai-credits`
- JetBrains AI FAQ: `https://lp.jetbrains.com/ai-ides-faq/`
- JetBrains Console AI management: `https://www.jetbrains.com/help/jetbrains-console/ai-management.html`
- Junie docs: IDE plugin: `https://junie.jetbrains.com/docs/junie-ide-plugin.html`
- Junie docs: CLI: `https://junie.jetbrains.com/docs/junie-cli.html`
- Quota background (blog): `https://blog.jetbrains.com/ai/2025/09/faq-new-ai-quota/`
- Captured in: `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-jetbrains.md`

## Known discrepancies / follow-ups

- Cursor tier availability mismatch (docs list `Pro` $20; pricing page shows `Individual` $60): `docs/public-calculator/research/2026-02-21-pricing-sweep/main-cursor-plan-discrepancy.md`

## App builders (separate category)

- Bolt.new pricing (token quotas): `https://bolt.new/pricing`
- Lovable pricing (credits): `https://lovable.dev/pricing`
- Lovable docs (plans and credits): `https://docs.lovable.dev/introduction/plans-and-credits`
- Captured in:
  - `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-bolt.md`
  - `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-lovable.md`

## Other developer tools

- Tabnine pricing: `https://www.tabnine.com/pricing/`
- Sourcegraph pricing: `https://sourcegraph.com/pricing`
- Sourcegraph Cody plan changes (blog): `https://sourcegraph.com/blog/changes-to-cody-free-pro-and-enterprise-starter-plans`
- Sourcegraph Cody plan changes (changelog): `https://sourcegraph.com/changelog/cody-plan-changes`
- Captured in:
  - `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-tabnine.md`
  - `docs/public-calculator/research/2026-02-21-pricing-sweep/agent-sourcegraph.md`
