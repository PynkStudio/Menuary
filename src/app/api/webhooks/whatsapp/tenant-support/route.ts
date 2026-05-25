import { NextRequest, NextResponse } from "next/server";
import { handleTenantSupportWhatsappMessage } from "@/lib/tenant-support/whatsapp-service";

type TenantSupportWhatsappBody = {
  from?: string;
  text?: string;
  messageId?: string;
  message_id?: string;
  imageUrl?: string;
  image_url?: string;
  mediaUrl?: string;
  media_url?: string;
  imageDataUrl?: string;
  image_data_url?: string;
};

function isAuthorizedTenantSupportRequest(request: Request): boolean {
  const configured = process.env.TENANT_SUPPORT_WHATSAPP_SECRET || process.env.WHATSAPP_WEB_BRIDGE_SECRET;
  if (!configured) return true;
  return (
    request.headers.get("x-tenant-support-whatsapp-secret") === configured ||
    request.headers.get("x-whatsapp-web-secret") === configured
  );
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedTenantSupportRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as TenantSupportWhatsappBody | null;
  const from = body?.from?.trim();
  const imageUrl = body?.imageUrl ?? body?.image_url ?? body?.mediaUrl ?? body?.media_url ?? body?.imageDataUrl ?? body?.image_data_url ?? null;
  const text = body?.text?.trim() || (imageUrl ? "carica elementi menu da questa foto" : "");

  if (!from || !text) {
    return NextResponse.json({ error: "from_and_text_required" }, { status: 400 });
  }

  try {
    const result = await handleTenantSupportWhatsappMessage({
      from,
      text,
      imageUrl,
      messageId: body?.messageId ?? body?.message_id ?? null,
      payload: body,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "tenant_support_whatsapp_failed" },
      { status: 500 },
    );
  }
}
