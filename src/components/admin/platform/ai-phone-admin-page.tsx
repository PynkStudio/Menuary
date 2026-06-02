"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Loader2, Phone, Save, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Control = {
  accepting: boolean;
  disabledUntil: string | null;
  reason: string | null;
};

type QuickSettings = {
  acceptNewOrders: Control;
  acceptReservations: Control;
  answerAfterHours: boolean;
  allowHumanTransfer: boolean;
  askAllergiesForOrders: boolean;
  suggestAlternatives: boolean;
  collectMarketingConsent: boolean;
  notesForAssistant: string;
};

type PaymentControls = {
  enabled: boolean;
  requireForTakeaway: boolean;
  requireForDelivery: boolean;
  defaultChannel: "sms" | "whatsapp";
  fallbackChannel: "sms" | "whatsapp" | null;
  sendAutomatically: boolean;
  acceptedMethods: "online_only" | "on_site_only" | "both";
};

type Settings = {
  tenantId: string;
  enabled: boolean;
  phoneNumber: string;
  retellAgentId: string;
  retellPhoneNumberId: string;
  greetingMessage: string;
  systemPrompt: string;
  handoffPhone: string;
  language: string;
  voiceLabel: string;
  humanTransferEnabled: boolean;
  confirmBeforeWrite: boolean;
  menuSyncEnabled: boolean;
  includeSpecialHours: boolean;
  afterHoursMode: "answer_and_collect" | "answer_info_only" | "closed_message";
  quickSettings: QuickSettings;
  paymentControls: PaymentControls;
  updatedAt: string | null;
};

type TenantOption = {
  id: string;
  name: string;
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-pork-ink/50">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-pork-ink/45">{hint}</span>}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "rounded-2xl px-4 py-3 text-left text-sm font-bold ring-1 transition",
        checked ? "bg-pork-green/15 text-pork-green ring-pork-green/30" : "bg-pork-ink/5 text-pork-ink/55 ring-pork-ink/10",
      )}
    >
      {label}
      <span className="ml-2 text-xs uppercase">{checked ? "Si" : "No"}</span>
    </button>
  );
}

function blankSettings(tenantId: string): Settings {
  return {
    tenantId,
    enabled: true,
    phoneNumber: "",
    retellAgentId: "",
    retellPhoneNumberId: "",
    greetingMessage: "Ciao, sono l'assistente del locale. Dimmi pure come posso aiutarti.",
    systemPrompt: "Rispondi in modo chiaro e cordiale. Usa menu, prezzi, orari e regole operative dal contesto. Conferma sempre i dati prima di creare ordini o prenotazioni.",
    handoffPhone: "",
    language: "it-IT",
    voiceLabel: "",
    humanTransferEnabled: true,
    confirmBeforeWrite: true,
    menuSyncEnabled: true,
    includeSpecialHours: true,
    afterHoursMode: "answer_and_collect",
    quickSettings: {
      acceptNewOrders: { accepting: true, disabledUntil: null, reason: null },
      acceptReservations: { accepting: true, disabledUntil: null, reason: null },
      answerAfterHours: true,
      allowHumanTransfer: true,
      askAllergiesForOrders: true,
      suggestAlternatives: true,
      collectMarketingConsent: false,
      notesForAssistant: "",
    },
    paymentControls: {
      enabled: false,
      requireForTakeaway: false,
      requireForDelivery: false,
      defaultChannel: "whatsapp",
      fallbackChannel: "sms",
      sendAutomatically: true,
      acceptedMethods: "on_site_only",
    },
    updatedAt: null,
  };
}

export function AiPhoneAdminPage({ tenants }: { tenants: TenantOption[] }) {
  const [settingsByTenant, setSettingsByTenant] = useState<Record<string, Settings>>({});
  const [selectedTenant, setSelectedTenant] = useState(tenants[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/ai-phone", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { settings?: Settings[]; error?: string }) => {
        if (!alive) return;
        if (json.error) throw new Error(json.error);
        setSettingsByTenant(Object.fromEntries((json.settings ?? []).map((item) => [item.tenantId, item])));
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Errore caricamento.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const current = useMemo(
    () => settingsByTenant[selectedTenant] ?? blankSettings(selectedTenant),
    [selectedTenant, settingsByTenant],
  );

  function patch(patch: Partial<Settings>) {
    setSettingsByTenant((prev) => ({
      ...prev,
      [selectedTenant]: { ...current, ...patch },
    }));
  }

  function patchQuick(patchValue: Partial<QuickSettings>) {
    patch({ quickSettings: { ...current.quickSettings, ...patchValue } });
  }

  function patchPayment(patchValue: Partial<PaymentControls>) {
    patch({ paymentControls: { ...current.paymentControls, ...patchValue } });
  }

  async function save() {
    if (!selectedTenant) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-phone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      const json = (await res.json().catch(() => ({}))) as { settings?: Settings; error?: string };
      if (!res.ok || json.error || !json.settings) throw new Error(json.error ?? "Salvataggio non riuscito.");
      setSettingsByTenant((prev) => ({ ...prev, [selectedTenant]: json.settings! }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Salvataggio non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="impact-title text-xs text-pork-red">Piattaforma</p>
          <h1 className="headline text-4xl">Assistente AI telefono</h1>
          <p className="mt-1 text-pork-ink/60">
            Configurazione completa per Retell e WhatsApp Web bridge: numeri, messaggi, prompt e comportamento per tenant.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading || !selectedTenant}
          className="inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-2.5 font-bold text-white transition hover:bg-pork-red/90 disabled:pointer-events-none disabled:opacity-45"
        >
          <Save size={16} /> {saving ? "Salvataggio..." : "Salva configurazione"}
        </button>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}
      {loading && (
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-pork-ink/60 ring-1 ring-pork-ink/10">
          <Loader2 size={16} className="animate-spin" /> Caricamento impostazioni...
        </div>
      )}

      <section className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
        <Field label="Tenant">
          <select
            value={selectedTenant}
            onChange={(event) => setSelectedTenant(event.target.value)}
            className="input-base"
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name} · {tenant.id}</option>
            ))}
          </select>
        </Field>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-pork-red" />
            <h2 className="impact-title text-xl">Telefonia e Retell</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assistente attivo">
              <Toggle label="Abilita chiamate AI" checked={current.enabled} onChange={(enabled) => patch({ enabled })} />
            </Field>
            <Field label="Numero pubblico">
              <input value={current.phoneNumber} onChange={(event) => patch({ phoneNumber: event.target.value })} className="input-base" placeholder="+39 ..." />
            </Field>
            <Field label="Retell Agent ID">
              <input value={current.retellAgentId} onChange={(event) => patch({ retellAgentId: event.target.value })} className="input-base font-mono text-xs" />
            </Field>
            <Field label="Retell Phone Number ID">
              <input value={current.retellPhoneNumberId} onChange={(event) => patch({ retellPhoneNumberId: event.target.value })} className="input-base font-mono text-xs" />
            </Field>
            <Field label="Numero per passaggio a persona">
              <input value={current.handoffPhone} onChange={(event) => patch({ handoffPhone: event.target.value })} className="input-base" placeholder="+39 ..." />
            </Field>
            <Field label="Lingua">
              <select value={current.language} onChange={(event) => patch({ language: event.target.value })} className="input-base">
                <option value="it-IT">Italiano</option>
                <option value="en-US">English</option>
                <option value="fr-FR">Francais</option>
                <option value="es-ES">Espanol</option>
                <option value="de-DE">Deutsch</option>
              </select>
            </Field>
            <Field label="Voce / nota voce">
              <input value={current.voiceLabel} onChange={(event) => patch({ voiceLabel: event.target.value })} className="input-base" placeholder="Es. tono caldo, giovane, professionale" />
            </Field>
            <Field label="Fuori orario">
              <select value={current.afterHoursMode} onChange={(event) => patch({ afterHoursMode: event.target.value as Settings["afterHoursMode"] })} className="input-base">
                <option value="answer_and_collect">Risponde e raccoglie richieste</option>
                <option value="answer_info_only">Solo informazioni</option>
                <option value="closed_message">Messaggio di chiusura</option>
              </select>
            </Field>
          </div>
          <div className="rounded-2xl bg-pork-mustard/20 p-4 text-sm text-pork-ink/75 ring-1 ring-pork-mustard/40">
            WhatsApp in fase test usa il bridge WhatsApp Web. Configura lo scraper con
            <code className="mx-1 rounded bg-white px-1 py-0.5 text-xs">/api/whatsapp/inbound</code>
            e header <code className="mx-1 rounded bg-white px-1 py-0.5 text-xs">x-whatsapp-web-secret</code>.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle label="Trasferimento a persona" checked={current.humanTransferEnabled} onChange={(humanTransferEnabled) => patch({ humanTransferEnabled })} />
            <Toggle label="Conferma prima di scrivere" checked={current.confirmBeforeWrite} onChange={(confirmBeforeWrite) => patch({ confirmBeforeWrite })} />
            <Toggle label="Sincronizza menu/listino" checked={current.menuSyncEnabled} onChange={(menuSyncEnabled) => patch({ menuSyncEnabled })} />
            <Toggle label="Usa orari speciali" checked={current.includeSpecialHours} onChange={(includeSpecialHours) => patch({ includeSpecialHours })} />
          </div>
          <div className="rounded-2xl bg-pork-cream p-4 ring-1 ring-pork-ink/10">
            <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-pork-ink/50">
              Payment link ordini
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Abilita link Stripe" checked={current.paymentControls.enabled} onChange={(enabled) => patchPayment({ enabled })} />
              <Toggle label="Invio automatico" checked={current.paymentControls.sendAutomatically} onChange={(sendAutomatically) => patchPayment({ sendAutomatically })} />
              <Toggle label="Richiedi per asporto" checked={current.paymentControls.requireForTakeaway} onChange={(requireForTakeaway) => patchPayment({ requireForTakeaway })} />
              <Toggle label="Richiedi per delivery" checked={current.paymentControls.requireForDelivery} onChange={(requireForDelivery) => patchPayment({ requireForDelivery })} />
            </div>
            <Field
              label="Canale primario invio link"
              hint="Default WhatsApp. Se il numero non ha WA o il send fallisce, useremo il canale di fallback."
            >
              <select
                value={current.paymentControls.defaultChannel}
                onChange={(event) => patchPayment({ defaultChannel: event.target.value === "sms" ? "sms" : "whatsapp" })}
                className="input-base"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </Field>
            <Field label="Canale di fallback">
              <select
                value={current.paymentControls.fallbackChannel ?? "none"}
                onChange={(event) => {
                  const v = event.target.value;
                  patchPayment({
                    fallbackChannel:
                      v === "whatsapp" ? "whatsapp" : v === "sms" ? "sms" : null,
                  });
                }}
                className="input-base"
              >
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="none">Nessuno (riprova solo il primario)</option>
              </select>
            </Field>
            <Field
              label="Metodi di pagamento accettati"
              hint="L'assistente AI plasma la conversazione in base a questa policy. 'Online' richiede Stripe collegato; in caso contrario l'agente proporrà sempre pagamento al posto."
            >
              <select
                value={current.paymentControls.acceptedMethods}
                onChange={(event) => {
                  const v = event.target.value;
                  patchPayment({
                    acceptedMethods:
                      v === "online_only" || v === "on_site_only" || v === "both" ? v : "on_site_only",
                  });
                }}
                className="input-base"
              >
                <option value="on_site_only">Solo al ritiro / consegna</option>
                <option value="online_only">Solo online (link Stripe)</option>
                <option value="both">Entrambi · l&apos;agente chiede al cliente</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-pork-red" />
            <h2 className="impact-title text-xl">Messaggi e prompt</h2>
          </div>
          <Field label="Greeting message" hint="Prima frase o messaggio iniziale dell'assistente.">
            <textarea value={current.greetingMessage} onChange={(event) => patch({ greetingMessage: event.target.value })} rows={4} className="input-base resize-none" />
          </Field>
          <Field label="Prompt operativo" hint="Istruzioni generali. Il contesto menu/orari viene aggiunto automaticamente.">
            <textarea value={current.systemPrompt} onChange={(event) => patch({ systemPrompt: event.target.value })} rows={9} className="input-base resize-none font-mono text-xs" />
          </Field>
        </section>
      </div>

      <section className="space-y-4 rounded-3xl bg-pork-cream p-5 ring-1 ring-pork-ink/10">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-pork-red" />
          <h2 className="impact-title text-xl">Impostazioni rapide visibili al tenant</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Toggle label="Risponde fuori orario" checked={current.quickSettings.answerAfterHours} onChange={(answerAfterHours) => patchQuick({ answerAfterHours })} />
          <Toggle label="Passaggio a persona" checked={current.quickSettings.allowHumanTransfer} onChange={(allowHumanTransfer) => patchQuick({ allowHumanTransfer })} />
          <Toggle label="Chiede allergie" checked={current.quickSettings.askAllergiesForOrders} onChange={(askAllergiesForOrders) => patchQuick({ askAllergiesForOrders })} />
          <Toggle label="Suggerisce alternative" checked={current.quickSettings.suggestAlternatives} onChange={(suggestAlternatives) => patchQuick({ suggestAlternatives })} />
          <Toggle label="Consenso marketing" checked={current.quickSettings.collectMarketingConsent} onChange={(collectMarketingConsent) => patchQuick({ collectMarketingConsent })} />
        </div>
        <Field label="Nota rapida del giorno">
          <textarea
            value={current.quickSettings.notesForAssistant}
            onChange={(event) => patchQuick({ notesForAssistant: event.target.value })}
            rows={4}
            className="input-base resize-none"
          />
        </Field>
      </section>
    </div>
  );
}
