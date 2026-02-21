export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>AI Cost Calculator (WIP)</h1>
      <p style={{ marginBottom: 12 }}>
        This Next.js app is the public-facing UI layer. Pricing and entitlements live as versioned
        JSON snapshots in <code>apps/public-calculator/data/</code>.
      </p>
      <ul>
        <li>
          <a href="/datasets">View latest dataset metadata</a>
        </li>
      </ul>
    </main>
  );
}
