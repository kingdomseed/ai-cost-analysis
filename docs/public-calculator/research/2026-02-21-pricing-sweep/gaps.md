# Gaps / Next Actions (Pricing Sweep — 2026-02-21)

This sweep intentionally prefers official sources and labels anything uncertain.

## High-priority gaps

1) **Replit pricing changes (effective 2026-02-24)**
   - Replit announced a new Pro plan and that the Teams plan will be sunset, with changes taking effect on **2026-02-24**.
   - Next: re-run a pricing sweep on/after **2026-02-24** and update dataset plan IDs/availability notes accordingly (avoid treating sunset plans as active after the cutoff date).

2) **Cursor: “Pro $20” availability**
   - Cursor docs list `Pro` ($20 included usage), while `cursor.com/pricing` prominently shows `Individual $60` with `$70` included usage.
   - Next: confirm whether Pro is still purchasable (official checkout/billing docs), then encode as `active` vs `legacy/hidden`.

3) **ChatGPT plan limits**
   - `help.openai.com` was blocked from direct fetch in this environment during the sweep.
   - Next: re-capture Help Center content directly (or via an allowed official export) and mark subscription entries `verified: true`.

## Medium-priority gaps (tool ecosystem breadth)

4) **Opaque credit systems: Verdent + Qoder**
   - Official pricing/docs were captured, but neither tool publishes a stable credits→tokens conversion table.
   - Next: represent credits as opaque in the dataset and (optionally) add user-overridable assumptions (effective $/credit, or credits-per-request) in the calculator UX.

5) **Kimi Code: quota sizing (numeric)**
   - Official docs confirm Kimi Code is a **membership benefit** with a **7-day rolling quota refresh**, but do not publish a stable token↔quota mapping (and the UI describes both a 7-day quota cycle and a “5-hour token quota” concept without fully defining the relationship).
   - Next: capture an official quota table by membership tier (if published) and clarify how the 5-hour token quota relates to the 7-day cycle.

## Dataset TODOs

- Add Gemini Batch prices (ai.google.dev lists them) if the calculator will support “batch mode” as a first-class option.
- Add Anthropic 1-hour cache write rates (officially documented) as explicit fields if we model caching beyond 5 minutes.
- Decide whether to include “throughput tiers” (AWS Bedrock Priority/Flex; Vertex Priority) as separate pricing tiers in the dataset.
- Confirm whether the “Replit Hacker” plan still exists publicly, or if it is only a legacy plan artifact in embedded pricing data.

## Recently resolved (this sweep)

- **JetBrains AI: quota values + $/credit mapping**
  - Resolved via JetBrains AI Assistant licensing docs (quota tables + “Each AI Credit equals $1 USD”) and JetBrains AI Credits Terms (12-month expiry for top-ups).
  - Dataset is now modeled as `credits` / `seat_subscription_with_credits` rather than an opaque quota.
