# Agent Notes: AWS Bedrock — Pricing Sweep

**Agent focus:** Amazon Bedrock pricing page (AWS official) for Anthropic + Moonshot (Kimi).  \n**retrieved_at:** 2026-02-21  \n**last_verified_at:** 2026-02-21

## Primary source (official)

- `https://aws.amazon.com/bedrock/pricing/`

## Anthropic — rows with numeric prices embedded in static HTML

The Bedrock pricing page includes an “Models with extended access” table with explicit numeric prices in the HTML.

| Provider | Model name | Regions | $/1M input | $/1M output | $/1M input (batch) | $/1M output (batch) | $/1M input (cache write) | $/1M input (cache read) |
|---|---|---|---:|---:|---:|---:|---:|---:|
| Anthropic | Claude 3.5 Sonnet (Public Extended Access, Effective 1 Dec 2025) | US East (N. Virginia), US East (Ohio), US West (Oregon), Europe (Frankfurt), Europe (Ireland), Europe (Zurich), Europe (Paris) | 6.00 | 30.00 | 3.00 | 15.00 | N/A | N/A |
| Anthropic | Claude 3.5 Sonnet v2 (Public Extended Access, Effective 1 Dec 2025) | US East (N. Virginia), US East (Ohio), US West (Oregon) | 6.00 | 30.00 | 3.00 | 15.00 | 7.50 | 0.60 |

## Anthropic — Claude 4.6 presence check (pricing page)

The Bedrock pricing page’s Anthropic section includes rows for:
- **Claude Sonnet 4.6** (+ “Long Context”)
- **Claude Opus 4.6** (+ “Long Context”)

However, in this sweep, the numeric prices for those rows appear to be **client-rendered** (not present as explicit numeric values in the static HTML that was extracted), so this note does **not** claim numeric $/1M values for Claude 4.6 on Bedrock.

## Moonshot AI — Kimi K2/K2.5 (on-demand pricing)

The Bedrock pricing page includes explicit numeric region tables for Kimi models.

| Provider | Model name | Regions (as shown) | $/1M input | $/1M output |
|---|---|---|---:|---:|
| Moonshot AI | Kimi K2 Thinking | US East (N. Virginia), US East (Ohio), US West (Oregon) | 0.60 | 2.50 |
| Moonshot AI | Kimi K2.5 | US East (N. Virginia), US East (Ohio), US West (Oregon) | 0.60 | 3.00 |
| Moonshot AI | Kimi K2 Thinking | Asia Pacific (Mumbai) | 0.71 | 2.94 |
| Moonshot AI | Kimi K2.5 | Asia Pacific (Mumbai) | 0.72 | 3.60 |
| Moonshot AI | Kimi K2 Thinking | South America (Sao Paulo), Asia Pacific (Tokyo) | 0.73 | 3.03 |
| Moonshot AI | Kimi K2.5 | South America (Sao Paulo), Asia Pacific (Tokyo) | 0.72 | 3.60 |
| Moonshot AI | Kimi K2.5 | Europe (Stockholm), Asia Pacific (Jakarta) | 0.72 | 3.60 |
| Moonshot AI | Kimi K2 Thinking | Asia Pacific (Sydney) | 0.6180 | 2.5750 |
| Moonshot AI | Kimi K2.5 | Asia Pacific (Sydney) | 0.6180 | 3.0900 |

## Next extraction gap (to resolve)

To include Claude 4.6 Bedrock token rates empirically, we need an additional **official** pricing feed that exposes the client-rendered table data (or an AWS pricing API endpoint used by the page). Until that is captured and verified, treat “Claude 4.6 exists on Bedrock” as confirmed, but its numeric $/1M token rates as **not yet verified** in our dataset.

