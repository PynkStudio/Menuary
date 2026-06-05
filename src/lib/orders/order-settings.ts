import type { TenantOrderSettings } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

// Riga DB di tenant_order_settings (campi snake_case).
type DbOrderSettings = {
  id: string;
  tenant_id: string;
  location_id: string | null;
  takeaway_enabled: boolean;
  dine_in_enabled: boolean;
  delivery_enabled: boolean;
  takeaway_window_before_open_min: number | null;
  takeaway_window_before_close_min: number | null;
  dine_in_window_before_open_min: number | null;
  dine_in_window_before_close_min: number | null;
  delivery_window_before_open_min: number | null;
  delivery_window_before_close_min: number | null;
  auto_accept_enabled: boolean;
  auto_accept_max_total: number | string | null;
  auto_accept_max_items: number | null;
  auto_accept_only_returning: boolean;
  auto_accept_no_notes: boolean;
  auto_accept_min_notice_minutes: number | null;
  pending_timeout_seconds: number;
};

/** Settings di default usati se non esiste riga per il tenant. */
export const DEFAULT_ORDER_SETTINGS: Omit<TenantOrderSettings, "id" | "tenantId" | "locationId"> = {
  takeawayEnabled: true,
  dineInEnabled: true,
  deliveryEnabled: false,
  takeawayWindowBeforeOpenMin: null,
  takeawayWindowBeforeCloseMin: null,
  dineInWindowBeforeOpenMin: null,
  dineInWindowBeforeCloseMin: null,
  deliveryWindowBeforeOpenMin: null,
  deliveryWindowBeforeCloseMin: null,
  autoAcceptEnabled: false,
  autoAcceptMaxTotal: null,
  autoAcceptMaxItems: null,
  autoAcceptOnlyReturning: false,
  autoAcceptNoNotes: false,
  autoAcceptMinNoticeMinutes: null,
  pendingTimeoutSeconds: 120,
};

function dbRowToSettings(row: DbOrderSettings): TenantOrderSettings {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    locationId: row.location_id,
    takeawayEnabled: row.takeaway_enabled,
    dineInEnabled: row.dine_in_enabled,
    deliveryEnabled: row.delivery_enabled,
    takeawayWindowBeforeOpenMin: row.takeaway_window_before_open_min,
    takeawayWindowBeforeCloseMin: row.takeaway_window_before_close_min,
    dineInWindowBeforeOpenMin: row.dine_in_window_before_open_min,
    dineInWindowBeforeCloseMin: row.dine_in_window_before_close_min,
    deliveryWindowBeforeOpenMin: row.delivery_window_before_open_min,
    deliveryWindowBeforeCloseMin: row.delivery_window_before_close_min,
    autoAcceptEnabled: row.auto_accept_enabled,
    autoAcceptMaxTotal: row.auto_accept_max_total != null ? Number(row.auto_accept_max_total) : null,
    autoAcceptMaxItems: row.auto_accept_max_items,
    autoAcceptOnlyReturning: row.auto_accept_only_returning,
    autoAcceptNoNotes: row.auto_accept_no_notes,
    autoAcceptMinNoticeMinutes: row.auto_accept_min_notice_minutes,
    pendingTimeoutSeconds: row.pending_timeout_seconds,
  };
}

/**
 * Carica i settings effettivi per (tenant, location) usando il fallback DB:
 * - prima riga con location_id = location, altrimenti riga con location_id NULL.
 * - se nessuna riga esiste → DEFAULT_ORDER_SETTINGS.
 */
export async function loadOrderSettings(
  supabase: SupabaseClient,
  tenantId: string,
  locationId: string | null,
): Promise<TenantOrderSettings> {
  // resolve_order_settings restituisce una riga (o nessuna). Usiamo rpc.
  const { data, error } = await supabase
    .rpc("resolve_order_settings", { p_tenant_id: tenantId, p_location_id: locationId })
    .maybeSingle();

  if (error || !data) {
    // Default soft: pretendiamo che esista una "riga virtuale" senza id.
    return {
      id: "",
      tenantId,
      locationId,
      ...DEFAULT_ORDER_SETTINGS,
    };
  }
  return dbRowToSettings(data as DbOrderSettings);
}

/** Parametri minimi per valutare auto-accept su un ordine in creazione. */
export type AutoAcceptCandidate = {
  total: number;
  itemsCount: number; // somma qty di tutte le righe
  hasNotes: boolean;  // true se note di testata o di linea presenti
  isReturningCustomer: boolean; // true se identity.registered o customer_id riconosciuto
  crmEnabled: boolean;
  noticeMinutes: number | null;
};

/**
 * Restituisce true se TUTTE le condizioni attivate (non-null/non-false) sono soddisfatte.
 * Se autoAcceptEnabled è false → false.
 * Se autoAcceptEnabled è true ma nessuna sotto-regola attiva → true (accetta tutto).
 */
export function evaluateAutoAccept(
  s: TenantOrderSettings,
  c: AutoAcceptCandidate,
): boolean {
  if (!s.autoAcceptEnabled) return false;

  if (s.autoAcceptMaxTotal != null && c.total > s.autoAcceptMaxTotal) return false;
  if (s.autoAcceptMaxItems != null && c.itemsCount > s.autoAcceptMaxItems) return false;
  if (s.autoAcceptOnlyReturning && (!c.crmEnabled || !c.isReturningCustomer)) return false;
  if (s.autoAcceptNoNotes && c.hasNotes) return false;
  if (
    s.autoAcceptMinNoticeMinutes != null &&
    (c.noticeMinutes == null || c.noticeMinutes < s.autoAcceptMinNoticeMinutes)
  ) {
    return false;
  }

  return true;
}

export function resolveOrderNoticeMinutes(input: {
  pickupTime?: string | null;
  desiredTime?: string | null;
  pickupDate?: string | null;
  now?: Date;
}): number | null {
  const raw = (input.desiredTime ?? input.pickupTime ?? "").trim();
  const now = input.now ?? new Date();
  const pickupDate = input.pickupDate?.trim();

  if (raw) {
    const isoCandidate = /^\d{4}-\d{2}-\d{2}/.test(raw) ? new Date(raw) : null;
    if (isoCandidate && !Number.isNaN(isoCandidate.getTime())) {
      return Math.floor((isoCandidate.getTime() - now.getTime()) / 60000);
    }
  }

  const time = raw.match(/^(\d{1,2}):(\d{2})$/);
  const date = pickupDate && /^\d{4}-\d{2}-\d{2}$/.test(pickupDate) ? pickupDate : null;
  if (!time) return null;

  const target = date
    ? new Date(`${date}T${time[1]!.padStart(2, "0")}:${time[2]}:00`)
    : new Date(now);
  if (!date) {
    target.setHours(Number(time[1]), Number(time[2]), 0, 0);
    if (target.getTime() < now.getTime()) target.setDate(target.getDate() + 1);
  }

  if (Number.isNaN(target.getTime())) return null;
  return Math.floor((target.getTime() - now.getTime()) / 60000);
}
