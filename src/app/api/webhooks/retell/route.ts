import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/types";
import { buildRetellInboundContext, isAuthorizedRetellRequest } from "@/lib/retell/inbound-orchestrator";

/** Riceve eventi Retell; persistenza grezza per idempotenza e debug. */
export async function POST(req: NextRequest) {
  if (!isAuthorizedRetellRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const svc = createSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json({ ok: true, stored: false });
  }
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  await svc.from("channel_webhook_events").insert({
    channel: "retell",
    tenant_id: tenantId,
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
