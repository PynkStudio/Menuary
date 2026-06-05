"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bike, Bot, CheckCircle2, Clock, QrCode, RotateCcw, Save, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import type { TenantOrderSettings } from "@/lib/types";
import { useDraftPersistence } from "@/lib/hooks/use-draft-persistence";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";

type FormState = Omit<TenantOrderSettings, "id" | "tenantId" | "locationId">;

type WhatsappSession = {
  status: "not_configured" | "pending_qr" | "connected" | "offline" | "error";
  session_id: string;
  phone_e164: string | null;
  qr_data_url: string | null;
  last_heartbeat_at: string | null;
  last_error: string | null;
};

const EMPTY: FormState = {
  takeawayEnabled: true,
  dineInEnabled: true,
  deliveryEnabled: false,
  takeawayWindowBeforeOpenMin: null,
  takeawayWindowBeforeCloseMin: null,
  dineInWindowBeforeOpenMin: null,
  dineInWindowBeforeCloseMin: null,
  deliveryWindowBeforeOpenMin: null,
  deliveryWindowBeforeCloseMin: null,
  autoAcceptEnabled: false,
  autoAcceptMaxTotal: null,
  autoAcceptMaxItems: null,
  autoAcceptOnlyReturning: false,
  autoAcceptNoNotes: false,
  pendingTimeoutSeconds: 120,
};

export function OrderSettingsPanel() {
  const tenant = useTenant();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const draft = useDraftPersistence<FormState>(`draft:${tenant.id}:order-settings`);
  const savedFormRef = useRef<FormState | null>(null);
  const isDirty = useMemo(
    () => loaded && savedFormRef.current !== null && JSON.stringify(form) !== JSON.stringify(savedFormRef.current),
    [form, loaded],
  );
  useUnsavedChangesWarning(isDirty);
  const [waSession, setWaSession] = useState<WhatsappSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/gestione/order-settings?tenantId=${tenant.id}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        if (!cancelled) setLoaded(true);
        return;
      }
      const { settings } = (await res.json()) as { settings: TenantOrderSettings };
      if (cancelled) return;
      const { id, tenantId, locationId, ...rest } = settings;
      void id; void tenantId; void locationId;
      setForm(rest);
      savedFormRef.current = rest;
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenant.id]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch(`/api/gestione/whatsapp-session?tenantId=${tenant.id}`, { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as { session?: WhatsappSession | null };
      if (!cancelled) setWaSession(json.session ?? null);
    };
    void load();
    const timer = window.setInterval(load, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [tenant.id]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      draft.saveDraft(next);
      return next;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/gestione/order-settings?tenantId=${tenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, locationId: null, ...form }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMsg(err.error ?? "Errore salvataggio");
      } else {
        setMsg("Impostazioni salvate.");
        savedFormRef.current = form;
        draft.clearDraft();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return <p className="text-sm text-zinc-500">Carico…</p>;
  }

  return (
    <form onSubmit={save} className="max-w-3xl space-y-8">
      {draft.draftDate && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            Modifiche non salvate del{" "}
            {draft.draftDate.toLocaleDateString("it-IT", {
              day: "2-digit", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => draft.clearDraft()}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100">
              Ignora
            </button>
            <button type="button"
              onClick={() => { const s = draft.readDraft(); if (s) { setForm(s); draft.clearDraft(); } }}
              className="inline-flex items-center gap-1 rounded-full bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">
              <RotateCcw size={12} /> Recupera
            </button>
          </div>
        </div>
      )}
      <header>
        <h1 className="text-3xl font-bold">Impostazioni ordini</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Decidi quali ordini accettare, in quali fasce orarie e quali confermare
          automaticamente.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <QrCode size={18} /> WhatsApp ordini
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Sessione del numero WhatsApp pubblico usato dai clienti per ordini e richieste.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className="flex min-h-[160px] items-center justify-center rounded-xl bg-zinc-50 p-3">
            {waSession?.qr_data_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={waSession.qr_data_url} alt="QR WhatsApp Web" className="max-h-[136px] max-w-[136px] object-contain" />
            ) : waSession?.status === "connected" ? (
              <CheckCircle2 size={44} className="text-emerald-600" />
            ) : (
              <QrCode size={44} className="text-zinc-300" />
            )}
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase text-zinc-600">
                {waSession?.status === "connected"
                  ? "Attiva"
                  : waSession?.status === "pending_qr"
                    ? "QR da inquadrare"
                    : waSession?.status === "offline"
                      ? "Offline"
                      : waSession?.status === "error"
                        ? "Errore"
                        : "Non configurata"}
              </span>
              {waSession?.phone_e164 && <span className="font-medium text-zinc-700">{waSession.phone_e164}</span>}
            </div>
            <p className="text-zinc-500">
              Sessione: <span className="font-mono text-zinc-700">{waSession?.session_id ?? `tenant-${tenant.id}`}</span>
            </p>
            <p className="text-zinc-500">
              Ultimo heartbeat: {waSession?.last_heartbeat_at ? new Date(waSession.last_heartbeat_at).toLocaleString("it-IT") : "mai"}
            </p>
            {(waSession?.status === "offline" || waSession?.status === "error") && (
              <p className="flex gap-2 rounded-xl bg-red-50 p-3 font-medium text-red-700">
                <AlertTriangle size={16} className="shrink-0" />
                {waSession.last_error || "Sessione non operativa: alert email inviato a supporto e tenant admin."}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Canali */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ShoppingBag size={18} /> Canali ordine
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Attiva o disattiva i percorsi di ordinazione disponibili al cliente.
        </p>

        <div className="mt-4 space-y-3">
          <Toggle
            label="Asporto"
            description="Il cliente ordina e ritira al bancone."
            checked={form.takeawayEnabled}
            onChange={(v) => patch("takeawayEnabled", v)}
          />
          <Toggle
            label="Mangia qui"
            description="Per locali senza tavoli numerati: l'ordine è preparato su vassoio."
            checked={form.dineInEnabled}
            onChange={(v) => patch("dineInEnabled", v)}
          />
          <Toggle
            label="Delivery"
            description="Consegna a domicilio."
            checked={form.deliveryEnabled}
            onChange={(v) => patch("deliveryEnabled", v)}
          />
        </div>
      </section>

      {/* Finestre orarie */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Clock size={18} /> Finestre di accettazione
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Minuti rispetto agli orari di apertura del locale. Lascia vuoto per
          nessun limite su quel lato.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WindowFields
            title={<><ShoppingBag size={14} /> Asporto</>}
            beforeOpen={form.takeawayWindowBeforeOpenMin}
            beforeClose={form.takeawayWindowBeforeCloseMin}
            onBeforeOpen={(v) => patch("takeawayWindowBeforeOpenMin", v)}
            onBeforeClose={(v) => patch("takeawayWindowBeforeCloseMin", v)}
          />
          <WindowFields
            title={<><UtensilsCrossed size={14} /> Mangia qui</>}
            beforeOpen={form.dineInWindowBeforeOpenMin}
            beforeClose={form.dineInWindowBeforeCloseMin}
            onBeforeOpen={(v) => patch("dineInWindowBeforeOpenMin", v)}
            onBeforeClose={(v) => patch("dineInWindowBeforeCloseMin", v)}
          />
          <WindowFields
            title={<><Bike size={14} /> Delivery</>}
            beforeOpen={form.deliveryWindowBeforeOpenMin}
            beforeClose={form.deliveryWindowBeforeCloseMin}
            onBeforeOpen={(v) => patch("deliveryWindowBeforeOpenMin", v)}
            onBeforeClose={(v) => patch("deliveryWindowBeforeCloseMin", v)}
          />
        </div>
      </section>

      {/* Auto-accept */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bot size={18} /> Accettazione automatica
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Quando attiva, gli ordini che rispettano <strong>tutte</strong> le
          condizioni qui sotto entrano direttamente in cucina. Gli altri restano
          in attesa di conferma manuale.
        </p>

        <div className="mt-4 space-y-4">
          <Toggle
            label="Abilita accettazione automatica"
            checked={form.autoAcceptEnabled}
            onChange={(v) => patch("autoAcceptEnabled", v)}
          />

          <fieldset
            disabled={!form.autoAcceptEnabled}
            className={form.autoAcceptEnabled ? "" : "opacity-40 pointer-events-none"}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Importo massimo (€)"
                placeholder="es. 50"
                value={form.autoAcceptMaxTotal}
                onChange={(v) => patch("autoAcceptMaxTotal", v)}
                step="0.01"
              />
              <NumberField
                label="Numero massimo prodotti"
                placeholder="es. 10"
                value={form.autoAcceptMaxItems}
                onChange={(v) => patch("autoAcceptMaxItems", v)}
              />
            </div>

            <div className="mt-4 space-y-3">
              <Toggle
                label="Solo clienti già conosciuti"
                description="Auto-accetta solo se il cliente ha già ordinato in passato."
                checked={form.autoAcceptOnlyReturning}
                onChange={(v) => patch("autoAcceptOnlyReturning", v)}
              />
              <Toggle
                label="Solo ordini senza note"
                description="Auto-accetta solo se non ci sono richieste particolari nelle linee o in testata."
                checked={form.autoAcceptNoNotes}
                onChange={(v) => patch("autoAcceptNoNotes", v)}
              />
            </div>
          </fieldset>
        </div>
      </section>

      {/* Timeout pending */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Clock size={18} /> Tempo di conferma manuale
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Quanto tempo il cliente attende sulla pagina di conferma (30–600 secondi).
          Oltre questa soglia l&apos;ordine viene marcato come scaduto.
        </p>
        <NumberField
          className="mt-4 max-w-[200px]"
          label="Secondi"
          placeholder="120"
          value={form.pendingTimeoutSeconds}
          onChange={(v) => patch("pendingTimeoutSeconds", v ?? 120)}
          min={30}
          max={600}
        />
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 font-medium text-white disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Salvo…" : "Salva impostazioni"}
        </button>
        {msg && <span className="text-sm text-zinc-600">{msg}</span>}
      </div>
    </form>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-zinc-500">{description}</span>}
      </span>
    </label>
  );
}

function NumberField({
  label,
  placeholder,
  value,
  onChange,
  step,
  min,
  max,
  className,
}: {
  label: string;
  placeholder?: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: string;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
      />
    </label>
  );
}

function WindowFields({
  title,
  beforeOpen,
  beforeClose,
  onBeforeOpen,
  onBeforeClose,
}: {
  title: React.ReactNode;
  beforeOpen: number | null;
  beforeClose: number | null;
  onBeforeOpen: (v: number | null) => void;
  onBeforeClose: (v: number | null) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">{title}</h3>
      <div className="space-y-3">
        <NumberField
          label="Apri ordini X min prima dell'apertura"
          placeholder="es. 15"
          value={beforeOpen}
          onChange={onBeforeOpen}
        />
        <NumberField
          label="Chiudi ordini X min prima della chiusura"
          placeholder="es. 30"
          value={beforeClose}
          onChange={onBeforeClose}
        />
      </div>
    </div>
  );
}
