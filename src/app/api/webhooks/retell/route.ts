import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/types";
import { buildRetellInboundContext, isAuthorizedRetellRequest } from "@/lib/retell/inbound-orchestrator";
import { getAiPhoneSettings, listAiPhoneSettings } from "@/lib/retell/settings";
import { getTenantPaymentAccount } from "@/lib/payments/stripe/accounts";
import { buildAiPaymentInstruction } from "@/lib/payments/ai-payment-instruction";
import { findTenantById } from "@/lib/tenant-registry";

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

async function buildInboundDynamicVariables(tenantId: string) {
  const settings = await getAiPhoneSettings(tenantId);
  const variables: Record<string, string> = {
    tenant_id: tenantId,
    daily_notes: (settings.quickSettings.notesForAssistant ?? "").trim(),
  };
  try {
    const context = await buildRetellInboundContext(tenantId);
    variables.tenant_name = context.tenant.name;
    const location = context.locations[0];
    if (location) {
      variables.location_name = location.name;
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
    // Contesto opzionale: la chiamata può proseguire con sole note del giorno.
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
    const dynamicVariables = tenantId ? await buildInboundDynamicVariables(tenantId) : {};
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
