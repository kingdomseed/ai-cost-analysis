# Next.js guidance

For changes that depend on Next.js routing, rendering, caching, or APIs, check
the resolved version in the lockfile and consult the relevant official Next.js
documentation. Read the pages needed for the task.

The existing `.next-docs/` can help locate a topic, but check that it matches
the resolved version. Do not regenerate AGENTS.md as a prerequisite for work.

Use the scripts in `package.json` for the affected app checks. Run applicable
checks for code, dependency, and configuration changes. Documentation-only
edits need document checks. Complete requested local execution and inspection
before returning, and fix failures caused by the change.
