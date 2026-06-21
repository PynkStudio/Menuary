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

function isoDateLocal(d: Date, timeZone?: string): string {
  if (timeZone) {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Componenti calendario (anno/mese/giorno + giorno-settimana lun=0..dom=6) di un istante
// nel fuso dato. Serve a costruire le fasce orarie nell'orario reale del locale anche se
// il server gira in UTC.
function zonedDateParts(date: Date, timeZone: string): { y: number; mo: number; d: number; dow: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hourCycle: "h23",
  });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wk: Record<string, number> = { Sun: 6, Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5 };
  return { y: Number(get("year")), mo: Number(get("month")), d: Number(get("day")), dow: wk[get("weekday")] ?? 0 };
}

// Istante UTC corrispondente all'orologio da parete (y-mo-d h:mi) nel fuso dato.
// Gestisce DST con la correzione di offset single-pass.
function zonedWallClockToInstant(y: number, mo: number, d: number, h: number, mi: number, timeZone: string): Date {
  const asUTC = Date.UTC(y, mo - 1, d, h, mi, 0);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const p = dtf.formatToParts(new Date(asUTC));
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value ?? "0");
  const tzAsUTC = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return new Date(asUTC - (tzAsUTC - asUTC));
}

export type OrderChannel = "takeaway" | "dine_in" | "delivery";

// Le consegne/asporto degli ordini telefonici vanno validate nell'orario reale del
// locale: il server gira in UTC, quindi le nuove funzioni di disponibilità passano
// esplicitamente questo fuso (a differenza della legacy checkOrderingWindow).
const DELIVERY_TZ = "Europe/Rome";

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

  // 2. Carica orari
  const week = await loadWeekHours(supabase, tenantId, locationId);
  if (!week) return { ok: true }; // niente orari → non blocchiamo

  // 3. Intervalli effettivi (offset applicati) della giornata che contiene `now`.
  const intervals = await effectiveIntervalsForDay(supabase, tenantId, locationId, week, now, channelOffsets(settings, channel));
  if (intervals.length === 0) return { ok: false, reason: "closed_today" };

  const nowMs = now.getTime();
  for (const c of intervals) {
    if (nowMs >= c.start.getTime() && nowMs <= c.end.getTime()) return { ok: true };
  }
  return { ok: false, reason: "outside_window" };
}

/** Offset finestra (minuti prima di apertura/chiusura; negativi = dopo) per canale. */
function channelOffsets(settings: TenantOrderSettings, channel: OrderChannel): { beforeOpen: number; beforeClose: number } {
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
  return { beforeOpen, beforeClose };
}

/**
 * Intervalli effettivi (Date start/end, con offset apertura/chiusura applicati) per la
 * giornata che contiene `refDate`: include gli slot di `refDate` e gli slot del giorno
 * precedente che si chiudono dopo mezzanotte. Salta gli slot resi inutili dagli offset.
 */
async function effectiveIntervalsForDay(
  supabase: SupabaseClient,
  tenantId: string,
  locationId: string | null,
  week: DaySchedule[],
  refDate: Date,
  offsets: { beforeOpen: number; beforeClose: number },
  timeZone?: string,
): Promise<Array<{ start: Date; end: Date }>> {
  const prev = addDays(refDate, -1);
  const todaySlots = await resolveSlotsForDate(supabase, tenantId, locationId, week, refDate, timeZone);
  const prevSlots = await resolveSlotsForDate(supabase, tenantId, locationId, week, prev, timeZone);
  const raw: Array<{ start: Date; end: Date }> = [];

  // Costruisce un istante a `dayShift` giorni da refDate, all'ora h:mi. Con timeZone
  // l'ora è interpretata nell'orario reale del locale (corretto anche su server UTC);
  // senza, resta nel fuso del server (comportamento legacy di checkOrderingWindow).
  const refParts = timeZone ? zonedDateParts(refDate, timeZone) : null;
  const mkInstant = (dayShift: number, h: number, m: number): Date =>
    refParts
      ? zonedWallClockToInstant(refParts.y, refParts.mo, refParts.d + dayShift, h, m, timeZone!)
      : atTime(addDays(refDate, dayShift), h, m);

  if (todaySlots && !todaySlots.closed) {
    for (const slot of todaySlots.slots) {
      const parsed = parseSlot(slot);
      if (!parsed) continue;
      const start = mkInstant(0, parsed.open.h, parsed.open.m);
      const crossesMidnight =
        parsed.close.h < parsed.open.h ||
        (parsed.close.h === parsed.open.h && parsed.close.m < parsed.open.m);
      const end = crossesMidnight
        ? mkInstant(1, parsed.close.h, parsed.close.m)
        : mkInstant(0, parsed.close.h, parsed.close.m);
      raw.push({ start, end });
    }
  }

  if (prevSlots && !prevSlots.closed) {
    for (const slot of prevSlots.slots) {
      const parsed = parseSlot(slot);
      if (!parsed) continue;
      const crossesMidnight =
        parsed.close.h < parsed.open.h ||
        (parsed.close.h === parsed.open.h && parsed.close.m < parsed.open.m);
      if (!crossesMidnight) continue;
      raw.push({
        start: mkInstant(-1, parsed.open.h, parsed.open.m),
        end: mkInstant(0, parsed.close.h, parsed.close.m),
      });
    }
  }

  const out: Array<{ start: Date; end: Date }> = [];
  for (const c of raw) {
    const start = new Date(c.start.getTime() - offsets.beforeOpen * 60_000);
    const end = new Date(c.end.getTime() - offsets.beforeClose * 60_000);
    if (end.getTime() <= start.getTime()) continue; // slot reso inutile dagli offset
    out.push({ start, end });
  }
  out.sort((a, b) => a.start.getTime() - b.start.getTime());
  return out;
}

export type DeliveryAvailability = {
  leadMinutes: number;
  /** Nessuna fascia consegne configurata oggi (locale chiuso o canale fuori giorno). */
  closedToday: boolean;
  /** Fasce consegna effettive di oggi (offset applicati), in ISO. */
  todayWindows: Array<{ startIso: string; endIso: string }>;
  /** Prima consegna possibile oggi = max(adesso+lead, inizio fascia). Null se non più possibile oggi. */
  earliestIso: string | null;
  /** Ultima consegna possibile oggi. */
  lastIso: string | null;
  todayPossible: boolean;
  /** Prossimo giorno con consegne (YYYY-MM-DD) e prima fascia, per ordini programmati. */
  nextDate: string | null;
  nextEarliestIso: string | null;
};

/**
 * Disponibilità consegne dal punto di vista di una chiamata che arriva `now`.
 * Considera la finestra consegne dedicata (offset su orari del locale) e il tempo medio
 * di gestione (`settings.avgHandlingMinutes`): la prima consegna è max(adesso+lead, apertura).
 * Se oggi non è più possibile, indica il prossimo giorno di consegna disponibile.
 */
export async function resolveDeliveryAvailability(
  supabase: SupabaseClient,
  args: {
    tenantId: string;
    locationId: string | null;
    settings: TenantOrderSettings;
    channel?: OrderChannel;
    now?: Date;
    lookaheadDays?: number;
  },
): Promise<DeliveryAvailability> {
  const channel = args.channel ?? "delivery";
  const now = args.now ?? new Date();
  const lead = Math.max(0, Math.floor(args.settings.avgHandlingMinutes ?? 0));
  const earliestReach = new Date(now.getTime() + lead * 60_000);

  const week = await loadWeekHours(supabase, args.tenantId, args.locationId);
  // Niente orari configurati → non vincoliamo: prima consegna = adesso+lead.
  if (!week) {
    return {
      leadMinutes: lead,
      closedToday: false,
      todayWindows: [],
      earliestIso: earliestReach.toISOString(),
      lastIso: null,
      todayPossible: true,
      nextDate: null,
      nextEarliestIso: null,
    };
  }

  const offsets = channelOffsets(args.settings, channel);
  const today = await effectiveIntervalsForDay(supabase, args.tenantId, args.locationId, week, now, offsets, DELIVERY_TZ);

  let earliest: Date | null = null;
  for (const w of today) {
    const candidate = earliestReach.getTime() > w.start.getTime() ? earliestReach : w.start;
    if (candidate.getTime() <= w.end.getTime()) {
      earliest = candidate;
      break;
    }
  }
  const last = today.length ? today[today.length - 1]!.end : null;

  let nextDate: string | null = null;
  let nextEarliestIso: string | null = null;
  if (!earliest) {
    const lookahead = args.lookaheadDays ?? 7;
    for (let i = 1; i <= lookahead; i++) {
      const day = addDays(now, i);
      const intervals = await effectiveIntervalsForDay(supabase, args.tenantId, args.locationId, week, day, offsets, DELIVERY_TZ);
      // Solo le fasce che iniziano in `day` (escludo il cavallo di mezzanotte del giorno prima).
      const own = intervals.filter((w) => isoDateLocal(w.start, DELIVERY_TZ) === isoDateLocal(day, DELIVERY_TZ));
      if (own.length) {
        nextDate = isoDateLocal(day, DELIVERY_TZ);
        nextEarliestIso = own[0]!.start.toISOString();
        break;
      }
    }
  }

  return {
    leadMinutes: lead,
    closedToday: today.length === 0,
    todayWindows: today.map((w) => ({ startIso: w.start.toISOString(), endIso: w.end.toISOString() })),
    earliestIso: earliest ? earliest.toISOString() : null,
    lastIso: last ? last.toISOString() : null,
    todayPossible: Boolean(earliest),
    nextDate,
    nextEarliestIso,
  };
}

/**
 * Finestre consegna effettive per una data specifica (per ordini programmati a giorni
 * futuri). Nessun vincolo di lead time: serve solo a validare che un orario richiesto
 * cada in apertura. `closed` = nessuna fascia consegne quel giorno.
 */
export async function resolveDeliveryWindowsForDate(
  supabase: SupabaseClient,
  args: {
    tenantId: string;
    locationId: string | null;
    settings: TenantOrderSettings;
    channel?: OrderChannel;
    date: Date;
  },
): Promise<{ closed: boolean; windows: Array<{ start: Date; end: Date }> }> {
  const week = await loadWeekHours(supabase, args.tenantId, args.locationId);
  if (!week) return { closed: false, windows: [] }; // niente orari → non vincoliamo
  const offsets = channelOffsets(args.settings, args.channel ?? "delivery");
  const windows = await effectiveIntervalsForDay(supabase, args.tenantId, args.locationId, week, args.date, offsets, DELIVERY_TZ);
  return { closed: windows.length === 0, windows };
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
  timeZone?: string,
): Promise<{ closed: boolean; slots: string[] } | null> {
  const special = await loadSpecialHoursForDate(supabase, tenantId, locationId, isoDateLocal(date, timeZone));
  if (special) return special;
  const dow = timeZone ? zonedDateParts(date, timeZone).dow : dowMondayBased(date);
  const day = week.find((d) => LABEL_TO_DOW[d.label] === dow);
  if (!day) return null;
  return { closed: day.closed, slots: day.slots };
}
