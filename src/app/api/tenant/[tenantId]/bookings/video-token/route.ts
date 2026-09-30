import { NextResponse } from "next/server";
import { agendaHttp } from "@/lib/agenda-runtime";
import { findTenantById } from "@/lib/tenant-registry";

export const dynamic = "force-dynamic";

// Token LiveKit: l'ospite si autentica col token del suo link, lo staff con la sessione siteadmin.
export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  if (!findTenantById(tenantId)) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  return agendaHttp.videoToken(request, { scope: tenantId });
}
