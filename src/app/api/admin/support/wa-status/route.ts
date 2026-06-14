import { NextResponse } from "next/server";
import { getCurrentSiteadmin } from "@/lib/support/admin";
import { isTwilioApiConfigured, configuredTwilioFrom } from "@/lib/twilio/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteadmin = await getCurrentSiteadmin();
  if (!siteadmin) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const apiConfigured = isTwilioApiConfigured();
  const from = configuredTwilioFrom("whatsapp");
  const ready = apiConfigured && Boolean(from);

  return NextResponse.json({
    ok: ready,
    provider: "twilio",
    ready,
    from: from || null,
    state: ready ? "ready" : "not_configured",
    updatedAt: new Date().toISOString(),
    error: ready ? null : "Configura TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET e TWILIO_WHATSAPP_FROM.",
  });
}
