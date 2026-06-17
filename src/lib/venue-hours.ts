import { siteConfig } from "@/lib/site-config";

/** Un giorno della settimana con una o più fasce orarie. */
export type DaySchedule = {
  label: string;
  closed: boolean;
  /** Es. "12:30 – 15:00", "19:00 – 00:00" (testo libero per la demo). */
  slots: string[];
};

export function defaultHoursWeek(): DaySchedule[] {
  return siteConfig.hours.map((h) => ({
    label: h.day,
    closed: h.closed,
    slots: [...h.slots],
  }));
}

export function docaHoursWeek(): DaySchedule[] {
  return [
    { label: "Lunedì", closed: true, slots: [] },
    { label: "Martedì", closed: false, slots: ["08:00 – 18:30"] },
    { label: "Mercoledì", closed: false, slots: ["08:00 – 18:30"] },
    { label: "Giovedì", closed: false, slots: ["08:00 – 18:30"] },
    { label: "Venerdì", closed: false, slots: ["08:00 – 18:30"] },
    { label: "Sabato", closed: false, slots: ["08:30 – 13:00"] },
    { label: "Domenica", closed: false, slots: ["08:30 – 13:00"] },
  ];
}

export function juniorFoodHoursWeek(): DaySchedule[] {
  return [
    { label: "Lunedì", closed: true, slots: [] },
    { label: "Martedì", closed: false, slots: ["12:00 – 00:00"] },
    { label: "Mercoledì", closed: false, slots: ["12:00 – 00:00"] },
    { label: "Giovedì", closed: false, slots: ["12:00 – 00:00"] },
    { label: "Venerdì", closed: false, slots: ["12:00 – 02:00"] },
    { label: "Sabato", closed: false, slots: ["12:00 – 02:00"] },
    { label: "Domenica", closed: false, slots: ["12:00 – 02:00"] },
  ];
}

export function nomSushiHoursWeek(): DaySchedule[] {
  return [
    { label: "Lunedì", closed: false, slots: ["12:00 – 15:00", "19:00 – 23:30"] },
    { label: "Martedì", closed: false, slots: ["12:00 – 15:00", "19:00 – 23:30"] },
    { label: "Mercoledì", closed: false, slots: ["12:00 – 15:00", "19:00 – 23:30"] },
    { label: "Giovedì", closed: false, slots: ["12:00 – 15:00", "19:00 – 23:30"] },
    { label: "Venerdì", closed: false, slots: ["12:00 – 15:00", "19:00 – 23:30"] },
    { label: "Sabato", closed: false, slots: ["12:00 – 15:00", "19:00 – 23:30"] },
    { label: "Domenica", closed: false, slots: ["12:00 – 15:00", "19:00 – 23:30"] },
  ];
}

export function kimosHoursWeek(): DaySchedule[] {
  return [
    { label: "Lunedì", closed: false, slots: ["11:30 – 15:00", "18:00 – 00:00"] },
    { label: "Martedì", closed: false, slots: ["11:30 – 15:00", "18:00 – 00:00"] },
    { label: "Mercoledì", closed: false, slots: ["11:30 – 15:00", "18:00 – 00:00"] },
    { label: "Giovedì", closed: false, slots: ["11:30 – 15:00", "18:00 – 00:00"] },
    { label: "Venerdì", closed: false, slots: ["11:30 – 15:00", "18:00 – 00:00"] },
    { label: "Sabato", closed: false, slots: ["11:30 – 15:00", "18:00 – 00:00"] },
    { label: "Domenica", closed: false, slots: ["11:30 – 15:00", "18:00 – 00:00"] },
  ];
}

export function cascinaErranteHoursWeek(): DaySchedule[] {
  return [
    { label: "Lunedì", closed: true, slots: [] },
    { label: "Martedì", closed: false, slots: ["12:00 – 15:00", "19:00 – 23:00"] },
    { label: "Mercoledì", closed: false, slots: ["12:00 – 15:00", "19:00 – 23:00"] },
    { label: "Giovedì", closed: false, slots: ["12:00 – 15:00", "19:00 – 23:00"] },
    { label: "Venerdì", closed: false, slots: ["12:00 – 15:00", "19:00 – 00:00"] },
    { label: "Sabato", closed: false, slots: ["11:30 – 15:30", "19:00 – 00:00"] },
    { label: "Domenica", closed: false, slots: ["11:30 – 16:00"] },
  ];
}

export function defaultHoursWeekForTenant(tenantId: string): DaySchedule[] {
  if (tenantId === "doca") return docaHoursWeek();
  if (tenantId === "junior-food") return juniorFoodHoursWeek();
  if (tenantId === "nom-sushi") return nomSushiHoursWeek();
  if (tenantId === "kimos") return kimosHoursWeek();
  if (tenantId === "cascina-errante") return cascinaErranteHoursWeek();
  return defaultHoursWeek();
}

/**
 * Restituisce il DaySchedule per una data specifica.
 * L'array hoursWeek è indicizzato Monday=0 … Sunday=6.
 */
export function scheduleDayForDate(hoursWeek: DaySchedule[], date: Date): DaySchedule {
  const index = (date.getDay() + 6) % 7;
  return hoursWeek[index] ?? { label: "", closed: true, slots: [] };
}

/**
 * Parsa "08:00 – 18:30" (en-dash) in { open: "08:00", close: "18:30" }.
 * Restituisce null se il formato non è riconoscibile.
 */
export function parseSlotBounds(slot: string): { open: string; close: string } | null {
  const parts = slot.split("–").map((s) => s.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { open: parts[0], close: parts[1] };
}

/**
 * Restituisce le date aperte in [startDate, startDate + windowDays).
 * Usa solo i giorni non segnati come closed nello schedule del tenant.
 */
export function openPickupDates(hoursWeek: DaySchedule[], startDate: Date, windowDays: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    if (!scheduleDayForDate(hoursWeek, d).closed) dates.push(d);
  }
  return dates;
}

/**
 * Verifica che una stringa "HH:mm" cada dentro almeno una fascia oraria del giorno.
 * Il confronto stringa funziona per orari in formato 24h zero-padded.
 */
export function isTimeInOpenSlots(time: string, slots: string[]): boolean {
  for (const slot of slots) {
    const bounds = parseSlotBounds(slot);
    if (!bounds) continue;
    if (time >= bounds.open && time <= bounds.close) return true;
  }
  return false;
}

/**
 * Genera gli slot orari cliccabili a partire dalle fasce di un giorno.
 * stepMinutes: granularità in minuti (default 30).
 * Es. ["08:00 – 18:30"] con step 30 → ["08:00", "08:30", ..., "18:30"]
 */
export function generateTimeSlots(slots: string[], stepMinutes = 30): string[] {
  const result: string[] = [];
  for (const slot of slots) {
    const bounds = parseSlotBounds(slot);
    if (!bounds) continue;
    const [openH, openM] = bounds.open.split(":").map(Number);
    const [closeH, closeM] = bounds.close.split(":").map(Number);
    let current = openH * 60 + openM;
    const end = closeH * 60 + closeM;
    while (current <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, "0");
      const m = (current % 60).toString().padStart(2, "0");
      result.push(`${h}:${m}`);
      current += stepMinutes;
    }
  }
  return result;
}

export function cloneHoursWeek(w: DaySchedule[]): DaySchedule[] {
  return w.map((d) => ({
    label: d.label,
    closed: d.closed,
    slots: [...d.slots],
  }));
}

export function hoursWeekEquals(a: DaySchedule[], b: DaySchedule[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].label !== b[i].label || a[i].closed !== b[i].closed) return false;
    if (a[i].slots.length !== b[i].slots.length) return false;
    for (let j = 0; j < a[i].slots.length; j++) {
      if (a[i].slots[j] !== b[i].slots[j]) return false;
    }
  }
  return true;
}

/** Trim fasce; giorno aperto senza fasce → una riga vuota per l’editor. */
export function sanitizeHoursWeek(w: DaySchedule[]): DaySchedule[] {
  return w.map((d) => {
    if (d.closed) return { ...d, slots: [] };
    const slots = d.slots.map((s) => s.trim()).filter(Boolean);
    return { ...d, closed: false, slots: slots.length ? slots : [""] };
  });
}
