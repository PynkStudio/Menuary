import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/types";

/** Riceve eventi Retell; persistenza grezza per idempotenza e debug. */
export async function POST(req: NextRequest) {
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
