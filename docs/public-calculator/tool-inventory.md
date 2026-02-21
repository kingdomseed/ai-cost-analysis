# Tool Inventory (Public Calculator)

This file is the **checklist** for which tools/plans we want to model in the public calculator. It’s intentionally separate from pricing notes so we can track coverage without reading long reports.

## Modeled (has dataset entries)

- Direct token-meter providers: OpenAI, Anthropic, Google (Gemini API), Azure OpenAI, Moonshot (Kimi API), AWS Bedrock
- Wrappers / gateways: OpenRouter, OpenCode Zen
- IDE/tools: Cursor, Windsurf, Warp, Verdent, Qoder, Cline, Devin, GitHub Copilot, Amazon Q Developer, Replit, JetBrains AI
- Consumer subscriptions (non-token quotas): Anthropic Claude plans, Google AI Plus/Pro/Ultra, Kimi memberships, ChatGPT Pro *(unverified in this environment)*

## Tracked but incomplete (needs more official details)

- Kimi Code: marketed as a separate developer product; pricing/model identity not yet verified in an accessible official source
- Cline Provider: credits exist, but credit-pack pricing / conversion rules not captured publicly

## Not yet researched (add here as you decide scope)

Add additional tools you care about here (examples):
- Sourcegraph Cody
- Codeium
- Tabnine
- Bolt
- Lovable

When adding an item, include:
- Official pricing URL(s)
- Which billing primitive it uses: token-meter, USD pool, credits, per-request, or opaque quota
