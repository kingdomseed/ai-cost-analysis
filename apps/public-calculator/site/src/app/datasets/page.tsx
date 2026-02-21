import { loadLatestEntitlementsSnapshot, loadLatestPricingSnapshot } from "@/lib/public-datasets";
import Link from "next/link";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default async function DatasetsPage() {
  const [{ date: pricingDate, data: pricing }, { date: entitlementsDate, data: entitlements }] =
    await Promise.all([loadLatestPricingSnapshot(), loadLatestEntitlementsSnapshot()]);

  const pricingMeta = isRecord(pricing) ? (pricing.meta ?? null) : null;
  const entitlementsMeta = isRecord(entitlements) ? (entitlements.meta ?? null) : null;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Datasets</h1>

      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Latest pricing</h2>
        <div>snapshot: {pricingDate}</div>
        {pricingMeta ? <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(pricingMeta, null, 2)}</pre> : null}
        <div>
          <Link href="/api/datasets/pricing">Download JSON</Link>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Latest entitlements</h2>
        <div>snapshot: {entitlementsDate}</div>
        {entitlementsMeta ? (
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(entitlementsMeta, null, 2)}</pre>
        ) : null}
        <div>
          <Link href="/api/datasets/entitlements">Download JSON</Link>
        </div>
      </section>
    </main>
  );
}
