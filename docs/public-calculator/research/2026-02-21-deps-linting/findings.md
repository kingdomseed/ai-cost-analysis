# Findings: Linting + `npm audit` (2026-02-21)

## Goal

Keep `apps/public-calculator/site/` on **current stable Next.js** while avoiding dependency hacks (no npm `overrides`) and still keeping `npm audit` clean.

## What we observed

- The `npm audit` “high” findings were driven by the `minimatch <10.2.1` ReDoS advisory (GHSA-3ppc-4f35-3m26) pulled in through ESLint and the Next.js lint toolchain.
- Moving to `eslint@10` is currently blocked by upstream compatibility issues in the React-related ESLint plugins and/or Next’s lint stack.

## Upstream signals (open issues)

- Next.js tracking ESLint v10 support: https://github.com/vercel/next.js/issues/89764
- `eslint-plugin-react` ESLint v10 support discussion: https://github.com/jsx-eslint/eslint-plugin-react/issues/3923
- `eslint-plugin-jsx-a11y` ESLint v10 support discussion: https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/1154

### Note: “Temporary fix” for the React rule crash

The Next.js issue includes a workaround for the specific crash:

- Cause: `eslint-plugin-react` tries to auto-detect the React version and, under ESLint v10, hits a removed legacy API (see stack trace in the issue).
- Workaround: set React version explicitly so the plugin doesn’t auto-detect:

```js
{
  settings: {
    react: { version: "19" }
  }
}
```

This can make ESLint v10 runnable for some projects, but it does **not** address the separate `minimatch <10.2.1` audit advisory in the lint dependency chain.

## Decision for this repo (for now)

We removed ESLint from the public calculator site and switched the `npm run lint` surface to **Biome**:

- Removes the vulnerable dependency chain without pinning/transitive overrides
- Keeps the project on current stable Next.js
- Gives us a deterministic check that can run in CI later

If/when the upstream ESLint v10 transition stabilizes (Next + plugins), we can reassess switching back.
