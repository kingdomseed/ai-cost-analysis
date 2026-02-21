# Ambiguities / Decisions Needed (Calculator)

This is a short list of “we can’t be empirical until we decide/verify” items.

## 1) Credit → token conversion

For tools with credits (Windsurf, Warp, Verdent, Qoder, etc.):
- Do we have a documented mapping from **credits → USD** or **credits → tokens**?
- If not, should the calculator:
  - require the user to provide an assumption (e.g., `$ per credit`), or
  - fall back to “API-equivalent” by routing to underlying provider token prices (only valid if the tool explicitly states it passes through pricing/pool)?

## 2) What “cost across tools” means

Two different (both useful) definitions:
- **API-equivalent cost:** what the same token workload would cost at published token prices.
- **Plan-effective cost:** what the workload would likely cost inside a given tool plan (requires pool/credit conversion + overage rules).

We should decide whether the UI shows both by default, or makes the user pick one.

## 3) Overage and throttling behavior

For each plan type, we need to model:
- What happens after pool/credits are exhausted?
  - pay-as-you-go
  - hard stop
  - rate limits/throttling (still “flat-rate” but slowed)

Even when “no overage,” the practical limit may be rate limiting. We can represent this as:
- “cost: flat” but “throughput constrained” (separate axis).

## 4) Caching assumptions (if modeled)

If we model cached reads:
- Do we treat caching as:
  - always available in a tool,
  - never available, or
  - user-controlled (hit rate slider)?

## 5) Token accounting shape

When a user says “I’ll use X tokens/month”:
- Do we require input/output split, or default to a ratio (e.g., 3:1) with override?
- Do we support an explicit “cached input percentage”?

## 6) Model naming normalization

Tools and providers use different names for the “same” model.
We need a canonical ID scheme for:
- model family
- version
- provider availability

## 7) Source freshness policy

Pricing is time-variant.
Decide the UI rule when entries are unverified or stale:
- hide them,
- show with a prominent “unverified / last verified X days ago,” or
- allow but warn.

