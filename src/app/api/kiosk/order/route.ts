import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { resolveKioskDevice } from "@/lib/kiosk-auth";

type Body = {
  type: "tavolo" | "asporto";
  lines: { itemId: string; itemUuid?: string | null; name: string; qty: number; unit: number }[];
  total: number;
  customerName?: string | null;
  tableLabel?: string | null;
  notes?: string | null;
  /** Metodo dichiarato dal cliente sul kiosk (cash | stripe_qr | pos | satispay). */
  paymentMethod: string;
};

// POST /api/kiosk/order
// Header: X-Kiosk-Token
// Crea l'ordine usando il tenant_id derivato dal device (no spoofing dal client).
// In v1 i metodi non-cash sono demo: l'ordine viene comunque inserito in stato
// "nuovo" e il pagamento non è effettivamente regolato.
export async function POST(req: NextRequest) {
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const token = req.headers.get("x-kiosk-token");
  const device = await resolveKioskDevice(svc, token);
  if (!device) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.type || !Array.isArray(body.lines) || body.lines.length === 0) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // Genera codice ordine atomico (B001, B002…) lato Supabase.
  const { data: codeRow, error: codeErr } = await svc.rpc("next_order_code", {
    p_tenant_id: device.tenant_id,
    p_prefix: "K",
  });
  if (codeErr) return NextResponse.json({ error: codeErr.message }, { status: 500 });

  const { data: order, error: orderErr } = await svc
    .from("orders")
    .insert({
      tenant_id: device.tenant_id,
      code: codeRow as string,
      type: body.type,
      total: body.total,
      customer_name: body.customerName ?? null,
      table_label: body.tableLabel ?? null,
      location_id: device.location_id,
      notes: body.notes ?? `Kiosk: ${device.name} · pagamento ${body.paymentMethod}`,
    })
    .select("id, code")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: orderErr?.message ?? "order_create_failed" }, { status: 500 });
  }

  const lineRows = body.lines.map((l, i) => ({
    order_id: order.id,
    item_id: l.itemId,
    item_uuid: l.itemUuid ?? null,
    name: l.name,
    qty: l.qty,
    unit_price: l.unit,
    line_total: l.unit * l.qty,
    position: i,
  }));
  const { error: linesErr } = await svc.from("order_lines").insert(lineRows);
  if (linesErr) return NextResponse.json({ error: linesErr.message }, { status: 500 });

  return NextResponse.json({ id: order.id, code: order.code }, { status: 201 });
}
