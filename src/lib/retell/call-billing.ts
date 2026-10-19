import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { normalizePhone } from "@/lib/crm/customer-identity";
import { AI_ADDON } from "@/lib/platform-pricing";

type Db = SupabaseClient<Database>;

// Margine attorno alla chiamata entro cui un ordine dello stesso numero le appartiene:
// il tool create_order gira durante la chiamata, ma gli orologi di Retell e del DB
// non coincidono al secondo.
const LINK_MARGIN_MS = 2 * 60 * 1000;

/**
 * Collega alla chiamata Retell gli ordini creati durante la chiamata dallo stesso numero.
 * Il flow non passa l'id della chiamata a create_order, quindi lo ricaviamo a fine chiamata
 * da numero chiamante + orario. Serve a non addebitare le chiamate di ordini annullati.
 */
export async function linkRetellCallToOrders(
  db: Db,
  tenantId: string,
  call: Record<string, unknown>,
): Promise<number> {
  const callId = typeof call.call_id === "string" ? call.call_id : null;
  const fromNumber = typeof call.from_number === "string" ? call.from_number : null;
  const start = typeof call.start_timestamp === "number" ? call.start_timestamp : null;
  const end = typeof call.end_timestamp === "number" ? call.end_timestamp : null;
  if (!callId || !fromNumber || !start) return 0;

  const phones = [...new Set([fromNumber, normalizePhone(fromNumber)].filter(Boolean) as string[])];
  const { data } = await db
    .from("orders")
    .update({ retell_call_id: callId })
    .eq("tenant_id", tenantId)
    .eq("source", "retell")
    .is("retell_call_id", null)
    .in("customer_phone", phones)
    .gte("created_at", new Date(start - LINK_MARGIN_MS).toISOString())
    .lte("created_at", new Date((end ?? start) + LINK_MARGIN_MS).toISOString())
    .select("id");
  return data?.length ?? 0;
}

export type TenantCallBilling = {
  tenantId: string;
  calls: number;
  /** Chiamate che hanno generato solo ordini annullati dal locale: non si addebitano. */
  excludedCalls: number;
  billableCalls: number;
  perCallPrice: number;
  amount: number;
};

export type OrderCancellationRow = {
  id: string;
  tenantId: string;
  code: string;
  source: string;
  total: number;
  reason: string | null;
  note: string | null;
  createdAt: string;
  cancelledAt: string;
  retellCallId: string | null;
};

/** Mese "YYYY-MM" → intervallo [inizio, fine) in UTC sui confini del mese di Roma. */
export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  // Mezzanotte di Roma = 22:00/23:00 UTC del giorno prima: usiamo l'offset del giorno 1.
  const offsetFor = (year: number, monthIndex: number) => {
    const probe = new Date(Date.UTC(year, monthIndex, 1, 12));
    const rome = new Date(probe.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
    const utc = new Date(probe.toLocaleString("en-US", { timeZone: "UTC" }));
    return rome.getTime() - utc.getTime();
  };
  const from = new Date(Date.UTC(y, m - 1, 1) - offsetFor(y, m - 1));
  const to = new Date(Date.UTC(y, m, 1) - offsetFor(y, m));
  return { from: from.toISOString(), to: to.toISOString() };
}

export async function loadCallBilling(db: Db, month: string): Promise<{
  tenants: TenantCallBilling[];
  cancellations: OrderCancellationRow[];
}> {
  const { from, to } = monthRange(month);
  const perCallPrice = AI_ADDON.settings.perCallPrice ?? AI_ADDON.per_call ?? 0;

  // call_ended arriva una volta per chiamata: è la base del conteggio.
  const { data: events } = await db
    .from("channel_webhook_events")
    .select("tenant_id, call_id:payload->call->>call_id")
    .eq("channel", "retell")
    .eq("payload->>event", "call_ended")
    .gte("received_at", from)
    .lt("received_at", to)
    .limit(20000);
  const callsByTenant = new Map<string, Set<string>>();
  for (const row of (events ?? []) as Array<{ tenant_id: string | null; call_id: string | null }>) {
    if (!row.tenant_id || !row.call_id) continue;
    const set = callsByTenant.get(row.tenant_id) ?? new Set<string>();
    set.add(row.call_id);
    callsByTenant.set(row.tenant_id, set);
  }

  const { data: cancelledRows } = await db
    .from("orders")
    .select("id, tenant_id, code, source, total, status, cancellation_reason, cancellation_note, created_at, cancelled_at, retell_call_id")
    .not("cancelled_at", "is", null)
    .gte("created_at", from)
    .lt("created_at", to)
    .order("cancelled_at", { ascending: false })
    .limit(2000);
  const cancellations: OrderCancellationRow[] = (cancelledRows ?? [])
    .filter((row) => row.status === "annullato" && row.cancelled_at)
    .map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      code: row.code,
      source: row.source,
      total: Number(row.total),
      reason: row.cancellation_reason,
      note: row.cancellation_note,
      createdAt: row.created_at,
      cancelledAt: row.cancelled_at as string,
      retellCallId: row.retell_call_id,
    }));

  // Una chiamata si esclude solo se TUTTI i suoi ordini sono stati annullati dal locale.
  const linkedCallIds = [...new Set(cancellations.map((c) => c.retellCallId).filter(Boolean) as string[])];
  const excluded = new Set<string>();
  if (linkedCallIds.length > 0) {
    const { data: liveOrders } = await db
      .from("orders")
      .select("retell_call_id")
      .in("retell_call_id", linkedCallIds)
      .neq("status", "annullato");
    const stillLive = new Set((liveOrders ?? []).map((row) => row.retell_call_id));
    for (const id of linkedCallIds) if (!stillLive.has(id)) excluded.add(id);
  }

  const tenants = [...callsByTenant.entries()]
    .map(([tenantId, calls]) => {
      const excludedCalls = [...calls].filter((id) => excluded.has(id)).length;
      const billableCalls = calls.size - excludedCalls;
      return {
        tenantId,
        calls: calls.size,
        excludedCalls,
        billableCalls,
        perCallPrice,
        amount: Math.round(billableCalls * perCallPrice * 100) / 100,
      };
    })
    .sort((a, b) => b.calls - a.calls);

  return { tenants, cancellations };
}
