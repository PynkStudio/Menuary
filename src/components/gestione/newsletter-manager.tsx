"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Clock3,
  Mail,
  MousePointerClick,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import type {
  NewsletterDashboardData,
  NewsletterMessage,
  NewsletterMessageKind,
  NewsletterSubscriber,
} from "@/lib/newsletter/types";

type Tab = "overview" | "subscribers" | "campaigns" | "automations";
type SubscriberDraft = Partial<NewsletterSubscriber> & { tagsText?: string };

const emptyData: NewsletterDashboardData = {
  subscribers: [],
  messages: [],
  deliveries: [],
  unsubscribes: [],
  metrics: {
    activeSubscribers: 0,
    unsubscribed: 0,
    sent: 0,
    delivered: 0,
    uniqueOpens: 0,
    uniqueClicks: 0,
    openRate: 0,
    clickRate: 0,
  },
};

function emptyMessage(kind: NewsletterMessageKind, tenantId: string): NewsletterMessage {
  const now = new Date().toISOString();
  return {
    id: "",
    tenantId,
    kind,
    name: kind === "campaign" ? "Nuova campagna" : "Nuova automazione",
    status: kind === "campaign" ? "draft" : "paused",
    triggerKey: kind === "automation" ? "subscriber_joined" : null,
    delayMinutes: 0,
    subject: "",
    preheader: "",
    bodyHtml: "<p>Ciao {{first_name}},</p><p>scrivi qui il contenuto della mail.</p>",
    fromName: "",
    replyTo: "",
    scheduledAt: null,
    sentAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function dateTimeLocal(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

export function NewsletterManager({
  tenantId,
  initialData,
  initialError,
}: {
  tenantId: string;
  initialData?: NewsletterDashboardData;
  initialError?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState(initialData ?? emptyData);
  const [selectedMessage, setSelectedMessage] = useState<NewsletterMessage | null>(null);
  const [subscriberDraft, setSubscriberDraft] = useState<SubscriberDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(initialError ?? null);

  const campaigns = useMemo(() => data.messages.filter((message) => message.kind === "campaign"), [data.messages]);
  const automations = useMemo(() => data.messages.filter((message) => message.kind === "automation"), [data.messages]);

  async function api(payload: Record<string, unknown>) {
    const response = await fetch("/api/gestione/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, ...payload }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error ?? "Operazione non riuscita.");
    return result;
  }

  async function refresh(message?: string) {
    const response = await fetch(`/api/gestione/newsletter?tenantId=${encodeURIComponent(tenantId)}`, { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error ?? "Aggiornamento non riuscito.");
    setData(result);
    setNotice(message ?? null);
  }

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setNotice(null);
    try {
      await task();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Operazione non riuscita.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSubscriber() {
    if (!subscriberDraft?.email) return;
    await run(async () => {
      await api({
        action: "save-subscriber",
        ...subscriberDraft,
        tags: (subscriberDraft.tagsText ?? subscriberDraft.tags?.join(", ") ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setSubscriberDraft(null);
      await refresh("Iscritto aggiornato.");
    });
  }

  async function deleteSubscriber() {
    if (!subscriberDraft?.id || !window.confirm(`Eliminare ${subscriberDraft.email} dalla lista?`)) return;
    await run(async () => {
      await api({ action: "delete-subscriber", id: subscriberDraft.id });
      setSubscriberDraft(null);
      await refresh("Iscritto eliminato.");
    });
  }

  async function saveMessage() {
    if (!selectedMessage) return;
    await run(async () => {
      await api({
        action: "save-message",
        ...selectedMessage,
        scheduledAt: selectedMessage.scheduledAt,
      });
      setSelectedMessage(null);
      await refresh("Messaggio salvato.");
    });
  }

  async function deleteMessage(message: NewsletterMessage) {
    if (!window.confirm(`Eliminare "${message.name}" e le sue statistiche?`)) return;
    await run(async () => {
      await api({ action: "delete-message", id: message.id });
      if (selectedMessage?.id === message.id) setSelectedMessage(null);
      await refresh("Messaggio eliminato.");
    });
  }

  async function sendCampaign(message: NewsletterMessage) {
    if (!window.confirm(`Inviare "${message.name}" a tutti gli iscritti attivi?`)) return;
    await run(async () => {
      const result = await api({ action: "send-campaign", id: message.id });
      await refresh(`Campagna completata: ${result.result?.sent ?? 0} invii.`);
    });
  }

  async function triggerAutomation(message: NewsletterMessage) {
    if (!message.triggerKey || !window.confirm(`Accodare il trigger "${message.triggerKey}" per tutti gli iscritti attivi?`)) return;
    await run(async () => {
      await api({ action: "trigger", triggerKey: message.triggerKey });
      setNotice("Trigger accodato. Il cron newsletter lo elaborerà entro 5 minuti.");
    });
  }

  function metric(label: string, value: string | number, hint: string, icon: ReactNode) {
    return (
      <article className="nl-metric">
        <div><span>{label}</span>{icon}</div>
        <strong>{value}</strong>
        <small>{hint}</small>
      </article>
    );
  }

  function messageList(messages: NewsletterMessage[], kind: NewsletterMessageKind) {
    return (
      <div className="nl-message-layout">
        <aside className="nl-list">
          <button className="nl-primary" type="button" onClick={() => setSelectedMessage(emptyMessage(kind, tenantId))}>
            <Plus size={15} /> {kind === "campaign" ? "Nuova campagna" : "Nuova automazione"}
          </button>
          {messages.map((message) => (
            <button
              className="nl-list-item"
              data-active={selectedMessage?.id === message.id}
              key={message.id}
              type="button"
              onClick={() => setSelectedMessage(message)}
            >
              <span><strong>{message.name}</strong><small>{message.subject || "Senza oggetto"}</small></span>
              <em>{message.status}</em>
            </button>
          ))}
          {!messages.length && <p className="nl-empty">Nessun messaggio configurato.</p>}
        </aside>
        <div>
          {selectedMessage?.kind === kind ? (
            <MessageEditor
              message={selectedMessage}
              busy={busy}
              onChange={setSelectedMessage}
              onDelete={() => selectedMessage.id && deleteMessage(selectedMessage)}
              onSave={saveMessage}
              onSend={() => sendCampaign(selectedMessage)}
              onTrigger={() => triggerAutomation(selectedMessage)}
            />
          ) : (
            <div className="nl-empty nl-empty-large">
              Seleziona un messaggio o creane uno nuovo.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ga-dashboard newsletter-admin">
      <header className="nl-heading-row">
        <div>
          <span className="ga-eyebrow">Pubblico</span>
          <h1 className="ga-heading">Newsletter</h1>
          <p className="ga-lead">Iscritti, campagne, automazioni e performance email in un unico modulo.</p>
        </div>
        <button type="button" className="nl-secondary" disabled={busy} onClick={() => run(() => refresh("Dati aggiornati."))}>
          <RefreshCw size={15} /> Aggiorna
        </button>
      </header>

      {notice && <div className="nl-notice">{notice}</div>}

      <nav className="nl-tabs" aria-label="Sezioni newsletter">
        {([
          ["overview", "Panoramica"],
          ["subscribers", "Iscritti"],
          ["campaigns", "Campagne"],
          ["automations", "Automazioni"],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" data-active={tab === key} onClick={() => { setTab(key); setSelectedMessage(null); }}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <>
          <section className="nl-metrics">
            {metric("Iscritti attivi", data.metrics.activeSubscribers, `${data.metrics.unsubscribed} disiscritti`, <Users size={18} />)}
            {metric("Email inviate", data.metrics.sent, `${data.metrics.delivered} consegnate`, <Mail size={18} />)}
            {metric("Tasso aperture", `${data.metrics.openRate}%`, `${data.metrics.uniqueOpens} aperture uniche`, <Activity size={18} />)}
            {metric("Tasso click", `${data.metrics.clickRate}%`, `${data.metrics.uniqueClicks} click unici`, <MousePointerClick size={18} />)}
          </section>
          <section className="nl-panel">
            <div className="ga-section-head">
              <h2 className="ga-section-title">Attività recente</h2>
              <span className="ga-section-hint">Ultime 500 delivery</span>
            </div>
            <div className="nl-table-wrap">
              <table className="nl-table">
                <thead><tr><th>Destinatario</th><th>Stato</th><th>Aperture</th><th>Click</th><th>Invio</th></tr></thead>
                <tbody>
                  {data.deliveries.slice(0, 30).map((delivery) => (
                    <tr key={delivery.id}>
                      <td>{delivery.recipientEmail}</td>
                      <td><span className="nl-status" data-status={delivery.status}>{delivery.status}</span></td>
                      <td>{delivery.openCount}</td>
                      <td>{delivery.clickCount}</td>
                      <td>{formatDate(delivery.sentAt ?? delivery.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.deliveries.length && <p className="nl-empty">Le statistiche compariranno dopo il primo invio.</p>}
            </div>
          </section>
        </>
      )}

      {tab === "subscribers" && (
        <section className="nl-panel">
          <div className="ga-section-head">
            <div><h2 className="ga-section-title">Lista iscritti</h2><span className="ga-section-hint">{data.subscribers.length} contatti</span></div>
            <button className="nl-primary" type="button" onClick={() => setSubscriberDraft({ status: "active", locale: "it", source: "gestione", tags: [] })}>
              <Plus size={15} /> Aggiungi
            </button>
          </div>
          {subscriberDraft && (
            <div className="nl-subscriber-form">
              <label>Email<input type="email" value={subscriberDraft.email ?? ""} onChange={(event) => setSubscriberDraft({ ...subscriberDraft, email: event.target.value })} /></label>
              <label>Nome<input value={subscriberDraft.name ?? ""} onChange={(event) => setSubscriberDraft({ ...subscriberDraft, name: event.target.value })} /></label>
              <label>Stato<select value={subscriberDraft.status ?? "active"} onChange={(event) => setSubscriberDraft({ ...subscriberDraft, status: event.target.value as NewsletterSubscriber["status"] })}><option value="active">Attivo</option><option value="unsubscribed">Disiscritto</option><option value="bounced">Bounce</option><option value="complained">Spam</option></select></label>
              <label>Tag<input value={subscriberDraft.tagsText ?? subscriberDraft.tags?.join(", ") ?? ""} onChange={(event) => setSubscriberDraft({ ...subscriberDraft, tagsText: event.target.value })} placeholder="lettori, eventi" /></label>
              <div className="nl-form-actions">
                {subscriberDraft.id && <button className="nl-danger" type="button" disabled={busy} onClick={deleteSubscriber}><Trash2 size={15} /> Elimina</button>}
                <span />
                <button type="button" onClick={() => setSubscriberDraft(null)}>Annulla</button>
                <button className="nl-primary" type="button" disabled={busy} onClick={saveSubscriber}><Save size={15} /> Salva</button>
              </div>
            </div>
          )}
          <div className="nl-table-wrap">
            <table className="nl-table">
              <thead><tr><th>Email</th><th>Nome</th><th>Stato</th><th>Sorgente</th><th>Consenso</th></tr></thead>
              <tbody>
                {data.subscribers.map((subscriber) => (
                  <tr key={subscriber.id} onClick={() => setSubscriberDraft({ ...subscriber, tagsText: subscriber.tags.join(", ") })}>
                    <td>{subscriber.email}</td><td>{subscriber.name ?? "—"}</td>
                    <td><span className="nl-status" data-status={subscriber.status}>{subscriber.status}</span></td>
                    <td>{subscriber.source}</td><td>{formatDate(subscriber.consentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="nl-unsubscribe-summary">
            <UserMinus size={17} />
            <span>{data.unsubscribes.length} eventi di disiscrizione registrati.</span>
          </div>
        </section>
      )}

      {tab === "campaigns" && messageList(campaigns, "campaign")}
      {tab === "automations" && messageList(automations, "automation")}
    </div>
  );
}

function MessageEditor({
  message,
  busy,
  onChange,
  onDelete,
  onSave,
  onSend,
  onTrigger,
}: {
  message: NewsletterMessage;
  busy: boolean;
  onChange: (message: NewsletterMessage) => void;
  onDelete: () => void;
  onSave: () => void;
  onSend: () => void;
  onTrigger: () => void;
}) {
  const set = (patch: Partial<NewsletterMessage>) => onChange({ ...message, ...patch });
  return (
    <div className="nl-editor">
      <div className="nl-editor-grid">
        <div className="nl-fields">
          <label>Nome interno<input value={message.name} onChange={(event) => set({ name: event.target.value })} /></label>
          <label>Nome mittente<input value={message.fromName ?? ""} onChange={(event) => set({ fromName: event.target.value })} placeholder="Nome attività o autore" /></label>
          <label>Oggetto<input value={message.subject} onChange={(event) => set({ subject: event.target.value })} placeholder="Ciao {{first_name}}..." /></label>
          <label>Preheader<input value={message.preheader ?? ""} onChange={(event) => set({ preheader: event.target.value })} /></label>
          {message.kind === "campaign" ? (
            <div className="nl-inline-fields">
              <label>Stato<select value={message.status === "scheduled" ? "scheduled" : "draft"} onChange={(event) => set({ status: event.target.value as NewsletterMessage["status"] })}><option value="draft">Bozza</option><option value="scheduled">Programmata</option></select></label>
              <label>Data invio<input type="datetime-local" value={dateTimeLocal(message.scheduledAt)} onChange={(event) => set({ scheduledAt: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label>
            </div>
          ) : (
            <div className="nl-inline-fields">
              <label>Trigger<select value={message.triggerKey ?? "subscriber_joined"} onChange={(event) => set({ triggerKey: event.target.value })}><option value="subscriber_joined">Nuova iscrizione</option><option value="subscriber_left">Disiscrizione</option><option value="new_book">Nuovo libro</option><option value="new_event">Nuovo evento</option></select></label>
              <label>Ritardo (minuti)<input type="number" min={0} value={message.delayMinutes} onChange={(event) => set({ delayMinutes: Number(event.target.value) || 0 })} /></label>
              <label>Stato<select value={message.status === "active" ? "active" : "paused"} onChange={(event) => set({ status: event.target.value as NewsletterMessage["status"] })}><option value="active">Attiva</option><option value="paused">In pausa</option></select></label>
            </div>
          )}
          <label>Corpo HTML<textarea rows={16} value={message.bodyHtml} onChange={(event) => set({ bodyHtml: event.target.value })} /></label>
          <small className="nl-merge-tags">Merge tag: {"{{first_name}}"}, {"{{name}}"}, {"{{email}}"}, {"{{unsubscribe_url}}"}, {"{{current_year}}"}</small>
        </div>
        <div className="nl-preview">
          <span>Anteprima contenuto</span>
          <iframe title="Anteprima newsletter" sandbox="" srcDoc={`<!doctype html><meta charset="utf-8"><style>body{font:15px/1.6 system-ui;padding:24px;color:#222}img{max-width:100%}</style>${message.bodyHtml}`} />
        </div>
      </div>
      <div className="nl-form-actions">
        {message.id && <button type="button" className="nl-danger" onClick={onDelete}><Trash2 size={15} /> Elimina</button>}
        <span />
        <button className="nl-primary" type="button" disabled={busy} onClick={onSave}><Save size={15} /> Salva</button>
        {message.kind === "campaign" && message.id && message.status !== "sent" && (
          <button className="nl-primary" type="button" disabled={busy} onClick={onSend}><Send size={15} /> Invia ora</button>
        )}
        {message.kind === "automation" && message.id && message.status === "active" && ["new_book", "new_event"].includes(message.triggerKey ?? "") && (
          <button className="nl-primary" type="button" disabled={busy} onClick={onTrigger}><Send size={15} /> Avvia trigger</button>
        )}
        {message.kind === "campaign" && message.status === "scheduled" && <small><Clock3 size={14} /> {formatDate(message.scheduledAt)}</small>}
      </div>
    </div>
  );
}
