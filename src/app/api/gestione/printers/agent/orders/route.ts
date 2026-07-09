import { NextRequest, NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { buildComandaEscPos } from "@/lib/printing/comanda";
import { loadDefaultPrinter } from "@/lib/printing/config";
import { dbLinesToOrderLines, dbRowToOrder, type DbOrder, type DbOrderLine } from "@/lib/api/orders";
import type { Order } from "@/lib/types";

const ORDER_COLUMNS =
  "id, code, type, table_label, session_id, session_code, diner_client_id, diner_nickname, customer_name, customer_email, pickup_time, notes, total, status, created_at, dine_option, confirmation_expires_at, confirmed_at, auto_accepted, payment_method, payment_status";

type OrderSummary = {
  id: string;
  code: string;
  customerName: string | null;
  status: string;
  total: number;
  createdAt: string;
  printed: boolean;
  escposBase64?: string;
};

function tenantFrom(req: NextRequest) {
  return req.nextUrl.searchParams.get("tenantId") ?? "";
}

function orderToSummary(order: Order, printed: boolean, escposBase64?: string): OrderSummary {
  return {
    id: order.id,
    code: order.code,
    customerName: order.customerName ?? null,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    printed,
    ...(escposBase64 ? { escposBase64 } : {}),
  };
}

export async function GET(req: NextRequest) {
  const tenantId = tenantFrom(req);
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const locationId = req.nextUrl.searchParams.get("locationId");
  const printer = await loadDefaultPrinter(supabase, tenantId, locationId);
  if (!printer || printer.connection !== "sunmi_pos") {
    return NextResponse.json({ printer, recent: [], history: [] });
  }

  const hours = Math.max(1, Math.min(168, Number(req.nextUrl.searchParams.get("hours") ?? 24)));
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data: orderRows, error } = await supabase
    .from("orders")
    .select(`${ORDER_COLUMNS}, comanda_printed_at`)
    .eq("tenant_id", tenantId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (orderRows ?? []) as unknown as Array<DbOrder & { comanda_printed_at: string | null }>;
  const ids = rows.map((r) => r.id);
  const { data: lineRows } = ids.length
    ? await supabase
        .from("order_lines")
        .select("*")
        .in("order_id", ids)
        .order("position", { ascending: true })
    : { data: [] };

  const linesByOrder = new Map<string, DbOrderLine[]>();
  for (const line of (lineRows ?? []) as unknown as DbOrderLine[]) {
    const arr = linesByOrder.get(line.order_id) ?? [];
    arr.push(line);
    linesByOrder.set(line.order_id, arr);
  }

  const summaries = rows.map((row) => {
    const order = dbRowToOrder(row, dbLinesToOrderLines(linesByOrder.get(row.id) ?? []));
    return orderToSummary(
      order,
      Boolean(row.comanda_printed_at),
      Buffer.from(buildComandaEscPos(order, printer), "latin1").toString("base64"),
    );
  });

  return NextResponse.json({
    printer,
    recent: summaries.slice(0, 12),
    history: summaries.slice(12),
  });
}
