import { NextResponse } from "next/server";
import { agendaHttp } from "@/lib/agenda-runtime";
import { findTenantById } from "@/lib/tenant-registry";

export const dynamic = "force-dynamic";

// «Salva sul calendario» dalle email: file .ics della prenotazione, autenticato dal token del link personale.
export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  if (!findTenantById(tenantId)) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  return agendaHttp.guestIcs(request, { scope: tenantId });
}
