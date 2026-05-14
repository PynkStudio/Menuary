import { NextRequest, NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isAdminRequest } from "@/lib/api/admin-guard";

/** Canali delivery + righe magazzino per tenant (admin). */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  if (!tenantId || !findTenantById(tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json({ error: "supabase_service_unconfigured" }, { status: 503 });
  }

  const [{ data: channels }, { data: stock }] = await Promise.all([
    svc.from("delivery_channels").select("*").eq("tenant_id", tenantId).order("name"),
    svc.from("inventory_ingredients").select("*").eq("tenant_id", tenantId).order("name"),
  ]);

  return NextResponse.json({
    deliveryChannels: channels ?? [],
    inventory: stock ?? [],
  });
}
