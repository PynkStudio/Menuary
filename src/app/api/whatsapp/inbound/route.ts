import { NextRequest, NextResponse } from "next/server";
import {
  buildRetellInboundContext,
  createRetellOrder,
  createRetellReservation,
  getRetellAvailability,
  type CreateRetellOrderInput,
  type CreateRetellReservationInput,
  type RetellAvailabilityInput,
} from "@/lib/retell/inbound-orchestrator";
import { isAuthorizedWhatsappWebBridgeRequest } from "@/lib/whatsapp/web-bridge-auth";

type WhatsappActionBody =
  | ({ action: "context" } & { tenantId?: string; tenant_id?: string; locationId?: string | null; location_id?: string | null })
  | ({ action: "incoming_message"; tenantId?: string; tenant_id?: string; from: string; text: string; messageId?: string })
  | ({ action: "availability" } & RetellAvailabilityInput)
  | ({ action: "create_reservation" } & CreateRetellReservationInput)
  | ({ action: "create_order" } & CreateRetellOrderInput);

function tenantFrom(req: NextRequest, body?: WhatsappActionBody | null): string {
  return (
    req.nextUrl.searchParams.get("tenant_id") ||
    req.nextUrl.searchParams.get("tenantId") ||
    (body && "tenantId" in body ? body.tenantId : undefined) ||
    (body && "tenant_id" in body ? body.tenant_id : undefined) ||
    ""
  );
}

function locationFrom(req: NextRequest, body?: WhatsappActionBody | null): string | null {
  return (
    req.nextUrl.searchParams.get("location_id") ||
    req.nextUrl.searchParams.get("locationId") ||
    (body && "locationId" in body ? body.locationId ?? null : null) ||
    (body && "location_id" in body ? body.location_id ?? null : null)
  );
}

async function contextResponse(req: NextRequest, body?: WhatsappActionBody | null) {
  const tenantId = tenantFrom(req, body);
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });
  const context = await buildRetellInboundContext(tenantId, {
    locationId: locationFrom(req, body),
    includeUnavailable: req.nextUrl.searchParams.get("include_unavailable") === "true",
    channel: "whatsapp",
  });
  if (!context.tenant.aiWhatsappEnabled) {
    return NextResponse.json({ error: "ai_whatsapp_not_enabled", context }, { status: 403 });
  }
  return NextResponse.json(context);
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedWhatsappWebBridgeRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return await contextResponse(req);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "whatsapp_context_failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedWhatsappWebBridgeRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as WhatsappActionBody | null;
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  try {
    if (body.action === "context") return await contextResponse(req, body);

    if (body.action === "incoming_message") {
      const tenantId = tenantFrom(req, body);
      if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });
      const context = await buildRetellInboundContext(tenantId, { locationId: locationFrom(req, body), channel: "whatsapp" });
      if (!context.tenant.aiWhatsappEnabled) {
        return NextResponse.json({ error: "ai_whatsapp_not_enabled", context }, { status: 403 });
      }
      return NextResponse.json({
        ok: true,
        context,
        bridgeInstructions: [
          "Lo scraper WhatsApp Web deve inviare i messaggi utente qui o al motore LLM applicativo.",
          "Per scrivere dati usa le action availability, create_order e create_reservation dello stesso endpoint.",
          "Per ora questo endpoint non usa Meta API e non invia messaggi direttamente: restituisce payload strutturati al bridge.",
        ],
      });
    }

    if (body.action === "availability") {
      const result = await getRetellAvailability(body);
      return NextResponse.json({ ok: true, availability: result });
    }

    if (body.action === "create_reservation") {
      const result = await createRetellReservation({ ...body, source: "whatsapp" });
      return NextResponse.json({ ok: true, reservation: result });
    }

    if (body.action === "create_order") {
      const result = await createRetellOrder({
        ...body,
        source: "whatsapp",
        paymentChannel: body.paymentChannel ?? "whatsapp",
      });
      return NextResponse.json({ ok: true, order: result });
    }

    return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "whatsapp_action_failed" },
      { status: 500 },
    );
  }
}
