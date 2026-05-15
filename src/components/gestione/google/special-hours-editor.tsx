"use client";

import { useState } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import type { SpecialHourRow } from "@/lib/data/special-hours";

interface Props {
  tenantId: string;
  initialData: SpecialHourRow[];
}

function parseDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

export function SpecialHoursEditor({ tenantId, initialData }: Props) {
  const [items, setItems] = useState<SpecialHourRow[]>(initialData);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: "",
    closed: false,
    label: "",
    slots: [""],
  });

  function updateSlot(i: number, val: string) {
    setForm((f) => {
      const slots = [...f.slots];
      slots[i] = val;
      return { ...f, slots };
    });
  }

  async function handleSave() {
    if (!form.date) return;
    setSaving(true);
    try {
      const slots = form.closed ? [] : form.slots.filter((s) => s.trim());
      const res = await fetch("/api/gestione/google/special-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          date: form.date,
          closed: form.closed,
          slots,
          label: form.label || null,
        }),
      });
      if (res.ok) {
        const newItem: SpecialHourRow = {
          id: crypto.randomUUID(),
          date: form.date,
          closed: form.closed,
          slots,
          label: form.label || null,
          synced_to_google: false,
        };
        setItems((prev) => {
          const filtered = prev.filter((i) => i.date !== form.date);
          return [...filtered, newItem].sort((a, b) => a.date.localeCompare(b.date));
        });
        setForm({ date: "", closed: false, label: "", slots: [""] });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch("/api/gestione/google/special-hours", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, id }),
      });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">
          Orari straordinari
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-pork-cream"
        >
          <Plus size={12} /> Aggiungi data
        </button>
      </div>

      {/* Form nuova eccezione */}
      {showForm && (
        <div className="rounded-2xl border-2 border-pork-red/20 bg-pork-red/5 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">Data</span>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 text-sm outline-none focus:border-pork-red"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">Etichetta (opzionale)</span>
              <input
                type="text"
                value={form.label}
                placeholder="es. Orario natalizio"
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 text-sm outline-none focus:border-pork-red"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.closed}
              className="h-4 w-4 accent-pork-red"
              onChange={(e) => setForm((f) => ({ ...f, closed: e.target.checked }))}
            />
            Chiuso questo giorno
          </label>

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
                    onClick={() => setForm((f) => ({ ...f, slots: f.slots.filter((_, j) => j !== i) }))}
                    className="rounded-xl p-2 text-pork-ink/30 hover:text-pork-red disabled:pointer-events-none disabled:opacity-20"
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

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-pork-ink/50 hover:text-pork-ink"
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={!form.date || saving}
              onClick={handleSave}
              className="rounded-full bg-pork-ink px-4 py-1.5 text-xs font-bold text-pork-cream disabled:opacity-40"
            >
              {saving ? "Salvataggio…" : "Salva eccezione"}
            </button>
          </div>
        </div>
      )}

      {/* Lista eccezioni */}
      {items.length === 0 && !showForm ? (
        <div className="rounded-2xl border-2 border-dashed border-pork-ink/15 p-6 text-center text-sm text-pork-ink/40">
          <CalendarDays size={24} className="mx-auto mb-2 opacity-40" />
          Nessun orario straordinario programmato
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-pork-ink/10 bg-white px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm capitalize">{parseDate(item.date)}</span>
                  {item.label && (
                    <span className="rounded-full bg-pork-ink/5 px-2 py-0.5 text-xs font-medium text-pork-ink/60">
                      {item.label}
                    </span>
                  )}
                  {item.synced_to_google && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                      Sync ✓
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-pork-ink/50">
                  {item.closed ? "Chiuso" : item.slots.join(" · ")}
                </p>
              </div>
              <button
                type="button"
                disabled={deletingId === item.id}
                onClick={() => handleDelete(item.id)}
                className="rounded-xl p-2 text-pork-ink/30 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
