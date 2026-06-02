import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { getSpecialHours } from "@/lib/data/special-hours";

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
    const rows = await getSpecialHours(tenantId);
    return NextResponse.json({
      specialHours: rows.map((r) => ({
        date: r.date,
        closed: r.closed,
        slots: r.slots,
        label: r.label,
      })),
    });
  } catch {
    return NextResponse.json({ specialHours: [] });
  }
}
