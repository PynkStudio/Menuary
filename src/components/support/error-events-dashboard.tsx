"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AlertOctagon, CheckCircle2, Clock, Filter, RefreshCw, ServerCrash, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformErrorEvent, PlatformErrorSeverity, PlatformErrorStatus } from "@/lib/platform-errors";

const STATUS_LABEL: Record<PlatformErrorStatus, string> = {
  new: "Nuovo",
  triage: "Triage",
  in_progress: "In lavorazione",
  resolved: "Risolto",
  ignored: "Ignorato",
};

const SEVERITY_LABEL: Record<PlatformErrorSeverity, string> = {
  debug: "Debug",
  info: "Info",
  warning: "Warning",
  error: "Errore",
  critical: "Critico",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as PlatformErrorStatus[];
const SEVERITY_OPTIONS = Object.keys(SEVERITY_LABEL) as PlatformErrorSeverity[];

function formatDate(value: string | null | undefined) {
  if (!value) return "mai";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function severityClass(severity: PlatformErrorSeverity) {
  if (severity === "critical") return "bg-red-600 text-white";
  if (severity === "error") return "bg-red-100 text-red-800";
  if (severity === "warning") return "bg-amber-100 text-amber-800";
  if (severity === "info") return "bg-sky-100 text-sky-800";
  return "bg-slate-100 text-slate-700";
}

function sourceLabel(source: PlatformErrorEvent["source"]) {
  if (source === "edge_function") return "Edge";
  if (source === "android_app") return "Android";
  if (source === "cloud_print") return "Cloud print";
  if (source === "gestione") return "Gestione";
  return source.toUpperCase();
}

export function ErrorEventsDashboard({
  initialEvents,
  currentSiteadminId,
  tenantNames,
}: {
  initialEvents: PlatformErrorEvent[];
  currentSiteadminId: string | null;
  tenantNames: Record<string, string>;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [selectedId, setSelectedId] = useState(initialEvents[0]?.id ?? "");
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [busy, setBusy] = useState(false);

  const sources = useMemo(() => Array.from(new Set(events.map((event) => event.source))).sort(), [events]);
  const visible = useMemo(() => {
    return events.filter((event) => {
      if (statusFilter === "active" && (event.status === "resolved" || event.status === "ignored")) return false;
      if (sourceFilter !== "all" && event.source !== sourceFilter) return false;
      return true;
    });
  }, [events, sourceFilter, statusFilter]);
  const selected = events.find((event) => event.id === selectedId) ?? visible[0] ?? events[0] ?? null;
  const activeCount = events.filter((event) => event.status !== "resolved" && event.status !== "ignored").length;
  const criticalCount = events.filter((event) => event.severity === "critical" && event.status !== "resolved" && event.status !== "ignored").length;
  const printCount = events.filter((event) => event.source === "cloud_print" || event.flow.includes("print")).length;

  async function refreshEvents() {
    const response = await fetch("/api/support/error-events/list", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json() as { events?: PlatformErrorEvent[] };
    if (payload.events) {
      setEvents(payload.events);
      setSelectedId((current) => current || payload.events?.[0]?.id || "");
    }
  }

  useEffect(() => {
    window.addEventListener("platform-errors:refresh", refreshEvents as EventListener);
    return () => window.removeEventListener("platform-errors:refresh", refreshEvents as EventListener);
  }, []);

  async function patchEvent(id: string, patch: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch(`/api/support/error-events/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Aggiornamento non riuscito");
      setEvents((prev) => prev.map((event) => event.id === id ? payload.event : event));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="menuary-admin-page-title text-4xl font-semibold text-[var(--menuary-ink)]">
            Registro errori
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--ma-muted)]">
            Punto unico per analizzare errori tecnici e operativi generati da API, edge function, app Android, cloud print, ordini e pannelli gestione.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[34rem]">
          <Metric icon={<ServerCrash size={18} />} label="Attivi" value={activeCount} />
          <Metric icon={<AlertOctagon size={18} />} label="Critici" value={criticalCount} />
          <Metric icon={<RefreshCw size={18} />} label="Stampa" value={printCount} />
        </div>
      </header>

      <section className="grid gap-6 2xl:grid-cols-[minmax(22rem,30rem)_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[var(--ma-line)] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ma-line)] p-3">
            <div className="inline-flex rounded-lg bg-[var(--ma-surface)] p-1">
              {(["active", "all"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatusFilter(item)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-bold",
                    statusFilter === item ? "bg-white text-[var(--ma-ink)] shadow-sm" : "text-[var(--ma-muted)]",
                  )}
                >
                  {item === "active" ? "Attivi" : "Tutti"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-[var(--ma-muted)]">
              <Filter size={14} />
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="rounded-lg border border-[var(--ma-line)] bg-white px-2 py-1 text-xs text-[var(--ma-ink)]"
              >
                <option value="all">Tutte le sorgenti</option>
                {sources.map((source) => (
                  <option key={source} value={source}>{sourceLabel(source)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            {visible.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedId(event.id)}
                className="block w-full border-b border-[var(--ma-line)] p-4 text-left hover:bg-[var(--ma-surface)]"
                data-active={selected?.id === event.id}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", severityClass(event.severity))}>
                    {SEVERITY_LABEL[event.severity]}
                  </span>
                  <span className="rounded-full bg-[var(--ma-surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--ma-muted)]">
                    {sourceLabel(event.source)}
                  </span>
                  <span className="ml-auto text-[11px] font-semibold text-[var(--ma-muted)]">
                    x{event.occurrence_count}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm font-bold text-[var(--ma-ink)]">{event.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--ma-muted)]">{event.message || event.flow}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-semibold text-[var(--ma-muted)]">
                  <span>{event.tenant_id ? tenantNames[event.tenant_id] ?? event.tenant_id : "Piattaforma"}</span>
                  <span>{formatDate(event.last_seen_at)}</span>
                </div>
              </button>
            ))}
            {visible.length === 0 && (
              <div className="p-8 text-center text-sm text-[var(--ma-muted)]">Nessun errore in questa vista.</div>
            )}
          </div>
        </aside>

        <section className="min-h-[40rem] rounded-2xl border border-[var(--ma-line)] bg-white">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-[var(--ma-line)] p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", severityClass(selected.severity))}>
                        {SEVERITY_LABEL[selected.severity]}
                      </span>
                      <span className="rounded-full bg-[var(--ma-accent)]/10 px-2.5 py-1 text-xs font-bold text-[var(--ma-accent)]">
                        {STATUS_LABEL[selected.status]}
                      </span>
                      <span className="rounded-full bg-[var(--ma-surface)] px-2.5 py-1 text-xs font-bold text-[var(--ma-muted)]">
                        {sourceLabel(selected.source)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--ma-ink)]">{selected.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm text-[var(--ma-muted)]">{selected.message || "Nessun messaggio registrato."}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:w-[24rem]">
                    <SelectControl
                      label="Stato"
                      value={selected.status}
                      options={STATUS_OPTIONS}
                      labels={STATUS_LABEL}
                      disabled={busy}
                      onChange={(status) => void patchEvent(selected.id, { status })}
                    />
                    <SelectControl
                      label="Gravità"
                      value={selected.severity}
                      options={SEVERITY_OPTIONS}
                      labels={SEVERITY_LABEL}
                      disabled={busy}
                      onChange={(severity) => void patchEvent(selected.id, { severity })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <section className="space-y-5">
                  <InfoGrid event={selected} tenantNames={tenantNames} />
                  {selected.stack && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold text-[var(--ma-ink)]">Stack trace</h3>
                      <pre className="max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
                        {selected.stack}
                      </pre>
                    </div>
                  )}
                  <div>
                    <h3 className="mb-2 text-sm font-bold text-[var(--ma-ink)]">Metadata</h3>
                    <pre className="max-h-80 overflow-auto rounded-xl border border-[var(--ma-line)] bg-[var(--ma-surface)] p-4 text-xs leading-relaxed text-[var(--ma-ink)]">
                      {JSON.stringify(selected.metadata ?? {}, null, 2)}
                    </pre>
                  </div>
                </section>

                <aside className="space-y-3">
                  <ActionButton
                    icon={<UserCheck size={16} />}
                    disabled={busy || !currentSiteadminId}
                    onClick={() => void patchEvent(selected.id, { assignToMe: true })}
                  >
                    Assegna a me
                  </ActionButton>
                  <ActionButton
                    icon={<Clock size={16} />}
                    disabled={busy}
                    onClick={() => void patchEvent(selected.id, { status: "in_progress" })}
                  >
                    Metti in lavorazione
                  </ActionButton>
                  <ActionButton
                    icon={<CheckCircle2 size={16} />}
                    disabled={busy}
                    onClick={() => void patchEvent(selected.id, { status: "resolved" })}
                  >
                    Segna risolto
                  </ActionButton>
                  <div className="rounded-xl border border-[var(--ma-line)] bg-[var(--ma-surface)] p-4 text-xs leading-relaxed text-[var(--ma-muted)]">
                    Fingerprint<br />
                    <code className="mt-1 block break-all text-[var(--ma-ink)]">{selected.fingerprint}</code>
                  </div>
                </aside>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[40rem] items-center justify-center p-8 text-center text-sm text-[var(--ma-muted)]">
              Nessun evento registrato. Appena un flusso invia un errore, comparirà qui.
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--ma-line)] bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--ma-muted)]">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-3xl font-bold text-[var(--ma-ink)]">{value}</p>
    </div>
  );
}

function SelectControl<T extends string>({
  label,
  value,
  options,
  labels,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  labels: Record<T, string>;
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <label className="space-y-1 text-xs font-bold text-[var(--ma-muted)]">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-xl border border-[var(--ma-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ma-ink)]"
      >
        {options.map((option) => (
          <option key={option} value={option}>{labels[option]}</option>
        ))}
      </select>
    </label>
  );
}

function InfoGrid({ event, tenantNames }: { event: PlatformErrorEvent; tenantNames: Record<string, string> }) {
  const rows = [
    ["Tenant", event.tenant_id ? tenantNames[event.tenant_id] ?? event.tenant_id : "Piattaforma"],
    ["Ambiente", event.environment],
    ["Flusso", event.flow],
    ["Operazione", event.operation ?? "-"],
    ["Codice", event.error_code ?? "-"],
    ["HTTP", event.http_status ? String(event.http_status) : "-"],
    ["Ordine", event.order_id ?? "-"],
    ["Device", event.device_id ?? "-"],
    ["Request ID", event.request_id ?? "-"],
    ["Prima volta", formatDate(event.created_at)],
    ["Ultima volta", formatDate(event.last_seen_at)],
    ["Occorrenze", String(event.occurrence_count)],
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-[var(--ma-line)] bg-white p-3">
          <p className="text-[11px] font-bold uppercase text-[var(--ma-muted)]">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold text-[var(--ma-ink)]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ActionButton({
  children,
  icon,
  disabled,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ma-ink)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--ma-accent)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      {children}
    </button>
  );
}
