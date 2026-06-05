import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, X, UserCheck, UserX, Phone, Tag, Users, Briefcase, Clock } from "lucide-react";
import { TENANTS } from "@/lib/tenant-registry";
import { getModuleLabel, getVerticalMeta } from "@/lib/vertical";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  confirmReservation,
  rejectReservation,
  markSeatedReservation,
  markNoShowReservation,
} from "./actions";
import { demoReservations } from "@/lib/demo-fixtures";
import { ReservationSettingsPanel } from "@/components/gestione/reservation-settings-panel";

type Filter = "today" | "upcoming" | "pending" | "confirmed" | "history" | "all";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "today", label: "Oggi" },
  { id: "upcoming", label: "Prossime" },
  { id: "pending", label: "Da gestire" },
  { id: "confirmed", label: "Confermate" },
  { id: "history", label: "Storico" },
  { id: "all", label: "Tutte" },
];

type ReservationRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  covers: number;
  reservation_date: string;
  reservation_time: string;
  notes: string | null;
  status: string;
  table_id: string | null;
  assigned_area: string | null;
  special_request_tags: string[];
  channel: string;
  service_id: string | null;
  duration_minutes: number | null;
  service: { name: string; duration_minutes: number | null } | null;
};

function todayIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
}

function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
}

async function fetchReservations(tenantSlug: string, filter: Filter): Promise<ReservationRow[]> {
  const svc = createSupabaseServiceClient();
  if (!svc) return [];

  let q = svc
    .from("reservation_requests")
    .select(
      "id, customer_name, customer_phone, covers, reservation_date, reservation_time, notes, status, table_id, assigned_area, special_request_tags, channel, service_id, duration_minutes, service:menu_items!reservation_requests_service_id_fkey(name, duration_minutes)",
    )
    .eq("tenant_id", tenantSlug);

  const today = todayIso();
  switch (filter) {
    case "today":
      q = q.eq("reservation_date", today);
      break;
    case "upcoming":
      q = q.gte("reservation_date", today).lte("reservation_date", inDays(30));
      break;
    case "pending":
      q = q.in("status", ["pending_manual", "auto_proposed"]);
      break;
    case "confirmed":
      q = q.eq("status", "confirmed").gte("reservation_date", today);
      break;
    case "history":
      q = q.lt("reservation_date", today);
      break;
    case "all":
    default:
      break;
  }

  const order = filter === "history" ? { ascending: false } : { ascending: true };
  q = q.order("reservation_date", order).order("reservation_time", order);

  const { data, error } = await q.limit(200);
  if (error) return [];
  return (data ?? []) as ReservationRow[];
}

function filterDemoReservations(rows: ReservationRow[], filter: Filter): ReservationRow[] {
  const today = todayIso();
  const max = inDays(30);
  switch (filter) {
    case "today": return rows.filter((r) => r.reservation_date === today);
    case "upcoming": return rows.filter((r) => r.reservation_date >= today && r.reservation_date <= max);
    case "pending": return rows.filter((r) => r.status === "pending_manual" || r.status === "auto_proposed");
    case "confirmed": return rows.filter((r) => r.status === "confirmed" && r.reservation_date >= today);
    case "history": return rows.filter((r) => r.reservation_date < today);
    case "all":
    default: return rows;
  }
}

function statusBadge(status: string): { label: string; tone: "pending" | "ok" | "warn" | "error" | "muted" } {
  switch (status) {
    case "confirmed":
      return { label: "Confermata", tone: "ok" };
    case "seated":
      return { label: "Seduta", tone: "ok" };
    case "pending_manual":
      return { label: "Da gestire", tone: "warn" };
    case "auto_proposed":
      return { label: "Auto-proposta", tone: "warn" };
    case "rejected":
      return { label: "Rifiutata", tone: "error" };
    case "no_show":
      return { label: "No show", tone: "muted" };
    default:
      return { label: status, tone: "muted" };
  }
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" });
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

export default async function PrenotazioniPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ f?: string }>;
}) {
  const { tenantSlug } = await params;
  const { f } = await searchParams;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) return null;

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) notFound();

  const filter: Filter = FILTERS.some((x) => x.id === f) ? (f as Filter) : "today";
  const reservations = auth.isDemo ? filterDemoReservations(demoReservations(tenant.vertical), filter) : await fetchReservations(tenantSlug, filter);
  const isServicesVertical = tenant.vertical === "services";

  const vertical = getVerticalMeta(tenant.vertical);
  const isServices = tenant.vertical === "services";
  const title = getModuleLabel("reservations", tenant.vertical);
  const lead = isServices
    ? `Gestisci le richieste di appuntamento della tua ${vertical.businessNoun}: conferma, sposta o rifiuta.`
    : "Gestisci le prenotazioni della sala: conferma, sposta o rifiuta le richieste.";

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Clienti</span>
        <h1 className="ga-heading">{title}</h1>
        <p className="ga-lead">{lead}</p>
      </header>

      <ReservationSettingsPanel />

      <nav className="ga-pills" aria-label="Filtra prenotazioni">
        {FILTERS.map((opt) => (
          <Link
            key={opt.id}
            href={`?f=${opt.id}`}
            className="ga-pill"
            data-active={opt.id === filter}
          >
            {opt.label}
          </Link>
        ))}
      </nav>

      {reservations.length === 0 ? (
        <div className="ga-empty">
          Nessuna prenotazione in questo intervallo.
        </div>
      ) : (
        <div className="ga-reservation-list">
          {reservations.map((r) => {
            const badge = statusBadge(r.status);
            const isPending = r.status === "pending_manual" || r.status === "auto_proposed";
            const isConfirmed = r.status === "confirmed";

            return (
              <article key={r.id} className="ga-reservation">
                <div className="ga-reservation-when">
                  <span className="ga-reservation-date">{formatDate(r.reservation_date)}</span>
                  <span className="ga-reservation-time">{formatTime(r.reservation_time)}</span>
                </div>

                <div className="ga-reservation-body">
                  <div className="ga-reservation-head">
                    <span className="ga-reservation-name">{r.customer_name}</span>
                    <span className="ga-module-status" data-status={badge.tone}>{badge.label}</span>
                  </div>
                  <div className="ga-reservation-meta">
                    {isServicesVertical && r.service?.name && (
                      <span><Briefcase size={12} strokeWidth={2.2} /> {r.service.name}</span>
                    )}
                    {(r.duration_minutes ?? r.service?.duration_minutes) && (
                      <span><Clock size={12} strokeWidth={2.2} /> {r.duration_minutes ?? r.service?.duration_minutes} min</span>
                    )}
                    {!isServicesVertical && (
                      <span><Users size={12} strokeWidth={2.2} /> {r.covers} {r.covers === 1 ? "persona" : "persone"}</span>
                    )}
                    <span><Phone size={12} strokeWidth={2.2} /> {r.customer_phone}</span>
                    {(r.table_id || r.assigned_area) && (
                      <span><Tag size={12} strokeWidth={2.2} /> {r.assigned_area ?? (isServicesVertical ? "Postazione assegnata" : "Tavolo assegnato")}</span>
                    )}
                  </div>
                  {(r.notes || r.special_request_tags?.length > 0) && (
                    <p className="ga-reservation-notes">
                      {r.special_request_tags?.length > 0 && (
                        <span className="ga-reservation-tags">
                          {r.special_request_tags.map((t) => (
                            <span key={t} className="ga-reservation-tag">{t}</span>
                          ))}
                        </span>
                      )}
                      {r.notes && <span>{r.notes}</span>}
                    </p>
                  )}
                </div>

                <div className="ga-reservation-actions">
                  {isPending && (
                    <>
                      <form action={confirmReservation}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                          <Check size={14} strokeWidth={2.4} /> Conferma
                        </button>
                      </form>
                      <form action={rejectReservation}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                          <X size={14} strokeWidth={2.4} /> Rifiuta
                        </button>
                      </form>
                    </>
                  )}
                  {isConfirmed && (
                    <>
                      <form action={markSeatedReservation}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                          <UserCheck size={14} strokeWidth={2.4} /> Arrivato
                        </button>
                      </form>
                      <form action={markNoShowReservation}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                          <UserX size={14} strokeWidth={2.4} /> No show
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
