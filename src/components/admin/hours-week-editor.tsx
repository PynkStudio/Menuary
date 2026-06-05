"use client";

import { Plus, Trash2 } from "lucide-react";
import type { DaySchedule } from "@/lib/venue-hours";
import { cloneHoursWeek, defaultHoursWeek } from "@/lib/venue-hours";

type Slot = { open: string; close: string };

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseSlot(s: string): Slot {
  const [openRaw, closeRaw] = s.split("–").map((p) => p.trim());
  return {
    open: TIME_RE.test(openRaw ?? "") ? openRaw! : "",
    close: TIME_RE.test(closeRaw ?? "") ? closeRaw! : "",
  };
}

function formatSlot(slot: Slot): string {
  if (!slot.open && !slot.close) return "";
  return `${slot.open} – ${slot.close}`;
}

function slotsForUi(d: DaySchedule): Slot[] {
  if (d.closed) return [];
  if (d.slots.length === 0) return [{ open: "", close: "" }];
  return d.slots.map(parseSlot);
}

export function HoursWeekEditor({
  value,
  onChange,
}: {
  value: DaySchedule[];
  onChange: (next: DaySchedule[]) => void;
}) {
  function updateSlot(dayIndex: number, slotIndex: number, patch: Partial<Slot>) {
    const next = cloneHoursWeek(value);
    const slots = slotsForUi(next[dayIndex]);
    slots[slotIndex] = { ...slots[slotIndex], ...patch };
    next[dayIndex] = { ...next[dayIndex], slots: slots.map(formatSlot) };
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">
          Settimana tipo
        </p>
        <button
          type="button"
          onClick={() => onChange(defaultHoursWeek())}
          className="text-xs font-semibold text-pork-red underline-offset-2 hover:underline"
        >
          Ripristina orari predefiniti sito
        </button>
      </div>

      {value.map((day, di) => {
        const slots = slotsForUi(day);
        return (
          <div
            key={`${day.label}-${di}`}
            className="rounded-[18px] border-2 border-[#ead8bd] bg-[#fff8e7] p-4 shadow-[10px_10px_0_rgba(52,28,22,0.07)] sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-bold">{day.label}</span>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={day.closed}
                  className="h-4 w-4 accent-pork-red"
                  onChange={(e) => {
                    const closed = e.target.checked;
                    const next = cloneHoursWeek(value);
                    next[di] = {
                      ...next[di],
                      closed,
                      slots: closed ? [] : next[di].slots.length ? [...next[di].slots] : [""],
                    };
                    onChange(next);
                  }}
                />
                Chiuso
              </label>
            </div>

            {!day.closed && (
              <div className="mt-3 space-y-2">
                {slots.map((slot, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.open}
                      onChange={(e) => updateSlot(di, si, { open: e.target.value })}
                      className="rounded-lg border border-pork-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-pork-red"
                    />
                    <span className="text-pork-ink/40">–</span>
                    <input
                      type="time"
                      value={slot.close}
                      onChange={(e) => updateSlot(di, si, { close: e.target.value })}
                      className="rounded-lg border border-pork-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-pork-red"
                    />
                    <button
                      type="button"
                      aria-label="Rimuovi fascia"
                      disabled={slots.length <= 1}
                      onClick={() => {
                        const next = cloneHoursWeek(value);
                        const base = slotsForUi(next[di]);
                        base.splice(si, 1);
                        next[di] = {
                          ...next[di],
                          slots: base.length ? base.map(formatSlot) : [""],
                        };
                        onChange(next);
                      }}
                      className="ml-auto rounded-lg p-2 text-pork-ink/40 hover:bg-pork-red/10 hover:text-pork-red disabled:pointer-events-none disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const next = cloneHoursWeek(value);
                    const base = [...slotsForUi(next[di]), { open: "", close: "" }];
                    next[di] = { ...next[di], closed: false, slots: base.map(formatSlot) };
                    onChange(next);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-pork-red"
                >
                  <Plus size={14} /> Aggiungi fascia
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
