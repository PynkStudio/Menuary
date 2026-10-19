import { NextResponse } from "next/server";
import { recordPlatformError, recordPlatformErrorFromRequest } from "@/lib/platform-errors";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { finalizePendingOrder } from "@/lib/orders/finalize-pending";
import { retryPendingComande } from "@/lib/printing/dispatch";

export const maxDuration = 60;

// Vercel chiama i cron con header Authorization: Bearer {CRON_SECRET}.
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

/**
 * Finalizza gli ordini in `pending_confirmation` la cui finestra di modifica è
 * scaduta. Per gli ordini Retell/WhatsApp non aperti dal cliente il default è
 * contanti: diventano `nuovo`, entrano in operativo/fatturazione e vengono stampati.
 * Poi ritenta le comande cloud rimaste non stampate.
 *
 * Idempotente: gira ogni minuto via pg_cron (`expire-pending-orders-http`). La funzione
 * SQL `expire_pending_orders()` resta come fallback per gli ordini scaduti da più di
 * qualche minuto (route irraggiungibile): non stampa, ma il ripasso qui sotto li recupera.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "service unavailable" }, { status: 503 });
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .select("id, tenant_id, code")
    .eq("status", "pending_confirmation")
    .lt("confirmation_expires_at", nowIso)
    .limit(100);

  if (error) {
    await recordPlatformErrorFromRequest(req, {
      error,
      source: "cron",
      flow: "expire_pending_orders",
      operation: "update_expired_orders",
      title: "Cron ordini: scadenza pending fallita",
      httpStatus: 500,
      metadata: { nowIso },
    }).catch(() => undefined);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const finalized: Array<{ id: string; tenant_id: string; code: string }> = [];
  const failed: Array<{ id: string; error: string }> = [];
  for (const order of data ?? []) {
    const result = await finalizePendingOrder(supabase, {
      orderId: order.id,
      tenantId: order.tenant_id,
      paymentMethod: "on_delivery_cash",
    });
    if (result.ok) finalized.push(order);
    else failed.push({ id: order.id, error: result.error ?? result.reason });
  }

  const printRetry = await retryPendingComande(supabase).catch((error) => ({
    attempted: 0,
    dispatched: 0,
    failed: [{ orderId: "", tenantId: "", reason: error instanceof Error ? error.message : "retry_failed" }],
  }));
  // Un evento per ordine (fingerprint stabile): i ripassi ogni minuto incrementano il
  // contatore invece di creare una riga nuova, e la prima occorrenza fa partire l'avviso.
  for (const failure of printRetry.failed) {
    await recordPlatformError({
      source: "cloud_print",
      severity: "error",
      tenantId: failure.tenantId || null,
      orderId: failure.orderId || null,
      flow: "comanda_print",
      operation: "retry_dispatch",
      title: "Comanda non stampata: stampante cloud non raggiungibile",
      message: failure.reason,
      errorCode: failure.reason,
      fingerprint: `comanda_print:${failure.orderId || "retry"}`,
    }).catch(() => undefined);
  }

  return NextResponse.json({
    ok: true,
    finalizedCount: finalized.length,
    failedCount: failed.length,
    finalized,
    failed,
    printRetry,
  });
}
