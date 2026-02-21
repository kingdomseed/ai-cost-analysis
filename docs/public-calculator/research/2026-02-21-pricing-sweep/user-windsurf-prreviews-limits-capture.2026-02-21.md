# Windsurf PR Reviews limits — user-provided capture (unverified)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21  
**verified:** false

## Why this file exists

Windsurf’s published PR Reviews doc currently states an org-wide “500 reviews/month” cap (and 50 files/PR). A separate limit statement was pasted by the repo owner, and we have not yet located a matching publicly accessible official page containing this wording.

We store the text here to avoid losing it, but we do **not** treat it as authoritative until it is corroborated by an official Windsurf URL.

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

- Official PR Reviews doc (captured separately in this sweep) states: “Organization-wide limit of **500 reviews/month**.”
- The user-captured text implies: `min(50 × members, 1000)` reviews per rolling 30-day window.

Next action: find and capture the official Windsurf page or product UI location that contains this min() statement.

