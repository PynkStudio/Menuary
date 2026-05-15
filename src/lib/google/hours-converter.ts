import type { DaySchedule } from "@/lib/venue-hours";

// ─── Mapping italiano → Google Day enum ──────────────────────────────────────
const LABEL_TO_GOOGLE_DAY: Record<string, string> = {
  "Lunedì":    "MONDAY",
  "Martedì":   "TUESDAY",
  "Mercoledì": "WEDNESDAY",
  "Giovedì":   "THURSDAY",
  "Venerdì":   "FRIDAY",
  "Sabato":    "SATURDAY",
  "Domenica":  "SUNDAY",
};

type TimePoint = { hours: number; minutes: number };
type GooglePeriod = {
  openDay: string;
  openTime: TimePoint;
  closeDay: string;
  closeTime: TimePoint;
};
type GoogleSpecialPeriod = {
  startDate: { year: number; month: number; day: number };
  endDate: { year: number; month: number; day: number };
  openTime?: TimePoint;
  closeTime?: TimePoint;
  isClosed: boolean;
};

/** Parsa "12:30 – 15:00" → { open, close }. Ritorna null se formato non valido. */
function parseSlot(slot: string): { open: TimePoint; close: TimePoint } | null {
  const m = slot.match(/(\d{1,2}):(\d{2})\s*[–\-]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return {
    open:  { hours: parseInt(m[1]), minutes: parseInt(m[2]) },
    close: { hours: parseInt(m[3]), minutes: parseInt(m[4]) },
  };
}

/**
 * Converte l'array DaySchedule nel formato `regularHours.periods` di Google.
 * Fasce che superano la mezzanotte (es. "22:00 – 02:00") vengono gestite
 * impostando closeDay al giorno successivo.
 */
export function toGoogleRegularHours(week: DaySchedule[]): { periods: GooglePeriod[] } {
  const DAY_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
  const periods: GooglePeriod[] = [];

  for (const day of week) {
    if (day.closed) continue;
    const googleDay = LABEL_TO_GOOGLE_DAY[day.label];
    if (!googleDay) continue;

    for (const slot of day.slots) {
      const parsed = parseSlot(slot);
      if (!parsed) continue;

      const { open, close } = parsed;
      // Chiusura oltre mezzanotte → closeDay è il giorno successivo
      const crossesMidnight = close.hours < open.hours || (close.hours === 0 && close.minutes === 0);
      const closeDay = crossesMidnight
        ? DAY_ORDER[(DAY_ORDER.indexOf(googleDay) + 1) % 7]
        : googleDay;

      periods.push({ openDay: googleDay, openTime: open, closeDay, closeTime: close });
    }
  }

  return { periods };
}

export type SpecialHourInput = {
  date: string;   // "YYYY-MM-DD"
  closed: boolean;
  slots: string[];
};

/**
 * Converte gli orari straordinari nel formato `specialHours.specialHourPeriods` di Google.
 */
export function toGoogleSpecialHours(
  specials: SpecialHourInput[],
): { specialHourPeriods: GoogleSpecialPeriod[] } {
  const specialHourPeriods: GoogleSpecialPeriod[] = [];

  for (const s of specials) {
    const [year, month, day] = s.date.split("-").map(Number);
    const dateObj = { year, month, day };

    if (s.closed || s.slots.length === 0) {
      specialHourPeriods.push({ startDate: dateObj, endDate: dateObj, isClosed: true });
      continue;
    }

    for (const slot of s.slots) {
      const parsed = parseSlot(slot);
      if (!parsed) continue;
      specialHourPeriods.push({
        startDate: dateObj,
        endDate: dateObj,
        openTime: parsed.open,
        closeTime: parsed.close,
        isClosed: false,
      });
    }
  }

  return { specialHourPeriods };
}
