import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isDemoHost } from "@/lib/platform";
import { getTenantDemoControl } from "@/lib/demo-controls";
import { loadDefaultPrinter } from "./config";
import { buildComandaEscPos } from "./comanda";
import { bindPrinterToShop, isSunmiConfigured, pushPrintContent } from "./sunmi-cloud";
import { dbLinesToOrderLines, dbRowToOrder, type DbOrder, type DbOrderLine } from "@/lib/api/orders";

// Dispatch server-side della stampa comanda per un ordine appena accettato.
//
// - connection 'sunmi_cloud' → push diretto (Cloud to Cloud): costruiamo l'ESC/POS
//   e lo inviamo a SUNMI con pushContent; SUNMI lo inoltra alla stampante (per SN).
// - connection 'qz' → no-op: la stampa USB è gestita dal watcher client nella
//   pagina Operativo → Ordini (la stampante USB non è raggiungibile dal server).
// - connection 'sunmi_pos' → no-op: stampa locale sul terminale POS SUNMI tramite
//   app Android Menuary Print Agent, che polla la coda server.
//
// Idempotente: marca `comanda_printed_at` quando prende in carico l'ordine, così
// non viene rilanciato (né dal doppio trigger creazione/conferma, né dal watcher).
// Non lancia mai: la stampa non deve far fallire la creazione/conferma ordine.

const ORDER_COLUMNS =
  "id, tenant_id, location_id, code, type, table_label, session_id, session_code, diner_client_id, diner_nickname, customer_name, customer_email, customer_phone, delivery_address, delivery_address_text, delivery_doorbell, delivery_floor, delivery_notes, desired_time, pickup_time, notes, total, status, created_at, dine_option, payment_method, payment_status, confirmation_expires_at, confirmed_at, auto_accepted";

// trade_no SUNMI: max 32 caratteri. L'id ordine è un UUID (36 con trattini); senza
// trattini sono 32 hex esatti, univoci → chiave dedup/idempotenza per SUNMI.
function tradeNoFor(orderId: string): string {
  return orderId.replace(/-/g, "");
}

/**
 * Gate demo: su host demo le comande escono dalla stampante (reale) solo se il
 * tenant ha "Backend live" attivo in tenant_demo_controls. Host non demo → sempre.
 * Va valutato dove c'è la request: cron e webhook Stripe non hanno l'host, per
 * questo chi crea l'ordine da demo spento lo nasce con `comanda_printed_at`
 * valorizzato (comanda "gestita") e nessun canale di stampa lo riprende.
 */
export async function isComandaPrintBlockedForHost(
  host: string | null | undefined,
  tenantId: string,
): Promise<boolean> {
  if (!isDemoHost(host)) return false;
  const control = await getTenantDemoControl(tenantId).catch(() => null);
  return !control?.backendLive;
}

export type DispatchResult =
  | { dispatched: false; reason: string }
  | { dispatched: true; via: "sunmi_cloud" };

export async function dispatchComandaForOrder(
  supabase: SupabaseClient,
  tenantId: string,
  orderId: string,
  locationId: string | null = null,
): Promise<DispatchResult> {
  try {
    const printer = await loadDefaultPrinter(supabase, tenantId, locationId);
    if (!printer || !printer.enabled || !printer.autoPrint) {
      return { dispatched: false, reason: "no_active_printer" };
    }

    // QZ/SUNMI POS: gestiti lato client, non dal server.
    if (printer.connection === "qz") return { dispatched: false, reason: "qz_client_side" };
    if (printer.connection === "sunmi_pos") return { dispatched: false, reason: "sunmi_pos_client_side" };

    if (printer.connection === "sunmi_cloud") {
      if (!isSunmiConfigured() || !printer.deviceSn) {
        return { dispatched: false, reason: "sunmi_not_configured" };
      }

      // Prenota l'ordine (anti doppio push) prima di costruire/inviare la comanda.
      const { data: claimed } = await supabase
        .from("orders")
        .update({ comanda_printed_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("id", orderId)
        .is("comanda_printed_at", null)
        .select("id")
        .maybeSingle();
      if (!claimed) return { dispatched: false, reason: "already_dispatched" };

      const rollbackClaim = async () => {
        await supabase
          .from("orders")
          .update({ comanda_printed_at: null })
          .eq("tenant_id", tenantId)
          .eq("id", orderId);
      };

      const { data: orderRow } = await supabase
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("id", orderId)
        .maybeSingle();
      if (!orderRow) {
        await rollbackClaim();
        return { dispatched: false, reason: "order_not_found" };
      }

      const { data: lineRows } = await supabase
        .from("order_lines")
        .select("*")
        .eq("order_id", orderId)
        .order("position", { ascending: true });

      const order = dbRowToOrder(
        orderRow as unknown as DbOrder,
        dbLinesToOrderLines((lineRows ?? []) as unknown as DbOrderLine[]),
      );
      const escpos = buildComandaEscPos(order, printer);

      const pushInput = {
        sn: printer.deviceSn,
        tradeNo: tradeNoFor(orderId),
        escpos,
        copies: printer.copies,
      };
      let res = await pushPrintContent(pushInput);
      // 10071704 = SN non associato al nostro channel: bind e un solo nuovo tentativo.
      if (!res.ok && res.code === 10071704) {
        const bind = await bindPrinterToShop(printer.deviceSn);
        if (bind.ok) res = await pushPrintContent(pushInput);
      }
      if (!res.ok) {
        // Rollback del claim: riproveremo (es. al prossimo evento/cron).
        await rollbackClaim();
        return { dispatched: false, reason: `sunmi_push_failed_${res.code ?? res.status}` };
      }
      return { dispatched: true, via: "sunmi_cloud" };
    }

    return { dispatched: false, reason: `unsupported_connection_${printer.connection}` };
  } catch (e) {
    return { dispatched: false, reason: e instanceof Error ? e.message : "dispatch_error" };
  }
}

// Motivi per cui un ordine resta non stampato senza che sia un guasto: non vanno né
// ritentati come errori né segnalati.
const BENIGN_DISPATCH_REASONS = new Set([
  "no_active_printer",
  "already_dispatched",
  "qz_client_side",
  "sunmi_pos_client_side",
]);

// Oltre questa età una comanda che non è uscita va gestita a mano: ristamparla in
// automatico ore dopo creerebbe solo confusione in cucina.
const RETRY_WINDOW_MS = 2 * 60 * 60 * 1000;

export type RetryComandeResult = {
  attempted: number;
  dispatched: number;
  failed: Array<{ orderId: string; tenantId: string; reason: string }>;
};

/**
 * Rete di sicurezza della stampa cloud: ripassa gli ordini accettati e non stampati dei
 * tenant con una stampante server-side (SUNMI cloud). Copre i dispatch persi (errore
 * SUNMI, stampante offline, funzione interrotta) e gli ordini finalizzati dal fallback
 * SQL del cron, che non stampa. Idempotente grazie al claim su `comanda_printed_at`.
 */
export async function retryPendingComande(supabase: SupabaseClient): Promise<RetryComandeResult> {
  const result: RetryComandeResult = { attempted: 0, dispatched: 0, failed: [] };

  const { data: printers } = await supabase
    .from("tenant_printers")
    .select("tenant_id")
    .eq("connection", "sunmi_cloud")
    .eq("enabled", true)
    .eq("auto_print", true);
  const tenantIds = [...new Set(((printers ?? []) as Array<{ tenant_id: string }>).map((p) => p.tenant_id))];
  if (tenantIds.length === 0) return result;

  const since = new Date(Date.now() - RETRY_WINDOW_MS).toISOString();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, tenant_id, location_id")
    .in("tenant_id", tenantIds)
    .in("status", ["nuovo", "in_preparazione"])
    .is("comanda_printed_at", null)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(50);

  for (const order of (orders ?? []) as Array<{ id: string; tenant_id: string; location_id: string | null }>) {
    result.attempted += 1;
    const outcome = await dispatchComandaForOrder(supabase, order.tenant_id, order.id, order.location_id);
    if (outcome.dispatched) {
      result.dispatched += 1;
    } else if (!BENIGN_DISPATCH_REASONS.has(outcome.reason)) {
      result.failed.push({ orderId: order.id, tenantId: order.tenant_id, reason: outcome.reason });
    }
  }
  return result;
}
