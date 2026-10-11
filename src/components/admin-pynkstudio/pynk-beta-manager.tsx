"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ClipboardCopy, ExternalLink, FlaskConical, Plus, Search, Send, Trash2, X } from "lucide-react";
import type { Database } from "@/lib/database.types";
import {
  BETA_CATEGORIES,
  BETA_DEVICES,
  BETA_KINDS,
  BETA_LANGUAGES,
  BETA_METHODS,
  BETA_STATUSES,
  BETA_WEB_DEVICE,
  betaCategoryLabel,
  betaDeviceLabel,
  betaKindLabel,
  betaMethodInfo,
  betaStatusLabel,
  cleanBetaChannels,
  type BetaChannel,
  type BetaMethod,
} from "@/lib/pynkstudio/beta-shared";

const API = "/api/admin/pynkstudio/beta";

type BetaRow = Database["public"]["Tables"]["pynkstudio_betas"]["Row"];
type RequestRow = Database["public"]["Tables"]["pynkstudio_beta_requests"]["Row"];
type TesterRow = Omit<Database["public"]["Tables"]["pynkstudio_beta_testers"]["Row"], "access_token" | "consent_at" | "updated_at" | "locale">;

type Payload = {
  betas: BetaRow[];
  testers: TesterRow[];
  requests: RequestRow[];
  notifiedByBeta: Record<string, number>;
};

type Tab = "betas" | "requests" | "testers";

const ERRORS: Record<string, string> = {
  name_required: "Il nome è obbligatorio.",
  slug_exists: "Esiste già una beta con questo slug.",
  invalid_slug: "Slug non valido.",
  beta_not_open: "Gli avvisi partono solo per le beta in stato «Aperta».",
};

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function deviceOptions() {
  return [{ id: BETA_WEB_DEVICE, label: betaDeviceLabel(BETA_WEB_DEVICE) }, ...BETA_DEVICES];
}

function defaultMethod(device: string): BetaMethod {
  if (device === BETA_WEB_DEVICE) return "web";
  if (["iphone", "ipad", "mac", "apple_watch", "apple_tv", "vision_pro"].includes(device)) return "testflight";
  if (["android_phone", "android_tablet", "android_tv", "wear_os", "android_auto", "chromebook"].includes(device)) return "play_open";
  return "download";
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function StatusBadge({ status }: { status: string }) {
  return <span className="pynk-beta-admin-badge" data-status={status}>{betaStatusLabel(status)}</span>;
}

type EditorForm = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  icon_url: string;
  category: string;
  kind: string;
  version: string;
  status: string;
  languages: string[];
  ends_at: string;
  feedback_url: string;
  channels: BetaChannel[];
};

function toForm(b: BetaRow | null): EditorForm {
  return {
    name: b?.name ?? "",
    slug: b?.slug ?? "",
    tagline: b?.tagline ?? "",
    description: b?.description ?? "",
    icon_url: b?.icon_url ?? "",
    category: b?.category ?? "altro",
    kind: b?.kind ?? "new",
    version: b?.version ?? "",
    status: b?.status ?? "draft",
    languages: b?.languages ?? ["it"],
    ends_at: b?.ends_at ? b.ends_at.slice(0, 10) : "",
    feedback_url: b?.feedback_url ?? "",
    channels: b ? cleanBetaChannels(b.channels) : [],
  };
}

function BetaEditor({
  beta,
  notified,
  approved,
  onClose,
  onSaved,
  onDeleted,
}: {
  beta: BetaRow | null;
  notified: number;
  approved: number;
  onClose: () => void;
  onSaved: (b: BetaRow) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState<EditorForm>(() => toForm(beta));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notifyInfo, setNotifyInfo] = useState<string>("");
  const [targets, setTargets] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const set = <K extends keyof EditorForm>(k: K, v: EditorForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setChannel = (i: number, patch: Partial<BetaChannel>) =>
    set("channels", form.channels.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const usedDevices = new Set(form.channels.map((c) => c.device));
  const freeDevice = deviceOptions().find((d) => !usedDevices.has(d.id))?.id;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(beta ? `${API}/${beta.id}` : API, {
        method: beta ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(ERRORS[data.error] ?? "Salvataggio non riuscito.");
      onSaved(data.beta);
    } catch {
      setError("Salvataggio non riuscito.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!beta || !window.confirm(`Eliminare «${beta.name}»? Si perdono anche richieste e storico avvisi.`)) return;
    const res = await fetch(`${API}/${beta.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(beta.id);
  };

  const notify = async (dryRun: boolean) => {
    if (!beta) return;
    setError("");
    setNotifyInfo("");
    if (!dryRun) setSending(true);
    try {
      const res = await fetch(`${API}/${beta.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (!res.ok) return setError(ERRORS[data.error] ?? "Operazione non riuscita.");
      if (dryRun) setTargets(data.targets);
      else {
        setTargets(null);
        setNotifyInfo(`Inviati ${data.sent} avvisi${data.failed ? `, ${data.failed} non riusciti` : ""}.`);
      }
    } finally {
      setSending(false);
    }
  };

  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(beta));

  return (
    <>
      <div className="pynk-crm-overlay" onClick={onClose} aria-hidden />
      <div className="pynk-crm-drawer" role="dialog" aria-modal aria-label={beta ? `Beta: ${beta.name}` : "Nuova beta"}>
        <div className="pynk-crm-drawer-header">
          <div>
            <p className="pynk-crm-drawer-name">{beta ? beta.name : "Nuova beta"}</p>
            {beta && (
              <div className="pynk-crm-drawer-badges">
                <StatusBadge status={beta.status} />
                <span className="pynk-crm-flag">{notified} avvisati</span>
                <span className="pynk-crm-flag">{approved} richieste approvate</span>
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} className="pynk-admin-icon-btn" aria-label="Chiudi"><X size={18} /></button>
        </div>

        <div className="pynk-crm-drawer-body">
          <div className="pynk-crm-field-row">
            <div className="pynk-crm-field">
              <label className="pynk-crm-label">Nome app</label>
              <input className="pynk-admin-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Es. Are You Stupid?!" />
            </div>
            <div className="pynk-crm-field">
              <label className="pynk-crm-label">Slug</label>
              <input className="pynk-admin-input" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="generato dal nome" />
            </div>
          </div>
          <div className="pynk-crm-field">
            <label className="pynk-crm-label">Frase breve</label>
            <input className="pynk-admin-input" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Il party game con il presentatore AI" />
          </div>
          <div className="pynk-crm-field">
            <label className="pynk-crm-label">Descrizione e cosa testare</label>
            <textarea className="pynk-admin-textarea" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="pynk-crm-field-row">
            <div className="pynk-crm-field">
              <label className="pynk-crm-label">Stato</label>
              <select className="pynk-admin-select" value={form.status} onChange={(e) => set("status", e.target.value)}>
                {BETA_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="pynk-crm-field">
              <label className="pynk-crm-label">Tipo</label>
              <select className="pynk-admin-select" value={form.kind} onChange={(e) => set("kind", e.target.value)}>
                {BETA_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </div>
          </div>
          <div className="pynk-crm-field-row">
            <div className="pynk-crm-field">
              <label className="pynk-crm-label">Categoria</label>
              <select className="pynk-admin-select" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {BETA_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="pynk-crm-field">
              <label className="pynk-crm-label">Versione</label>
              <input className="pynk-admin-input" value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="1.2.0 (9)" />
            </div>
          </div>
          <div className="pynk-crm-field">
              <label className="pynk-crm-label">Lingue dell&apos;app</label>
            <div className="pynk-beta-admin-chips">
              {BETA_LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="pynk-crm-chip"
                  data-active={form.languages.includes(l.id)}
                  onClick={() => set("languages", form.languages.includes(l.id) ? form.languages.filter((x) => x !== l.id) : [...form.languages, l.id])}
                >
                  {form.languages.includes(l.id) && <Check size={12} />} {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="pynk-crm-field-row">
            <div className="pynk-crm-field">
              <label className="pynk-crm-label">Icona (URL https)</label>
              <input className="pynk-admin-input" value={form.icon_url} onChange={(e) => set("icon_url", e.target.value)} placeholder="https://…/icon.png" />
            </div>
            <div className="pynk-crm-field">
              <label className="pynk-crm-label">Termina il</label>
              <input className="pynk-admin-input" type="date" value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} />
            </div>
          </div>
          <div className="pynk-crm-field">
            <label className="pynk-crm-label">Feedback (link o email)</label>
            <input className="pynk-admin-input" value={form.feedback_url} onChange={(e) => set("feedback_url", e.target.value)} placeholder="https://… oppure feedback@pynkstudio.eu" />
          </div>

          <div className="pynk-crm-drawer-section">
            <p className="pynk-crm-drawer-section-title">Canali per dispositivo</p>
            {form.channels.length === 0 && <p className="pynk-crm-row-secondary">Aggiungi almeno un canale: senza canali la beta non compare a nessuno.</p>}
            {form.channels.map((ch, i) => {
              const method = betaMethodInfo(ch.method);
              return (
                <div key={i} className="pynk-beta-admin-channel">
                  <div className="pynk-crm-field-row">
                    <select className="pynk-admin-select" value={ch.device} onChange={(e) => setChannel(i, { device: e.target.value, method: defaultMethod(e.target.value) })} aria-label="Dispositivo">
                      {deviceOptions().filter((d) => d.id === ch.device || !usedDevices.has(d.id)).map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                    <select className="pynk-admin-select" value={ch.method} onChange={(e) => setChannel(i, { method: e.target.value as BetaMethod })} aria-label="Metodo">
                      {BETA_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                  </div>
                  <input className="pynk-admin-input" value={ch.url} onChange={(e) => setChannel(i, { url: e.target.value })} placeholder={method.id.startsWith("testflight") ? "https://testflight.apple.com/join/…" : method.id.startsWith("play") ? "https://play.google.com/apps/testing/…" : "https://…"} aria-label="Link" />
                  <input className="pynk-admin-input" value={ch.notes ?? ""} onChange={(e) => setChannel(i, { notes: e.target.value })} placeholder="Nota per il tester (facoltativa)" aria-label="Nota" />
                  <div className="pynk-beta-admin-channel-foot">
                    <span className="pynk-crm-row-secondary">
                      {method.needsApproval ? `Su richiesta: il tester indica l'account ${method.account === "apple" ? "Apple ID" : "Google"}, il link si sblocca dopo l'approvazione.` : "Link visibile subito agli iscritti con questo dispositivo."}
                    </span>
                    <button type="button" className="pynk-admin-icon-btn" onClick={() => set("channels", form.channels.filter((_, idx) => idx !== i))} aria-label="Rimuovi canale"><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
            {freeDevice && (
              <button type="button" className="pynk-admin-btn-outline pynk-crm-btn" onClick={() => set("channels", [...form.channels, { device: freeDevice, method: defaultMethod(freeDevice), url: "" }])}>
                <Plus size={14} /> Aggiungi canale
              </button>
            )}
          </div>

          {beta && (
            <div className="pynk-crm-drawer-section">
              <p className="pynk-crm-drawer-section-title"><Send size={14} /> Avvisi email</p>
              <p className="pynk-crm-row-secondary">
                Va ai tester con email confermata, avvisi attivi, almeno un dispositivo compatibile e filtri d&apos;interesse soddisfatti. Chi è già stato avvisato per questa beta non riceve doppioni.
                {beta.notified_at && ` Ultimo invio: ${formatDate(beta.notified_at)}.`}
              </p>
              {dirty && <p className="pynk-crm-drawer-error">Salva le modifiche prima di inviare gli avvisi.</p>}
              <div className="pynk-beta-admin-row">
                <button type="button" className="pynk-admin-btn-outline pynk-crm-btn" disabled={dirty || beta.status !== "open"} onClick={() => notify(true)}>Conta destinatari</button>
                {targets !== null && (
                  <button type="button" className="pynk-admin-btn-primary pynk-crm-btn" disabled={dirty || sending || targets === 0} onClick={() => notify(false)}>
                    {sending ? "Invio…" : `Invia a ${targets} tester`}
                  </button>
                )}
              </div>
              {notifyInfo && <p className="pynk-crm-row-secondary">{notifyInfo}</p>}
            </div>
          )}

          {error && <p className="pynk-crm-drawer-error">{error}</p>}
        </div>

        <div className="pynk-crm-drawer-footer">
          {beta ? <button type="button" className="pynk-admin-btn-outline pynk-crm-btn" onClick={remove}><Trash2 size={14} /> Elimina</button> : <span />}
          <button type="button" className="pynk-admin-btn-primary pynk-crm-btn" disabled={saving || !dirty} onClick={save}>{saving ? "Salvo…" : "Salva"}</button>
        </div>
      </div>
    </>
  );
}

export function PynkBetaManager() {
  const [data, setData] = useState<Payload | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<Tab>("betas");
  const [editing, setEditing] = useState<BetaRow | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [requestBeta, setRequestBeta] = useState("all");
  const [requestStatus, setRequestStatus] = useState("pending");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(API, { cache: "no-store" });
    if (!res.ok) return setLoadError(true);
    setLoadError(false);
    setData(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const testersById = useMemo(() => new Map((data?.testers ?? []).map((t) => [t.id, t])), [data]);
  const betasById = useMemo(() => new Map((data?.betas ?? []).map((b) => [b.id, b])), [data]);

  const pending = data?.requests.filter((r) => r.status === "pending").length ?? 0;
  const verified = data?.testers.filter((t) => t.email_verified_at).length ?? 0;
  const openBetas = data?.betas.filter((b) => b.status === "open").length ?? 0;

  const filteredRequests = (data?.requests ?? []).filter(
    (r) => (requestBeta === "all" || r.beta_id === requestBeta) && (requestStatus === "all" || r.status === requestStatus),
  );

  const q = search.trim().toLowerCase();
  const filteredTesters = (data?.testers ?? []).filter(
    (t) => !q || `${t.first_name} ${t.last_name} ${t.email} ${t.phone} ${t.devices.map(betaDeviceLabel).join(" ")}`.toLowerCase().includes(q),
  );

  const setRequest = async (r: RequestRow, status: string) => {
    const res = await fetch(`${API}/requests/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return setToast("Aggiornamento non riuscito.");
    setData((d) => (d ? { ...d, requests: d.requests.map((x) => (x.id === r.id ? out.request : x)) } : d));
    if (status === "approved") setToast(out.emailed ? "Approvata: il tester ha ricevuto l'email." : "Approvata (email non inviata).");
  };

  const removeTester = async (t: TesterRow) => {
    if (!window.confirm(`Eliminare ${t.first_name} ${t.last_name} dai beta tester?`)) return;
    const res = await fetch(`${API}/testers/${t.id}`, { method: "DELETE" });
    if (res.ok) void load();
  };

  const editingBeta = editing && editing !== "new" ? editing : null;

  return (
    <div>
      <div className="pynk-crm-header">
        <div>
          <h1 className="pynk-admin-page-title">Beta program</h1>
          <p className="pynk-admin-page-subtitle">
            Beta pubblicate su <a href="https://pynkstudio.eu/beta" target="_blank" rel="noopener noreferrer" className="pynk-crm-drawer-link">pynkstudio.eu/beta <ExternalLink size={12} /></a>, iscritti e richieste d&apos;accesso.
          </p>
        </div>
        <div className="pynk-crm-header-actions">
          <button type="button" className="pynk-admin-btn-primary pynk-crm-btn" onClick={() => { setTab("betas"); setEditing("new"); }}><Plus size={14} /> Nuova beta</button>
        </div>
      </div>

      <div className="pynk-admin-kpi-grid pynk-crm-kpis">
        <div className="pynk-admin-kpi"><p className="pynk-admin-kpi-label">Beta aperte</p><p className="pynk-admin-kpi-value">{data ? openBetas : "—"}</p><p className="pynk-admin-kpi-hint">{data?.betas.length ?? 0} in totale</p></div>
        <div className="pynk-admin-kpi"><p className="pynk-admin-kpi-label">Tester iscritti</p><p className="pynk-admin-kpi-value">{data?.testers.length ?? "—"}</p><p className="pynk-admin-kpi-hint">{verified} con email confermata</p></div>
        <button type="button" className="pynk-admin-kpi pynk-crm-kpi-btn" data-alert={pending > 0} onClick={() => { setTab("requests"); setRequestStatus("pending"); }}>
          <p className="pynk-admin-kpi-label">Richieste in attesa</p><p className="pynk-admin-kpi-value">{data ? pending : "—"}</p><p className="pynk-admin-kpi-hint">TestFlight su invito e Play test chiusi</p>
        </button>
        <div className="pynk-admin-kpi"><p className="pynk-admin-kpi-label">Avvisi attivi</p><p className="pynk-admin-kpi-value">{data ? data.testers.filter((t) => t.notify_enabled && t.email_verified_at).length : "—"}</p><p className="pynk-admin-kpi-hint">tester raggiungibili via email</p></div>
      </div>

      <div className="pynk-crm-status-tabs" style={{ marginBottom: 14 }}>
        {([["betas", "Beta"], ["requests", `Richieste${pending ? ` (${pending})` : ""}`], ["testers", "Tester"]] as [Tab, string][]).map(([v, l]) => (
          <button key={v} type="button" className="pynk-crm-status-tab" data-active={tab === v} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {loadError && <p className="pynk-crm-drawer-error">Impossibile caricare il beta program.</p>}

      {tab === "betas" && (
        <div className="pynk-admin-card pynk-crm-table-wrap">
          {!data ? <p className="pynk-crm-empty">Carico…</p> : data.betas.length === 0 ? (
            <div className="pynk-crm-empty">
              <FlaskConical size={32} style={{ opacity: 0.3, margin: "0 auto 8px" }} />
              Nessuna beta ancora. Crea la prima con «Nuova beta».
            </div>
          ) : (
            <table className="pynk-crm-table">
              <thead>
                <tr><th>App</th><th>Stato</th><th>Tipo</th><th>Dispositivi</th><th>Richieste</th><th>Avvisati</th><th>Pubblicata</th></tr>
              </thead>
              <tbody>
                {data.betas.map((b) => {
                  const reqs = data.requests.filter((r) => r.beta_id === b.id);
                  return (
                    <tr key={b.id} className="pynk-crm-row" onClick={() => setEditing(b)}>
                      <td>
                        <span className="pynk-crm-row-name">{b.name}</span>
                        <span className="pynk-crm-row-sub">{b.version ? `v${b.version} · ` : ""}{betaCategoryLabel(b.category)}</span>
                      </td>
                      <td><StatusBadge status={b.status} /></td>
                      <td className="pynk-crm-row-secondary">{betaKindLabel(b.kind)}</td>
                      <td className="pynk-crm-row-secondary">{cleanBetaChannels(b.channels).map((c) => betaDeviceLabel(c.device)).join(", ") || "—"}</td>
                      <td className="pynk-crm-row-secondary">{reqs.length ? `${reqs.filter((r) => r.status === "approved").length}/${reqs.length} approvate` : "—"}</td>
                      <td className="pynk-crm-row-secondary">{data.notifiedByBeta[b.id] ?? 0}</td>
                      <td className="pynk-crm-row-secondary">{formatDate(b.published_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "requests" && data && (
        <>
          <div className="pynk-crm-toolbar">
            <select className="pynk-admin-select pynk-crm-select" value={requestBeta} onChange={(e) => setRequestBeta(e.target.value)} aria-label="Beta">
              <option value="all">Tutte le beta</option>
              {data.betas.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="pynk-admin-select pynk-crm-select" value={requestStatus} onChange={(e) => setRequestStatus(e.target.value)} aria-label="Stato">
              <option value="pending">In attesa</option>
              <option value="approved">Approvate</option>
              <option value="rejected">Rifiutate</option>
              <option value="all">Tutte</option>
            </select>
            <button
              type="button"
              className="pynk-admin-btn-outline pynk-crm-btn"
              disabled={filteredRequests.length === 0}
              onClick={async () => {
                const emails = [...new Set(filteredRequests.map((r) => r.account_email).filter(Boolean))].join(", ");
                setToast((await copyText(emails)) ? "Email account copiate: incollale nel Google Group o in TestFlight." : "Copia non riuscita.");
              }}
            >
              <ClipboardCopy size={14} /> Copia email account
            </button>
          </div>
          <div className="pynk-admin-card pynk-crm-table-wrap">
            {filteredRequests.length === 0 ? <p className="pynk-crm-empty">Nessuna richiesta.</p> : (
              <table className="pynk-crm-table">
                <thead>
                  <tr><th>Tester</th><th>Beta</th><th>Dispositivo</th><th>Account da aggiungere</th><th>Data</th><th>Stato</th><th /></tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => {
                    const t = testersById.get(r.tester_id);
                    return (
                      <tr key={r.id} className="pynk-crm-row" style={{ cursor: "default" }}>
                        <td>
                          <span className="pynk-crm-row-name">{t ? `${t.first_name} ${t.last_name}` : "—"}</span>
                          <span className="pynk-crm-row-sub">{t?.email}</span>
                        </td>
                        <td className="pynk-crm-row-secondary">{betasById.get(r.beta_id)?.name ?? "—"}</td>
                        <td className="pynk-crm-row-secondary">{betaDeviceLabel(r.device)}<span className="pynk-crm-row-sub">{betaMethodInfo(r.method).label}</span></td>
                        <td className="pynk-crm-row-secondary">{r.account_email ?? "—"}</td>
                        <td className="pynk-crm-row-secondary">{formatDate(r.created_at)}</td>
                        <td><span className="pynk-beta-admin-badge" data-status={r.status}>{r.status === "pending" ? "In attesa" : r.status === "approved" ? "Approvata" : "Rifiutata"}</span></td>
                        <td>
                          <span className="pynk-beta-admin-row">
                            {r.status !== "approved" && <button type="button" className="pynk-admin-btn-primary pynk-crm-btn" onClick={() => setRequest(r, "approved")}>Approva</button>}
                            {r.status === "pending" && <button type="button" className="pynk-admin-btn-outline pynk-crm-btn" onClick={() => setRequest(r, "rejected")}>Rifiuta</button>}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <p className="pynk-crm-row-secondary" style={{ marginTop: 10 }}>
            Prima di approvare aggiungi l&apos;account alla lista tester (Google Group / Play Console o TestFlight): l&apos;approvazione invia al tester l&apos;email con il link.
          </p>
        </>
      )}

      {tab === "testers" && data && (
        <>
          <div className="pynk-crm-toolbar">
            <div className="pynk-crm-search-wrap">
              <Search size={15} className="pynk-crm-search-icon" />
              <input className="pynk-crm-search" placeholder="Cerca per nome, email, telefono, dispositivo…" value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button type="button" onClick={() => setSearch("")} className="pynk-crm-search-clear" aria-label="Cancella"><X size={14} /></button>}
            </div>
            <button
              type="button"
              className="pynk-admin-btn-outline pynk-crm-btn"
              disabled={filteredTesters.length === 0}
              onClick={async () => setToast((await copyText(filteredTesters.map((t) => t.email).join(", "))) ? "Email copiate." : "Copia non riuscita.")}
            >
              <ClipboardCopy size={14} /> Copia email
            </button>
          </div>
          <div className="pynk-admin-card pynk-crm-table-wrap">
            {filteredTesters.length === 0 ? <p className="pynk-crm-empty">Nessun tester.</p> : (
              <table className="pynk-crm-table">
                <thead>
                  <tr><th>Tester</th><th>Telefono</th><th>Dispositivi</th><th>Account</th><th>Avvisi</th><th>Iscritto</th><th /></tr>
                </thead>
                <tbody>
                  {filteredTesters.map((t) => (
                    <tr key={t.id} className="pynk-crm-row" style={{ cursor: "default" }}>
                      <td>
                        <span className="pynk-crm-row-name">{t.first_name} {t.last_name}</span>
                        <span className="pynk-crm-row-sub">{t.email}{!t.email_verified_at && " · non confermata"}</span>
                      </td>
                      <td className="pynk-crm-row-secondary"><a href={`tel:${t.phone}`} className="pynk-crm-icon-link">{t.phone}</a></td>
                      <td className="pynk-crm-row-secondary">{t.devices.map(betaDeviceLabel).join(", ")}</td>
                      <td className="pynk-crm-row-secondary">
                        {t.apple_id_email && <span className="pynk-crm-row-sub">Apple: {t.apple_id_email}</span>}
                        {t.google_account_email && <span className="pynk-crm-row-sub">Google: {t.google_account_email}</span>}
                        {!t.apple_id_email && !t.google_account_email && "—"}
                      </td>
                      <td className="pynk-crm-row-secondary">
                        {t.notify_enabled ? "Sì" : "No"}
                        {(t.notify_categories.length > 0 || t.notify_kinds.length > 0 || t.notify_languages.length > 0) && (
                          <span className="pynk-crm-row-sub">
                            {[...t.notify_kinds.map(betaKindLabel), ...t.notify_categories.map(betaCategoryLabel), ...t.notify_languages.map((l) => l.toUpperCase())].join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="pynk-crm-row-secondary">{formatDate(t.created_at)}</td>
                      <td><button type="button" className="pynk-admin-icon-btn" onClick={() => removeTester(t)} aria-label="Elimina tester"><Trash2 size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {toast && <div className="pynk-beta-admin-toast" role="status">{toast}</div>}

      {editing && (
        <BetaEditor
          key={editingBeta ? `${editingBeta.id}-${editingBeta.updated_at}` : "new"}
          beta={editingBeta}
          notified={editingBeta ? data?.notifiedByBeta[editingBeta.id] ?? 0 : 0}
          approved={editingBeta ? data?.requests.filter((r) => r.beta_id === editingBeta.id && r.status === "approved").length ?? 0 : 0}
          onClose={() => setEditing(null)}
          onSaved={(b) => { setEditing(b); void load(); setToast("Beta salvata."); }}
          onDeleted={() => { setEditing(null); void load(); }}
        />
      )}
    </div>
  );
}
