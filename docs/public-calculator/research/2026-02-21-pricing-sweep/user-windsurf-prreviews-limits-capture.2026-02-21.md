# Windsurf PR Reviews limits — user-provided capture (unverified)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21  
**verified:** true

## Why this file exists

This text was captured **word-for-word from the authenticated Windsurf dashboard** (official UI) and is treated as authoritative for the repo’s target region, even though we don’t currently have a public URL we can cite for it.

We keep it in a dedicated file because Windsurf’s public docs currently contain a conflicting numeric cap statement, and we need to track the discrepancy explicitly.

## Captured text (as provided)

> Your team's rate limit is calculated as the minimum of:
>
> - 50 reviews per team member
> - 1000 reviews total
>
> This limit applies to a rolling 30-day window and resets gradually as older reviews age out.
>
> Need more reviews? Contact prem@windsurf.com to discuss further.

## Conflicts with currently captured official docs

- Public PR Reviews doc (captured separately in this sweep) states: “Organization-wide limit of **500 reviews/month**.”
- The user-captured text implies: `min(50 × members, 1000)` reviews per rolling 30-day window.

Next action: find an official Windsurf public doc or FAQ that publishes this same limit (or confirm the public doc is region-specific/outdated), and then update the public calculator rules to prefer the dashboard rule for the US/“global” target unless a region is specified.
