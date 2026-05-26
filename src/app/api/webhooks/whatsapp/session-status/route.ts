import { NextRequest, NextResponse } from "next/server";
import { upsertTenantWhatsappSession, type WhatsappSessionStatus } from "@/lib/whatsapp/session-status";

type Body = {
  tenantId?: string;
  tenant_id?: string;
  sessionId?: string;
  session_id?: string;
  phoneE164?: string | null;
  phone_e164?: string | null;
  status?: WhatsappSessionStatus;
  qrDataUrl?: string | null;
  qr_data_url?: string | null;
  lastError?: string | null;
  last_error?: string | null;
  metadata?: Record<string, unknown>;
};

function isAuthorized(request: Request): boolean {
  const configured = process.env.WHATSAPP_WEB_BRIDGE_SECRET;
  if (!configured) return true;
  return request.headers.get("x-whatsapp-web-secret") === configured;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const tenantId = body?.tenantId ?? body?.tenant_id ?? "";
  const status = body?.status;

  if (!tenantId || !status || !["pending_qr", "connected", "offline", "error"].includes(status)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const session = await upsertTenantWhatsappSession({
      tenantId,
      sessionId: body?.sessionId ?? body?.session_id,
      phoneE164: body?.phoneE164 ?? body?.phone_e164 ?? null,
      status: status as Exclude<WhatsappSessionStatus, "not_configured">,
      qrDataUrl: body?.qrDataUrl ?? body?.qr_data_url ?? null,
      lastError: body?.lastError ?? body?.last_error ?? null,
      metadata: body?.metadata,
    });
    return NextResponse.json({ ok: true, session });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "whatsapp_session_update_failed" },
      { status: 500 },
    );
  }
}
