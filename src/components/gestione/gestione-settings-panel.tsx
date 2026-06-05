"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  Globe2,
  KeyRound,
  LogOut,
  Plus,
  Save,
  Trash2,
  WalletCards,
} from "lucide-react";
import { ChangePasswordForm } from "@/components/shared/change-password-form";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildLoginUrl, type LoginFrom } from "@/lib/login-url";
import { useSettingsStore } from "@/store/settings-store";

type SubscriptionSummary = {
  status: string;
  packageName: string | null;
  billingCycle: string;
  currency: string;
  nextRenewalAt: string | null;
  currentPeriodEnd: string | null;
  price: number | null;
};

type Props = {
  tenantSlug: string;
  tenantName: string;
  subscription: SubscriptionSummary | null;
  loginFrom?: LoginFrom;
  isDemo?: boolean;
};

const CURRENCY_OPTIONS = [
  { value: "EUR", label: "EUR - Euro" },
  { value: "USD", label: "USD - Dollaro USA" },
  { value: "GBP", label: "GBP - Sterlina britannica" },
  { value: "CHF", label: "CHF - Franco svizzero" },
  { value: "BRL", label: "BRL - Real brasiliano" },
  { value: "AUD", label: "AUD - Dollaro australiano" },
];

const LANGUAGE_OPTIONS = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" },
  { value: "fr", label: "Francais" },
  { value: "es", label: "Espanol" },
  { value: "de", label: "Deutsch" },
  { value: "pt-br", label: "Portugues brasileiro" },
];

const STATUS_LABELS: Record<string, string> = {
  active: "Attivo",
  trial: "In prova",
  past_due: "Pagamento in ritardo",
  cancelled: "Cancellato",
  suspended: "Sospeso",
};

function formatDate(value: string | null) {
  if (!value) return "Non disponibile";
  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatAmount(amount: number | null, currency: string) {
  if (amount == null) return "Non disponibile";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(amount);
}

export function GestioneSettingsPanel({
  tenantSlug,
  tenantName,
  subscription,
  loginFrom,
  isDemo = false,
}: Props) {
  const router = useRouter();
  const settings = useSettingsStore();
  const setSettings = useSettingsStore((state) => state.set);
  const [customCurrency, setCustomCurrency] = useState("");
  const [languageToAdd, setLanguageToAdd] = useState("en");
  const activeLanguages = useMemo(
    () => (settings.activeLanguages.length ? settings.activeLanguages : ["it"]),
    [settings.activeLanguages],
  );
  const activeLanguageLabels = useMemo(
    () =>
      activeLanguages.map((language) => ({
        value: language,
        label: LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? language.toUpperCase(),
      })),
    [activeLanguages],
  );

  function saveCurrency(value: string) {
    setSettings({ siteCurrency: value.toUpperCase() });
  }

  function addLanguage() {
    if (activeLanguages.includes(languageToAdd)) return;
    setSettings({ activeLanguages: [...activeLanguages, languageToAdd] });
  }

  function removeLanguage(language: string) {
    if (activeLanguages.length <= 1) return;
    setSettings({ activeLanguages: activeLanguages.filter((item) => item !== language) });
  }

  async function handleLogout() {
    if (isDemo) {
      router.push("/");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(buildLoginUrl({ from: loginFrom ?? `gestione.${tenantSlug}` }));
  }

  const status = subscription?.status ?? (isDemo ? "active" : "missing");
  const statusLabel = STATUS_LABELS[status] ?? (subscription ? status : "Da collegare");
  const subscriptionCurrency = subscription?.currency ?? settings.siteCurrency;

  return (
    <div className="ga-settings-grid">
      <section className="ga-card">
        <div className="ga-section-head">
          <div>
            <h2 className="ga-section-title">
              <CreditCard size={16} /> Abbonamento Menuary
            </h2>
            <p className="ga-card-hint">Stato commerciale e prossimo rinnovo per {tenantName}.</p>
          </div>
          <span className="ga-status-badge" data-status={status}>
            <CheckCircle2 size={12} />
            {statusLabel}
          </span>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="ga-label-text">Piano</dt>
            <dd className="font-semibold">{subscription?.packageName ?? (isDemo ? "Menuary Pro" : "Non collegato")}</dd>
          </div>
          <div>
            <dt className="ga-label-text">Canone</dt>
            <dd className="font-semibold">{formatAmount(subscription?.price ?? null, subscriptionCurrency)}</dd>
          </div>
          <div>
            <dt className="ga-label-text">Ciclo</dt>
            <dd className="font-semibold">{subscription?.billingCycle ?? "Non disponibile"}</dd>
          </div>
          <div>
            <dt className="ga-label-text">Prossimo rinnovo</dt>
            <dd className="font-semibold">
              {formatDate(subscription?.nextRenewalAt ?? subscription?.currentPeriodEnd ?? null)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="ga-card">
        <div className="ga-section-head">
          <div>
            <h2 className="ga-section-title">
              <WalletCards size={16} /> Valuta
            </h2>
            <p className="ga-card-hint">Preferenza usata per importi e prezzi configurabili nel pannello.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <select
            value={CURRENCY_OPTIONS.some((option) => option.value === settings.siteCurrency) ? settings.siteCurrency : ""}
            onChange={(event) => saveCurrency(event.target.value)}
            className="ga-select"
            aria-label="Valuta"
          >
            <option value="" disabled>Valuta personalizzata</option>
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
          <span className="ga-current-token">{settings.siteCurrency}</span>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={customCurrency}
            onChange={(event) => setCustomCurrency(event.target.value.toUpperCase().slice(0, 3))}
            placeholder="Es. JPY"
            className="ga-input"
            aria-label="Valuta personalizzata"
          />
          <button
            type="button"
            className="ga-btn ga-btn-ghost"
            onClick={() => {
              if (customCurrency.length === 3) {
                saveCurrency(customCurrency);
                setCustomCurrency("");
              }
            }}
          >
            <Save size={14} />
            Usa
          </button>
        </div>
      </section>

      <section className="ga-card">
        <div className="ga-section-head">
          <div>
            <h2 className="ga-section-title">
              <Globe2 size={16} /> Lingue sito
            </h2>
            <p className="ga-card-hint">Aggiungi o rimuovi lingue gestibili per contenuti e menu.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {activeLanguageLabels.map((language) => (
            <span key={language.value} className="ga-language-chip">
              {language.label}
              <button
                type="button"
                onClick={() => removeLanguage(language.value)}
                disabled={activeLanguages.length <= 1}
                aria-label={`Rimuovi ${language.label}`}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <select
            value={languageToAdd}
            onChange={(event) => setLanguageToAdd(event.target.value)}
            className="ga-select"
            aria-label="Lingua da aggiungere"
          >
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={addLanguage} className="ga-btn ga-btn-ghost">
            <Plus size={14} />
            Aggiungi
          </button>
        </div>
      </section>

      <section className="ga-card">
        <div className="ga-section-head">
          <div>
            <h2 className="ga-section-title">
              <KeyRound size={16} /> Password
            </h2>
            <p className="ga-card-hint">Aggiorna la password del tuo account personale.</p>
          </div>
        </div>
        <div className="mt-5">
          <ChangePasswordForm className="gestione-password-form" />
        </div>
      </section>

      <section className="ga-card ga-danger-zone">
        <div>
          <h2 className="ga-section-title">
            <LogOut size={16} /> Sessione
          </h2>
          <p className="ga-card-hint">Chiudi la sessione su questo dispositivo.</p>
        </div>
        <button type="button" onClick={handleLogout} className="ga-btn ga-btn-danger">
          <LogOut size={14} />
          Esci
        </button>
      </section>
    </div>
  );
}
