"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useHydrated } from "@/components/core/providers";
import { useTenant } from "@/components/core/tenant-provider";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { ADMIN_TOKEN_HEADER, getAdminPassword } from "@/lib/admin-auth";
import {
  mapReservationRequestRow,
  type ReservationRequestRow,
} from "@/lib/reservations/map-row";
import {
  type Reservation,
  type ReservationStatus,
  useRestaurantServicesStore,
} from "@/store/restaurant-services-store";

const reservationStatuses: ReservationStatus[] = [
  "nuova",
  "confermata",
  "seduta",
  "no_show",
];

type ReservationDraft = {
  customer: string;
  phone: string;
  covers: number;
  date: string;
  time: string;
  tableLabel: string;
  notes: string;
  status: ReservationStatus;
};

const emptyDraft: ReservationDraft = {
  customer: "",
  phone: "",
  covers: 2,
  date: "",
  time: "",
  tableLabel: "",
  notes: "",
  status: "nuova",
};

function statusClass(status: ReservationStatus) {
  if (status === "confermata") return "bg-pork-green text-white";
  if (status === "seduta") return "bg-pork-ink text-pork-cream";
  if (status === "no_show") return "bg-pork-red text-white";
  return "bg-pork-mustard text-pork-ink";
}

function sortReservations(a: Reservation, b: Reservation) {
  const ad = `${a.date} ${a.time}`;
  const bd = `${b.date} ${b.time}`;
  return ad.localeCompare(bd);
}

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export default function AdminPrenotazioniPage() {
  const hydrated = useHydrated();
  const tenant = useTenant();
  const { modules } = useEffectiveFeatures();
  const store = useRestaurantServicesStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReservationDraft>(emptyDraft);

  useEffect(() => {
    if (!hydrated) return;
    store.setTenantSeed(tenant.id);
  }, [hydrated, store, tenant.id]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tenant/${encodeURIComponent(tenant.id)}/reservations`, {
          headers: { [ADMIN_TOKEN_HEADER]: getAdminPassword() },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { reservations?: ReservationRequestRow[] };
        if (cancelled || !data.reservations?.length) return;
        store.replaceReservations(data.reservations.map(mapReservationRequestRow));
      } catch {
        /* Supabase non configurato o offline: restano i dati seed locali */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, store, tenant.id]);

  const tableOptions = useMemo(
    () => store.roomTables.map((table) => `${table.label} - ${table.area}`),
    [store.roomTables],
  );

  const filteredReservations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...store.reservations]
      .filter((reservation) =>
        statusFilter === "all" ? true : reservation.status === statusFilter,
      )
      .filter((reservation) => {
        if (!q) return true;
        return [
          reservation.customer,
          reservation.phone,
          reservation.date,
          reservation.time,
          reservation.tableLabel,
          reservation.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort(sortReservations);
  }, [query, statusFilter, store.reservations]);

  const editing = editingId
    ? store.reservations.find((reservation) => reservation.id === editingId)
    : undefined;

  function startEdit(reservation: Reservation) {
    setEditingId(reservation.id);
    setDraft({
      customer: reservation.customer,
      phone: reservation.phone,
      covers: reservation.covers,
      date: reservation.date,
      time: reservation.time,
      tableLabel: reservation.tableLabel ?? "",
      notes: reservation.notes ?? "",
      status: reservation.status,
    });
  }

  function resetDraft() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function saveReservation() {
    if (!draft.customer.trim() || !draft.phone.trim() || !draft.date.trim() || !draft.time.trim()) {
      return;
    }

    const payload = {
      customer: draft.customer.trim(),
      phone: draft.phone.trim(),
      covers: Math.max(1, Number(draft.covers) || 1),
      date: draft.date.trim(),
      time: draft.time.trim(),
      tableLabel: draft.tableLabel.trim() || undefined,
      notes: draft.notes.trim() || undefined,
      status: draft.status,
    };

    if (editingId) {
      store.updateReservation(editingId, payload);
      if (isUuid(editingId)) {
        try {
          await fetch(
            `/api/tenant/${encodeURIComponent(tenant.id)}/reservations/${encodeURIComponent(editingId)}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                [ADMIN_TOKEN_HEADER]: getAdminPassword(),
              },
              body: JSON.stringify({
                customer_name: payload.customer,
                customer_phone: payload.phone,
                covers: payload.covers,
                reservation_date: payload.date,
                reservation_time: payload.time,
                notes: payload.notes ?? null,
                status: payload.status,
              }),
            },
          );
        } catch {
          /* ignore */
        }
      }
    } else {
      store.addReservation(payload);
    }
    resetDraft();
  }

  if (!hydrated || store.currentTenantId !== tenant.id) {
    return <p className="text-pork-ink/50">Caricamento prenotazioni...</p>;
  }

  if (!modules.reservations) {
    return (
      <div className="rounded-3xl bg-white p-8 ring-1 ring-pork-ink/10">
        <p className="impact-title text-xs text-pork-red">Modulo non attivo</p>
        <h1 className="headline mt-2 text-4xl">Prenotazioni</h1>
        <p className="mt-2 text-pork-ink/60">
          Il modulo prenotazioni non è incluso nel piano operativo del tenant.
        </p>
      </div>
    );
  }

  const confirmed = store.reservations.filter((reservation) => reservation.status === "confermata").length;
  const seated = store.reservations.filter((reservation) => reservation.status === "seduta").length;
  const covers = store.reservations
    .filter((reservation) => reservation.status !== "no_show")
    .reduce((sum, reservation) => sum + reservation.covers, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="impact-title text-xs text-pork-red">Sala</p>
        <h1 className="headline text-4xl">Prenotazioni</h1>
        <p className="mt-2 max-w-3xl text-pork-ink/60">
          Agenda prenotazioni, assegnazione tavoli, note cliente, coperti e stati operativi.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-pork-ink p-5 text-pork-cream">
          <p className="text-xs font-bold uppercase opacity-60">Totali</p>
          <p className="headline mt-1 text-4xl">{store.reservations.length}</p>
        </div>
        <div className="rounded-3xl bg-pork-green p-5 text-white">
          <p className="text-xs font-bold uppercase opacity-70">Confermate</p>
          <p className="headline mt-1 text-4xl">{confirmed}</p>
        </div>
        <div className="rounded-3xl bg-pork-red p-5 text-white">
          <p className="text-xs font-bold uppercase opacity-70">Sedute</p>
          <p className="headline mt-1 text-4xl">{seated}</p>
        </div>
        <div className="rounded-3xl bg-pork-mustard p-5 text-pork-ink">
          <p className="text-xs font-bold uppercase opacity-60">Coperti attesi</p>
          <p className="headline mt-1 text-4xl">{covers}</p>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.45fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-pork-ink/5">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-pork-cream px-3 py-2">
              <Search size={16} className="text-pork-ink/50" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cerca nome, telefono, note..."
                className="w-full bg-transparent outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | ReservationStatus)
              }
              className="rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-sm font-bold outline-none"
            >
              <option value="all">Tutti gli stati</option>
              {reservationStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filteredReservations.map((reservation) => (
              <article
                key={reservation.id}
                className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-pork-ink">{reservation.customer}</h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(
                          reservation.status,
                        )}`}
                      >
                        {reservation.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-pork-ink/60">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={14} /> {reservation.date} · {reservation.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={14} /> {reservation.covers} coperti
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone size={14} /> {reservation.phone}
                      </span>
                    </div>
                    {reservation.tableLabel && (
                      <p className="mt-2 text-sm font-bold text-pork-red">
                        {reservation.tableLabel}
                      </p>
                    )}
                    {reservation.notes && (
                      <p className="mt-2 text-sm text-pork-ink/55">
                        {reservation.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <select
                      value={reservation.status}
                      onChange={(event) =>
                        store.updateReservationStatus(
                          reservation.id,
                          event.target.value as ReservationStatus,
                        )
                      }
                      className="rounded-xl border-2 border-pork-ink/10 bg-pork-cream px-2 py-1.5 text-xs font-bold outline-none"
                    >
                      {reservationStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => startEdit(reservation)}
                      className="rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-pork-cream hover:bg-pork-red"
                    >
                      Modifica
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Eliminare la prenotazione di ${reservation.customer}?`)) {
                          store.removeReservation(reservation.id);
                          if (editingId === reservation.id) resetDraft();
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-pork-red/30 px-2.5 py-1.5 text-pork-red hover:bg-pork-red hover:text-white"
                      aria-label="Elimina prenotazione"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10 xl:sticky xl:top-24 xl:self-start">
          <div className="mb-5 flex items-center gap-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pork-red text-white">
              {editing ? <CalendarCheck size={18} /> : <Plus size={18} />}
            </div>
            <div>
              <p className="impact-title text-xs text-pork-red">
                {editing ? "Modifica" : "Nuova prenotazione"}
              </p>
              <h2 className="font-black text-pork-ink">
                {editing ? editing.customer : "Inserisci richiesta"}
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                Nome cliente
              </span>
              <input
                value={draft.customer}
                onChange={(event) => setDraft((prev) => ({ ...prev, customer: event.target.value }))}
                className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                Telefono
              </span>
              <input
                value={draft.phone}
                onChange={(event) => setDraft((prev) => ({ ...prev, phone: event.target.value }))}
                className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
              />
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                  Data
                </span>
                <input
                  value={draft.date}
                  onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
                  placeholder="oggi"
                  className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                  Ora
                </span>
                <input
                  type="time"
                  value={draft.time}
                  onChange={(event) => setDraft((prev) => ({ ...prev, time: event.target.value }))}
                  className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                  Coperti
                </span>
                <input
                  type="number"
                  min={1}
                  value={draft.covers}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, covers: Number(event.target.value) }))
                  }
                  className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                Tavolo o area
              </span>
              <input
                list="reservation-table-options"
                value={draft.tableLabel}
                onChange={(event) => setDraft((prev) => ({ ...prev, tableLabel: event.target.value }))}
                className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
              />
              <datalist id="reservation-table-options">
                {tableOptions.map((table) => (
                  <option key={table} value={table} />
                ))}
              </datalist>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                Stato
              </span>
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    status: event.target.value as ReservationStatus,
                  }))
                }
                className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
              >
                {reservationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-pork-ink/50">
                Note
              </span>
              <textarea
                rows={4}
                value={draft.notes}
                onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 outline-none focus:border-pork-red"
              />
            </label>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={saveReservation}
                className="inline-flex items-center gap-2 rounded-full bg-pork-red px-4 py-2 text-sm font-bold text-white hover:bg-pork-red-dark"
              >
                <CheckCircle2 size={16} />
                {editing ? "Salva modifiche" : "Crea prenotazione"}
              </button>
              <button
                type="button"
                onClick={resetDraft}
                className="rounded-full border border-pork-ink/15 px-4 py-2 text-sm font-bold text-pork-ink/60 hover:text-pork-red"
              >
                Annulla
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
