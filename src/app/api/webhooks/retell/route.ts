import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/database.types";
import { buildRetellInboundContext, isAuthorizedRetellRequest } from "@/lib/retell/inbound-orchestrator";
import { getAiPhoneSettings, listAiPhoneSettings } from "@/lib/retell/settings";
import { getTenantPaymentAccount } from "@/lib/payments/stripe/accounts";
import { buildAiPaymentInstruction } from "@/lib/payments/ai-payment-instruction";
import { findTenantById } from "@/lib/tenant-registry";
import { getTenantContent } from "@/lib/tenant-content";

// Saluto contestuale in base all'ora locale (Europe/Rome): Buongiorno / Buon pomeriggio / Buonasera.
function italianGreetingForNow(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  if (hour >= 6 && hour < 13) return "Buongiorno";
  if (hour >= 13 && hour < 19) return "Buon pomeriggio";
  return "Buonasera";
}

function normalizePhoneCandidates(value: string | null | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  return Array.from(new Set([trimmed, digitsOnly, `+${digitsOnly}`].filter(Boolean)));
}

async function resolveTenantFromInbound(payload: Record<string, unknown>): Promise<string | null> {
  const inbound = (payload.call_inbound ?? payload.call ?? {}) as Record<string, unknown>;
  const toNumber = typeof inbound.to_number === "string" ? inbound.to_number : null;
  const agentId = typeof inbound.agent_id === "string" ? inbound.agent_id : null;
  const settings = await listAiPhoneSettings();

  if (toNumber) {
    const candidates = normalizePhoneCandidates(toNumber);
    const byPhone = settings.find((entry) =>
      candidates.some((candidate) => candidate === entry.phoneNumber.trim()),
    );
    if (byPhone) return byPhone.tenantId;
  }
  if (agentId) {
    const byAgent = settings.find((entry) => entry.retellAgentId === agentId);
    if (byAgent) return byAgent.tenantId;
  }
  return null;
}

async function buildInboundDynamicVariables(
  tenantId: string,
  inbound: { fromNumber?: string | null; toNumber?: string | null } = {},
) {
  const settings = await getAiPhoneSettings(tenantId);
  const variables: Record<string, string> = {
    tenant_id: tenantId,
    daily_notes: (settings.quickSettings.notesForAssistant ?? "").trim(),
    caller_phone: (inbound.fromNumber ?? "").trim(),
    called_number: (inbound.toNumber ?? "").trim(),
    greeting: italianGreetingForNow(),
    // Default conservativi: la flow li può overrideare se manca contesto.
    multi_location_choice_required: "false",
    location_id: "",
    location_name: "",
    open_hours: "",
    special_hours: "",
    payment_instruction: "",
    payment_online_available: "false",
    payment_on_site_available: "true",
    payment_should_ask: "false",
    suggest_alternatives: settings.quickSettings.suggestAlternatives ? "true" : "false",
    ask_allergies: settings.quickSettings.askAllergiesForOrders ? "true" : "false",
    collect_marketing_consent: settings.quickSettings.collectMarketingConsent ? "true" : "false",
    human_transfer_enabled: settings.humanTransferEnabled ? "true" : "false",
    handoff_phone: settings.handoffPhone ?? "",
    accepting_orders: settings.quickSettings.acceptNewOrders.accepting ? "true" : "false",
    accepting_reservations: settings.quickSettings.acceptReservations.accepting ? "true" : "false",
  };

  // Anagrafica statica del locale dal content registry — tutto stringificato per Retell.
  try {
    const content = getTenantContent(tenantId);
    variables.venue_name = content.logoAlt ?? "";
    variables.venue_description = content.description ?? "";
    variables.venue_address = content.address?.full ?? "";
    variables.venue_phone = content.contact?.phone ?? "";
    variables.venue_website = (content.url ?? "").replace(/^https?:\/\//, "");
    variables.venue_specialty = (content.souls ?? [])
      .map((soul) => soul.title)
      .filter(Boolean)
      .join(", ");
    variables.venue_social_facebook = content.social?.facebook ?? "";
    variables.venue_social_instagram = content.social?.instagram ?? "";
    variables.venue_whatsapp_digits = content.contact?.whatsappDigits ?? "";
  } catch {
    // Tenant senza content registry: skip campi anagrafici, il resto basta.
  }

  try {
    const context = await buildRetellInboundContext(tenantId);
    variables.tenant_name = context.tenant.name;
    // venue_name preferisce il display name del registry; se mancante, ripiega sul nome tecnico.
    if (!variables.venue_name) variables.venue_name = context.tenant.name;
    const location = context.locations[0];
    if (location) {
      variables.location_id = location.id;
      variables.location_name = location.name;
      // Multi-sede: la flow chiede esplicitamente la sede solo quando il numero
      // chiamato non identifica univocamente una location.
      variables.multi_location_choice_required =
        context.locations.length > 1 ? "true" : "false";
      const weekly = location.weeklyHours
        .map((day) => `${day.label}: ${day.closed ? "chiuso" : day.slots.join(", ")}`)
        .join(" | ");
      if (weekly) variables.open_hours = weekly;
      const special = location.specialHours
        .map((entry) => `${entry.date}${entry.label ? ` (${entry.label})` : ""}: ${entry.closed ? "chiuso" : entry.slots.join(", ")}`)
        .join(" | ");
      variables.special_hours = special;
    }

    // Istruzione pagamento per il prompt — combina feature flag, stato Stripe Connect e policy AI.
    const tenantProfile = findTenantById(tenantId);
    const stripeAccount = await getTenantPaymentAccount(tenantId).catch(() => null);
    const instruction = buildAiPaymentInstruction({
      paymentsModuleEnabled: Boolean(tenantProfile?.features.payments),
      stripeReady: Boolean(stripeAccount?.chargesEnabled),
      policy: settings.paymentControls.acceptedMethods,
      vertical: context.tenant.vertical === "services" ? "services" : "food",
    });
    variables.payment_instruction = instruction.text;
    variables.payment_online_available = instruction.onlineAvailable ? "true" : "false";
    variables.payment_on_site_available = instruction.onSiteAvailable ? "true" : "false";
    variables.payment_should_ask = instruction.shouldAsk ? "true" : "false";
  } catch {
    // Contesto opzionale: la chiamata può proseguire con sole note del giorno + anagrafica statica.
  }
  return variables;
}

/** Riceve eventi Retell; persistenza grezza per idempotenza e debug. */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!isAuthorizedRetellRequest(req, rawBody)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  const eventType = typeof payload.event === "string" ? payload.event : null;
  const tenantIdParam = req.nextUrl.searchParams.get("tenant_id");

  // call_inbound: Retell aspetta una risposta sincrona con eventuali dynamic_variables/override_agent_id.
  // Qui iniettiamo le "Note del giorno" del ristoratore (quickSettings.notesForAssistant) + orari aggiornati.
  if (eventType === "call_inbound") {
    const tenantId = tenantIdParam || (await resolveTenantFromInbound(payload));
    const inbound = (payload.call_inbound ?? payload.call ?? {}) as Record<string, unknown>;
    const dynamicVariables = tenantId
      ? await buildInboundDynamicVariables(tenantId, {
          fromNumber: typeof inbound.from_number === "string" ? inbound.from_number : null,
          toNumber: typeof inbound.to_number === "string" ? inbound.to_number : null,
        })
      : {};
    const svc = createSupabaseServiceClient();
    if (svc) {
      await svc.from("channel_webhook_events").insert({
        channel: "retell",
        tenant_id: tenantId,
        payload: payload as Json,
      });
    }
    return NextResponse.json({
      call_inbound: {
        dynamic_variables: dynamicVariables,
        metadata: tenantId ? { tenant_id: tenantId } : {},
      },
    });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json({ ok: true, stored: false });
  }
  await svc.from("channel_webhook_events").insert({
    channel: "retell",
    tenant_id: tenantIdParam,
    payload: payload as Json,
  });
  return NextResponse.json({ ok: true, stored: true });
}

/** Endpoint rapido per Retell custom tools che devono recuperare il contesto tenant. */
export async function GET(req: NextRequest) {
  if (!isAuthorizedRetellRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  try {
    const context = await buildRetellInboundContext(tenantId, {
      locationId: req.nextUrl.searchParams.get("location_id"),
    });
    return NextResponse.json(context);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "retell_context_failed" },
      { status: 500 },
    );
  }
}
