# Agent Notes: GitHub Copilot (Feb 2026)

Retrieved at: **2026-02-21**

## Official sources

- Individual plans: `https://docs.github.com/en/copilot/concepts/billing/individual-plans`
  - Markdown API: `https://docs.github.com/api/article/body?pathname=/en/copilot/concepts/billing/individual-plans`
- Premium requests + model multipliers: `https://docs.github.com/en/copilot/concepts/billing/copilot-requests`
  - Markdown API: `https://docs.github.com/api/article/body?pathname=/en/copilot/concepts/billing/copilot-requests`

## Billing primitive

Copilot (individual) is best modeled as:

- **Subscription plans** (Free / Pro / Pro+)
- A monthly allowance of **premium requests** (counts depend on model multiplier)
- **Overage** for paid plans: **$0.04 USD per additional premium request**

Premium request counters reset on the **1st of each month at 00:00:00 UTC** (see the Copilot requests doc).

## Individual plans (prices + included requests)

From the GitHub Docs “About individual GitHub Copilot plans and benefits” page:

- **Copilot Free**
  - Price: **$0**
  - Included: **2,000 inline suggestions/month**
  - Included: **50 premium requests/month**
- **Copilot Pro**
  - Price: **$10/month** or **$100/year**
  - Included: **300 premium requests/month**
  - Additional premium requests: **$0.04/request**
- **Copilot Pro+**
  - Price: **$39/month** or **$390/year**
  - Included: **1,500 premium requests/month**
  - Additional premium requests: **$0.04/request**

## Model multipliers (selected extract)

The Copilot requests page publishes a **model multiplier table**. These multipliers apply to how many “premium requests” are deducted when using a model, and GitHub notes they are subject to change.

Extracted table rows (paid multiplier → free multiplier):

- Claude Haiku 4.5: `0.33` → `1`
- Claude Opus 4.5: `3` → N/A
- Claude Opus 4.6: `3` → N/A
- Claude Opus 4.6 (fast mode) (preview): `30` → N/A
- Claude Sonnet 4 / 4.5 / 4.6: `1` → N/A
- Gemini 2.5 Pro: `1` → N/A
- Gemini 3 Flash: `0.33` → N/A
- Gemini 3 Pro / 3.1 Pro: `1` → N/A
- GPT-4.1: `0` → `1`
- GPT-4o: `0` → `1`
- GPT-5 mini: `0` → `1`
- GPT-5.1 / 5.2 / 5.1-Codex / 5.2-Codex / 5.3-Codex: `1` → N/A
- GPT-5.1-Codex-Mini: `0.33` → N/A
- Grok Code Fast 1: `0.25` → N/A
- Raptor mini: `0` → `1`

Notes from the doc that matter for modeling:
- On **paid plans**, “included models” (GPT-5 mini, GPT-4.1, GPT-4o) have a **0** multiplier (no premium requests consumed).
- On **Copilot Free**, models consume premium requests (often `1`).
- If you use **auto model selection** on a paid plan, some models qualify for a **10% multiplier discount** (e.g., `1x` becomes `0.9x`).

