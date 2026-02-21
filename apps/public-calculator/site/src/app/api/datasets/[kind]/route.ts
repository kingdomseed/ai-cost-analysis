import { NextResponse } from "next/server";
import { loadLatestEntitlementsSnapshot, loadLatestPricingSnapshot } from "@/lib/public-datasets";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string }> },
): Promise<NextResponse> {
  const { kind } = await params;

  if (kind !== "pricing" && kind !== "entitlements") {
    return NextResponse.json({ error: "Unknown dataset kind" }, { status: 404 });
  }

  const snapshot =
    kind === "pricing" ? await loadLatestPricingSnapshot() : await loadLatestEntitlementsSnapshot();

  return NextResponse.json({
    kind,
    snapshot_date: snapshot.date,
    data: snapshot.data,
  });
}
