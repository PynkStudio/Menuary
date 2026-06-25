import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { verifySunmiSign } from "@/lib/printing/sunmi-cloud";
import { mapPrinterRow } from "@/lib/printing/config";
import { buildComandaEscPos } from "@/lib/printing/comanda";
import { dbLinesToOrderLines, dbRowToOrder, type DbOrder, type DbOrderLine } from "@/lib/api/orders";

// Callback pubblico delle stampanti cloud SUNMI (connection 'sunmi_cloud').
//
// Dopo il push (vedi sunmi-cloud.ts), la stampante si collega QUI e scarica la
// comanda in ESC/POS. La richiesta è firmata (app_id/sign): la verifichiamo.
//
// ⚠️ TODO(verify): metodo (GET/POST), nomi esatti dei parametri e formato della
// RISPOSTA attesi dalla stampante SUNMI (ESC/POS raw vs JSON/base64) vanno
// confermati sulla doc autenticata. Sotto: ESC/POS raw come default ragionevole.

const ORDER_COLUMNS =
  "id, tenant_id, location_id, code, type, table_label, session_id, session_code, diner_client_id, diner_nickname, customer_name, customer_email, pickup_time, notes, total, status, created_at, dine_option, confirmation_expires_at, confirmed_at, auto_accepted";

async function paramsFrom(req: NextRequest): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => (out[k] = v));
  if (req.method === "POST") {
    try {
      const form = await req.formData();
      form.forEach((v, k) => (out[k] = String(v)));
    } catch {
      /* body non-form: ignora */
    }
  }
  return out;
}

async function handle(req: NextRequest) {
  const params = await paramsFrom(req);
  const sign = params.sign ?? null;
  const sn = params.sn ?? params.device_sn ?? "";
  const traceId = params.trace_id ?? params.traceId ?? "";

  if (!sn || !traceId) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (!verifySunmiSign(params, sign)) {
    return NextResponse.json({ error: "bad_sign" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service unavailable" }, { status: 503 });

  // Stampante per SN → ricaviamo tenant e config (larghezza/copie).
  const { data: printerRow } = await supabase
    .from("tenant_printers")
    .select("*")
    .eq("device_sn", sn)
    .eq("connection", "sunmi_cloud")
    .limit(1)
    .maybeSingle();
  if (!printerRow) return NextResponse.json({ error: "printer_not_found" }, { status: 404 });
  const printer = mapPrinterRow(printerRow as Parameters<typeof mapPrinterRow>[0]);

  // Ordine richiesto (trace_id = order id), scoping per tenant della stampante.
  const { data: orderRow } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("tenant_id", printer.tenantId)
    .eq("id", traceId)
    .maybeSingle();
  if (!orderRow) return NextResponse.json({ error: "order_not_found" }, { status: 404 });

  const { data: lineRows } = await supabase
    .from("order_lines")
    .select("*")
    .eq("order_id", traceId)
    .order("position", { ascending: true });

  const order = dbRowToOrder(
    orderRow as unknown as DbOrder,
    dbLinesToOrderLines((lineRows ?? []) as unknown as DbOrderLine[]),
  );

  const escpos = buildComandaEscPos(order, printer);

  // ESC/POS raw. TODO(verify): se SUNMI attende un wrapper JSON/base64, adattare.
  return new NextResponse(escpos, {
    status: 200,
    headers: { "Content-Type": "application/octet-stream" },
  });
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
