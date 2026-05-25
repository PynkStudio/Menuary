import { NextRequest, NextResponse } from "next/server";
import {
  buildRetellInboundContext,
  createRetellOrder,
  createRetellReservation,
  getRetellAvailability,
  isAuthorizedRetellRequest,
  type CreateRetellOrderInput,
  type CreateRetellReservationInput,
  type RetellAvailabilityInput,
} from "@/lib/retell/inbound-orchestrator";

type RetellActionBody =
  | ({ action: "context" } & { tenantId?: string; tenant_id?: string; locationId?: string | null; location_id?: string | null })
  | ({ action: "availability" } & RetellAvailabilityInput)
  | ({ action: "create_reservation" } & CreateRetellReservationInput)
  | ({ action: "create_order" } & CreateRetellOrderInput);

function tenantFrom(req: NextRequest, body?: RetellActionBody | null): string {
  return (
    req.nextUrl.searchParams.get("tenant_id") ||
    req.nextUrl.searchParams.get("tenantId") ||
    (body && "tenantId" in body ? body.tenantId : undefined) ||
    (body && "tenant_id" in body ? body.tenant_id : undefined) ||
    ""
  );
}

function locationFrom(req: NextRequest, body?: RetellActionBody | null): string | null {
  return (
    req.nextUrl.searchParams.get("location_id") ||
    req.nextUrl.searchParams.get("locationId") ||
    (body && "locationId" in body ? body.locationId ?? null : null) ||
    (body && "location_id" in body ? body.location_id ?? null : null)
  );
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedRetellRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const tenantId = tenantFrom(req);
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  try {
    const context = await buildRetellInboundContext(tenantId, {
      locationId: locationFrom(req),
      includeUnavailable: req.nextUrl.searchParams.get("include_unavailable") === "true",
    });
    if (!context.tenant.aiPhoneEnabled) {
      return NextResponse.json({ error: "ai_phone_not_enabled", context }, { status: 403 });
    }
    return NextResponse.json(context);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "retell_context_failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedRetellRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as RetellActionBody | null;
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  try {
    if (body.action === "context") {
      const tenantId = tenantFrom(req, body);
      if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });
      const context = await buildRetellInboundContext(tenantId, { locationId: locationFrom(req, body) });
      if (!context.tenant.aiPhoneEnabled) {
        return NextResponse.json({ error: "ai_phone_not_enabled", context }, { status: 403 });
      }
      return NextResponse.json(context);
    }

    if (body.action === "create_reservation") {
      const result = await createRetellReservation({ ...body, source: "retell" });
      return NextResponse.json({ ok: true, reservation: result });
    }

    if (body.action === "availability") {
      const result = await getRetellAvailability(body);
      return NextResponse.json({ ok: true, availability: result });
    }

    if (body.action === "create_order") {
      const result = await createRetellOrder({ ...body, source: "retell" });
      return NextResponse.json({ ok: true, order: result });
    }

    return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "retell_action_failed" },
      { status: 500 },
    );
  }
}
