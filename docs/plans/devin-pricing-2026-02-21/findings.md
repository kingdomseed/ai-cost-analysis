# Findings: Devin pricing + billing mechanics (2026-02-21)

## Key findings (public/self-serve)

- Plans: Core (“Pay as you go, starting at $20”), Team ($500/month), Enterprise (custom).
- Usage unit: Agent Compute Units (ACUs).
- Core ACU price: $2.25 / ACU (PAYG).
- Team includes 250 subscription ACUs per month; concurrency is “unlimited concurrent sessions.”
- Consumption mechanics: ACUs depend on actions/complexity; not consumed when waiting for user, waiting for tests, or cloning repos (aside from baseline VM-running ACUs).
- ACU buckets: subscription (resets each cycle), PAYG (does not expire), gift (does not expire); consumption order subscription → PAYG → gift (Core consumes PAYG before gift).
- Day boundary: billing cycles use midnight PST (08:00:00 UTC) for consumption reporting in API docs.
- Fast Mode: release notes indicate ~2× faster at 4× ACU per session.
- Team overage: official pages describe auto-reload after included ACUs, but do not clearly publish the per-ACU price for those additional purchases.

## Sources (official)

- `https://devin.ai/pricing`
- `https://docs.devin.ai/admin/billing`
- `https://docs.devin.ai/api-reference/v2/consumption/daily-consumption`
- `https://docs.devin.ai/release-notes/overview`
- `https://cognition.ai/terms-of-service`

