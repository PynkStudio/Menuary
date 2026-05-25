"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Clock, PhoneForwarded, Save, ShieldCheck, Utensils } from "lucide-react";
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
  sendAutomatically: boolean;
};

type Settings = {
  enabled: boolean;
  phoneNumber: string;
  greetingMessage: string;
  quickSettings: QuickSettings;
  paymentControls: PaymentControls;
};

type PauseMode = "accept" | "30m" | "day-end" | "custom" | "manual";

function controlLabel(control: Control) {
  if (control.accepting) return "Attivo";
  if (!control.disabledUntil) return "Pausa fino a riattivazione";
  const until = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(control.disabledUntil));
  return `In pausa fino al ${until}`;
}

function isAccepting(control: Control) {
  if (control.accepting) return true;
  if (!control.disabledUntil) return false;
  return new Date(control.disabledUntil).getTime() <= Date.now();
}

function toInputDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function ControlPicker({
  title,
  description,
  control,
  mode,
  customUntil,
  onModeChange,
  onCustomUntilChange,
}: {
  title: string;
  description: string;
  control: Control;
  mode: PauseMode;
  customUntil: string;
  onModeChange: (mode: PauseMode) => void;
  onCustomUntilChange: (value: string) => void;
}) {
  const accepting = isAccepting(control);
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="impact-title text-xl text-pork-ink">{title}</h2>
          <p className="mt-1 text-sm text-pork-ink/60">{description}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-black uppercase",
            accepting ? "bg-pork-green text-white" : "bg-pork-red/10 text-pork-red",
          )}
        >
          {controlLabel(control)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          ["accept", "Si, accetta"],
          ["30m", "No per 30 minuti"],
          ["day-end", "No fino a fine giornata"],
          ["manual", "No finche lo riattivo"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onModeChange(value as PauseMode)}
            className={cn(
              "rounded-2xl px-4 py-3 text-left text-sm font-bold ring-1 transition",
              mode === value
                ? "bg-pork-ink text-white ring-pork-ink"
                : "bg-pork-cream text-pork-ink ring-pork-ink/10 hover:ring-pork-red/35",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="mt-3 block rounded-2xl bg-pork-cream p-4 ring-1 ring-pork-ink/10">
        <span className="text-xs font-black uppercase tracking-wide text-pork-ink/50">
          No fino a un orario personalizzato
        </span>
        <input
          type="datetime-local"
          value={customUntil}
          onChange={(event) => {
            onCustomUntilChange(event.target.value);
            onModeChange("custom");
          }}
          className="mt-2 w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 font-bold outline-none focus:border-pork-red"
        />
      </label>
    </section>
  );
}

function QuickToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-pork-ink/10 transition hover:ring-pork-red/30"
    >
      <span className={cn("mt-0.5 rounded-xl p-2", checked ? "bg-pork-green/15 text-pork-green" : "bg-pork-ink/10 text-pork-ink/40")}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="mt-1 block text-sm text-pork-ink/60">{description}</span>
      </span>
      <span className={cn("rounded-full px-3 py-1 text-xs font-black", checked ? "bg-pork-green text-white" : "bg-pork-ink/10 text-pork-ink/45")}>
        {checked ? "Si" : "No"}
      </span>
    </button>
  );
}

export function AiPhoneQuickSettings({ tenantId }: { tenantId: string }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [ordersMode, setOrdersMode] = useState<PauseMode>("accept");
  const [ordersCustomUntil, setOrdersCustomUntil] = useState("");
  const [reservationsMode, setReservationsMode] = useState<PauseMode>("accept");
  const [reservationsCustomUntil, setReservationsCustomUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/gestione/ai-phone?tenantId=${encodeURIComponent(tenantId)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { settings?: Settings; error?: string }) => {
        if (!alive) return;
        if (json.error || !json.settings) throw new Error(json.error ?? "Impostazioni non disponibili.");
        setSettings(json.settings);
        setOrdersMode(isAccepting(json.settings.quickSettings.acceptNewOrders) ? "accept" : json.settings.quickSettings.acceptNewOrders.disabledUntil ? "custom" : "manual");
        setOrdersCustomUntil(toInputDateTime(json.settings.quickSettings.acceptNewOrders.disabledUntil));
        setReservationsMode(isAccepting(json.settings.quickSettings.acceptReservations) ? "accept" : json.settings.quickSettings.acceptReservations.disabledUntil ? "custom" : "manual");
        setReservationsCustomUntil(toInputDateTime(json.settings.quickSettings.acceptReservations.disabledUntil));
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Errore caricamento.");
      });
    return () => {
      alive = false;
    };
  }, [tenantId]);

  const quick = settings?.quickSettings;
  const canSave = useMemo(() => {
    if (!settings) return false;
    if (ordersMode === "custom" && !ordersCustomUntil) return false;
    if (reservationsMode === "custom" && !reservationsCustomUntil) return false;
    return true;
  }, [ordersCustomUntil, ordersMode, reservationsCustomUntil, reservationsMode, settings]);

  async function save() {
    if (!settings || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/gestione/ai-phone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          ordersMode,
          ordersCustomUntil: ordersCustomUntil || null,
          reservationsMode,
          reservationsCustomUntil: reservationsCustomUntil || null,
          answerAfterHours: quick!.answerAfterHours,
          allowHumanTransfer: quick!.allowHumanTransfer,
          askAllergiesForOrders: quick!.askAllergiesForOrders,
          suggestAlternatives: quick!.suggestAlternatives,
          collectMarketingConsent: quick!.collectMarketingConsent,
          notesForAssistant: quick!.notesForAssistant,
          paymentControls: settings.paymentControls,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { settings?: Settings; error?: string };
      if (!res.ok || json.error || !json.settings) throw new Error(json.error ?? "Salvataggio non riuscito.");
      setSettings(json.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Salvataggio non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  function patchQuick(patch: Partial<QuickSettings>) {
    setSettings((prev) => prev ? { ...prev, quickSettings: { ...prev.quickSettings, ...patch } } : prev);
  }

  if (!settings || !quick) {
    return <p className="text-pork-ink/50">{error ?? "Caricamento assistente..."}</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="impact-title text-xs text-pork-red">Assistente AI</p>
          <h1 className="headline text-4xl">Telefono e WhatsApp</h1>
          <p className="mt-1 text-pork-ink/60">
            Controlli rapidi per decidere cosa puo gestire l&apos;assistente su chiamate e WhatsApp.
          </p>
          {settings.phoneNumber && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-pork-ink ring-1 ring-pork-ink/10">
              <PhoneForwarded size={15} /> {settings.phoneNumber}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!canSave || saving}
          className="btn-primary inline-flex items-center gap-2 text-sm disabled:pointer-events-none disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Salvataggio..." : "Salva"}
        </button>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ControlPicker
          title="Nuovi ordini"
          description="Ordini telefonici da asporto creati dall&apos;assistente."
          control={quick.acceptNewOrders}
          mode={ordersMode}
          customUntil={ordersCustomUntil}
          onModeChange={setOrdersMode}
          onCustomUntilChange={setOrdersCustomUntil}
        />
        <ControlPicker
          title="Prenotazioni e appuntamenti"
          description="Richieste scritte in agenda come da confermare."
          control={quick.acceptReservations}
          mode={reservationsMode}
          customUntil={reservationsCustomUntil}
          onModeChange={setReservationsMode}
          onCustomUntilChange={setReservationsCustomUntil}
        />
      </div>

      <section className="space-y-3">
        <h2 className="impact-title text-sm text-pork-ink/70">Impostazioni rapide</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <QuickToggle
            icon={<Clock size={18} />}
            title="Risponde fuori orario"
            description="Se il locale e chiuso, fornisce info e raccoglie richieste quando possibile."
            checked={quick.answerAfterHours}
            onChange={(answerAfterHours) => patchQuick({ answerAfterHours })}
          />
          <QuickToggle
            icon={<PhoneForwarded size={18} />}
            title="Passaggio a una persona"
            description="Quando serve, puo proporre il trasferimento allo staff."
            checked={quick.allowHumanTransfer}
            onChange={(allowHumanTransfer) => patchQuick({ allowHumanTransfer })}
          />
          <QuickToggle
            icon={<ShieldCheck size={18} />}
            title="Chiede allergie sugli ordini"
            description="Prima di chiudere un ordine ricorda allergie o intolleranze."
            checked={quick.askAllergiesForOrders}
            onChange={(askAllergiesForOrders) => patchQuick({ askAllergiesForOrders })}
          />
          <QuickToggle
            icon={<Utensils size={18} />}
            title="Suggerisce alternative"
            description="Se un prodotto non e disponibile, propone opzioni simili dal menu."
            checked={quick.suggestAlternatives}
            onChange={(suggestAlternatives) => patchQuick({ suggestAlternatives })}
          />
          <QuickToggle
            icon={<Bot size={18} />}
            title="Chiede consenso marketing"
            description="Solo se naturale nella chiamata, chiede consenso per ricontatto e offerte."
            checked={quick.collectMarketingConsent}
            onChange={(collectMarketingConsent) => patchQuick({ collectMarketingConsent })}
          />
          <QuickToggle
            icon={<ShieldCheck size={18} />}
            title="Invia link pagamento"
            description="L'assistente puo mandare via SMS o WhatsApp un link Stripe per pagare l'ordine."
            checked={settings.paymentControls.enabled}
            onChange={(enabled) => setSettings((prev) => prev ? { ...prev, paymentControls: { ...prev.paymentControls, enabled } } : prev)}
          />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
        <h2 className="impact-title text-sm text-pork-ink/70">Pagamento ordine</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <QuickToggle
            icon={<ShieldCheck size={18} />}
            title="Richiedi pagamento per asporto"
            description="Dopo conferma ordine, invia link se il cliente accetta il pagamento digitale."
            checked={settings.paymentControls.requireForTakeaway}
            onChange={(requireForTakeaway) => setSettings((prev) => prev ? { ...prev, paymentControls: { ...prev.paymentControls, requireForTakeaway } } : prev)}
          />
          <QuickToggle
            icon={<ShieldCheck size={18} />}
            title="Richiedi pagamento per delivery"
            description="Utile per ordini da consegnare prima della preparazione."
            checked={settings.paymentControls.requireForDelivery}
            onChange={(requireForDelivery) => setSettings((prev) => prev ? { ...prev, paymentControls: { ...prev.paymentControls, requireForDelivery } } : prev)}
          />
        </div>
        <label className="mt-4 block">
          <span className="text-xs font-black uppercase tracking-wide text-pork-ink/50">Canale link pagamento</span>
          <select
            value={settings.paymentControls.defaultChannel}
            onChange={(event) => setSettings((prev) => prev ? { ...prev, paymentControls: { ...prev.paymentControls, defaultChannel: event.target.value === "whatsapp" ? "whatsapp" : "sms" } } : prev)}
            className="mt-2 w-full rounded-xl border-2 border-pork-ink/10 bg-pork-cream px-3 py-2 font-bold outline-none focus:border-pork-red"
          >
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </label>
      </section>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-pork-ink/50">
            Nota del giorno per l&apos;assistente
          </span>
          <textarea
            value={quick.notesForAssistant}
            onChange={(event) => patchQuick({ notesForAssistant: event.target.value })}
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border-2 border-pork-ink/10 bg-pork-cream px-4 py-3 text-sm outline-none focus:border-pork-red"
            placeholder="Esempio: oggi pizza senza glutine non disponibile; spingere menu degustazione; evitare prenotazioni dopo le 22:00."
          />
        </label>
      </section>
    </div>
  );
}
