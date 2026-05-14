"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Sparkles, ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  FAQSection,
  FinalCTASection,
} from "@/components/marketing/marketing-sections";
import {
  PRICING_PLANS,
  annualSaving,
  type PricingPlan,
} from "@/lib/platform-pricing";

// ─── Tabella di confronto ─────────────────────────────────────────────────────

type Row = {
  label: string;
  vetrina: boolean | string;
  operativita: boolean | string;
  autopilota: boolean | string;
};

const COMPARE_ROWS: Row[] = [
  { label: "Sito su misura", vetrina: true, operativita: true, autopilota: true },
  { label: "Menu digitale", vetrina: true, operativita: true, autopilota: true },
  { label: "Hosting, SSL, backup", vetrina: true, operativita: true, autopilota: true },
  { label: "Prenotazioni online", vetrina: false, operativita: true, autopilota: true },
  { label: "Ordini sala & asporto", vetrina: false, operativita: true, autopilota: true },
  { label: "Delivery integrato", vetrina: false, operativita: true, autopilota: true },
  { label: "Magazzino & scorte", vetrina: false, operativita: true, autopilota: true },
  { label: "Food cost & margini", vetrina: false, operativita: true, autopilota: true },
  { label: "CRM clienti", vetrina: false, operativita: true, autopilota: true },
  { label: "Pannello staff & cucina", vetrina: false, operativita: true, autopilota: true },
  { label: "IA al telefono 24/7", vetrina: false, operativita: false, autopilota: true },
  { label: "Cloning vocale", vetrina: false, operativita: false, autopilota: true },
  {
    label: "Supporto",
    vetrina: "Standard",
    operativita: "Prioritario",
    autopilota: "Dedicato",
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const PRICING_FAQ = [
  {
    q: "Il contratto è annuale?",
    a: "Sì. Il contratto ha durata annuale e non è previsto il recesso anticipato. Puoi però cambiare piano — salire o scendere — in qualsiasi momento: la variazione è attiva dal mese successivo.",
  },
  {
    q: "Cosa cambia tra fatturazione annuale e mensile?",
    a: "Con fatturazione annuale paghi un unico importo per i 12 mesi e benefici di un canone mensile ridotto. Con fatturazione mensile la spesa è ripartita mese per mese, ma il canone è più alto. In entrambi i casi il contratto è annuale.",
  },
  {
    q: "Cos'è il costo di attivazione?",
    a: "È una tariffa una tantum per la configurazione iniziale: setup tecnico, onboarding, personalizzazione del sito e dei moduli. Non è inclusa nel canone e viene concordata prima dell'avvio. I prezzi indicati sono indicativi; il preventivo esatto dipende dalla complessità del locale.",
  },
  {
    q: "Cosa è incluso nel canone?",
    a: "Hosting, dominio (se gestito da noi), certificati SSL, backup, aggiornamenti tecnici, sicurezza e tutte le nuove funzioni del prodotto su qualsiasi modulo. Più il supporto del nostro team.",
  },
  {
    q: "Posso passare da un piano all'altro?",
    a: "Sì, in qualsiasi momento. Aggiungere prenotazioni, ordini, magazzino, food cost o CRM è una semplice attivazione, senza dover rifare il sito. La variazione è attiva dal mese successivo.",
  },
  {
    q: "Come funziona l'IA al telefono?",
    a: "L'assistente vocale risponde 24/7 con la voce e il tono del locale. Prende prenotazioni e le scrive direttamente nell'agenda, accetta ordini d'asporto, suggerisce piatti del giorno, gestisce le richieste fuori orario. Supporta il cloning vocale opzionale e parla nativamente italiano, inglese, francese, spagnolo e tedesco.",
  },
  {
    q: "Quanto tempo serve per andare online?",
    a: "Per Vetrina, in media 3–5 settimane dalla prima chiamata. Operatività richiede 4–6 settimane perché include magazzino, food cost e configurazione dei moduli operativi. Autopilota aggiunge 2 settimane per training della voce e calibrazione dei flussi telefonici.",
  },
  {
    q: "Posso usare il mio dominio attuale?",
    a: "Certo. Possiamo configurare il tuo dominio esistente o registrarne uno nuovo per te. In entrambi i casi nessun costo aggiuntivo.",
  },
  {
    q: "Ci sono commissioni su prenotazioni, ordini o delivery?",
    a: "Zero. Menuary non trattiene nulla sui tuoi ordini, prenotazioni o consegne. Quello che incassi è tuo, integrale. Eventuali fee dei corrieri delivery dipendono dal provider che scegli.",
  },
];

// ─── Componente principale ────────────────────────────────────────────────────

export function MarketingPricingPage() {
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");

  return (
    <MarketingShell>
      {/* HERO */}
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-20 lg:pt-28 lg:pb-24">
          <div className="grid items-end gap-14 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Offerta</p>
              <h1 className="menuary-display mt-7 text-[clamp(3rem,6.8vw,6rem)]">
                Parti dal sito giusto.
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  Aggiungi solo ciò che serve.
                </span>
              </h1>
            </div>
            <p className="menuary-fade-up menuary-fade-up-d1 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:text-right">
              Tre piani per ristoranti di ogni dimensione. Prezzi chiari, zero
              commissioni su ordini e prenotazioni.
            </p>
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section>
        <div className="menuary-container py-20 lg:py-24">

          {/* Toggle fatturazione */}
          <div className="mb-14 flex justify-center">
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
                Annuale
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
            {billing === "annual" && (
              <p className="ml-4 self-center text-xs font-semibold text-[var(--menuary-sage)]">
                Risparmio fino a {Math.max(...PRICING_PLANS.map(annualSaving))}€/anno
              </p>
            )}
          </div>

          <div className="grid gap-px sm:gap-6 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <PlanCard key={plan.slug} plan={plan} billing={billing} />
            ))}
          </div>

          {/* Note IVA */}
          <p className="mt-10 text-center text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
            Tutti i prezzi sono IVA esclusa &nbsp;·&nbsp; contratto annuale
            {billing === "annual"
              ? " · fatturazione annuale"
              : " · fatturazione mensile"}
          </p>
        </div>
      </section>

      {/* NOTE COMMERCIALI */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-16 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="menuary-section-label mb-6">Note</p>
            <div className="grid gap-8 sm:grid-cols-3 text-[14px] leading-7 text-[var(--menuary-muted)]">
              <div>
                <p className="mb-2 font-semibold text-[var(--menuary-ink)]">Contratto annuale</p>
                <p>
                  La durata minima è di 12 mesi. Non è previsto il recesso
                  anticipato. Puoi cambiare piano in qualsiasi momento.
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold text-[var(--menuary-ink)]">Costo di attivazione</p>
                <p>
                  Una tantum, concordata prima dell&apos;avvio. Copre setup tecnico,
                  onboarding e personalizzazione. Non è inclusa nel canone.
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold text-[var(--menuary-ink)]">IVA e prezzi</p>
                <p>
                  Tutti i prezzi esposti sono al netto dell&apos;IVA applicabile.
                  La fattura sarà emessa con l&apos;aliquota vigente.
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
                    <th className="py-4 px-4 text-center font-semibold">Vetrina</th>
                    <th className="py-4 px-4 text-center font-semibold text-[var(--menuary-copper)]">
                      Operatività
                    </th>
                    <th className="py-4 pl-4 text-center font-semibold">Autopilota</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.label} className="border-b border-[var(--menuary-line)]">
                      <td className="py-4 pr-4">{row.label}</td>
                      <td className="py-4 px-4 text-center">
                        <CellMark value={row.vetrina} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <CellMark value={row.operativita} />
                      </td>
                      <td className="py-4 pl-4 text-center">
                        <CellMark value={row.autopilota} />
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
      <FAQSection
        items={PRICING_FAQ}
        title="Tutto quello che vuoi sapere prima di iniziare."
      />

      <FinalCTASection />
    </MarketingShell>
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
          <Sparkles size={11} strokeWidth={2} />
          Consigliato
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
          <span className="amount">€{price}</span>
          <span className="unit">/mese</span>
        </span>
        {billing === "annual" ? (
          <p className="mt-2 text-xs text-[var(--menuary-muted)]">
            <span className="font-semibold text-[var(--menuary-sage)]">
              Risparmi €{saving}/anno
            </span>
            {" "}rispetto al mensile
          </p>
        ) : (
          <p className="mt-2 text-xs text-[var(--menuary-muted)]">
            €{plan.price_annual}/mese pagando annualmente
          </p>
        )}
        <p className="mt-1.5 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
          setup {plan.setup_from}
        </p>
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
    <span className="text-[14px] font-semibold text-[var(--menuary-ink)]">{value}</span>
  );
}
