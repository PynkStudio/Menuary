"use client";

import { useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import type { SpecialHourRow } from "@/lib/data/special-hours";
import { SpecialHoursExceptionModal } from "./special-hours-exception-modal";

interface Props {
  tenantId: string;
  initialData: SpecialHourRow[];
  locationId?: string | null;
}

const WEEKDAYS_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "short", day: "2-digit", month: "long", year: "numeric",
  });
}

function itemDescription(item: SpecialHourRow): string {
  if (item.closed) {
    if (item.kind === "single") return "Chiuso";
    if (item.kind === "range") return `Chiuso dal ${formatDate(item.date)} al ${formatDate(item.end_date!)}`;
    return `Chiuso ogni ${WEEKDAYS_SHORT[item.weekday ?? 0]} dal ${formatDate(item.date)} al ${formatDate(item.end_date!)}`;
  }
  const slots = item.slots.join(" · ");
  if (item.kind === "single") return slots;
  if (item.kind === "range") return `Dal ${formatDate(item.date)} al ${formatDate(item.end_date!)} · ${slots}`;
  return `Ogni ${WEEKDAYS_SHORT[item.weekday ?? 0]} dal ${formatDate(item.date)} al ${formatDate(item.end_date!)} · ${slots}`;
}

function itemTitle(item: SpecialHourRow): string {
  if (item.label) return item.label;
  if (item.kind === "single") return formatDate(item.date);
  if (item.kind === "range") return `${formatDate(item.date)} → ${formatDate(item.end_date!)}`;
  return `Ogni ${WEEKDAYS_SHORT[item.weekday ?? 0]} (${formatDate(item.date)} → ${formatDate(item.end_date!)})`;
}

export function SpecialHoursEditor({ tenantId, initialData, locationId }: Props) {
  const [items, setItems] = useState<SpecialHourRow[]>(initialData);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-pork-ink/45 max-w-sm">
          Programma in anticipo festività, chiusure e aperture speciali. Vengono pubblicati su Google Maps come «orario speciale».
        </p>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-pork-cream"
        >
          <Plus size={12} /> Aggiungi eccezione
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-pork-ink/15 p-6 text-center text-sm text-pork-ink/40">
          <CalendarDays size={24} className="mx-auto mb-2 opacity-40" />
          Nessun orario straordinario programmato
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-pork-ink/10 bg-white px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm capitalize">{itemTitle(item)}</span>
                  {item.synced_to_google && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                      Sync ✓
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-pork-ink/50">{itemDescription(item)}</p>
              </div>
              <button
                type="button"
                disabled={deletingId === item.id}
                onClick={() => handleDelete(item.id)}
                className="rounded-xl p-2 text-pork-ink/30 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                aria-label="Elimina eccezione"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SpecialHoursExceptionModal
          tenantId={tenantId}
          locationId={locationId}
          onClose={() => setShowModal(false)}
          onSaved={(item) => {
            setItems((prev) => [...prev, item].sort((a, b) => a.date.localeCompare(b.date)));
          }}
        />
      )}
    </div>
  );
}
