import { NextRequest, NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { getAiPhoneSettings } from "@/lib/retell/settings";
import { enqueueOutboundMessage, type OutboundChannel } from "@/lib/outbound/messages";

export const dynamic = "force-dynamic";

/**
 * POST /api/outbound/send-menu-link
 *
 * Invocato come custom function tool da Retell quando il cliente chiama solo
 * per informazioni e l'agente propone di inviare il link al menu via WhatsApp.
 * Inserisce il messaggio nella coda outbound (canale primario WA, fallback SMS)
 * e ritorna conferma immediata all'agente per poter chiudere la chiamata.
 *
 * Body (Retell custom tool payload):
 *   { tenantId, recipientPhone, locationName?, extraNote? }
 */
type Body = {
  tenantId?: string;
  recipientPhone?: string;
  locationName?: string | null;
  extraNote?: string | null;
};

// URL canonico del menu: menuary.it/c/[previewSlug] (short-link piattaforma).
// Quando il tenant avrà un dominio proprio, /c/[slug] continuerà a funzionare
// come alias permanente senza bisogno di aggiornare i template WA già inviati.
function menuShortUrl(tenantId: string): string {
  const tenant = findTenantById(tenantId);
  const platformBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuary.it";
  if (tenant?.previewSlug) return `${platformBase}/c/${tenant.previewSlug}`;
  return platformBase;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.tenantId) return NextResponse.json({ error: "tenantId_required" }, { status: 400 });
  if (!body.recipientPhone?.trim()) {
    return NextResponse.json({ error: "recipient_phone_required" }, { status: 400 });
  }

  const tenant = findTenantById(body.tenantId);
  if (!tenant) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });

  const settings = await getAiPhoneSettings(body.tenantId);

  // Canale: lo stesso primario/fallback configurato per i link pagamento — coerenza UX.
  const primary: OutboundChannel = settings.paymentControls.defaultChannel;
  const fallback: OutboundChannel | null = settings.paymentControls.fallbackChannel;

  const url = menuShortUrl(body.tenantId);
  const tenantName = tenant.label ?? tenant.name;
  const locationLine = body.locationName ? ` (${body.locationName})` : "";
  const extra = body.extraNote?.trim() ? `\n${body.extraNote.trim()}` : "";
  const messageBody =
    `Ciao da ${tenantName}${locationLine}! Qui trovi il nostro menu completo: ${url}${extra}\nA presto!`;

  // Template WA approvato Meta per il link menu (opzionale: se non configurato usa testo libero).
  // Variabili: {{1}} = nome locale, {{2}} = previewSlug (suffisso del bottone CTA menuary.it/c/{{2}}).
  const waContentSid = process.env.TWILIO_WA_MENU_LINK_SID ?? null;
  const waContentVariables = waContentSid && tenant.previewSlug
    ? { "1": tenantName, "2": tenant.previewSlug }
    : null;

  try {
    const enqueued = await enqueueOutboundMessage({
      tenantId: body.tenantId,
      kind: "menu_link",
      channel: primary,
      fallbackChannel: fallback,
      recipientPhone: body.recipientPhone,
      body: messageBody,
      source: "retell",
      contentSid: primary === "whatsapp" ? waContentSid : null,
      contentVariables: primary === "whatsapp" ? waContentVariables : null,
      metadata: {
        menu_url: url,
        location_name: body.locationName ?? null,
      },
    });
    return NextResponse.json({
      ok: true,
      message_id: enqueued.id,
      channel: enqueued.channel,
      fallback_channel: enqueued.fallbackChannel,
      url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "enqueue_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
