import { NextRequest, NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { TENANTS } from "@/lib/tenant-registry";
import { loadDefaultPrinter } from "@/lib/printing/config";
import { buildComandaEscPos } from "@/lib/printing/comanda";
import { dbLinesToOrderLines, dbRowToOrder, type DbOrder, type DbOrderLine } from "@/lib/api/orders";

// Coda di stampa comande per la postazione di stampa (modulo printStations).
//
// GET  → { printer, orders } : la stampante predefinita del locale + gli ordini
//        ACCETTATI (entrati in cucina) NON ancora stampati, con le righe.
// POST → marca gli ordini come stampati (dedup server-side: niente ristampe a
//        ogni evento realtime / refresh / riapertura della pagina).
//
// Agnostico dal canale: sito, WhatsApp e Retell creano tutti righe in `orders`;
// qui contano solo lo stato e il flag di stampa.
// TODO(multi-printer): instradare per reparto/categoria su più stampanti.

const ORDER_COLUMNS =
  "id, code, type, table_label, session_id, session_code, diner_client_id, diner_nickname, customer_name, customer_email, pickup_time, notes, total, status, created_at, dine_option, confirmation_expires_at, confirmed_at, auto_accepted, payment_method, payment_status";

// Stati esclusi dalla stampa: in attesa di conferma, scaduti, annullati.
const PRINTABLE_EXCLUDED = ["pending_confirmation", "expired", "annullato"];

function tenantFrom(req: NextRequest, body?: { tenantId?: string } | null) {
  return req.nextUrl.searchParams.get("tenantId") ?? body?.tenantId ?? "";
}

function moduleEnabled(tenantId: string) {
  const tenant = TENANTS.find((t) => t.id === tenantId);
  return Boolean(tenant && getGestioneModuleAccess(tenant.features).canManagePrintStations);
}

export async function GET(req: NextRequest) {
  const tenantId = tenantFrom(req);
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!moduleEnabled(tenantId) && (auth.isDemo || !auth.isPlatformAdmin)) {
    return NextResponse.json({ error: "module_disabled" }, { status: 403 });
  }

  const locationId = req.nextUrl.searchParams.get("locationId");

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const printer = await loadDefaultPrinter(supabase, tenantId, locationId);
  // Questa coda serve le stampanti locali lato client: QZ sul PC cassa e SUNMI POS
  // tramite app Android. Le stampanti cloud SUNMI restano gestite server-side.
  const localConnection = printer?.connection === "qz" || printer?.connection === "sunmi_pos";
  if (
    !printer ||
    !localConnection ||
    !printer.enabled ||
    !printer.autoPrint ||
    (printer.connection === "qz" && !printer.qzPrinterName)
  ) {
    return NextResponse.json({ printer, orders: [] });
  }

  // Solo ordini recenti: alla prima apertura non vogliamo svuotare lo storico.
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  const { data: orderRows, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("tenant_id", tenantId)
    .is("comanda_printed_at", null)
    .not("status", "in", `(${PRINTABLE_EXCLUDED.join(",")})`)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(25);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (orderRows ?? []) as unknown as DbOrder[];
  if (rows.length === 0) return NextResponse.json({ printer, orders: [] });

  const ids = rows.map((r) => r.id);
  const { data: lineRows } = await supabase
    .from("order_lines")
    .select("*")
    .in("order_id", ids)
    .order("position", { ascending: true });

  const linesByOrder = new Map<string, DbOrderLine[]>();
  for (const l of (lineRows ?? []) as unknown as DbOrderLine[]) {
    const arr = linesByOrder.get(l.order_id) ?? [];
    arr.push(l);
    linesByOrder.set(l.order_id, arr);
  }

  const orders = rows.map((row) =>
    dbRowToOrder(row, dbLinesToOrderLines(linesByOrder.get(row.id) ?? [])),
  );

  if (req.nextUrl.searchParams.get("format") === "escpos") {
    const jobs = orders.map((order) => ({
      orderId: order.id,
      code: order.code,
      escposBase64: Buffer.from(buildComandaEscPos(order, printer), "latin1").toString("base64"),
      copies: printer.copies,
    }));
    return NextResponse.json({ printer, orders, jobs });
  }

  return NextResponse.json({ printer, orders });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { tenantId?: string; orderIds?: string[] } | null;
  const tenantId = tenantFrom(req, body);
  if (!tenantId || !body?.orderIds?.length) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!moduleEnabled(tenantId) && (auth.isDemo || !auth.isPlatformAdmin)) {
    return NextResponse.json({ error: "module_disabled" }, { status: 403 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  const { error } = await supabase
    .from("orders")
    .update({ comanda_printed_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .is("comanda_printed_at", null)
    .in("id", body.orderIds.slice(0, 50));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
