import { NextRequest, NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isAdminRequest } from "@/lib/api/admin-guard";

type PatchBody = {
  status?: string;
  table_id?: string | null;
  notes?: string | null;
  customer_name?: string;
  customer_phone?: string;
  covers?: number;
  reservation_date?: string;
  reservation_time?: string;
  assigned_area?: string | null;
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ tenantId: string; reservationId: string }> },
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tenantId, reservationId } = await ctx.params;
  if (!findTenantById(tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json({ error: "supabase_service_unconfigured" }, { status: 503 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { data, error } = await svc
    .from("reservation_requests")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId)
    .eq("tenant_id", tenantId)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
