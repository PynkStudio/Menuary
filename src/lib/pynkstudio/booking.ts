/**
 * Logica disponibilità per le call di consulenza PynkStudio (/prenota-call).
 * Slot da 20 min, lun-ven 10:00-18:00 in orario Europe/Rome.
 * In DB si salva sempre UTC; qui si converte il wall-clock di Roma in istante UTC
 * gestendo correttamente l'ora legale (niente librerie: solo Intl).
 */

export const BOOKING_TIMEZONE = "Europe/Rome";
export const BOOKING_OPEN_HOUR = 10; // prima call: 10:00
export const BOOKING_CLOSE_HOUR = 18; // ultima call deve chiudere entro le 18:00
export const BOOKING_SLOT_MINUTES = 20;
/** Quanti giorni lavorativi mostrare nel selettore data. */
export const BOOKING_LOOKAHEAD_DAYS = 14;

const WEEKEND = new Set([0, 6]); // 0 = domenica, 6 = sabato

/** Offset (in minuti) di Europe/Rome rispetto a UTC per un dato istante. */
function romeOffsetMinutes(at: Date): number {
  // Confronta il wall-clock di Roma con quello UTC per lo stesso istante.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  // Mezzanotte ("24") va normalizzata a 0.
  const hour = map.hour === 24 ? 0 : map.hour;
  const asUtc = Date.UTC(map.year, map.month - 1, map.day, hour, map.minute, map.second);
  return Math.round((asUtc - at.getTime()) / 60000);
}

/**
 * Converte un wall-clock di Roma (YYYY-MM-DD + ora + minuti) nell'istante UTC.
 * Itera una volta per assestare l'offset sui giorni di cambio ora legale.
 */
export function romeWallClockToUtc(dateISO: string, hour: number, minute: number): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  let guessUtcMs = Date.UTC(y, m - 1, d, hour, minute, 0);
  for (let i = 0; i < 2; i++) {
    const offset = romeOffsetMinutes(new Date(guessUtcMs));
    const corrected = Date.UTC(y, m - 1, d, hour, minute, 0) - offset * 60000;
    if (corrected === guessUtcMs) break;
    guessUtcMs = corrected;
  }
  return new Date(guessUtcMs);
}

/** YYYY-MM-DD del giorno di `at` in orario Roma. */
export function romeDateISO(at: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  return `${map.year}-${map.month}-${map.day}`;
}

/** Giorno della settimana (0=dom..6=sab) della data in orario Roma. */
function romeWeekday(dateISO: string): number {
  // Mezzogiorno UTC evita ambiguità di confine giorno.
  const noon = new Date(`${dateISO}T12:00:00Z`);
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    weekday: "short",
  }).format(noon);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

export function isWorkingDay(dateISO: string): boolean {
  const wd = romeWeekday(dateISO);
  return wd >= 1 && wd <= 5 && !WEEKEND.has(wd);
}

export type BookingSlot = { time: string; startUtc: Date };

/** Genera gli slot leciti del giorno (10:00..17:40). Vuoto se non lavorativo. */
export function slotsForDate(dateISO: string): BookingSlot[] {
  if (!isWorkingDay(dateISO)) return [];
  const slots: BookingSlot[] = [];
  const totalMinutes = (BOOKING_CLOSE_HOUR - BOOKING_OPEN_HOUR) * 60;
  for (let m = 0; m + BOOKING_SLOT_MINUTES <= totalMinutes; m += BOOKING_SLOT_MINUTES) {
    const hour = BOOKING_OPEN_HOUR + Math.floor(m / 60);
    const minute = m % 60;
    const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    slots.push({ time, startUtc: romeWallClockToUtc(dateISO, hour, minute) });
  }
  return slots;
}

/**
 * I prossimi giorni lavorativi (date ISO in orario Roma), a partire da oggi.
 */
export function upcomingWorkingDays(count = BOOKING_LOOKAHEAD_DAYS, now: Date = new Date()): string[] {
  const days: string[] = [];
  const cursor = new Date(now);
  // Scorri al massimo ~3x i giorni richiesti per saltare i weekend.
  for (let i = 0; i < count * 3 && days.length < count; i++) {
    const iso = romeDateISO(cursor);
    if (isWorkingDay(iso)) days.push(iso);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/**
 * Valida lato server che `startUtc` corrisponda esattamente a uno slot lecito e
 * ancora futuro. Non fidarsi mai dell'orario inviato dal client.
 */
export function isValidSlot(startUtc: Date, now: Date = new Date()): boolean {
  if (Number.isNaN(startUtc.getTime())) return false;
  if (startUtc.getTime() <= now.getTime()) return false;
  const dateISO = romeDateISO(startUtc);
  return slotsForDate(dateISO).some((s) => s.startUtc.getTime() === startUtc.getTime());
}

export function slotEnd(startUtc: Date): Date {
  return new Date(startUtc.getTime() + BOOKING_SLOT_MINUTES * 60000);
}

/** Etichetta leggibile in italiano dello slot (es. "lunedì 16 giugno, 10:20"). */
export function formatSlotLabel(startUtc: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: BOOKING_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(startUtc);
}
