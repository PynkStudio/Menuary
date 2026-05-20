"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Phone, ArrowRight } from "lucide-react";
import {
  PRICING_PLANS,
  AI_ADDON,
  annualSaving,
  type PricingAddon,
  type PricingPlan,
} from "@/lib/platform-pricing";

// ─── Tabella di confronto ─────────────────────────────────────────────────────

type Row = {
  label: string;
  presence: boolean | string;
  booking: boolean | string;
  ops: boolean | string;
};

const COMPARE_ROWS: Row[] = [
  { label: "Sito su misura", presence: true, booking: true, ops: true },
  { label: "Multilingua · IT EN FR DE ES (+ altre su richiesta)", presence: true, booking: true, ops: true },
  { label: "Dominio personalizzato", presence: true, booking: true, ops: true },
  { label: "Hosting, SSL, backup", presence: true, booking: true, ops: true },
  { label: "Menu digitale aggiornabile", presence: true, booking: true, ops: true },
  { label: "Recensioni Google sul sito", presence: true, booking: true, ops: true },
  { label: "Orari e info su Google Maps", presence: true, booking: true, ops: true },
  { label: "Aggiornamenti tecnici", presence: true, booking: true, ops: true },
  { label: "Prenotazioni online", presence: false, booking: true, ops: true },
  { label: "Conferme e reminder automatici", presence: false, booking: true, ops: true },
  { label: "Calendario di sala", presence: false, booking: true, ops: true },
  { label: "Click-to-WhatsApp", presence: false, booking: true, ops: true },
  { label: "Ordini sala & asporto", presence: false, booking: false, ops: true },
  { label: "Delivery integrato", presence: false, booking: false, ops: true },
  { label: "CRM clienti & analytics", presence: false, booking: false, ops: true },
  { label: "Dashboard operativa", presence: false, booking: false, ops: true },
  { label: "Gestione staff e cucina", presence: false, booking: false, ops: true },
  {
    label: "Integrazione AI (add-on)",
    presence: false,
    booking: "+€60/mese",
    ops: "+€60/mese",
  },
  {
    label: "Supporto",
    presence: "Standard",
    booking: "Prioritario",
    ops: "Dedicato",
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const PRICING_FAQ = [
  {
    q: "Come funziona il contratto?",
    a: "Il contratto è annuale con pagamento anticipato di 12 mesi. Non è previsto il recesso anticipato, ma puoi disdire il rinnovo automatico con un preavviso di 30 giorni: il contratto scade naturalmente al termine del periodo pagato.",
  },
  {
    q: "Quando va online il sito?",
    a: "Sito e servizi vengono attivati entro 7 giorni dalla firma del contratto e dal pagamento del setup iniziale.",
  },
  {
    q: "Posso cambiare piano?",
    a: "Sì. Passare a un piano superiore è possibile in qualsiasi momento ed è attivo immediatamente. Passare a un piano inferiore è possibile, ma la variazione parte dal rinnovo successivo.",
  },
  {
    q: "Cosa cambia tra fatturazione annuale e mensile?",
    a: "Con pagamento annuale anticipato benefici di un canone mensile equivalente ridotto. Con fatturazione mensile la spesa è ripartita mese per mese, ma il canone è più alto. In entrambi i casi il contratto è annuale.",
  },
  {
    q: "Cos'è il costo di attivazione?",
    a: "È una tariffa una tantum per la configurazione iniziale: setup tecnico, onboarding e personalizzazione del sito. Non è inclusa nel canone mensile. I prezzi indicati sono indicativi; il preventivo esatto dipende dalla complessità del locale.",
  },
  {
    q: "Cosa è incluso nel canone mensile?",
    a: "Hosting, dominio, certificati SSL, backup, aggiornamenti tecnici, sicurezza e tutte le nuove funzioni del prodotto. Più il supporto del nostro team.",
  },
  {
    q: "Come funziona l'integrazione AI?",
    a: "L'assistente IA risponde al telefono 24/7 con la voce e il tono del locale: prende prenotazioni e le scrive direttamente in agenda, accetta ordini d'asporto, suggerisce i piatti del giorno e gestisce richieste fuori orario. Supporta il cloning vocale opzionale e parla nativamente italiano, inglese, francese, spagnolo e tedesco. È disponibile dai piani Prenotazioni e Operatività al costo aggiuntivo di €60/mese.",
  },
  {
    q: "Come funziona la quota minuti dell'integrazione AI?",
    a: "Ogni piano AI include una quota mensile di minuti di conversazione. Se la superi, gli addebiti aggiuntivi sono calcolati a prezzo di costo — senza nessun markup da parte nostra. Trovi il dettaglio della quota nel contratto.",
  },
  {
    q: "Ci sono commissioni su prenotazioni, ordini o delivery?",
    a: "Zero. Menuary non trattiene nulla sui tuoi ordini, prenotazioni o consegne. Quello che incassi è tuo, integrale.",
  },
  {
    q: "Posso usare il mio dominio attuale?",
    a: "Sì. Possiamo configurare il tuo dominio esistente o registrarne uno nuovo. In entrambi i casi senza costo aggiuntivo.",
  },
  {
    q: "Il sito è disponibile in più lingue?",
    a: "Sì. Ogni sito viene realizzato in versione multilingua di default, coprendo le principali lingue europee: italiano, inglese, francese, tedesco e spagnolo. Su richiesta è possibile aggiungere altre lingue in base all'utenza tipica del locale — ad esempio russo, arabo, cinese o giapponese per zone ad alta frequentazione turistica internazionale. Il costo delle lingue aggiuntive viene concordato in fase di preventivo.",
  },
];

// ─── Componente principale ────────────────────────────────────────────────────

export function MarketingPricingPage({
  plans = PRICING_PLANS,
  aiAddon = AI_ADDON,
}: {
  plans?: PricingPlan[];
  aiAddon?: PricingAddon;
}) {
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");
  const maxSaving = Math.max(...plans.map(annualSaving));
  const displayCurrency = plans[0]?.currency ?? "EUR";

  return (
    <>
      {/* HERO */}
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-20 lg:pt-28 lg:pb-24">
          <div className="grid items-end gap-14 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Offerta</p>
              <h1 className="menuary-display mt-7 text-[clamp(3rem,6.8vw,6rem)] text-balance">
                Tre piani.
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  Nessuna sorpresa.
                </span>
              </h1>
            </div>
            <p className="menuary-fade-up menuary-fade-up-d1 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:text-right">
              Prezzi chiari, zero commissioni su ordini e prenotazioni. Parti
              da dove vuoi, aggiungi solo ciò che ti serve.
            </p>
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section>
        <div className="menuary-container py-20 lg:py-24">
          {/* Toggle fatturazione */}
          <div className="mb-14 flex flex-wrap items-center justify-center gap-4">
            <div className="inline-flex items-center gap-1 rounded-full border border-[var(--menuary-line)] p-1">
              <button
                onClick={() => setBilling("annual")}
                className={
                  "rounded-full px-5 py-2 text-sm font-semibold transition " +
                  (billing === "annual"
                    ? "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
                    : "text-[var(--menuary-muted)] hover:text-[var(--menuary-ink)]")
                }
              >
                Annuale anticipato
              </button>
              <button
                onClick={() => setBilling("monthly")}
                className={
                  "rounded-full px-5 py-2 text-sm font-semibold transition " +
                  (billing === "monthly"
                    ? "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
                    : "text-[var(--menuary-muted)] hover:text-[var(--menuary-ink)]")
                }
              >
                Mensile
              </button>
            </div>
            {billing === "annual" && maxSaving > 0 && (
              <p className="text-xs font-semibold text-[var(--menuary-sage)]">
                Risparmi fino a {formatPlanPrice(maxSaving, displayCurrency)}/anno
              </p>
            )}
          </div>

          <div className="grid gap-px sm:gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.slug} plan={plan} billing={billing} />
            ))}
          </div>

          <p className="mt-10 text-center text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
            Tutti i prezzi sono IVA esclusa · contratto annuale ·{" "}
            {billing === "annual"
              ? "pagamento anticipato 12 mesi"
              : "fatturazione mensile"}
          </p>
        </div>
      </section>

      {/* AI ADD-ON */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-20 lg:py-24">
          <div className="grid items-start gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">Dal piano Prenotazioni in su</p>
              <h2 className="menuary-display mt-6 text-[clamp(2rem,4.2vw,3.4rem)] text-balance">
                Integrazione AI al telefono.
              </h2>
              <p className="mt-6 text-[17px] leading-[1.75] text-[var(--menuary-muted)]">
                {aiAddon.description}
              </p>
              <div className="mt-8 inline-flex items-baseline gap-2">
                <span className="menuary-display text-[3rem] leading-none">
                  +{formatPlanPrice(aiAddon.monthly, aiAddon.currency ?? displayCurrency)}
                </span>
                <span className="text-sm text-[var(--menuary-muted)]">/mese</span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-[1.65] text-[var(--menuary-muted)]">
                {aiAddon.minutesNote}
              </p>
              <Link href="/contatti" className="menuary-link mt-7 inline-flex">
                Scopri l&apos;integrazione IA
                <ArrowRight size={14} strokeWidth={1.8} className="ml-1" />
              </Link>
            </div>

            <div className="rounded-3xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
                  <Phone size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                    {aiAddon.tagline}
                  </p>
                  <p className="menuary-display text-base">{aiAddon.marketing_name}</p>
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                {aiAddon.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-[1.5]">
                    <Check
                      size={16}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-[var(--menuary-sage)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-xl bg-[var(--menuary-ink)]/5 p-4 text-sm leading-[1.6] text-[var(--menuary-ink)]">
                <span className="font-semibold">Quota minuti mensile inclusa.</span>{" "}
                Oltre la soglia, addebiti a prezzo di costo — senza markup.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOTE COMMERCIALI */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-16 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="menuary-section-label mb-6">Condizioni</p>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-[14px] leading-7 text-[var(--menuary-muted)]">
              <div>
                <p className="mb-2 font-semibold text-[var(--menuary-ink)]">
                  Contratto annuale
                </p>
                <p>
                  Durata 12 mesi con pagamento anticipato. Disdetta del rinnovo
                  automatico con 30 giorni di preavviso — il contratto scade al
                  termine del periodo pagato.
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold text-[var(--menuary-ink)]">
                  Cambio piano
                </p>
                <p>
                  Upgrade attivo subito, in qualsiasi momento. Downgrade
                  possibile, parte dal rinnovo successivo.
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold text-[var(--menuary-ink)]">
                  Attivazione
                </p>
                <p>
                  Sito e servizi online entro 7 giorni dalla firma del
                  contratto. Il costo di setup è una tantum, concordato prima
                  dell&apos;avvio.
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold text-[var(--menuary-ink)]">
                  IVA e prezzi
                </p>
                <p>
                  Tutti i prezzi sono al netto dell&apos;IVA. La fattura sarà
                  emessa con l&apos;aliquota vigente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">Confronta</p>
              <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.4vw,3.6rem)]">
                Cosa c&apos;è in ogni piano.
              </h2>
              <p className="mt-6 max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
                Una vista chiara delle differenze. Nessun asterisco, nessuna
                fee a sorpresa.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left text-[15px]">
                <thead>
                  <tr className="border-b border-[var(--menuary-ink)]">
                    <th className="py-4 pr-4 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-semibold">
                      Funzione
                    </th>
                    <th className="py-4 px-4 text-center font-semibold">Presenza</th>
                    <th className="py-4 px-4 text-center font-semibold text-[var(--menuary-copper)]">
                      Prenotazioni
                    </th>
                    <th className="py-4 pl-4 text-center font-semibold">Operatività</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.label} className="border-b border-[var(--menuary-line)]">
                      <td className="py-4 pr-4">{row.label}</td>
                      <td className="py-4 px-4 text-center">
                        <CellMark value={row.presence} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <CellMark value={row.booking} />
                      </td>
                      <td className="py-4 pl-4 text-center">
                        <CellMark value={row.ops} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
    </>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  billing,
}: {
  plan: PricingPlan;
  billing: "annual" | "monthly";
}) {
  const price = billing === "annual" ? plan.price_annual : plan.price_monthly;
  const saving = annualSaving(plan);
  const currency = plan.currency ?? "EUR";

  return (
    <article
      className={
        "relative flex flex-col gap-6 border bg-[var(--menuary-porcelain)] p-8 sm:p-10 transition-colors " +
        (plan.is_featured
          ? "border-[var(--menuary-copper)] bg-[var(--menuary-paper)] lg:-translate-y-2"
          : "border-[var(--menuary-line)] hover:border-[var(--menuary-ink)]/40")
      }
    >
      {plan.is_featured && (
        <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-[var(--menuary-copper)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
          Più scelto
        </span>
      )}

      <div>
        <h2 className="menuary-display text-3xl">{plan.marketing_name}</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--menuary-copper)]">
          {plan.tagline}
        </p>
      </div>

      {/* Prezzo */}
      <div>
        <span className="menuary-price-tag">
          <span className="amount">{formatPlanPrice(price, currency)}</span>
          <span className="unit">/mese</span>
        </span>
        {billing === "annual" ? (
          <p className="mt-2 text-xs text-[var(--menuary-muted)]">
            Fatturazione annuale anticipata
            {saving > 0 && (
              <span className="ml-1 font-semibold text-[var(--menuary-sage)]">
                · risparmi {formatPlanPrice(saving, currency)}/anno
              </span>
            )}
          </p>
        ) : (
          <p className="mt-2 text-xs text-[var(--menuary-muted)]">
            Con pagamento annuale:{" "}
            <span className="font-semibold text-[var(--menuary-sage)]">
              {formatPlanPrice(plan.price_annual, currency)}/mese · risparmi {formatPlanPrice(saving, currency)}/anno
            </span>
          </p>
        )}
      </div>

      <p className="text-[15px] leading-7 text-[var(--menuary-muted)]">
        {plan.description}
      </p>

      <ul className="space-y-3 text-[15px]">
        {plan.marketing_items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <Check
              size={16}
              strokeWidth={2}
              className="mt-1 shrink-0 text-[var(--menuary-copper)]"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/contatti"
        className={
          "mt-2 inline-flex items-center justify-center gap-2 " +
          (plan.is_featured
            ? "menuary-button menuary-button-accent"
            : "menuary-button menuary-button-light")
        }
      >
        {plan.cta_label ?? "Richiedi proposta"}
        <ArrowRight size={15} strokeWidth={2} />
      </Link>
    </article>
  );
}

function formatPlanPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── CellMark ─────────────────────────────────────────────────────────────────

function CellMark({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--menuary-sage)]/15 text-[var(--menuary-sage)]">
        <Check size={14} strokeWidth={2} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--menuary-line)] text-[var(--menuary-muted)]">
        <Minus size={14} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className="text-[13px] font-semibold text-[var(--menuary-copper)]">
      {value}
    </span>
  );
}
