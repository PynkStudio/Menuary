"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Mail, Phone, Settings, Users, Video, X } from "lucide-react";
import { PushEnableToggle } from "./push-enable-toggle";

const TIMEZONE = "Europe/Rome";
const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Griglia ricavata dalle impostazioni dell'agenda; questi valori valgono finché non arrivano.
type Layout = { open: number; close: number; step: number; days: number[] };
const FALLBACK_LAYOUT: Layout = { open: 10 * 60, close: 18 * 60, step: 20, days: [1, 2, 3, 4, 5] };

type SettingsPayload = {
  eventTypes?: Array<{ durationMinutes: number; slotStepMinutes?: number; weekly: Array<{ day: number; start: string; end: string }> }>;
  hosts?: Array<{ id: string; name: string }>;
};

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function layoutFrom(settings: SettingsPayload): Layout {
  const et = settings.eventTypes?.[0];
  if (!et?.weekly?.length) return FALLBACK_LAYOUT;
  return {
    open: Math.min(...et.weekly.map((w) => minutesOf(w.start))),
    close: Math.max(...et.weekly.map((w) => minutesOf(w.end))),
    step: et.slotStepMinutes ?? et.durationMinutes,
    days: WEEK_ORDER.filter((d) => et.weekly.some((w) => w.day === d)),
  };
}

function clock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

// Forma restituita da `serializeBooking` di @pynkstudio/agendaapp.
type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  startsAt: string;
  endsAt: string;
  location: "video" | "phone" | "in_person";
  hostId: string | null;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  videoStartedAt: string | null;
  createdAt: string;
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

export function PynkAgenda() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [layout, setLayout] = useState<Layout>(FALLBACK_LAYOUT);
  const [hostNames, setHostNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetch("/api/admin/pynkstudio/agenda/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SettingsPayload | null) => {
        if (!data) return;
        setLayout(layoutFrom(data));
        setHostNames(new Map((data.hosts ?? []).map((h) => [h.id, h.name])));
      })
      .catch(() => {});
  }, []);

  const timeRows = useMemo(() => {
    const rows: number[] = [];
    for (let m = layout.open; m + layout.step <= layout.close; m += layout.step) rows.push(m);
    return rows;
  }, [layout]);

  const weekDays = useMemo(() => {
    return layout.days.map((weekday) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + ((weekday + 6) % 7));
      return d;
    });
  }, [weekStart, layout.days]);

  const load = useCallback(async () => {
    setLoading(true);
    const from = new Date(weekStart);
    const to = new Date(weekStart);
    to.setDate(to.getDate() + 7);
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

  // Più prenotazioni nella stessa cella (posti multipli o più persone dello staff).
  // Una call che non cade esattamente su una riga va nella riga che la contiene.
  const byCell = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      const { date, time } = romeParts(b.startsAt);
      const row = layout.open + Math.floor((minutesOf(time) - layout.open) / layout.step) * layout.step;
      const key = `${date} ${clock(row)}`;
      map.set(key, [...(map.get(key) ?? []), b]);
    }
    return map;
  }, [bookings, layout]);

  const updateBooking = async (id: string, action: "cancel" | "complete" | "no_show") => {
    await fetch("/api/admin/pynkstudio/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
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
  const confirmedCount = bookings.filter((b) => b.status !== "cancelled").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="pynk-admin-page-title">Agenda</h1>
          <p className="pynk-admin-page-subtitle">
            Call di consulenza prenotate · {confirmedCount} questa settimana
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin-pynkstudio/agenda/impostazioni" className="pynk-agenda-settings-link">
            <Settings size={16} /> Impostazioni
          </Link>
          <PushEnableToggle />
        </div>
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

        <div className="pynk-agenda-grid" style={{ gridTemplateColumns: `56px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
          <div className="pynk-agenda-corner" />
          {weekDays.map((d, i) => (
            <div key={i} className="pynk-agenda-dayhead">
              <span>{WEEKDAY_LABELS[d.getDay()]}</span>
              <strong>{d.getDate()}</strong>
            </div>
          ))}

          {timeRows.map((row) => (
            <div key={row} className="pynk-agenda-row" style={{ display: "contents" }}>
              <div className="pynk-agenda-time">{clock(row)}</div>
              {weekDays.map((d, i) => {
                const cellKey = `${toISODate(d)} ${clock(row)}`;
                const items = byCell.get(cellKey) ?? [];
                return (
                  <div key={i} className={`pynk-agenda-cell${items.length > 1 ? " is-multi" : ""}`}>
                    {items.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        className={`pynk-agenda-event${b.status !== "confirmed" ? " is-done" : ""}`}
                        onClick={() => setSelected(b)}
                      >
                        <span className="pynk-agenda-event-name">
                          {b.location === "video" && <Video size={12} aria-label="Videocall" />} {b.name}
                        </span>
                        <span className="pynk-agenda-event-topic">
                          {b.hostId && hostNames.get(b.hostId) ? `con ${hostNames.get(b.hostId)}` : b.topic}
                        </span>
                      </button>
                    ))}
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
              }).format(new Date(selected.startsAt))}
            </p>
            <h3 className="pynk-agenda-modal-name">{selected.name}</h3>
            <p className="pynk-agenda-modal-topic">{selected.topic}</p>
            {selected.hostId && hostNames.get(selected.hostId) && (
              <p className="pynk-agenda-modal-host">
                <Users size={14} /> Assegnata a {hostNames.get(selected.hostId)}
              </p>
            )}
            <div className="pynk-agenda-modal-contacts">
              {selected.phone && <a href={`tel:${selected.phone}`}><Phone size={14} /> {selected.phone}</a>}
              <a href={`mailto:${selected.email}`}><Mail size={14} /> {selected.email}</a>
            </div>
            {selected.status !== "confirmed" && (
              <p className="pynk-agenda-modal-status">
                {selected.status === "completed" ? "Call conclusa" : "Cliente non presentato"}
              </p>
            )}
            {selected.location === "video" && selected.status === "confirmed" && (
              <Link href={`/admin-pynkstudio/agenda/call/${selected.id}`} className="pynk-agenda-modal-join">
                <Video size={16} /> Entra in videocall
              </Link>
            )}
            {selected.status === "confirmed" && (
              <div className="pynk-agenda-modal-actions">
                <button type="button" onClick={() => updateBooking(selected.id, "complete")}>Segna conclusa</button>
                <button type="button" onClick={() => updateBooking(selected.id, "no_show")}>Non presentato</button>
              </div>
            )}
            {selected.status === "confirmed" && (
              <button type="button" className="pynk-agenda-modal-cancel" onClick={() => updateBooking(selected.id, "cancel")}>
                Annulla prenotazione
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
