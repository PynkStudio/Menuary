import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  cartLinesToDbRows,
  dbLinesToOrderLines,
  dbRowToOrder,
  type DbOrder,
  type DbOrderLine,
} from "@/lib/api/orders";
import type { CartLine } from "@/store/cart-store";

// ─── POST /api/orders — crea ordine ──────────────────────────────────────────

export type CreateOrderBody = {
  tenantId: string;
  type: "asporto" | "tavolo";
  lines: CartLine[];
  total: number;
  customerName?: string;
  pickupTime?: string;
  notes?: string;
  tableId?: string;
  tableLabel?: string;
  sessionId?: string;
  sessionCode?: string;
  dinerClientId?: string;
  dinerNickname?: string;
};

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const body: CreateOrderBody = await req.json();
  const { tenantId, type, lines, total, ...rest } = body;

  if (!tenantId || !type || !lines?.length) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  // Genera codice ordine atomico (B001, B002…)
  const { data: codeRow, error: codeErr } = await supabase.rpc("next_order_code", {
    p_tenant_id: tenantId,
    p_prefix: "B",
  });
  if (codeErr) return NextResponse.json({ error: codeErr.message }, { status: 500 });

  // Inserisci ordine
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenantId,
      code: codeRow as string,
      type,
      total,
      table_id: rest.tableId ?? null,
      table_label: rest.tableLabel ?? null,
      session_id: rest.sessionId ?? null,
      session_code: rest.sessionCode ?? null,
      diner_client_id: rest.dinerClientId ?? null,
      diner_nickname: rest.dinerNickname ?? null,
      customer_name: rest.customerName ?? null,
      pickup_time: rest.pickupTime ?? null,
      notes: rest.notes ?? null,
    })
    .select("id, code")
    .single();

  if (orderErr || !order) return NextResponse.json({ error: orderErr?.message }, { status: 500 });

  // Inserisci righe ordine
  const lineRows = cartLinesToDbRows(order.id, lines);
  if (lineRows.length > 0) {
    const { error: linesErr } = await supabase.from("order_lines").insert(lineRows);
    if (linesErr) return NextResponse.json({ error: linesErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: order.id, code: order.code }, { status: 201 });
}

// ─── GET /api/orders?tenantId=…&status=…&sessionId=… ─────────────────────────

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  const status = url.searchParams.get("status");
  const sessionId = url.searchParams.get("sessionId");

  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  let query = supabase
    .from("orders")
    .select("*, order_lines(*)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (sessionId) query = query.eq("session_id", sessionId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = (data ?? []).map((row) => {
    const { order_lines: dbLines, ...orderRow } = row as DbOrder & { order_lines: DbOrderLine[] };
    const lines = dbLinesToOrderLines(
      (dbLines ?? []).sort((a, b) => a.position - b.position),
    );
    return dbRowToOrder(orderRow, lines);
  });

  return NextResponse.json(orders);
}
