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
   - A user-provided capture of `chatgpt.com/pricing` is stored in `docs/public-calculator/research/2026-02-21-pricing-sweep/user-chatgpt-pricing-capture.2026-02-21.md`, but remains `verified: false`.
   - Next: re-capture Help Center and pricing content directly (or via an allowed official export) and mark subscription entries `verified: true`.

## Medium-priority gaps (tool ecosystem breadth)

4) **Opaque credit systems: Verdent + Qoder**
   - Official pricing/docs were captured, but neither tool publishes a stable credits→tokens conversion table.
   - Next: represent credits as opaque in the dataset and (optionally) add user-overridable assumptions (effective $/credit, or credits-per-request) in the calculator UX.

5) **Kimi Code: quota sizing (numeric)**
   - Official docs confirm Kimi Code is a **membership benefit** with a **7-day rolling quota refresh**, but do not publish a stable token↔quota mapping (and the UI describes both a 7-day quota cycle and a “5-hour token quota” concept without fully defining the relationship).
   - New: Moonshot publishes an official membership benefits table (CNY) with **monthly quotas** for Agent/Deep Research/PPT, and an oversea event rules appendix that lists **2048 Kimi Code requests/week** for Moderato. However, we still lack:
     - a full per-tier Kimi Code request quota table (Andante/Allegretto/Allegro), and
     - any token↔quota conversion to compare “Kimi Code requests” against token-metered APIs.
   - Next: capture an official quota table by membership tier for Kimi Code (if published) and clarify how the 5-hour token quota relates to the 7-day cycle.

6) **Bolt.new: overage pricing**
   - Bolt publishes token quotas and rollover behavior, but does not publish an explicit per-token overage price on the pricing page.
   - Next: find an official page describing what happens after token quotas are exceeded (hard stop vs pay-as-you-go) and any $/token rate if applicable.

7) **Lovable: credit unit conversion**
   - Lovable publishes credit tiers and top-up pricing but not a stable credits↔tokens conversion.
   - Next: treat credits as opaque, but consider adding user-overridable assumptions (e.g., average credits per message) for empirical comparisons.

8) **Tabnine: “reserved token consumption quota” mechanics**
   - Tabnine pricing describes BYOK unlimited vs Tabnine-provided LLM access (provider prices + 5% handling fee), but quota sizing mechanics are not fully enumerated on the pricing page.
   - Next: locate official docs that define how reserved token quota is purchased/allocated and whether it maps to a known provider token meter.

9) **Sourcegraph: Cody Enterprise pricing**
   - Sourcegraph documents Cody Free/Pro deprecation and shows Enterprise Search pricing, but does not publish self-serve numeric pricing for Cody Enterprise.
   - Next: if we want to model Cody Enterprise, capture an official price sheet (if public) or encode as `custom` with explicit “contact sales” notes.

10) **Windsurf: “code reviews” quota discrepancy**
   - Jason’s Teams billing UI shows “50 code reviews” included (Feb 2026).
   - Repo owner also provided an authenticated dashboard PR Reviews limit statement: `min(50 reviews per team member, 1000 reviews total)` over a rolling 30-day window.
   - The public PR Reviews doc states “Organization-wide limit of 500 reviews/month”, which conflicts with the dashboard statement.
   - For this repo’s target region (US/global self-serve), treat the **authenticated dashboard** as authoritative and treat conflicting public docs as potentially stale or region-specific until Windsurf publishes a single canonical statement.

## Dataset TODOs

- Add Gemini Batch prices (ai.google.dev lists them) if the calculator will support “batch mode” as a first-class option.
- Add Anthropic 1-hour cache write rates (officially documented) as explicit fields if we model caching beyond 5 minutes.
- Decide whether to include “throughput tiers” (AWS Bedrock Priority/Flex; Vertex Priority) as separate pricing tiers in the dataset.
- Confirm whether the “Replit Hacker” plan still exists publicly, or if it is only a legacy plan artifact in embedded pricing data.
- For Google AI plans, capture an official statement that maps **Gemini Code Assist for GitHub** to consumer plan tiers (if applicable), or treat GitHub as an “available surface” without tier mapping.

## Recently resolved (this sweep)

- **JetBrains AI: quota values + $/credit mapping**
  - Resolved via JetBrains AI Assistant licensing docs (quota tables + “Each AI Credit equals $1 USD”) and JetBrains AI Credits Terms (12-month expiry for top-ups).
  - Dataset is now modeled as `credits` / `seat_subscription_with_credits` rather than an opaque quota.
