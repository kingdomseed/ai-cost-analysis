import { NextResponse } from "next/server";
import {
  loadLatestEntitlementsSnapshot,
  loadLatestFxSnapshot,
  loadLatestPricingSnapshot,
} from "@/lib/public-datasets";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string }> },
): Promise<NextResponse> {
  const { kind } = await params;

  if (kind !== "pricing" && kind !== "entitlements" && kind !== "fx") {
    return NextResponse.json({ error: "Unknown dataset kind" }, { status: 404 });
  }

  const snapshot =
    kind === "pricing"
      ? await loadLatestPricingSnapshot()
      : kind === "entitlements"
        ? await loadLatestEntitlementsSnapshot()
        : await loadLatestFxSnapshot();

  return NextResponse.json({
    kind,
    snapshot_date: snapshot.date,
    data: snapshot.data,
  });
}
