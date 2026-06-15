"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus, Phone } from "lucide-react";
import {
  AI_ADDON,
  ORPHEO_PRICING_PLANS,
  annualSaving,
  type PricingAddon,
  type PricingPlan,
} from "@/lib/platform-pricing";
import { formatSetupFrom } from "@/lib/pricing-format";
import type { AppLocale } from "@/i18n";
import { localizedPath } from "@/lib/marketing-seo";

type Row = {
  label: string;
  presenza: boolean | string;
  pro: boolean | string;
  management: boolean | string;
};

const COMPARE_ROWS: Row[] = [
  { label: "Sito ufficiale e dominio", presenza: true, pro: true, management: true },
  { label: "Bio, foto ufficiali e press kit", presenza: true, pro: true, management: true },
  { label: "Catalogo opere essenziale", presenza: true, pro: true, management: true },
  { label: "Link provider e canali social", presenza: true, pro: true, management: true },
  { label: "Recensioni e citazioni selezionate", presenza: true, pro: true, management: true },
  { label: "CRM contatti professionali", presenza: false, pro: true, management: true },
  { label: "Booking eventi e opportunità", presenza: false, pro: true, management: true },
  { label: "Asset manager", presenza: false, pro: true, management: true },
  { label: "Reputation & reviews provider", presenza: false, pro: true, management: true },
  { label: "Diritti, licenze e scadenze", presenza: false, pro: false, management: true },
  { label: "Royalty e rendicontazioni", presenza: false, pro: false, management: true },
  { label: "Fanbase, newsletter e segmenti", presenza: false, pro: false, management: true },
  { label: "Multi-identità e ruoli avanzati", presenza: false, pro: false, management: true },
  { label: "Integrazione AI (add-on)", presenza: false, pro: "+€60/mese", management: "+€60/mese" },
  { label: "Supporto", presenza: "Standard", pro: "Prioritario", management: "Dedicato" },
];

const PRICING_FAQ = [
  {
    q: "Per quali professionisti è pensato Orpheo?",
    a: "Per autori, musicisti, cantanti, attori, registi, speaker, creatori, collettivi e team creativi che devono gestire presenza, opere, opportunità, recensioni e materiali professionali.",
  },
  {
    q: "Le recensioni Amazon o Goodreads sono integrate?",
    a: "Orpheo prevede un modulo Reputation & Reviews per aggregare provider rilevanti. Dove non esiste un'integrazione ufficiale, usiamo import controllati, link sorgente e metriche aggregate nel rispetto dei termini dei provider.",
  },
  {
    q: "Posso dare accesso a manager o ufficio stampa?",
    a: "Sì. I piani Pro e Management includono permessi per collaboratori, così artista, manager, agente, ufficio stampa o amministrazione possono lavorare nello stesso pannello.",
  },
  {
    q: "Il catalogo opere supporta categorie diverse?",
    a: "Sì. Il modello è pensato per libri, album, brani, filmografia, spettacoli, crediti, premi, collaborazioni, asset e link esterni.",
  },
  {
    q: "Orpheo è un servizio dedicato o un sito generico adattato?",
    a: "Orpheo è un servizio dedicato ai professionisti creativi: struttura, moduli e flussi sono pensati per presenza pubblica, opere, booking, materiali, diritti e fanbase.",
  },
];

export function OrpheoPricingPage({
  plans = ORPHEO_PRICING_PLANS,
  aiAddon = AI_ADDON,
  priceLocale = "it-IT",
  locale = "it",
}: {
  plans?: PricingPlan[];
  aiAddon?: PricingAddon;
  priceLocale?: string;
  locale?: AppLocale;
}) {
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");
  const maxSaving = Math.max(...plans.map(annualSaving));
  const displayCurrency = plans[0]?.currency ?? "EUR";
  const contactHref = localizedPath("/contatti", locale);

  return (
    <>
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-20 lg:pt-28 lg:pb-24">
          <div className="grid items-end gap-14 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Orpheo pricing</p>
              <h1 className="mt-7 text-[clamp(3rem,6.8vw,6rem)] font-medium leading-[1.05] tracking-[-0.02em] text-balance" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                Tre piani per
                <br />
                <span className="italic text-[var(--menuary-copper)]">professionisti creativi.</span>
              </h1>
            </div>
            <p className="menuary-fade-up menuary-fade-up-d1 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:text-right">
              Presenza ufficiale, catalogo opere, booking, diritti, recensioni e audience in un unico pannello.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="menuary-container py-20 lg:py-24">
          <div className="mb-14 flex flex-wrap items-center justify-center gap-4">
            <div className="inline-flex items-center gap-1 rounded-full border border-[var(--menuary-line)] p-1">
              <button onClick={() => setBilling("annual")} className={billing === "annual" ? activeToggleClass : inactiveToggleClass}>
                Annuale anticipato
              </button>
              <button onClick={() => setBilling("monthly")} className={billing === "monthly" ? activeToggleClass : inactiveToggleClass}>
                Mensile
              </button>
            </div>
            {billing === "annual" && maxSaving > 0 && (
              <p className="text-xs font-semibold text-[var(--menuary-sage)]">
                Risparmi fino a {formatPlanPrice(maxSaving, displayCurrency, priceLocale)}/anno
              </p>
            )}
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.slug}
                plan={plan}
                billing={billing}
                priceLocale={priceLocale}
                contactHref={contactHref}
              />
            ))}
          </div>

          <p className="mt-10 text-center text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
            Tutti i prezzi sono IVA esclusa · contratto annuale · {billing === "annual" ? "pagamento anticipato 12 mesi" : "fatturazione mensile"}
          </p>
        </div>
      </section>

      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-20 lg:py-24">
          <div className="grid items-start gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">Dal piano Pro in su</p>
              <h2 className="mt-6 text-[clamp(2rem,4.2vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.02em] text-balance" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                Assistente AI per richieste e booking.
              </h2>
              <p className="mt-6 text-[17px] leading-[1.75] text-[var(--menuary-muted)]">
                Risponde a richieste inbound, raccoglie dettagli evento o proposta, qualifica contatti, prepara follow-up e aggiorna il CRM.
              </p>
              <div className="mt-8 inline-flex items-baseline gap-2">
                <span className="text-[3rem] font-medium leading-none" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                  +{formatPlanPrice(aiAddon.monthly, aiAddon.currency ?? displayCurrency, priceLocale)}
                </span>
                <span className="text-sm text-[var(--menuary-muted)]">/mese</span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-[1.65] text-[var(--menuary-muted)]">
                {aiAddon.minutesNote}
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
                  <Phone size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--menuary-muted)]">IA creativa</p>
                  <p className="text-base font-medium" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>Add-on assistente AI</p>
                </div>
              </div>
              <ul className="mt-8 space-y-4">
                {[
                  "Qualifica richieste booking, stampa, casting e collaborazioni",
                  "Prepara follow-up e note operative",
                  "Supporta più lingue per pubblico e partner internazionali",
                  "Aggiorna CRM e attività in sospeso",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-[1.5]">
                    <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--menuary-sage)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">Confronta</p>
              <h2 className="mt-6 text-[clamp(2.2rem,4.4vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                Moduli inclusi.
              </h2>
              <p className="mt-6 max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
                I piani sono pensati per crescere dal profilo ufficiale alla gestione completa di opere, opportunità e diritti.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left text-[15px]">
                <thead>
                  <tr className="border-b border-[var(--menuary-ink)]">
                    <th className="py-4 pr-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--menuary-muted)]">Modulo</th>
                    <th className="px-4 py-4 text-center font-semibold">Presenza</th>
                    <th className="px-4 py-4 text-center font-semibold text-[var(--menuary-copper)]">Pro</th>
                    <th className="py-4 pl-4 text-center font-semibold">Management</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.label} className="border-b border-[var(--menuary-line)]">
                      <td className="py-4 pr-4">{row.label}</td>
                      <td className="px-4 py-4 text-center"><CellMark value={row.presenza} /></td>
                      <td className="px-4 py-4 text-center"><CellMark value={row.pro} /></td>
                      <td className="py-4 pl-4 text-center"><CellMark value={row.management} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">Domande frequenti</p>
              <h2 className="mt-6 text-[clamp(2.2rem,4.4vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                Prima di iniziare.
              </h2>
            </div>
            <div>
              {PRICING_FAQ.map((item) => (
                <details key={item.q} className="menuary-faq-item group">
                  <summary>
                    <span>{item.q}</span>
                    <span className="menuary-faq-toggle" aria-hidden>
                      <span className="block transition-transform duration-200 group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="menuary-faq-answer">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const activeToggleClass = "rounded-full bg-[var(--menuary-ink)] px-5 py-2 text-sm font-semibold text-[var(--menuary-paper)] transition";
const inactiveToggleClass = "rounded-full px-5 py-2 text-sm font-semibold text-[var(--menuary-muted)] transition hover:text-[var(--menuary-ink)]";

function PlanCard({
  plan,
  billing,
  priceLocale,
  contactHref,
}: {
  plan: PricingPlan;
  billing: "annual" | "monthly";
  priceLocale: string;
  contactHref: string;
}) {
  const price = billing === "annual" ? plan.price_annual : plan.price_monthly;
  return (
    <article
      data-featured={plan.is_featured ? "true" : "false"}
      className="flex h-full flex-col border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-7 shadow-[0_1.4rem_4rem_rgba(23,17,31,0.05)] data-[featured=true]:border-[var(--menuary-copper)] data-[featured=true]:bg-[var(--menuary-porcelain)] md:p-8"
    >
      <div>
        <p className="min-h-10 text-xs font-bold uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
          {plan.tagline}
        </p>
        <h3 className="mt-5 text-3xl font-medium tracking-[-0.02em]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
          {plan.marketing_name}
        </h3>
        <p className="mt-4 text-[15px] leading-7 text-[var(--menuary-muted)]">
          {plan.description}
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-end gap-x-2 gap-y-1">
        <span className="text-5xl font-medium leading-none tracking-[-0.04em]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
          {formatPlanPrice(price, plan.currency ?? "EUR", priceLocale)}
        </span>
        <span className="pb-1 text-sm text-[var(--menuary-muted)]">/mese</span>
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
        Setup {formatSetupFrom(plan.setup_from, plan.currency ?? "EUR", priceLocale)}
      </p>
      <ul className="mt-8 space-y-4 border-t border-[var(--menuary-line)] pt-8">
        {plan.marketing_items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-[15px] leading-6">
            <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--menuary-sage)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-9">
        <Link href={contactHref} className={plan.is_featured ? "menuary-button menuary-button-dark w-full justify-center" : "menuary-button menuary-button-light w-full justify-center"}>
          {plan.cta_label ?? "Richiedi una demo"}
          <ArrowRight size={15} strokeWidth={1.8} className="ml-1" />
        </Link>
      </div>
    </article>
  );
}

function CellMark({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check size={17} strokeWidth={2.2} className="mx-auto text-[var(--menuary-sage)]" />;
  }
  if (value === false) {
    return <Minus size={17} strokeWidth={2} className="mx-auto text-[var(--menuary-muted)]" />;
  }
  return <span className="text-sm font-semibold text-[var(--menuary-ink)]">{value}</span>;
}

function formatPlanPrice(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
