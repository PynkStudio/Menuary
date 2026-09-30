"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mail, Phone, Search, X, ChevronRight, ChevronLeft, Building2, Users, MapPin, Clock, Tag, StickyNote,
  Download, Plus, CalendarClock, Megaphone, MessageSquare, PhoneCall, CalendarCheck, Send, Trash2, Sparkles,
} from "lucide-react";
import type { Database } from "@/lib/database.types";
import type { Attribution } from "@/lib/tracking/types";
import {
  CRM_ACTIVITY_LABELS,
  CRM_SIZE_OPTIONS,
  CRM_STATUSES,
  CRM_STATUS_LABELS,
  CRM_TIMING_OPTIONS,
  TEMPERATURE_LABELS,
  describeAttribution,
  employeesLabel,
  leadTemperature,
  sourceLabel,
  type CrmActivityType,
  type CrmStatus,
} from "@/lib/pynkstudio/crm-shared";

type Contact = Omit<Database["public"]["Tables"]["pynkstudio_crm"]["Row"], "status" | "first_attribution" | "last_attribution"> & {
  status: CrmStatus;
  first_attribution: Attribution | null;
  last_attribution: Attribution | null;
};
type Activity = Database["public"]["Tables"]["pynkstudio_crm_activities"]["Row"];

type Stats = {
  all: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  followUpsDue: number;
  newThisWeek: number;
  pipelineValue: number;
  unsubscribed: number;
};

const API = "/api/admin/pynkstudio/crm";

const SORT_OPTIONS = [
  { value: "recent", label: "Ultima attività" },
  { value: "created", label: "Più recenti" },
  { value: "followup", label: "Follow-up" },
  { value: "size", label: "Dimensione azienda" },
  { value: "name", label: "Nome A–Z" },
];

const VIEW_OPTIONS = [
  { value: "all", label: "Tutti i contatti" },
  { value: "followup", label: "Follow-up scaduti" },
  { value: "reachable", label: "Solo raggiungibili" },
  { value: "unsubscribed", label: "Disiscritti" },
];

const ACTIVITY_ICONS: Record<CrmActivityType, typeof Mail> = {
  form: Sparkles,
  booking: CalendarCheck,
  note: StickyNote,
  call: PhoneCall,
  email: Mail,
  whatsapp: MessageSquare,
  status: Tag,
  unsubscribe: X,
  system: Clock,
};

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "adesso";
  if (min < 60) return `${min} min fa`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h fa`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} gg fa`;
  return formatDate(iso);
}

function toDateInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateInput(d.toISOString());
}

function isOverdue(iso: string | null) {
  return !!iso && new Date(iso).getTime() <= Date.now();
}

function splitList(value: string) {
  return value.split(",").map((t) => t.trim()).filter(Boolean);
}

function StatusBadge({ status }: { status: CrmStatus }) {
  return <span className="pynk-crm-badge" data-status={status}>{CRM_STATUS_LABELS[status]}</span>;
}

function TemperatureBadge({ contact }: { contact: Contact }) {
  const t = leadTemperature(contact);
  if (!t) return <span className="pynk-crm-empty-cell">—</span>;
  return <span className="pynk-crm-temp" data-temp={t}>{TEMPERATURE_LABELS[t]}</span>;
}

// ── Drawer ────────────────────────────────────────────────────────────────────

type DrawerProps = {
  contact: Contact;
  onClose: () => void;
  onChanged: (updated: Contact) => void;
  onDeleted: (id: string) => void;
};

type Tab = "scheda" | "attivita" | "origine";

function Drawer({ contact, onClose, onChanged, onDeleted }: DrawerProps) {
  const [tab, setTab] = useState<Tab>("scheda");
  const [form, setForm] = useState({
    name: contact.name,
    phone: contact.phone,
    company: contact.company ?? "",
    employees: employeesLabel(contact) ?? "",
    industry: contact.industry ?? "",
    address: contact.address ?? "",
    work_hours: contact.work_hours ?? "",
    notes: contact.notes ?? "",
    tags: contact.tags.join(", "),
    interests: contact.interests.join(", "),
    timing: contact.timing ?? "",
    plan_interest: contact.plan_interest ?? "",
    status: contact.status,
    next_follow_up: toDateInput(contact.next_follow_up_at),
    estimated_value: contact.estimated_value?.toString() ?? "",
    unsubscribed: !!contact.unsubscribed_at,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [noteType, setNoteType] = useState<"note" | "call" | "email" | "whatsapp">("note");
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const loadActivities = useCallback(async () => {
    try {
      const res = await fetch(`${API}/${contact.id}`, { cache: "no-store" });
      const json = await res.json();
      setActivities(json.activities ?? []);
    } catch {
      setActivities([]);
    }
  }, [contact.id]);

  useEffect(() => { void loadActivities(); }, [loadActivities]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError(null);
    const followUp = form.next_follow_up ? new Date(`${form.next_follow_up}T09:00:00`).toISOString() : null;
    try {
      const res = await fetch(`${API}/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          company: form.company,
          employees: form.employees,
          industry: form.industry,
          address: form.address,
          work_hours: form.work_hours,
          notes: form.notes,
          tags: splitList(form.tags),
          interests: splitList(form.interests),
          timing: form.timing,
          plan_interest: form.plan_interest,
          status: form.status,
          next_follow_up_at: followUp,
          estimated_value: form.estimated_value === "" ? null : Number(form.estimated_value),
          unsubscribed: form.unsubscribed,
        }),
      });
      if (!res.ok) throw new Error();
      // Rilegge la scheda: il server normalizza dimensione, date e stato.
      const fresh = await fetch(`${API}/${contact.id}`, { cache: "no-store" }).then((r) => r.json());
      if (fresh.contact) onChanged(fresh.contact as Contact);
      setActivities(fresh.activities ?? activities);
    } catch {
      setError("Salvataggio fallito. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    try {
      const res = await fetch(`${API}/${contact.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: noteType, body: noteText }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setActivities(json.activities ?? []);
      setNoteText("");
      onChanged({ ...contact, last_activity_at: json.last_activity_at ?? contact.last_activity_at });
    } catch {
      setError("Attività non salvata. Riprova.");
    } finally {
      setNoteSaving(false);
    }
  };

  const remove = async () => {
    const res = await fetch(`${API}/${contact.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(contact.id);
    else setError("Eliminazione fallita.");
  };

  const first = describeAttribution(contact.first_attribution);
  const last = describeAttribution(contact.last_attribution);
  const overdue = isOverdue(contact.next_follow_up_at);

  return (
    <>
      <div className="pynk-crm-overlay" onClick={onClose} aria-hidden />
      <div className="pynk-crm-drawer" role="dialog" aria-modal aria-label={`Scheda: ${contact.name}`}>
        <div className="pynk-crm-drawer-header">
          <div>
            <p className="pynk-crm-drawer-name">{contact.name}</p>
            <div className="pynk-crm-drawer-meta">
              <a href={`mailto:${contact.email}`} className="pynk-crm-drawer-link"><Mail size={13} />{contact.email}</a>
              {contact.phone && <a href={`tel:${contact.phone}`} className="pynk-crm-drawer-link"><Phone size={13} />{contact.phone}</a>}
            </div>
            <div className="pynk-crm-drawer-badges">
              <StatusBadge status={contact.status} />
              <TemperatureBadge contact={contact} />
              {contact.unsubscribed_at && <span className="pynk-crm-flag">Disiscritto</span>}
              {overdue && <span className="pynk-crm-flag" data-tone="warn">Follow-up scaduto</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="pynk-admin-icon-btn" aria-label="Chiudi"><X size={18} /></button>
        </div>

        <div className="pynk-crm-tabs" role="tablist">
          {([["scheda", "Scheda"], ["attivita", `Attività${activities ? ` (${activities.length})` : ""}`], ["origine", "Origine"]] as [Tab, string][]).map(([v, l]) => (
            <button key={v} type="button" role="tab" aria-selected={tab === v} className="pynk-crm-tab" data-active={tab === v} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        <div className="pynk-crm-drawer-body">
          {tab === "scheda" && (
            <>
              <div className="pynk-crm-field-row">
                <div className="pynk-crm-field">
                  <label className="pynk-crm-label">Stato</label>
                  <select className="pynk-admin-select" value={form.status} onChange={set("status")}>
                    {CRM_STATUSES.map((v) => <option key={v} value={v}>{CRM_STATUS_LABELS[v]}</option>)}
                  </select>
                </div>
                <div className="pynk-crm-field">
                  <label className="pynk-crm-label">Valore stimato (€)</label>
                  <input className="pynk-admin-input" type="number" min={0} value={form.estimated_value} onChange={set("estimated_value")} placeholder="Es. 1500" />
                </div>
              </div>

              <div className="pynk-crm-drawer-section">
                <p className="pynk-crm-drawer-section-title"><CalendarClock size={14} /> Prossimo follow-up</p>
                <div className="pynk-crm-followup-row">
                  <input className="pynk-admin-input" type="date" value={form.next_follow_up} onChange={set("next_follow_up")} />
                  <button type="button" className="pynk-crm-chip" onClick={() => setForm((f) => ({ ...f, next_follow_up: inDays(1) }))}>Domani</button>
                  <button type="button" className="pynk-crm-chip" onClick={() => setForm((f) => ({ ...f, next_follow_up: inDays(3) }))}>3 giorni</button>
                  <button type="button" className="pynk-crm-chip" onClick={() => setForm((f) => ({ ...f, next_follow_up: inDays(7) }))}>1 settimana</button>
                  {form.next_follow_up && <button type="button" className="pynk-crm-chip" onClick={() => setForm((f) => ({ ...f, next_follow_up: "" }))}>Nessuno</button>}
                </div>
              </div>

              <div className="pynk-crm-drawer-section">
                <p className="pynk-crm-drawer-section-title">Contatto</p>
                <div className="pynk-crm-field-row">
                  <div className="pynk-crm-field">
                    <label className="pynk-crm-label">Nome</label>
                    <input className="pynk-admin-input" value={form.name} onChange={set("name")} />
                  </div>
                  <div className="pynk-crm-field">
                    <label className="pynk-crm-label">Telefono</label>
                    <input className="pynk-admin-input" value={form.phone} onChange={set("phone")} type="tel" />
                  </div>
                </div>
              </div>

              <div className="pynk-crm-drawer-section">
                <p className="pynk-crm-drawer-section-title"><Building2 size={14} /> Azienda</p>
                <div className="pynk-crm-field">
                  <label className="pynk-crm-label">Nome azienda</label>
                  <input className="pynk-admin-input" value={form.company} onChange={set("company")} placeholder="Es. Acme S.r.l." />
                </div>
                <div className="pynk-crm-field-row">
                  <div className="pynk-crm-field">
                    <label className="pynk-crm-label"><Users size={12} /> Persone in azienda</label>
                    <input className="pynk-admin-input" list="pynk-crm-sizes" value={form.employees} onChange={set("employees")} placeholder="Es. 12 oppure 11–20" />
                    <datalist id="pynk-crm-sizes">{CRM_SIZE_OPTIONS.map((o) => <option key={o} value={o} />)}</datalist>
                  </div>
                  <div className="pynk-crm-field">
                    <label className="pynk-crm-label">Settore</label>
                    <input className="pynk-admin-input" value={form.industry} onChange={set("industry")} placeholder="Es. Manifattura, Retail…" />
                  </div>
                </div>
                <div className="pynk-crm-field">
                  <label className="pynk-crm-label"><MapPin size={12} /> Indirizzo</label>
                  <input className="pynk-admin-input" value={form.address} onChange={set("address")} placeholder="Via Roma 1, Milano" />
                </div>
                <div className="pynk-crm-field">
                  <label className="pynk-crm-label"><Clock size={12} /> Orari di lavoro</label>
                  <input className="pynk-admin-input" value={form.work_hours} onChange={set("work_hours")} placeholder="Lun-Ven 9:00-18:00" />
                </div>
              </div>

              <div className="pynk-crm-drawer-section">
                <p className="pynk-crm-drawer-section-title"><Sparkles size={14} /> Interesse</p>
                <div className="pynk-crm-field">
                  <label className="pynk-crm-label">Di cosa ha bisogno (separati da virgola)</label>
                  <input className="pynk-admin-input" value={form.interests} onChange={set("interests")} placeholder="Es. Formazione team IA, AI Act" />
                </div>
                <div className="pynk-crm-field-row">
                  <div className="pynk-crm-field">
                    <label className="pynk-crm-label">Tempistica</label>
                    <select className="pynk-admin-select" value={form.timing} onChange={set("timing")}>
                      <option value="">Non indicata</option>
                      {CRM_TIMING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      {form.timing && !(CRM_TIMING_OPTIONS as readonly string[]).includes(form.timing) && <option value={form.timing}>{form.timing}</option>}
                    </select>
                  </div>
                  <div className="pynk-crm-field">
                    <label className="pynk-crm-label">Percorso di interesse</label>
                    <input className="pynk-admin-input" value={form.plan_interest} onChange={set("plan_interest")} />
                  </div>
                </div>
              </div>

              <div className="pynk-crm-drawer-section">
                <p className="pynk-crm-drawer-section-title"><Tag size={14} /> Tag</p>
                <input className="pynk-admin-input" value={form.tags} onChange={set("tags")} placeholder="Es. e-commerce, nord-italia, urgente (separati da virgola)" />
                {splitList(form.tags).length > 0 && (
                  <div className="pynk-crm-tags-preview">
                    {splitList(form.tags).map((t) => <span key={t} className="pynk-crm-tag">{t}</span>)}
                  </div>
                )}
              </div>

              <div className="pynk-crm-drawer-section">
                <p className="pynk-crm-drawer-section-title"><StickyNote size={14} /> Note interne</p>
                <textarea className="pynk-admin-textarea" value={form.notes} onChange={set("notes")} rows={5} placeholder="Appunti fissi sul contatto. Per il diario di telefonate e messaggi usa la scheda Attività." />
              </div>

              <label className="pynk-crm-check">
                <input type="checkbox" checked={form.unsubscribed} onChange={(e) => setForm((f) => ({ ...f, unsubscribed: e.target.checked }))} />
                Ha chiesto di non ricevere comunicazioni
              </label>

              <div className="pynk-crm-danger">
                {confirmDelete ? (
                  <>
                    <span>Eliminare il contatto e tutto il suo storico?</span>
                    <button type="button" className="pynk-crm-danger-btn" onClick={remove}>Sì, elimina</button>
                    <button type="button" className="pynk-admin-btn-outline" onClick={() => setConfirmDelete(false)}>No</button>
                  </>
                ) : (
                  <button type="button" className="pynk-crm-danger-link" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Elimina contatto</button>
                )}
              </div>
            </>
          )}

          {tab === "attivita" && (
            <>
              <div className="pynk-crm-composer">
                <div className="pynk-crm-composer-types">
                  {(["note", "call", "email", "whatsapp"] as const).map((t) => (
                    <button key={t} type="button" className="pynk-crm-chip" data-active={noteType === t} onClick={() => setNoteType(t)}>
                      {CRM_ACTIVITY_LABELS[t]}
                    </button>
                  ))}
                </div>
                <textarea className="pynk-admin-textarea" rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Cosa vi siete detti? Esito, prossimi passi…" />
                <button type="button" className="pynk-admin-btn-primary" disabled={noteSaving || !noteText.trim()} onClick={addNote}>
                  <Send size={13} /> {noteSaving ? "Salvo…" : "Aggiungi alla cronologia"}
                </button>
              </div>

              {activities === null ? (
                <p className="pynk-crm-empty">Carico…</p>
              ) : activities.length === 0 ? (
                <p className="pynk-crm-empty">Nessuna attività registrata.</p>
              ) : (
                <ol className="pynk-crm-timeline">
                  {activities.map((a) => {
                    const Icon = ACTIVITY_ICONS[a.type as CrmActivityType] ?? Clock;
                    return (
                      <li key={a.id} className="pynk-crm-timeline-item" data-type={a.type}>
                        <span className="pynk-crm-timeline-icon"><Icon size={13} /></span>
                        <div>
                          <p className="pynk-crm-timeline-title">{a.title}</p>
                          {a.body && <p className="pynk-crm-timeline-body">{a.body}</p>}
                          <p className="pynk-crm-timeline-meta">{formatDateTime(a.created_at)}{a.created_by ? ` · ${a.created_by}` : ""}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </>
          )}

          {tab === "origine" && (
            <>
              <div className="pynk-crm-drawer-section">
                <p className="pynk-crm-drawer-section-title"><Megaphone size={14} /> Come è arrivato</p>
                <div className="pynk-crm-meta-grid">
                  <span>Primo contatto</span><strong>{sourceLabel(contact.source)}</strong>
                  <span>Canale</span><strong>{first.channel}</strong>
                  {first.detail && <><span>Campagna</span><strong>{first.detail}</strong></>}
                  <span>Data</span><strong>{formatDate(contact.created_at)}</strong>
                </div>
                <AttributionDetail attribution={contact.first_attribution} />
              </div>

              {contact.last_attribution && JSON.stringify(contact.last_attribution) !== JSON.stringify(contact.first_attribution) && (
                <div className="pynk-crm-drawer-section">
                  <p className="pynk-crm-drawer-section-title">Ultima richiesta</p>
                  <div className="pynk-crm-meta-grid">
                    <span>Canale</span><strong>{last.channel}</strong>
                    {last.detail && <><span>Campagna</span><strong>{last.detail}</strong></>}
                  </div>
                  <AttributionDetail attribution={contact.last_attribution} />
                </div>
              )}

              <div className="pynk-crm-drawer-section pynk-crm-drawer-section-muted">
                <p className="pynk-crm-drawer-section-title">Storico</p>
                <div className="pynk-crm-meta-grid">
                  <span>Richieste dal sito</span><strong>{contact.submissions_count}</strong>
                  <span>Call prenotate</span><strong>{contact.bookings_count}</strong>
                  <span>Ultima call</span><strong>{formatDate(contact.last_booking_at)}</strong>
                  <span>Ultima attività</span><strong>{formatDate(contact.last_activity_at)}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="pynk-crm-drawer-footer">
          {error && <p className="pynk-crm-drawer-error">{error}</p>}
          <button type="button" onClick={onClose} className="pynk-admin-btn-outline">Chiudi</button>
          {tab === "scheda" && (
            <button type="button" onClick={save} disabled={saving} className="pynk-admin-btn-primary">
              {saving ? "Salvo…" : "Salva modifiche"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function AttributionDetail({ attribution }: { attribution: Attribution | null }) {
  if (!attribution) return <p className="pynk-crm-timeline-meta">Nessun dato di provenienza raccolto (visita diretta o senza consenso al tracciamento).</p>;
  const rows: [string, string | undefined][] = [
    ["utm_source", attribution.utm_source],
    ["utm_medium", attribution.utm_medium],
    ["utm_campaign", attribution.utm_campaign],
    ["utm_term", attribution.utm_term],
    ["utm_content", attribution.utm_content],
    ["Click ID Google", attribution.gclid ?? attribution.gbraid ?? attribution.wbraid],
    ["Click ID Meta", attribution.fbclid],
    ["Click ID Microsoft", attribution.msclkid],
    ["Referrer", attribution.referrer],
    ["Pagina di atterraggio", attribution.landing_path],
  ];
  const filled = rows.filter(([, v]) => v);
  return (
    <div className="pynk-crm-meta-grid pynk-crm-meta-grid-sm">
      {filled.map(([k, v]) => (
        <span key={k} style={{ display: "contents" }}><span>{k}</span><strong className="pynk-crm-break">{v}</strong></span>
      ))}
    </div>
  );
}

// ── Nuovo contatto ────────────────────────────────────────────────────────────

function NewContactModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Contact) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", employees: "", status: "lead" as CrmStatus, notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 409) { setError("Esiste già un contatto con questa email."); return; }
      if (!res.ok) { setError("Servono almeno nome ed email valida."); return; }
      const json = await res.json();
      onCreated(json.contact as Contact);
    } catch {
      setError("Salvataggio fallito. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pynk-agenda-modal-overlay" onClick={onClose}>
      <form className="pynk-agenda-modal pynk-crm-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="pynk-agenda-modal-close" onClick={onClose} aria-label="Chiudi"><X size={18} /></button>
        <p className="pynk-agenda-modal-name">Nuovo contatto</p>
        <div className="pynk-crm-drawer-section">
          <div className="pynk-crm-field-row">
            <div className="pynk-crm-field"><label className="pynk-crm-label">Nome *</label><input className="pynk-admin-input" value={form.name} onChange={set("name")} required /></div>
            <div className="pynk-crm-field"><label className="pynk-crm-label">Email *</label><input className="pynk-admin-input" type="email" value={form.email} onChange={set("email")} required /></div>
          </div>
          <div className="pynk-crm-field-row">
            <div className="pynk-crm-field"><label className="pynk-crm-label">Telefono</label><input className="pynk-admin-input" type="tel" value={form.phone} onChange={set("phone")} /></div>
            <div className="pynk-crm-field"><label className="pynk-crm-label">Azienda</label><input className="pynk-admin-input" value={form.company} onChange={set("company")} /></div>
          </div>
          <div className="pynk-crm-field-row">
            <div className="pynk-crm-field"><label className="pynk-crm-label">Persone in azienda</label><input className="pynk-admin-input" value={form.employees} onChange={set("employees")} placeholder="Es. 12 oppure 11–20" /></div>
            <div className="pynk-crm-field">
              <label className="pynk-crm-label">Stato</label>
              <select className="pynk-admin-select" value={form.status} onChange={set("status")}>
                {CRM_STATUSES.map((v) => <option key={v} value={v}>{CRM_STATUS_LABELS[v]}</option>)}
              </select>
            </div>
          </div>
          <div className="pynk-crm-field"><label className="pynk-crm-label">Note</label><textarea className="pynk-admin-textarea" rows={3} value={form.notes} onChange={set("notes")} /></div>
        </div>
        {error && <p className="pynk-crm-drawer-error">{error}</p>}
        <div className="pynk-crm-drawer-footer" style={{ padding: "14px 0 0", border: "none" }}>
          <button type="button" className="pynk-admin-btn-outline" onClick={onClose}>Annulla</button>
          <button type="submit" className="pynk-admin-btn-primary" disabled={saving}>{saving ? "Salvo…" : "Crea contatto"}</button>
        </div>
      </form>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function PynkCrm() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [creating, setCreating] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryString = useCallback(
    (extra: Record<string, string> = {}) =>
      new URLSearchParams({ q: search, status: statusFilter, source: sourceFilter, sort, view, page: String(page), ...extra }).toString(),
    [search, statusFilter, sourceFilter, sort, view, page],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?${queryString()}`, { cache: "no-store" });
      const data = await res.json();
      setContacts(data.contacts ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 50);
      setStats(data.stats ?? null);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => void load(), search ? 300 : 0);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [load, search]);

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(0); };

  const handleChanged = (updated: Contact) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelected(updated);
    void load();
  };

  const handleDeleted = (id: string) => {
    setSelected(null);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    void load();
  };

  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  const sources = Object.keys(stats?.bySource ?? {}).sort();
  const statusFilters = [
    { value: "all", label: "Tutti", count: stats?.all },
    ...CRM_STATUSES.map((s) => ({ value: s, label: s === "client" ? "Clienti" : s === "lost" ? "Persi" : CRM_STATUS_LABELS[s], count: stats?.byStatus[s] ?? 0 })),
  ];

  return (
    <div>
      <div className="pynk-crm-header">
        <div>
          <h1 className="pynk-admin-page-title">CRM</h1>
          <p className="pynk-admin-page-subtitle">Si aggiorna da form contatti, landing IA in azienda, prenotazioni call e disiscrizioni.</p>
        </div>
        <div className="pynk-crm-header-actions">
          <a className="pynk-admin-btn-outline pynk-crm-btn" href={`${API}/export?${queryString()}`}><Download size={14} /> Esporta CSV</a>
          <button type="button" className="pynk-admin-btn-primary pynk-crm-btn" onClick={() => setCreating(true)}><Plus size={14} /> Nuovo contatto</button>
        </div>
      </div>

      <div className="pynk-admin-kpi-grid pynk-crm-kpis">
        <div className="pynk-admin-kpi"><p className="pynk-admin-kpi-label">Contatti</p><p className="pynk-admin-kpi-value">{stats?.all ?? "—"}</p><p className="pynk-admin-kpi-hint">{stats?.byStatus.client ?? 0} clienti</p></div>
        <div className="pynk-admin-kpi"><p className="pynk-admin-kpi-label">Nuovi in 7 giorni</p><p className="pynk-admin-kpi-value">{stats?.newThisWeek ?? "—"}</p><p className="pynk-admin-kpi-hint">arrivati dal sito o inseriti</p></div>
        <button type="button" className="pynk-admin-kpi pynk-crm-kpi-btn" data-alert={(stats?.followUpsDue ?? 0) > 0} onClick={() => resetPage(setView)(view === "followup" ? "all" : "followup")}>
          <p className="pynk-admin-kpi-label">Follow-up da fare</p><p className="pynk-admin-kpi-value">{stats?.followUpsDue ?? "—"}</p><p className="pynk-admin-kpi-hint">{view === "followup" ? "filtro attivo — clicca per togliere" : "clicca per filtrare"}</p>
        </button>
        <div className="pynk-admin-kpi"><p className="pynk-admin-kpi-label">Valore in pipeline</p><p className="pynk-admin-kpi-value">{stats ? euro.format(stats.pipelineValue) : "—"}</p><p className="pynk-admin-kpi-hint">lead + prospect con stima</p></div>
      </div>

      <div className="pynk-crm-toolbar">
        <div className="pynk-crm-search-wrap">
          <Search size={15} className="pynk-crm-search-icon" />
          <input className="pynk-crm-search" placeholder="Cerca per nome, email, azienda, settore, telefono…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="pynk-crm-search-clear" aria-label="Cancella"><X size={14} /></button>
          )}
        </div>
        <select className="pynk-admin-select pynk-crm-select" value={sourceFilter} onChange={(e) => resetPage(setSourceFilter)(e.target.value)} aria-label="Sorgente">
          <option value="all">Tutte le sorgenti</option>
          {sources.map((s) => <option key={s} value={s}>{sourceLabel(s)} ({stats?.bySource[s]})</option>)}
        </select>
        <select className="pynk-admin-select pynk-crm-select" value={view} onChange={(e) => resetPage(setView)(e.target.value)} aria-label="Vista">
          {VIEW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="pynk-admin-select pynk-crm-select" value={sort} onChange={(e) => resetPage(setSort)(e.target.value)} aria-label="Ordina per">
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="pynk-crm-status-tabs" style={{ marginBottom: 14 }}>
        {statusFilters.map((f) => (
          <button key={f.value} type="button" className="pynk-crm-status-tab" data-active={statusFilter === f.value} onClick={() => resetPage(setStatusFilter)(f.value)}>
            {f.label}{f.count !== undefined && <span className="pynk-crm-status-count">{f.count}</span>}
          </button>
        ))}
      </div>

      <div className="pynk-admin-card pynk-crm-table-wrap">
        {loading && contacts.length === 0 ? (
          <p className="pynk-crm-empty">Carico…</p>
        ) : contacts.length === 0 ? (
          <p className="pynk-crm-empty">Nessun contatto trovato.</p>
        ) : (
          <table className="pynk-crm-table" data-loading={loading}>
            <thead>
              <tr>
                <th>Contatto</th>
                <th>Azienda</th>
                <th>Persone</th>
                <th>Priorità</th>
                <th>Stato</th>
                <th>Origine</th>
                <th>Ultima attività</th>
                <th>Follow-up</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => {
                const channel = describeAttribution(c.first_attribution);
                return (
                  <tr key={c.id} className="pynk-crm-row" onClick={() => setSelected(c)}>
                    <td>
                      <span className="pynk-crm-row-name">{c.name}</span>
                      <span className="pynk-crm-row-sub">{c.email}</span>
                      {c.unsubscribed_at && <span className="pynk-crm-flag">Disiscritto</span>}
                    </td>
                    <td className="pynk-crm-row-secondary">
                      {c.company ?? <span className="pynk-crm-empty-cell">—</span>}
                      {c.industry && <span className="pynk-crm-row-sub">{c.industry}</span>}
                    </td>
                    <td className="pynk-crm-row-secondary">{employeesLabel(c) ?? <span className="pynk-crm-empty-cell">—</span>}</td>
                    <td><TemperatureBadge contact={c} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="pynk-crm-row-secondary">
                      {sourceLabel(c.source)}
                      <span className="pynk-crm-row-sub">{channel.channel}</span>
                    </td>
                    <td className="pynk-crm-row-secondary">
                      {relativeTime(c.last_activity_at)}
                      {c.bookings_count > 0 && <span className="pynk-crm-row-sub">{c.bookings_count} call</span>}
                    </td>
                    <td className="pynk-crm-row-secondary" data-overdue={isOverdue(c.next_follow_up_at)}>
                      {c.next_follow_up_at ? formatDate(c.next_follow_up_at) : <span className="pynk-crm-empty-cell">—</span>}
                    </td>
                    <td className="pynk-crm-row-secondary">
                      <span className="pynk-crm-contacts-cell">
                        {c.phone && <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="pynk-crm-icon-link" aria-label="Chiama"><Phone size={13} /></a>}
                        <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="pynk-crm-icon-link" aria-label="Email"><Mail size={13} /></a>
                        <ChevronRight size={15} className="pynk-crm-row-chevron" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {total > pageSize && (
        <div className="pynk-crm-pager">
          <button type="button" className="pynk-admin-btn-outline pynk-crm-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /> Precedenti</button>
          <span>Pagina {page + 1} di {lastPage + 1} · {total} contatti</span>
          <button type="button" className="pynk-admin-btn-outline pynk-crm-btn" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>Successivi <ChevronRight size={14} /></button>
        </div>
      )}

      {selected && (
        <Drawer key={selected.id} contact={selected} onClose={() => setSelected(null)} onChanged={handleChanged} onDeleted={handleDeleted} />
      )}
      {creating && (
        <NewContactModal
          onClose={() => setCreating(false)}
          onCreated={(c) => { setCreating(false); setSelected(c); void load(); }}
        />
      )}
    </div>
  );
}
