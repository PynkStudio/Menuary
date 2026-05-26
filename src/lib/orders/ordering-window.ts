import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantOrderSettings } from "@/lib/types";
import type { DaySchedule } from "@/lib/venue-hours";

function parseSlot(slot: string): { open: { h: number; m: number }; close: { h: number; m: number } } | null {
  const m = slot.match(/(\d{1,2}):(\d{2})\s*[–\-]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return {
    open: { h: parseInt(m[1], 10), m: parseInt(m[2], 10) },
    close: { h: parseInt(m[3], 10), m: parseInt(m[4], 10) },
  };
}

// Mappa label italiana → indice giorno della settimana (0 = lunedì).
const LABEL_TO_DOW: Record<string, number> = {
  "Lunedì": 0, "Martedì": 1, "Mercoledì": 2, "Giovedì": 3,
  "Venerdì": 4, "Sabato": 5, "Domenica": 6,
};

function isDayScheduleArray(v: unknown): v is DaySchedule[] {
  return Array.isArray(v) && v.every(
    (d) => d && typeof d === "object" && "label" in d && "slots" in d,
  );
}

/**
 * Carica gli orari standard per (tenant, location): preferisce location, poi tenant.
 * Restituisce null se nessun orario è configurato.
 */
async function loadWeekHours(
  supabase: SupabaseClient,
  tenantId: string,
  locationId: string | null,
): Promise<DaySchedule[] | null> {
  if (locationId) {
    const { data: loc } = await supabase
      .from("locations")
      .select("hours")
      .eq("id", locationId)
      .maybeSingle();
    if (loc && isDayScheduleArray(loc.hours) && loc.hours.length > 0) return loc.hours;
  }
  const { data: tenant } = await supabase
    .from("tenants")
    .select("hours")
    .eq("id", tenantId)
    .maybeSingle();
  if (tenant && isDayScheduleArray(tenant.hours) && tenant.hours.length > 0) return tenant.hours;
  return null;
}

/** Special-hours per il giorno richiesto (override su tenant_special_hours). */
async function loadSpecialHoursForDate(
  supabase: SupabaseClient,
  tenantId: string,
  locationId: string | null,
  isoDate: string, // YYYY-MM-DD locale
): Promise<{ closed: boolean; slots: string[] } | null> {
  const { data } = await supabase
    .from("tenant_special_hours")
    .select("closed, slots, location_id")
    .eq("tenant_id", tenantId)
    .eq("date", isoDate);
  if (!data?.length) return null;
  // Preferisci match esatto su location, altrimenti riga globale (location_id NULL).
  const exact = data.find((r) => r.location_id === locationId);
  const global = data.find((r) => r.location_id === null);
  const pick = exact ?? global;
  if (!pick) return null;
  return { closed: pick.closed, slots: Array.isArray(pick.slots) ? (pick.slots as string[]) : [] };
}

/** Indice giorno locale 0=lun..6=dom per una Date in fuso Europe/Rome (server-friendly). */
function dowMondayBased(d: Date): number {
  // getDay(): 0=dom..6=sab. Convertiamo: lun=0..dom=6.
  const js = d.getDay();
  return (js + 6) % 7;
}

function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type OrderChannel = "takeaway" | "dine_in" | "delivery";

export type WindowCheckResult =
  | { ok: true }
  | { ok: false; reason: "channel_disabled" | "closed_today" | "outside_window" | "no_hours_configured" };

/**
 * Verifica che `now` cada dentro una finestra di accettazione ordini per il canale.
 * Regole:
 *  - Se il canale è disabilitato nei settings → reject.
 *  - Se non ci sono orari configurati → ok (non blocchiamo: il tenant non li ha impostati).
 *  - Per ogni slot del giorno (incluso special-hours), apertura effettiva =
 *    open - beforeOpen, chiusura effettiva = close - beforeClose.
 *    Se beforeClose ≥ durata slot → slot inutile, salta.
 *  - Slot che attraversano la mezzanotte (close < open) sono supportati.
 */
export async function checkOrderingWindow(
  supabase: SupabaseClient,
  args: {
    tenantId: string;
    locationId: string | null;
    settings: TenantOrderSettings;
    channel: OrderChannel;
    now?: Date;
  },
): Promise<WindowCheckResult> {
  const { tenantId, locationId, settings, channel } = args;
  const now = args.now ?? new Date();

  // 1. Canale abilitato?
  if (channel === "takeaway" && !settings.takeawayEnabled) return { ok: false, reason: "channel_disabled" };
  if (channel === "dine_in" && !settings.dineInEnabled) return { ok: false, reason: "channel_disabled" };
  if (channel === "delivery" && !settings.deliveryEnabled) return { ok: false, reason: "channel_disabled" };

  // 2. Settings finestra
  const beforeOpen =
    (channel === "takeaway"
      ? settings.takeawayWindowBeforeOpenMin
      : channel === "dine_in"
        ? settings.dineInWindowBeforeOpenMin
        : settings.deliveryWindowBeforeOpenMin) ?? 0;
  const beforeClose =
    (channel === "takeaway"
      ? settings.takeawayWindowBeforeCloseMin
      : channel === "dine_in"
        ? settings.dineInWindowBeforeCloseMin
        : settings.deliveryWindowBeforeCloseMin) ?? 0;

  // 3. Carica orari
  const week = await loadWeekHours(supabase, tenantId, locationId);
  if (!week) return { ok: true }; // niente orari → non blocchiamo

  // 4. Determina lo slot di "oggi" tenendo conto di slot a cavallo della mezzanotte:
  //    consideriamo anche slot del giorno precedente che si chiudono oggi.
  const todaySlots = await resolveSlotsForDate(supabase, tenantId, locationId, week, now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdaySlots = await resolveSlotsForDate(supabase, tenantId, locationId, week, yesterday);

  const candidates: Array<{ start: Date; end: Date }> = [];

  // Slot di oggi.
  if (todaySlots && !todaySlots.closed) {
    for (const slot of todaySlots.slots) {
      const parsed = parseSlot(slot);
      if (!parsed) continue;
      const start = atTime(now, parsed.open.h, parsed.open.m);
      const crossesMidnight =
        parsed.close.h < parsed.open.h ||
        (parsed.close.h === parsed.open.h && parsed.close.m < parsed.open.m);
      const end = crossesMidnight
        ? atTime(addDays(now, 1), parsed.close.h, parsed.close.m)
        : atTime(now, parsed.close.h, parsed.close.m);
      candidates.push({ start, end });
    }
  }

  // Slot di ieri che si chiudono oggi (dopo mezzanotte).
  if (yesterdaySlots && !yesterdaySlots.closed) {
    for (const slot of yesterdaySlots.slots) {
      const parsed = parseSlot(slot);
      if (!parsed) continue;
      const crossesMidnight =
        parsed.close.h < parsed.open.h ||
        (parsed.close.h === parsed.open.h && parsed.close.m < parsed.open.m);
      if (!crossesMidnight) continue;
      const start = atTime(yesterday, parsed.open.h, parsed.open.m);
      const end = atTime(now, parsed.close.h, parsed.close.m);
      candidates.push({ start, end });
    }
  }

  if (candidates.length === 0) {
    // Nessuno slot oggi/cavallo: locale chiuso.
    return { ok: false, reason: "closed_today" };
  }

  const nowMs = now.getTime();
  for (const c of candidates) {
    const effectiveStart = c.start.getTime() - beforeOpen * 60_000;
    const effectiveEnd = c.end.getTime() - beforeClose * 60_000;
    if (effectiveEnd <= effectiveStart) continue; // slot inutile
    if (nowMs >= effectiveStart && nowMs <= effectiveEnd) return { ok: true };
  }
  return { ok: false, reason: "outside_window" };
}

function atTime(d: Date, h: number, m: number): Date {
  const out = new Date(d);
  out.setHours(h, m, 0, 0);
  return out;
}
function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** Risolve slots per la data (special-hours override → orari standard). */
async function resolveSlotsForDate(
  supabase: SupabaseClient,
  tenantId: string,
  locationId: string | null,
  week: DaySchedule[],
  date: Date,
): Promise<{ closed: boolean; slots: string[] } | null> {
  const special = await loadSpecialHoursForDate(supabase, tenantId, locationId, isoDateLocal(date));
  if (special) return special;
  const dow = dowMondayBased(date);
  const day = week.find((d) => LABEL_TO_DOW[d.label] === dow);
  if (!day) return null;
  return { closed: day.closed, slots: day.slots };
}
