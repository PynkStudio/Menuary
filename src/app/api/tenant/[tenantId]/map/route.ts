import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { getPrimaryLocation } from "@/lib/data/google-sync";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const tenant = findTenantById(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  try {
    const location = await getPrimaryLocation(tenantId);
    return NextResponse.json({
      google: location
        ? {
            placeId: location.placeId,
            locationName: location.locationName,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ google: null });
  }
}
