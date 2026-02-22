# Google: Google AI plans / Google One AI entitlements (2026-02-22)

## Targets

- Subscription tiers (e.g. Pro/Ultra): pricing and included surfaces/features.
- Explicit inclusion of developer tools: Gemini Code Assist, Gemini CLI, Jules, GitHub integrations, etc.

## Sources to verify (official)

- Google One / AI plans pages (official `google.com` / `one.google.com`).
- Product docs that enumerate which tools are covered by the subscription.

## Notes

- Prefer official landing pages + help center pages that list included tools.
- If plan pages differ by region (US/EU), record separate entries in entitlements/pricing.

## Quick findings (official, retrieved 2026-02-22)

- Google One “Google AI plans” landing page exists and is region-variant (example: `one.google.com/about/google-ai-plans/` and `one.google.com/intl/.../about/google-ai-plans/`). It’s primarily a marketing page; treat it as entitlement evidence for plan existence and broad inclusion claims, not numeric quotas.
- Gemini CLI docs state the CLI is part of Gemini Code Assist and that “each Gemini Code Assist edition provides quotas for using the Gemini CLI.” (`developers.google.com/gemini-code-assist/docs/gemini-cli`)
- Gemini Code Assist overview notes that individual developers on the free edition can get **higher daily model request limits** by purchasing Google AI Pro or Ultra. (`developers.google.com/gemini-code-assist/docs/overview`)
- Gemini Code Assist FAQs include guidance that Google will recognize a Google AI Pro/Ultra subscription for higher limits in Gemini CLI and the IDE extension. (`developers.google.com/gemini-code-assist/resources/faqs`)
- Quotas page indicates higher daily limits for agent mode and Gemini CLI can be obtained via Google Developer Program Premium, Google AI Pro, or Google AI Ultra. (`developers.google.com/gemini-code-assist/resources/quotas`)

## Quota details (official)

From `https://developers.google.com/gemini-code-assist/resources/quotas`:
- “Quotas for requests from Gemini Code Assist agent mode and Gemini CLI are combined.”
- Requests per user per day (agent mode + Gemini CLI):
  - Free: 1000/day
  - Google AI Pro: 1500/day
  - Google AI Ultra: 2000/day
- Requests per user per minute:
  - Free: 60/min
  - Google AI Pro/Ultra: 120/min
- Also lists “Local codebase awareness” as a 1,000,000 token context window.

From `https://one.google.com/about/google-ai-plans/`:
- The plan page explicitly calls out “Code faster” benefits on higher tiers, including:
  - higher limits in Gemini CLI and Gemini Code Assist IDE extensions (Pro/Ultra)
  - highest limits to Jules (asynchronous coding agent) and “Google Antigravity” rate limits (Ultra)
  - included monthly Google Cloud credits via Google Developer Program ($10/mo on Pro; $100/mo on Ultra, per plan page wording)

