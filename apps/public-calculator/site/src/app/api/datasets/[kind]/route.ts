import { NextResponse } from "next/server";
import {
  loadLatestEntitlementsSnapshot,
  loadLatestFxSnapshot,
  loadLatestModelsSnapshot,
  loadLatestPricingSnapshot,
} from "@/lib/public-datasets";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string }> },
): Promise<NextResponse> {
  const { kind } = await params;

  if (kind !== "pricing" && kind !== "entitlements" && kind !== "fx" && kind !== "models") {
    return NextResponse.json({ error: "Unknown dataset kind" }, { status: 404 });
  }

  const snapshot =
    kind === "pricing"
      ? await loadLatestPricingSnapshot()
      : kind === "entitlements"
        ? await loadLatestEntitlementsSnapshot()
        : kind === "fx"
          ? await loadLatestFxSnapshot()
          : await loadLatestModelsSnapshot();

  return NextResponse.json({
    kind,
    snapshot_date: snapshot.date,
    data: snapshot.data,
  });
}
