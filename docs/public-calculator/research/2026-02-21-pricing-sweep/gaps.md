# Gaps / Next Actions (Pricing Sweep — 2026-02-21)

This sweep intentionally prefers official sources and labels anything uncertain.

## High-priority gaps

1) **JetBrains AI: quota values + $/credit mapping**
   - Official JetBrains sources confirm pricing and that a quota/credit system exists, but the exact quota-by-tier table and any explicit “$ per AI Credit” mapping were not captured in a non-JS, machine-readable form in this sweep.
   - Next: find an official non-JS export (or a stable JSON endpoint) that lists quota sizes for AI Pro/Ultimate/Enterprise and top-up pricing rules; then model JetBrains plans as credits (not opaque quota).

2) **Replit pricing changes (effective 2026-02-24)**
   - Replit announced a new Pro plan and that the Teams plan will be sunset, with changes taking effect on **2026-02-24**.
   - Next: re-run a pricing sweep on/after **2026-02-24** and update dataset plan IDs/availability notes accordingly (avoid treating sunset plans as active after the cutoff date).

3) **Cursor: “Pro $20” availability**
   - Cursor docs list `Pro` ($20 included usage), while `cursor.com/pricing` prominently shows `Individual $60` with `$70` included usage.
   - Next: confirm whether Pro is still purchasable (official checkout/billing docs), then encode as `active` vs `legacy/hidden`.

4) **ChatGPT plan limits**
   - `help.openai.com` was blocked from direct fetch in this environment during the sweep.
   - Next: re-capture Help Center content directly (or via an allowed official export) and mark subscription entries `verified: true`.

## Medium-priority gaps (tool ecosystem breadth)

5) **Opaque credit systems: Verdent + Qoder**
   - Official pricing/docs were captured, but neither tool publishes a stable credits→tokens conversion table.
   - Next: represent credits as opaque in the dataset and (optionally) add user-overridable assumptions (effective $/credit, or credits-per-request) in the calculator UX.

6) **Kimi Code pricing + model identity**
   - Kimi Code is clearly marketed as a distinct developer product, but token-meter pricing and/or an official mapping to Open Platform API model IDs was not verified in this sweep.
   - Next: find an official statement covering (a) which Kimi Code plans include it, and (b) whether it uses a dedicated “Kimi Code” model with distinct pricing.

## Dataset TODOs

- Add Gemini Batch prices (ai.google.dev lists them) if the calculator will support “batch mode” as a first-class option.
- Add Anthropic 1-hour cache write rates (officially documented) as explicit fields if we model caching beyond 5 minutes.
- Decide whether to include “throughput tiers” (AWS Bedrock Priority/Flex; Vertex Priority) as separate pricing tiers in the dataset.
- Confirm whether the “Replit Hacker” plan still exists publicly, or if it is only a legacy plan artifact in embedded pricing data.
