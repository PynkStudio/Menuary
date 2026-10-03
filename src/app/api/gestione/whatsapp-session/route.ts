import { NextRequest, NextResponse } from "next/server";
import { requireGestione } from "@/lib/gestione-auth";
import { getTenantWhatsappSession } from "@/lib/whatsapp/session-status";

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId") ?? "";
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  const auth = await requireGestione(tenantId, "admin");
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  if (auth.isDemo) return NextResponse.json({ session: null });

  try {
    const session = await getTenantWhatsappSession(tenantId);
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "whatsapp_session_load_failed" },
      { status: 500 },
    );
  }
}
