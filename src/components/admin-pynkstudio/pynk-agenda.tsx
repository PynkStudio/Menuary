"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Mail, Phone, X } from "lucide-react";
import { PushEnableToggle } from "./push-enable-toggle";

const TIMEZONE = "Europe/Rome";
const OPEN_HOUR = 10;
const CLOSE_HOUR = 18;
const SLOT_MIN = 20;
const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven"];

type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled";
  created_at: string;
};

// Parti (dateISO + HH:MM) di un istante in orario Roma, per indicizzare le celle.
function romeParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const m: Record<string, string> = {};
  for (const x of p) if (x.type !== "literal") m[x.type] = x.value;
  const hour = m.hour === "24" ? "00" : m.hour;
  return { date: `${m.year}-${m.month}-${m.day}`, time: `${hour}:${m.minute}` };
}

function startOfWeekMonday(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = out.getDay(); // 0=dom
  const diff = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + diff);
  return out;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TIME_ROWS: string[] = (() => {
  const rows: string[] = [];
  const total = (CLOSE_HOUR - OPEN_HOUR) * 60;
  for (let m = 0; m + SLOT_MIN <= total; m += SLOT_MIN) {
    const h = OPEN_HOUR + Math.floor(m / 60);
    rows.push(`${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return rows;
})();

export function PynkAgenda() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    const from = new Date(weekStart);
    const to = new Date(weekStart);
    to.setDate(to.getDate() + 5);
    try {
      const res = await fetch(
        `/api/admin/pynkstudio/bookings?from=${from.toISOString()}&to=${to.toISOString()}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void load();
  }, [load]);

  // Indicizza le confermate per "dateISO HH:MM".
  const byCell = useMemo(() => {
    const map = new Map<string, Booking>();
    for (const b of bookings) {
      if (b.status !== "confirmed") continue;
      const { date, time } = romeParts(b.starts_at);
      map.set(`${date} ${time}`, b);
    }
    return map;
  }, [bookings]);

  const cancel = async (id: string) => {
    await fetch("/api/admin/pynkstudio/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "cancelled" }),
    });
    setSelected(null);
    void load();
  };

  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(startOfWeekMonday(d));
  };

  const monthLabel = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(weekStart);
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="pynk-admin-page-title">Agenda</h1>
          <p className="pynk-admin-page-subtitle">
            Call di consulenza prenotate · {confirmedCount} questa settimana
          </p>
        </div>
        <PushEnableToggle />
      </div>

      <div className="pynk-admin-card pynk-agenda-card">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => shiftWeek(-1)} className="pynk-admin-icon-btn" aria-label="Settimana precedente">
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold capitalize">{monthLabel}</span>
          <button type="button" onClick={() => shiftWeek(1)} className="pynk-admin-icon-btn" aria-label="Settimana successiva">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="pynk-agenda-grid">
          <div className="pynk-agenda-corner" />
          {weekDays.map((d, i) => (
            <div key={i} className="pynk-agenda-dayhead">
              <span>{WEEKDAY_LABELS[i]}</span>
              <strong>{d.getDate()}</strong>
            </div>
          ))}

          {TIME_ROWS.map((time) => (
            <div key={time} className="pynk-agenda-row" style={{ display: "contents" }}>
              <div className="pynk-agenda-time">{time}</div>
              {weekDays.map((d, i) => {
                const cellKey = `${toISODate(d)} ${time}`;
                const b = byCell.get(cellKey);
                return (
                  <div key={i} className="pynk-agenda-cell">
                    {b && (
                      <button type="button" className="pynk-agenda-event" onClick={() => setSelected(b)}>
                        <span className="pynk-agenda-event-name">{b.name}</span>
                        <span className="pynk-agenda-event-topic">{b.topic}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {loading && <p className="mt-3 text-sm opacity-50">Carico…</p>}
      </div>

      {selected && (
        <div className="pynk-agenda-modal-overlay" onClick={() => setSelected(null)}>
          <div className="pynk-agenda-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="pynk-agenda-modal-close" onClick={() => setSelected(null)} aria-label="Chiudi">
              <X size={18} />
            </button>
            <p className="pynk-agenda-modal-when">
              {new Intl.DateTimeFormat("it-IT", {
                timeZone: TIMEZONE,
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(selected.starts_at))}
            </p>
            <h3 className="pynk-agenda-modal-name">{selected.name}</h3>
            <p className="pynk-agenda-modal-topic">{selected.topic}</p>
            <div className="pynk-agenda-modal-contacts">
              <a href={`tel:${selected.phone}`}><Phone size={14} /> {selected.phone}</a>
              <a href={`mailto:${selected.email}`}><Mail size={14} /> {selected.email}</a>
            </div>
            <button type="button" className="pynk-agenda-modal-cancel" onClick={() => cancel(selected.id)}>
              Annulla prenotazione
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
