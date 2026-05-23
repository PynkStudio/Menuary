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
    { label: "Martedì", closed: true, slots: [] },
    { label: "Mercoledì", closed: false, slots: ["08:30 – 13:00"] },
    { label: "Giovedì", closed: false, slots: ["08:30 – 13:00"] },
    { label: "Venerdì", closed: false, slots: ["08:30 – 13:00"] },
    { label: "Sabato", closed: false, slots: ["08:30 – 13:00"] },
    { label: "Domenica", closed: true, slots: [] },
  ];
}

export function defaultHoursWeekForTenant(tenantId: string): DaySchedule[] {
  if (tenantId === "doca") return docaHoursWeek();
  return defaultHoursWeek();
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
