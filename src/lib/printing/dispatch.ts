import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadDefaultPrinter } from "./config";
import { isSunmiConfigured, pushPrintMessage } from "./sunmi-cloud";

// Dispatch server-side della stampa comanda per un ordine appena accettato.
//
// - connection 'sunmi_cloud' → notifica la stampante cloud (push by SN); la
//   stampante scaricherà l'ESC/POS dal callback /api/printing/sunmi/pull.
// - connection 'qz' → no-op: la stampa USB è gestita dal watcher client nella
//   pagina Operativo → Ordini (la stampante USB non è raggiungibile dal server).
//
// Idempotente: marca `comanda_printed_at` quando prende in carico l'ordine, così
// non viene rilanciato (né dal doppio trigger creazione/conferma, né dal watcher).
// Non lancia mai: la stampa non deve far fallire la creazione/conferma ordine.

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

    // QZ: gestito lato client (watcher), non dal server.
    if (printer.connection === "qz") return { dispatched: false, reason: "qz_client_side" };

    if (printer.connection === "sunmi_cloud") {
      if (!isSunmiConfigured() || !printer.deviceSn) {
        return { dispatched: false, reason: "sunmi_not_configured" };
      }
      // Prenota l'ordine (anti doppio push). Il callback userà trace_id=orderId
      // per recuperare la comanda anche dopo questo flag.
      const { data: claimed } = await supabase
        .from("orders")
        .update({ comanda_printed_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("id", orderId)
        .is("comanda_printed_at", null)
        .select("id")
        .maybeSingle();
      if (!claimed) return { dispatched: false, reason: "already_dispatched" };

      const res = await pushPrintMessage({ sn: printer.deviceSn, traceId: orderId });
      if (!res.ok) {
        // Rollback del claim: riproveremo (es. al prossimo evento/cron).
        await supabase
          .from("orders")
          .update({ comanda_printed_at: null })
          .eq("tenant_id", tenantId)
          .eq("id", orderId);
        return { dispatched: false, reason: `sunmi_push_failed_${res.status}` };
      }
      return { dispatched: true, via: "sunmi_cloud" };
    }

    return { dispatched: false, reason: `unsupported_connection_${printer.connection}` };
  } catch (e) {
    return { dispatched: false, reason: e instanceof Error ? e.message : "dispatch_error" };
  }
}
