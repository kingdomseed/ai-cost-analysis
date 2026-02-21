# Pricing Pillars (What “Up-to-date + Empirical” Means)

Today’s date for this repo: **2026-02-21**.

This calculator will compare costs across programming tools using **three distinct pricing primitives**, plus a freshness rule.

## 1) Raw per-token API pricing (billing meter)

Goal: show what the same workload costs at published API rates.

We model (when available):
- input $/1M tokens
- output $/1M tokens
- cached input $/1M tokens (or other caching discounts)
- any special tiers (batch, long-context multipliers, regional pricing)

We also support “tool overlays” (wrappers) like OpenRouter/OpenCode/Cline where applicable:
- markup rules (fixed %, fixed fee, or per-model overrides) **only when sourced**
- separate “tool subscription price” vs “token-meter cost”

## 2) Credit / pool systems (token→credit economics)

Goal: estimate cost inside tools that bill via credits or include a prepaid pool.

We represent these systems explicitly:
- **API pool plans** (e.g., “$200 plan includes $400 compute”):
  - subscription price
  - included pool USD
  - overage policy after pool depletion
- **Credit systems** (Windsurf / Verdent / Qoder / Warp / etc.):
  - included credits
  - top-up packs (price/credits)
  - credit multipliers by model/mode (if documented)
  - whether charges are per “turn”, per tool action, per request, or token-metered behind the scenes (if documented)

If a tool does **not** provide a reliable mapping:
- we do **not** pretend it is precise
- we either (a) ask for a user-supplied conversion assumption, or (b) show the plan mechanics without converting to tokens

## 3) Flat monthly subscriptions (Claude Max / ChatGPT Pro / Kimi plans / etc.)

Goal: capture what can be known empirically.

These plans often don’t publish token quotas and enforce limits via:
- rolling windows (e.g., per 5 hours)
- message caps
- rate limiting / throughput caps
- policy constraints on automation

We model them as:
- subscription price
- documented “usage limit” signals (messages/window, throttle behavior, priority)
- “API-equivalent cost” of a workload separately (using the raw token meter), because subscription limits are not reliably token-convertible

## 4) Freshness rule (February 2026 reality)

Pricing changes frequently; we treat “up to date” as a hard requirement:
- every entry has `source` + `retrieved_at` + `last_verified_at`
- UI should visibly label entries that are **unverified** or **stale**
- we avoid relying on LLM-generated pricing tables without direct sources

