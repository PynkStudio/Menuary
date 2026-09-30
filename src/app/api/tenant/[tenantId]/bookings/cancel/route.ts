import { NextResponse } from "next/server";
import { agendaHttp } from "@/lib/agenda-runtime";
import { findTenantById } from "@/lib/tenant-registry";

export const dynamic = "force-dynamic";

// Annullamento da parte dell'ospite, col token del link personale.
export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  if (!findTenantById(tenantId)) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  return agendaHttp.guestCancel(request, { scope: tenantId });
}
