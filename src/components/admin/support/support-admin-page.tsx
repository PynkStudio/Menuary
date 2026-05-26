"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Mail, MessageCircle, RefreshCw, Send, Server, UserRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { SupportTicketMessageRow, SupportTicketPriority, SupportTicketRow, SupportTicketStatus } from "@/lib/support/admin";
import { cn } from "@/lib/utils";

type WaStatus = {
  ok: boolean;
  remoteConfigured: boolean;
  state?: "starting" | "qr" | "ready" | "disconnected" | "error";
  ready?: boolean;
  qrDataUrl?: string | null;
  qrText?: string | null;
  updatedAt?: string | null;
  error?: string | null;
};

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  open: "Aperto",
  triage: "Triage",
  waiting_customer: "Attesa cliente",
  in_progress: "In lavorazione",
  resolved: "Risolto",
  closed: "Chiuso",
};

const PRIORITY_LABEL: Record<SupportTicketPriority, string> = {
  low: "Bassa",
  normal: "Normale",
  high: "Alta",
  urgent: "Urgente",
};

const statusOptions = Object.keys(STATUS_LABEL) as SupportTicketStatus[];
const priorityOptions = Object.keys(PRIORITY_LABEL) as SupportTicketPriority[];

function formatDate(value: string | null | undefined) {
  if (!value) return "mai";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function sourceLabel(source: SupportTicketRow["source"]) {
  if (source === "whatsapp_customer_service") return "WhatsApp";
  if (source === "email") return "Email";
  if (source === "gestione") return "Gestione";
  return "Admin";
}

export function SupportAdminPage({
  initialTickets,
  initialMessages,
  tenantNames,
  currentSiteadminId,
}: {
  initialTickets: SupportTicketRow[];
  initialMessages: SupportTicketMessageRow[];
  tenantNames: Record<string, string>;
  currentSiteadminId: string | null;
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [messages, setMessages] = useState(initialMessages);
  const [selectedId, setSelectedId] = useState(initialTickets[0]?.id ?? "");
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [waStatus, setWaStatus] = useState<WaStatus | null>(null);

  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0] ?? null;
  const visibleTickets = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets.filter((ticket) => ticket.status !== "closed" && ticket.status !== "resolved");
  }, [filter, tickets]);
  const selectedMessages = selected ? messages.filter((message) => message.ticket_id === selected.id) : [];
  const activeCount = tickets.filter((ticket) => ticket.status !== "closed" && ticket.status !== "resolved").length;

  async function refreshWaStatus() {
    const response = await fetch("/api/admin/support/wa-status", { cache: "no-store" });
    const payload = (await response.json()) as WaStatus;
    setWaStatus(payload);
  }

  useEffect(() => {
    void refreshWaStatus().catch(() => setWaStatus({ ok: false, remoteConfigured: false, error: "Controllo non disponibile" }));
    const interval = window.setInterval(() => {
      void refreshWaStatus().catch(() => undefined);
    }, 10_000);
    return () => window.clearInterval(interval);
  }, []);

  async function patchTicket(patch: Partial<Pick<SupportTicketRow, "status" | "priority" | "assigned_to_siteadmin_id">>) {
    if (!selected) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${selected.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Aggiornamento non riuscito");
      setTickets((prev) => prev.map((ticket) => ticket.id === selected.id ? payload.ticket : ticket));
    } finally {
      setBusy(false);
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${selected.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: reply, internal: internalNote }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Invio non riuscito");
      setTickets((prev) => prev.map((ticket) => ticket.id === selected.id ? payload.ticket : ticket));
      setMessages((prev) => [...prev, payload.message]);
      setReply("");
      setInternalNote(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="menuary-admin-page-title">Supporto</h1>
          <p className="menuary-admin-page-subtitle">
            Ticket generati da support@menuary.it, support@bizery.it e dal flusso WhatsApp operativo.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[32rem]">
          <div className="rounded-xl border border-[var(--ma-line)] bg-white p-3">
            <p className="text-xs font-semibold uppercase text-[var(--ma-muted)]">Attivi</p>
            <p className="text-2xl font-bold text-[var(--ma-ink)]">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-[var(--ma-line)] bg-white p-3">
            <p className="text-xs font-semibold uppercase text-[var(--ma-muted)]">Totali</p>
            <p className="text-2xl font-bold text-[var(--ma-ink)]">{tickets.length}</p>
          </div>
          <button
            type="button"
            onClick={() => void refreshWaStatus()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--ma-line)] bg-white px-3 py-3 text-sm font-semibold text-[var(--ma-ink)] hover:bg-[var(--ma-surface)]"
          >
            <RefreshCw size={16} /> Stato WA
          </button>
        </div>
      </header>

      <section className="grid gap-6 2xl:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)_24rem]">
        <aside className="rounded-2xl border border-[var(--ma-line)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--ma-line)] p-3">
            <div className="inline-flex rounded-lg bg-[var(--ma-surface)] p-1">
              {(["active", "all"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-bold",
                    filter === item ? "bg-white text-[var(--ma-ink)] shadow-sm" : "text-[var(--ma-muted)]",
                  )}
                >
                  {item === "active" ? "Attivi" : "Tutti"}
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-[var(--ma-muted)]">{visibleTickets.length} ticket</span>
          </div>
          <div className="max-h-[calc(100vh-17rem)] overflow-y-auto">
            {visibleTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                className="block w-full border-b border-[var(--ma-line)] p-4 text-left hover:bg-[var(--ma-surface)]"
                data-active={selected?.id === ticket.id}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-[var(--ma-surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--ma-muted)]">
                    {sourceLabel(ticket.source)}
                  </span>
                  <span className="rounded-full bg-[var(--ma-accent)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--ma-accent)]">
                    {STATUS_LABEL[ticket.status]}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm font-bold text-[var(--ma-ink)]">{ticket.subject || "Senza oggetto"}</p>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--ma-muted)]">{ticket.body}</p>
                <p className="mt-2 text-[11px] font-semibold text-[var(--ma-muted)]">{formatDate(ticket.updated_at)}</p>
              </button>
            ))}
            {visibleTickets.length === 0 && (
              <div className="p-8 text-center text-sm text-[var(--ma-muted)]">Nessun ticket in questa vista.</div>
            )}
          </div>
        </aside>

        <main className="min-h-[36rem] rounded-2xl border border-[var(--ma-line)] bg-white">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-[var(--ma-line)] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--ma-muted)]">
                      <span>{sourceLabel(selected.source)}</span>
                      <span>·</span>
                      <span>{tenantNames[selected.tenant_id ?? ""] ?? selected.tenant_id ?? "Piattaforma"}</span>
                      <span>·</span>
                      <span>{formatDate(selected.created_at)}</span>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--ma-ink)]">{selected.subject || "Richiesta supporto"}</h2>
                    <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm text-[var(--ma-muted)]">{selected.body}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[28rem]">
                    <select
                      value={selected.status}
                      disabled={busy}
                      onChange={(event) => void patchTicket({ status: event.target.value as SupportTicketStatus })}
                      className="rounded-xl border border-[var(--ma-line)] bg-white px-3 py-2 text-sm font-semibold"
                    >
                      {statusOptions.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
                    </select>
                    <select
                      value={selected.priority}
                      disabled={busy}
                      onChange={(event) => void patchTicket({ priority: event.target.value as SupportTicketPriority })}
                      className="rounded-xl border border-[var(--ma-line)] bg-white px-3 py-2 text-sm font-semibold"
                    >
                      {priorityOptions.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABEL[priority]}</option>)}
                    </select>
                    <button
                      type="button"
                      disabled={busy || !currentSiteadminId}
                      onClick={() => void patchTicket({ assigned_to_siteadmin_id: currentSiteadminId })}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--ma-ink)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      <UserRound size={15} /> Prendi
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {selectedMessages.map((message) => (
                  <article
                    key={message.id}
                    className={cn(
                      "max-w-3xl rounded-2xl border p-4",
                      message.direction === "outbound"
                        ? "ml-auto border-[var(--ma-accent)]/25 bg-[var(--ma-accent)]/5"
                        : message.direction === "internal"
                          ? "border-amber-200 bg-amber-50"
                          : "border-[var(--ma-line)] bg-[var(--ma-surface)]",
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-[var(--ma-muted)]">
                      {message.channel === "email" ? <Mail size={13} /> : message.channel === "whatsapp" ? <MessageCircle size={13} /> : <Clock size={13} />}
                      <span>{message.direction === "outbound" ? "Risposta" : message.direction === "internal" ? "Nota interna" : "Messaggio ricevuto"}</span>
                      <span>·</span>
                      <span>{formatDate(message.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-[var(--ma-ink)]">{message.body}</p>
                  </article>
                ))}
                {selectedMessages.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[var(--ma-line)] p-6 text-sm text-[var(--ma-muted)]">
                    Nessuna risposta ancora registrata su questo ticket.
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--ma-line)] p-4">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={4}
                  placeholder={selected.requester_email ? "Scrivi una risposta email..." : "Scrivi una nota interna..."}
                  className="w-full resize-none rounded-xl border border-[var(--ma-line)] p-3 text-sm outline-none focus:border-[var(--ma-accent)]"
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ma-muted)]">
                    <input type="checkbox" checked={internalNote} onChange={(event) => setInternalNote(event.target.checked)} />
                    Nota interna
                  </label>
                  <button
                    type="button"
                    disabled={busy || !reply.trim()}
                    onClick={() => void sendReply()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--ma-accent)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    <Send size={15} /> {internalNote || !selected.requester_email ? "Salva nota" : "Rispondi"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-[var(--ma-muted)]">Seleziona un ticket.</div>
          )}
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--ma-line)] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--ma-ink)]">WhatsApp remoto</h2>
              {waStatus?.ready ? <CheckCircle2 className="text-emerald-600" size={18} /> : <AlertCircle className="text-amber-600" size={18} />}
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[var(--ma-muted)]">
                <Server size={15} />
                <span>{waStatus?.remoteConfigured ? "Endpoint configurato" : "Endpoint non configurato"}</span>
              </div>
              <p className="font-semibold text-[var(--ma-ink)]">
                Stato: {waStatus?.state ?? (waStatus?.ok ? "online" : "non disponibile")}
              </p>
              <p className="text-xs text-[var(--ma-muted)]">Ultimo ping: {formatDate(waStatus?.updatedAt)}</p>
              {waStatus?.error && <p className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{waStatus.error}</p>}
              {(waStatus?.qrDataUrl || waStatus?.qrText) && (
                <div className="rounded-xl border border-[var(--ma-line)] bg-[var(--ma-surface)] p-3">
                  <p className="mb-3 text-xs font-bold uppercase text-[var(--ma-muted)]">Inquadra QR</p>
                  {waStatus.qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={waStatus.qrDataUrl} alt="QR WhatsApp" className="mx-auto h-48 w-48 rounded-lg bg-white p-2" />
                  ) : waStatus.qrText ? (
                    <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg bg-white p-2">
                      <QRCodeSVG value={waStatus.qrText} size={176} />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
