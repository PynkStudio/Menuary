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
  avg_handling_minutes: number | null;
};

export const DEFAULT_AVG_HANDLING_MINUTES = 45;

export function resolveAvgHandlingMinutes(value: number | null | undefined): number {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 0) return DEFAULT_AVG_HANDLING_MINUTES;
  return Math.floor(minutes);
}

export function resolveDefaultAvgHandlingMinutes(value: number | null | undefined): number {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return DEFAULT_AVG_HANDLING_MINUTES;
  return Math.floor(minutes);
}

/** Data "oggi" (YYYY-MM-DD) nel fuso operativo del locale. */
function serviceDateToday(timeZone = "Europe/Rome"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

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
  avgHandlingMinutes: DEFAULT_AVG_HANDLING_MINUTES,
};

export function resolvePendingTimeoutSeconds(value: number | null | undefined): number {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 30) return DEFAULT_ORDER_SETTINGS.pendingTimeoutSeconds;
  return Math.floor(seconds);
}

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
    pendingTimeoutSeconds: resolvePendingTimeoutSeconds(row.pending_timeout_seconds),
    avgHandlingMinutes: resolveDefaultAvgHandlingMinutes(row.avg_handling_minutes),
  };
}

/**
 * Override giornaliero del tempo medio di gestione: il ristorante può alzarlo solo
 * per oggi (dal portale ordini) nelle giornate cariche. La riga è per-data, quindi
 * scade da sé a fine giornata. Location-specific vince sul default sede.
 */
async function resolveDailyAvgHandlingOverride(
  supabase: SupabaseClient,
  tenantId: string,
  locationId: string | null,
): Promise<number | null> {
  let query = supabase
    .from("tenant_order_daily_overrides")
    .select("avg_handling_minutes, location_id")
    .eq("tenant_id", tenantId)
    .eq("service_date", serviceDateToday());
  // Sede specifica + riga default (location_id NULL); senza sede solo il default.
  query = locationId ? query.or(`location_id.eq.${locationId},location_id.is.null`) : query.is("location_id", null);
  const { data, error } = await query;
  if (error || !data?.length) return null;
  const exact = locationId ? data.find((r) => r.location_id === locationId) : undefined;
  const fallback = data.find((r) => r.location_id === null);
  const pick = exact ?? fallback;
  return pick && pick.avg_handling_minutes != null ? resolveAvgHandlingMinutes(pick.avg_handling_minutes) : null;
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

  const base: TenantOrderSettings = (error || !data)
    ? { id: "", tenantId, locationId, ...DEFAULT_ORDER_SETTINGS }
    : dbRowToSettings(data as DbOrderSettings);

  // Override "solo oggi" del tempo medio di gestione (portale ordini → giornate cariche).
  const dailyOverride = await resolveDailyAvgHandlingOverride(supabase, tenantId, locationId);
  if (dailyOverride != null) base.avgHandlingMinutes = dailyOverride;

  return base;
}

/**
 * Tempo di gestione per il controllo rapido del portale ordini: separa il valore
 * predefinito (impostazioni) dall'override "solo oggi", così la UI può mostrare
 * entrambi senza confondere "0 minuti" con "nessun override".
 */
export async function loadOrderHandling(
  supabase: SupabaseClient,
  tenantId: string,
  locationId: string | null,
): Promise<{ defaultMinutes: number; overrideMinutes: number | null; effectiveMinutes: number }> {
  const { data, error } = await supabase
    .rpc("resolve_order_settings", { p_tenant_id: tenantId, p_location_id: locationId })
    .maybeSingle();

  const defaultMinutes = (error || !data)
    ? DEFAULT_AVG_HANDLING_MINUTES
    : resolveDefaultAvgHandlingMinutes((data as DbOrderSettings).avg_handling_minutes);
  const overrideMinutes = await resolveDailyAvgHandlingOverride(supabase, tenantId, locationId);

  return { defaultMinutes, overrideMinutes, effectiveMinutes: overrideMinutes ?? defaultMinutes };
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
