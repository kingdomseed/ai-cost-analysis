## Google AI plans — Developer tooling entitlements (snapshot)

**retrieved_at:** 2026-02-21  
**last_verified_at:** 2026-02-21

### Scope

Capture *where* Google’s consumer AI subscriptions are positioned to apply for developer tooling (beyond the Gemini app), so we can model “what you get, where you get it” separately from token pricing.

### What the Google AI plans page claims (official)

On the Google AI plans marketing page, the plan descriptions explicitly call out developer tools:

- **Jules** (asynchronous coding agent) — “higher limits” / “highest limits” language for Pro/Ultra.
- **Gemini CLI** + **Gemini Code Assist IDE extensions** — Pro/Ultra mention higher / highest limits.
- **Antigravity** — described as an “agentic development platform” with higher / highest rate limits.

These statements establish that (at minimum) the consumer plans are intended to unlock or raise limits for these developer surfaces, even when exact numeric quotas are not listed on the marketing page.

### Gemini Code Assist (individuals) surfaces + upgrade path (official)

Google for Developers documentation states that **Gemini Code Assist for individuals** includes access to:

- **Gemini CLI**
- **Antigravity**
- **Gemini Code Assist plugins** for **VS Code** and **JetBrains**

The same page also states you can purchase a **Google AI Pro or Google AI Ultra subscription** to access the same features with **higher daily model request limits** (exact quota tables are not shown on this page).

### GitHub surfaces (official, but scope caveat)

Google for Developers documentation includes pages for **Gemini Code Assist for GitHub**, including:

- “Get Gemini Code Assist for GitHub”
- “About Gemini Code Assist code reviews”

These pages describe a GitHub integration surface, but they do **not** (in the sources captured for this note) explicitly say which Google AI plan tiers include it for consumers. Treat the GitHub surface as “exists” and defer plan-tier mapping until a plan page or Help Center page explicitly links them.

### Sources (official)

- Google AI plans marketing page: `https://one.google.com/about/google-ai-plans/`
- Gemini Code Assist for individuals — available locations + plan availability: `https://developers.google.com/gemini-code-assist/resources/available-locations`
- Jules landing page: `https://jules.google/`
- Jules announcement (beta): `https://blog.google/innovation-and-ai/models-and-research/google-labs/jules/`
- Gemini Code Assist for GitHub: `https://developers.google.com/gemini-code-assist/docs/github`
- Gemini Code Assist code reviews (GitHub): `https://developers.google.com/gemini-code-assist/docs/code-review`

