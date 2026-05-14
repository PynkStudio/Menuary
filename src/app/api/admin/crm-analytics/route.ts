import { NextRequest, NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isAdminRequest } from "@/lib/api/admin-guard";

/** Aggregati CRM + vendite (solo con service_role + password admin locale). */
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

  const { count: orderCount } = await svc
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const { data: revenueRows } = await svc.from("orders").select("total").eq("tenant_id", tenantId);

  const totalRev = (revenueRows ?? []).reduce((s, r) => s + (r.total ?? 0), 0);
  const avgTicket = orderCount && orderCount > 0 ? totalRev / orderCount : 0;

  const { data: orderIds } = await svc.from("orders").select("id").eq("tenant_id", tenantId);
  const ids = (orderIds ?? []).map((o) => o.id);
  let topLines: { name: string; qty: number }[] = [];
  if (ids.length > 0) {
    const { data: lines } = await svc.from("order_lines").select("name, qty").in("order_id", ids);
    topLines = lines ?? [];
  }

  const freq = new Map<string, number>();
  for (const line of topLines) {
    freq.set(line.name, (freq.get(line.name) ?? 0) + line.qty);
  }
  const topDishes = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, qty]) => ({ name, qty }));

  const { count: linkedCustomers } = await svc
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .not("menuary_user_id", "is", null);

  const { count: reservationCount } = await svc
    .from("reservation_requests")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  return NextResponse.json({
    orders: orderCount ?? 0,
    avgTicket,
    revenueTotal: totalRev,
    topDishes,
    customersWithMenuaryProfile: linkedCustomers ?? 0,
    reservations: reservationCount ?? 0,
  });
}
