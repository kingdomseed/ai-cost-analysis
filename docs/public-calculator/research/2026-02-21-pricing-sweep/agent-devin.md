# Devin (Cognition) — pricing & billing mechanics (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

## What Devin bills (billing primitive)

Devin bills primarily in **ACUs** (“Agent Compute Units”) rather than tokens. ACUs are an internal compute unit intended to normalize the cost of running Devin sessions (VM time + model inference + other runtime resources).

## Plans (USD)

From `devin.ai/pricing`:

| Plan | Price | Included usage | Notes |
|---|---:|---|---|
| Core | “Pay as you go, starting at $20” | Pay-as-you-go ACUs | Core includes access to key Devin capabilities and uses auto-recharge settings to avoid blocking. |
| Team | **$500/month** | **250 ACUs included** | After included ACUs, can continue consuming ACUs on-demand via auto-recharge. |
| Enterprise | Custom | Custom | Enterprise pricing is negotiated. |

## ACU rates (USD)

From the Devin pricing FAQ:

| Context | Rate |
|---|---:|
| Core (pay-as-you-go) | **$2.25 / ACU** |
| Team (included bundle) | **$2.00 / ACU** (250 ACUs included in subscription) |

## Metering semantics (important for the calculator)

- Devin only consumes ACUs when **actively working on a task** or when the **virtual machine is running**; consumption varies with task complexity, runtime, and repo size.
- If you have access to the **Devin API**, sessions started via the API are billed by the same ACU mechanism (no additional API-specific fee beyond ACU consumption).

## Sources

- Devin pricing page: `https://devin.ai/pricing`
- Devin billing docs (ACU background / billing model): `https://docs.devin.ai/billing`
- Cognition terms of service (plan terms): `https://www.cognition.ai/pages/terms-of-service`

