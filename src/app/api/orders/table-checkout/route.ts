import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { findTenantById } from "@/lib/tenant-registry";
import { isTenantFeatureEffective } from "@/lib/tenant-modules";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServiceClient();
  if (!supabase)
    return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  let body: { tenantId?: string; sessionId?: string; tableId?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { tenantId, sessionId, tableId } = body;
  if (!tenantId || !sessionId)
    return NextResponse.json(
      { error: "tenantId_and_sessionId_required" },
      { status: 400 },
    );

  const tenant = findTenantById(tenantId);
  if (
    !tenant ||
    !isTenantFeatureEffective(tenant.features, "autonomousTableCheckout")
  )
    return NextResponse.json(
      { error: "autonomous_checkout_not_enabled" },
      { status: 403 },
    );

  const { data: sessionOrders, error: fetchErr } = await supabase
    .from("orders")
    .select("id, code, total, status, public_token, payment_status")
    .eq("tenant_id", tenantId)
    .eq("session_id", sessionId)
    .neq("status", "annullato");

  if (fetchErr)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  if (!sessionOrders || sessionOrders.length === 0)
    return NextResponse.json({ error: "no_orders_in_session" }, { status: 404 });

  const grandTotal = sessionOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  if (grandTotal <= 0)
    return NextResponse.json({ error: "nothing_to_pay" }, { status: 422 });

  const alreadyPaid = sessionOrders.find(
    (o) => o.payment_status === "paid" && o.code?.startsWith("TC"),
  );
  if (alreadyPaid)
    return NextResponse.json({
      code: alreadyPaid.code,
      publicToken: alreadyPaid.public_token,
    });

  const { data: codeRow, error: codeErr } = await supabase.rpc(
    "next_order_code",
    { p_tenant_id: tenantId, p_prefix: "TC" },
  );
  if (codeErr)
    return NextResponse.json({ error: codeErr.message }, { status: 500 });

  const allLines: Array<{
    item_id: string;
    name: string;
    qty: number;
    unit_price: number;
    line_total: number;
    variant_label: string | null;
  }> = [];

  for (const o of sessionOrders) {
    const { data: lines } = await supabase
      .from("order_lines")
      .select("item_id, name, qty, unit_price, line_total, variant_label")
      .eq("order_id", o.id);
    if (lines) allLines.push(...lines);
  }

  const { data: checkoutOrder, error: insertErr } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenantId,
      code: codeRow as string,
      type: "tavolo",
      total: grandTotal,
      source: "web",
      status: "nuovo",
      table_id: tableId ?? null,
      session_id: sessionId,
      auto_accepted: true,
      confirmed_at: new Date().toISOString(),
      notes: `Checkout autonomo tavolo — consolida ${sessionOrders.length} ordini della sessione`,
    } as never)
    .select("id, code, public_token")
    .single();

  if (insertErr || !checkoutOrder)
    return NextResponse.json(
      { error: insertErr?.message ?? "insert_failed" },
      { status: 500 },
    );

  if (allLines.length > 0) {
    await supabase.from("order_lines").insert(
      allLines.map((l) => ({
        order_id: checkoutOrder.id,
        item_id: l.item_id,
        name: l.name,
        qty: l.qty,
        unit_price: l.unit_price,
        line_total: l.line_total,
        variant_label: l.variant_label,
      })),
    );
  }

  return NextResponse.json(
    {
      id: checkoutOrder.id,
      code: checkoutOrder.code,
      publicToken:
        (checkoutOrder as { public_token?: string }).public_token ?? null,
    },
    { status: 201 },
  );
}
