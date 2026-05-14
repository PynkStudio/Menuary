"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useRestaurantServicesStore } from "@/store/restaurant-services-store";
import { MenuaryAuthHintGate } from "@/components/modules/menu/menuary-auth-hint-gate";

export function ReservationRequestForm() {
  const tenant = useTenant();
  const { modules } = useEffectiveFeatures();
  const addReservation = useRestaurantServicesStore((state) => state.addReservation);
  const setTenantSeed = useRestaurantServicesStore((state) => state.setTenantSeed);
  const currentTenantId = useRestaurantServicesStore((state) => state.currentTenantId);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState({
    customer: "",
    phone: "",
    covers: 2,
    date: "",
    time: "",
    notes: "",
  });

  if (!modules.reservations) return null;

  async function submit() {
    if (!draft.customer.trim() || !draft.phone.trim() || !draft.date.trim() || !draft.time.trim()) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenant.id)}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: draft.customer.trim(),
          customerPhone: draft.phone.trim(),
          covers: Math.max(1, Number(draft.covers) || 1),
          reservationDate: draft.date.trim(),
          reservationTime: draft.time.trim(),
          notes: draft.notes.trim() || undefined,
        }),
      });
      if (res.ok) {
        const j = (await res.json()) as { id?: string; status?: string };
        if (currentTenantId !== tenant.id) setTenantSeed(tenant.id);
        addReservation({
          id: j.id ?? `res-${Date.now().toString(36)}`,
          customer: draft.customer.trim(),
          phone: draft.phone.trim(),
          covers: Math.max(1, Number(draft.covers) || 1),
          date: draft.date.trim(),
          time: draft.time.trim(),
          notes: draft.notes.trim() || undefined,
          status: "nuova",
        });
        setSent(true);
        setDraft({ customer: "", phone: "", covers: 2, date: "", time: "", notes: "" });
        return;
      }
      if (res.status === 503) {
        if (currentTenantId !== tenant.id) setTenantSeed(tenant.id);
        addReservation({
          customer: draft.customer.trim(),
          phone: draft.phone.trim(),
          covers: Math.max(1, Number(draft.covers) || 1),
          date: draft.date.trim(),
          time: draft.time.trim(),
          notes: draft.notes.trim() || undefined,
          status: "nuova",
        });
        setSent(true);
        setDraft({ customer: "", phone: "", covers: 2, date: "", time: "", notes: "" });
        return;
      }
      const err = await res.json().catch(() => ({}));
      setError(typeof err.error === "string" ? err.error : "Invio non riuscito");
    } catch {
      if (currentTenantId !== tenant.id) setTenantSeed(tenant.id);
      addReservation({
        customer: draft.customer.trim(),
        phone: draft.phone.trim(),
        covers: Math.max(1, Number(draft.covers) || 1),
        date: draft.date.trim(),
        time: draft.time.trim(),
        notes: draft.notes.trim() || undefined,
        status: "nuova",
      });
      setSent(true);
      setDraft({ customer: "", phone: "", covers: 2, date: "", time: "", notes: "" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-pork-ink/5">
      <MenuaryAuthHintGate />
      <div className="mt-4 flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-pork-red text-white">
          <CalendarCheck size={22} />
        </div>
        <div>
          <p className="impact-title text-xs text-pork-red">Prenotazione online</p>
          <h2 className="headline text-3xl">Richiedi un tavolo</h2>
        </div>
      </div>

      {sent && (
        <p className="mt-4 rounded-xl bg-pork-green/10 px-4 py-3 text-sm font-bold text-pork-green">
          Richiesta inviata. Lo staff la vede nel pannello prenotazioni.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-pork-red/10 px-4 py-3 text-sm font-bold text-pork-red">{error}</p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input
          value={draft.customer}
          onChange={(event) => setDraft((prev) => ({ ...prev, customer: event.target.value }))}
          placeholder="Nome"
          className="rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
        />
        <input
          value={draft.phone}
          onChange={(event) => setDraft((prev) => ({ ...prev, phone: event.target.value }))}
          placeholder="Telefono"
          className="rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
        />
        <input
          type="date"
          value={draft.date}
          onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
          className="rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
        />
        <div className="grid grid-cols-[1fr_0.7fr] gap-3">
          <input
            type="time"
            value={draft.time}
            onChange={(event) => setDraft((prev) => ({ ...prev, time: event.target.value }))}
            className="rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
          />
          <input
            type="number"
            min={1}
            value={draft.covers}
            onChange={(event) => setDraft((prev) => ({ ...prev, covers: Number(event.target.value) }))}
            className="rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
          />
        </div>
        <textarea
          rows={3}
          value={draft.notes}
          onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder="Note, allergie, preferenze tavolo"
          className="sm:col-span-2 rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
        />
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={() => void submit()}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-2.5 text-sm font-bold text-white hover:bg-pork-red-dark disabled:opacity-60"
      >
        <CalendarCheck size={16} />
        {submitting ? "Invio…" : "Invia richiesta"}
      </button>
    </div>
  );
}
