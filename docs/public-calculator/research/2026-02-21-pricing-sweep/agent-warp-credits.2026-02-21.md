# Warp — credits metering notes (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## Billing primitive (how Warp describes it)

Warp describes “credits” as the unit consumed by interactions with Warp’s Agent. Credit consumption is described as variable and depends on factors like model choice, task complexity, context size, and (for cloud agents) an additional hosting component.

## What we can model

For the public calculator:
- treat Warp as a **credit-based system** (opaque credits → no official token conversion)
- allow user-overridable assumptions (e.g., effective $/credit) when comparing against token-metered APIs

For personal analysis:
- we need a timestamped **credit ledger** export path (not yet captured in official docs during this sweep)

## Open questions / gaps

- Whether Warp provides an official CSV/JSON export for credit usage history (per interaction) for individual accounts.
- Whether Warp’s “bring your own API key” mode is available after credits are exhausted, and how that changes metering (official docs exist but need to be captured into the export-mechanisms checklist).

## Sources (official)

- Warp credits explanation: `https://docs.warp.dev/support-and-community/plans-and-billing/credits`

