import { NextResponse } from "next/server";
import { agendaHttp } from "@/lib/agenda-runtime";
import { findTenantById } from "@/lib/tenant-registry";

export const dynamic = "force-dynamic";

// Prenotazione di una call: logica in @pynkstudio/agendaapp, effetti (CRM,
// email, WhatsApp, push) negli hook di src/lib/agenda-runtime.ts.
export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  if (!findTenantById(tenantId)) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  return agendaHttp.book(request, { scope: tenantId });
}
