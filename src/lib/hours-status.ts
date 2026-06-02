import type { DaySchedule } from "@/lib/venue-hours";

export type HoursStatus =
  | { kind: "open"; closesAt: string }
  | { kind: "closing_soon"; closesAt: string }
  | { kind: "opening_soon"; opensAt: string }
  | { kind: "closed"; nextOpen?: { dayLabel: string; time: string } };

export type SpecialDay = {
  date: string;
  label: string | null;
  closed: boolean;
  slots: string[];
};

export type DayGroup = {
  /** Indici giorno (lun=0..dom=6) appartenenti al gruppo, in ordine. */
  indices: number[];
  /** Etichetta riassuntiva: "Lun – Gio", "Tutti i giorni", "Sab, Dom". */
  label: string;
  closed: boolean;
  slots: string[];
  containsToday: boolean;
};

const ITALIAN_DAYS = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
] as const;

const LABEL_TO_DOW: Record<string, number> = {
  Lunedì: 0,
  Martedì: 1,
  Mercoledì: 2,
  Giovedì: 3,
  Venerdì: 4,
  Sabato: 5,
  Domenica: 6,
};

/** 0=lun..6=dom */
export function todayMondayIndex(now: Date = new Date()): number {
  return (now.getDay() + 6) % 7;
}

export function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type ParsedSlot = {
  openH: number;
  openM: number;
  closeH: number;
  closeM: number;
  crossesMidnight: boolean;
};

export function parseSlot(slot: string): ParsedSlot | null {
  const m = slot.match(/(\d{1,2}):(\d{2})\s*[–\-]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const openH = parseInt(m[1], 10);
  const openM = parseInt(m[2], 10);
  const closeH = parseInt(m[3], 10);
  const closeM = parseInt(m[4], 10);
  const crossesMidnight =
    closeH < openH || (closeH === openH && closeM < openM) || (closeH === 0 && closeM === 0);
  return { openH, openM, closeH, closeM, crossesMidnight };
}

function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function fmt(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Calcola lo stato a partire dagli slot di oggi e ieri (per gestire fasce
 * che attraversano la mezzanotte).
 */
export function computeStatusFromSlots(
  todaySlots: string[],
  yesterdaySlots: string[],
  now: Date = new Date(),
): HoursStatus {
  const nowM = minutesSinceMidnight(now);
  const intervals: Array<{ startM: number; endM: number; openLabel: string; closeLabel: string }> = [];

  for (const slot of yesterdaySlots) {
    const p = parseSlot(slot);
    if (!p) continue;
    if (!p.crossesMidnight) continue;
    intervals.push({
      startM: -1, // già aperto da ieri
      endM: p.closeH * 60 + p.closeM,
      openLabel: fmt(p.openH, p.openM),
      closeLabel: fmt(p.closeH, p.closeM),
    });
  }

  for (const slot of todaySlots) {
    const p = parseSlot(slot);
    if (!p) continue;
    const startM = p.openH * 60 + p.openM;
    const endM = p.crossesMidnight ? 24 * 60 + p.closeH * 60 + p.closeM : p.closeH * 60 + p.closeM;
    intervals.push({
      startM,
      endM,
      openLabel: fmt(p.openH, p.openM),
      closeLabel: fmt(p.closeH, p.closeM),
    });
  }

  intervals.sort((a, b) => a.startM - b.startM);

  for (const iv of intervals) {
    if (nowM >= iv.startM && nowM < iv.endM) {
      const remaining = iv.endM - nowM;
      if (remaining <= 30) return { kind: "closing_soon", closesAt: iv.closeLabel };
      return { kind: "open", closesAt: iv.closeLabel };
    }
    if (nowM < iv.startM && iv.startM - nowM <= 30) {
      return { kind: "opening_soon", opensAt: iv.openLabel };
    }
  }

  return { kind: "closed" };
}

function slotsKey(closed: boolean, slots: string[]): string {
  if (closed) return "CLOSED";
  return slots.map((s) => s.trim()).filter(Boolean).join("|") || "EMPTY";
}

function formatRange(indices: number[], dayLabels: readonly string[], shortLabels?: readonly string[]): string {
  if (indices.length === 0) return "";
  if (indices.length === 7) return "Tutti i giorni";
  // contigui?
  const contiguous = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
  const short = shortLabels ?? dayLabels.map((l) => l.slice(0, 3));
  if (contiguous && indices.length > 1) {
    return `${short[indices[0]]} – ${short[indices[indices.length - 1]]}`;
  }
  if (indices.length === 1) return dayLabels[indices[0]];
  return indices.map((i) => short[i]).join(", ");
}

/**
 * Raggruppa giorni consecutivi con la stessa schedule. Restituisce i gruppi
 * in ordine settimanale.
 */
export function groupWeek(
  week: DaySchedule[],
  options?: {
    todayIndex?: number;
    dayLabels?: readonly string[];
    shortLabels?: readonly string[];
  },
): DayGroup[] {
  const todayIdx = options?.todayIndex ?? todayMondayIndex();
  const labels = options?.dayLabels ?? ITALIAN_DAYS;

  // Normalizza: indicizziamo per lunMon-based
  const byIndex: DaySchedule[] = new Array(7);
  for (const day of week) {
    const idx = LABEL_TO_DOW[day.label];
    if (idx == null) continue;
    byIndex[idx] = day;
  }

  const groups: DayGroup[] = [];
  let current: { key: string; day: DaySchedule; indices: number[] } | null = null;

  for (let i = 0; i < 7; i++) {
    const day = byIndex[i];
    if (!day) continue;
    const key = slotsKey(day.closed, day.slots);
    if (current && current.key === key) {
      current.indices.push(i);
    } else {
      if (current) {
        groups.push(buildGroup(current, todayIdx, labels, options?.shortLabels));
      }
      current = { key, day, indices: [i] };
    }
  }
  if (current) groups.push(buildGroup(current, todayIdx, labels, options?.shortLabels));

  return groups;
}

function buildGroup(
  acc: { key: string; day: DaySchedule; indices: number[] },
  todayIdx: number,
  dayLabels: readonly string[],
  shortLabels?: readonly string[],
): DayGroup {
  return {
    indices: acc.indices,
    label: formatRange(acc.indices, dayLabels, shortLabels),
    closed: acc.day.closed,
    slots: acc.day.slots.filter(Boolean),
    containsToday: acc.indices.includes(todayIdx),
  };
}

/** Restituisce gli slot effettivi per una data (override speciali → settimana). */
export function resolveDay(
  week: DaySchedule[],
  specials: SpecialDay[],
  date: Date,
): { closed: boolean; slots: string[]; special: SpecialDay | null } {
  const iso = isoDateLocal(date);
  const sp = specials.find((s) => s.date === iso);
  if (sp) return { closed: sp.closed, slots: sp.slots, special: sp };
  const idx = todayMondayIndex(date);
  const day = week.find((d) => LABEL_TO_DOW[d.label] === idx);
  if (!day) return { closed: true, slots: [], special: null };
  return { closed: day.closed, slots: day.slots, special: null };
}

export function getItalianDayLabels(): readonly string[] {
  return ITALIAN_DAYS;
}
