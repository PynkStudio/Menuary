"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, X } from "lucide-react";
import type { SpecialHourKind, SpecialHourRow } from "@/lib/data/special-hours";
import { bodyScrollLock, bodyScrollUnlock } from "@/lib/body-scroll-lock";

const WEEKDAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  tenantId: string;
  locationId?: string | null;
  onClose: () => void;
  onSaved: (item: SpecialHourRow) => void;
}

type FormState = {
  kind: SpecialHourKind;
  date: string;
  end_date: string;
  weekday: number;
  closed: boolean;
  label: string;
  slots: string[];
};

const INIT: FormState = {
  kind: "single",
  date: "",
  end_date: "",
  weekday: 0,
  closed: false,
  label: "",
  slots: [""],
};

export function SpecialHoursExceptionModal({ tenantId, locationId, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(INIT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    bodyScrollLock();
    return () => bodyScrollUnlock();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function updateSlot(i: number, val: string) {
    setForm((f) => {
      const slots = [...f.slots];
      slots[i] = val;
      return { ...f, slots };
    });
  }

  function removeSlot(i: number) {
    setForm((f) => ({ ...f, slots: f.slots.filter((_, j) => j !== i) }));
  }

  async function handleSave() {
    if (!form.date) return;
    if ((form.kind === "range" || form.kind === "weekly-in-range") && !form.end_date) {
      setError("Inserisci la data di fine.");
      return;
    }
    if (form.end_date && form.end_date <= form.date) {
      setError("La data di fine deve essere successiva a quella di inizio.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const slots = form.closed ? [] : form.slots.filter((s) => s.trim());
      const body = {
        tenantId,
        locationId: locationId ?? null,
        date: form.date,
        end_date: form.kind !== "single" ? form.end_date : null,
        weekday: form.kind === "weekly-in-range" ? form.weekday : null,
        kind: form.kind,
        closed: form.closed,
        slots,
        label: form.label || null,
      };

      const res = await fetch("/api/gestione/google/special-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Errore nel salvataggio");
        return;
      }

      const newItem: SpecialHourRow = {
        id: crypto.randomUUID(),
        date: body.date,
        end_date: body.end_date,
        weekday: body.weekday,
        kind: body.kind,
        closed: body.closed,
        slots: body.slots,
        label: body.label,
        location_id: body.locationId,
        synced_to_google: false,
      };
      onSaved(newItem);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  const kindLabel: Record<SpecialHourKind, string> = {
    single: "Data singola",
    range: "Intervallo di date",
    "weekly-in-range": "Ogni giorno della settimana in un intervallo",
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[90] flex items-end justify-center bg-pork-ink/70 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-pork-cream shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <p className="impact-title text-xs text-pork-red">Orari straordinari</p>
            <h2 className="headline text-xl">Aggiungi eccezione</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-pork-ink/40 hover:bg-pork-ink/5 hover:text-pork-ink"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body scrollabile */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {/* Tipo eccezione */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {(["single", "range", "weekly-in-range"] as SpecialHourKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, kind: k }))}
                  className={
                    form.kind === k
                      ? "rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-pork-cream"
                      : "rounded-full border-2 border-pork-ink/15 px-3 py-1.5 text-xs font-bold text-pork-ink/60 hover:border-pork-ink/40"
                  }
                >
                  {kindLabel[k]}
                </button>
              ))}
            </div>
          </div>

          {/* Selezione giorno (weekly-in-range) */}
          {form.kind === "weekly-in-range" && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">Giorno della settimana</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, weekday: i }))}
                    className={
                      form.weekday === i
                        ? "rounded-full bg-pork-red px-3 py-1.5 text-xs font-bold text-white"
                        : "rounded-full border-2 border-pork-ink/15 px-3 py-1.5 text-xs font-bold text-pork-ink/60 hover:border-pork-ink/40"
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div className={`grid gap-3 ${form.kind !== "single" ? "sm:grid-cols-2" : ""}`}>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">
                {form.kind === "single" ? "Data" : "Dal"}
              </span>
              <input
                type="date"
                value={form.date}
                min={todayLocal()}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 text-sm outline-none focus:border-pork-red"
              />
            </label>

            {form.kind !== "single" && (
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">Al</span>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.date || todayLocal()}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 text-sm outline-none focus:border-pork-red"
                />
              </label>
            )}
          </div>

          {/* Etichetta */}
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">
              Etichetta <span className="font-normal normal-case opacity-60">(opzionale)</span>
            </span>
            <input
              type="text"
              value={form.label}
              placeholder="es. Orario natalizio, Festa patronale…"
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 text-sm outline-none focus:border-pork-red"
            />
          </label>

          {/* Chiuso */}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.closed}
              className="h-4 w-4 accent-pork-red"
              onChange={(e) => setForm((f) => ({ ...f, closed: e.target.checked }))}
            />
            Chiuso {form.kind === "single" ? "questo giorno" : "in questo periodo"}
          </label>

          {/* Fasce orarie */}
          {!form.closed && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">Fasce orarie</p>
              {form.slots.map((slot, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={slot}
                    placeholder="es. 19:00 – 02:00"
                    onChange={(e) => updateSlot(i, e.target.value)}
                    className="flex-1 rounded-xl border-2 border-pork-ink/10 px-3 py-2 text-sm outline-none focus:border-pork-red"
                  />
                  <button
                    type="button"
                    disabled={form.slots.length <= 1}
                    onClick={() => removeSlot(i)}
                    className="rounded-xl p-2 text-pork-ink/30 hover:text-pork-red disabled:pointer-events-none disabled:opacity-20"
                    aria-label="Rimuovi fascia"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, slots: [...f.slots, ""] }))}
                className="inline-flex items-center gap-1 text-xs font-bold text-pork-red"
              >
                <Plus size={13} /> Aggiungi fascia
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">{error}</p>
          )}
        </div>

        {/* Footer fisso */}
        <div className="flex justify-end gap-2 border-t border-pork-ink/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-bold text-pork-ink/50 hover:text-pork-ink"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={!form.date || saving}
            onClick={handleSave}
            className="rounded-full bg-pork-ink px-5 py-2 text-sm font-bold text-pork-cream disabled:opacity-40"
          >
            {saving ? "Salvataggio…" : "Salva eccezione"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
