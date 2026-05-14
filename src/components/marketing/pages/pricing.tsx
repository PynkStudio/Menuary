import Link from "next/link";
import { Check, Minus, Sparkles } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  FAQSection,
  FinalCTASection,
} from "@/components/marketing/marketing-sections";

type Plan = {
  name: string;
  tagline: string;
  monthly: string;
  setup: string;
  body: string;
  items: string[];
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Presenza",
    tagline: "Sito su misura",
    monthly: "39",
    setup: "da € 690",
    body: "Per chi vuole essere scelto meglio online. Una presenza curata e coerente con il locale.",
    items: [
      "Dominio personalizzato",
      "Design su misura sull'identità",
      "Menu digitale aggiornabile",
      "Recensioni, foto, orari, contatti",
      "Hosting, SSL, backup inclusi",
    ],
  },
  {
    name: "Operatività",
    tagline: "Sito + servizi",
    monthly: "79",
    setup: "da € 990",
    featured: true,
    body: "Per locali che vogliono trasformare il sito in uno strumento di lavoro. Più richieste, meno errori.",
    items: [
      "Tutto quello di Presenza",
      "Prenotazioni dal sito",
      "Ordini da asporto e dal tavolo",
      "QR menu per sala e tavoli",
      "Pannello staff per cucina e cassa",
    ],
  },
  {
    name: "Crescita",
    tagline: "Evoluzione continua",
    monthly: "Custom",
    setup: "preventivo dedicato",
    body: "Per ristoranti che vogliono partire bene e aggiungere funzioni quando il locale ne ha bisogno.",
    items: [
      "Tutto quello di Operatività",
      "Funzioni custom su richiesta",
      "Campagne stagionali e nuove sezioni",
      "Multi-sede e multi-brand",
      "Supporto prioritario dedicato",
    ],
  },
];

type Row = {
  label: string;
  presenza: boolean | string;
  operativita: boolean | string;
  crescita: boolean | string;
};

const COMPARE_ROWS: Row[] = [
  { label: "Sito personalizzato", presenza: true, operativita: true, crescita: true },
  { label: "Menu digitale aggiornabile", presenza: true, operativita: true, crescita: true },
  { label: "Hosting, SSL, backup", presenza: true, operativita: true, crescita: true },
  { label: "Prenotazioni online", presenza: false, operativita: true, crescita: true },
  { label: "Ordini asporto / al tavolo", presenza: false, operativita: true, crescita: true },
  { label: "QR menu per la sala", presenza: false, operativita: true, crescita: true },
  { label: "Pannello staff", presenza: false, operativita: true, crescita: true },
  { label: "Multi-sede", presenza: false, operativita: false, crescita: true },
  { label: "Funzioni custom", presenza: false, operativita: false, crescita: true },
  {
    label: "Supporto",
    presenza: "Standard",
    operativita: "Prioritario",
    crescita: "Dedicato",
  },
];

const PRICING_FAQ = [
  {
    q: "C'è un vincolo annuale?",
    a: "No. I piani Menuary sono mensili, senza penali. Puoi cambiare piano o disdire con un mese di preavviso. Il setup iniziale resta acquisito.",
  },
  {
    q: "Cosa è incluso nel canone mensile?",
    a: "Hosting, dominio (se gestito da noi), certificati SSL, backup, aggiornamenti tecnici, sicurezza e tutte le nuove funzioni del prodotto. Più il supporto del nostro team.",
  },
  {
    q: "Posso passare da un piano all'altro?",
    a: "Sì, in qualsiasi momento. Aggiungere prenotazioni, ordini o nuove sezioni è una semplice attivazione, senza dover rifare il sito.",
  },
  {
    q: "Quanto tempo serve per andare online?",
    a: "Per Presenza, in media 3–5 settimane dalla prima chiamata. Operatività richiede 4–6 settimane. Crescita ha tempi dedicati in base al progetto.",
  },
  {
    q: "Posso usare il mio dominio attuale?",
    a: "Certo. Possiamo configurare il tuo dominio esistente o registrarne uno nuovo per te. In entrambi i casi nessun costo aggiuntivo.",
  },
  {
    q: "Le commissioni su prenotazioni e ordini?",
    a: "Zero. Menuary non trattiene nulla sui tuoi ordini o prenotazioni. Quello che incassi è tuo, integrale.",
  },
];

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

export function MarketingPricingPage() {
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
              Tre piani pensati per ristoranti di ogni dimensione. Prezzi
              chiari, nessun vincolo annuale, nessuna commissione su
              prenotazioni e ordini.
            </p>
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section>
        <div className="menuary-container py-20 lg:py-24">
          <div className="grid gap-px sm:gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={
                  "relative flex flex-col gap-6 border bg-[var(--menuary-porcelain)] p-8 sm:p-10 transition-colors " +
                  (plan.featured
                    ? "border-[var(--menuary-copper)] bg-[var(--menuary-paper)] lg:-translate-y-2"
                    : "border-[var(--menuary-line)] hover:border-[var(--menuary-ink)]/40")
                }
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-[var(--menuary-copper)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                    <Sparkles size={11} strokeWidth={2} />
                    Consigliato
                  </span>
                )}

                <div>
                  <h2 className="menuary-display text-3xl">{plan.name}</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--menuary-copper)]">
                    {plan.tagline}
                  </p>
                </div>

                <div>
                  <span className="menuary-price-tag">
                    {plan.monthly === "Custom" ? (
                      <span className="amount">Custom</span>
                    ) : (
                      <>
                        <span className="amount">€{plan.monthly}</span>
                        <span className="unit">/mese</span>
                      </>
                    )}
                  </span>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                    setup {plan.setup}
                  </p>
                </div>

                <p className="text-[15px] leading-7 text-[var(--menuary-muted)]">{plan.body}</p>

                <ul className="space-y-3 text-[15px]">
                  {plan.items.map((item) => (
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
                    "mt-2 " +
                    (plan.featured
                      ? "menuary-button menuary-button-accent"
                      : "menuary-button menuary-button-light")
                  }
                >
                  {plan.featured ? "Inizia con Operatività" : "Richiedi proposta"}
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-12 text-center text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
            Tutti i prezzi sono IVA esclusa · pagamento mensile o annuale
          </p>
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
                      Operatività
                    </th>
                    <th className="py-4 pl-4 text-center font-semibold">Crescita</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.label} className="border-b border-[var(--menuary-line)]">
                      <td className="py-4 pr-4">{row.label}</td>
                      <td className="py-4 px-4 text-center">
                        <CellMark value={row.presenza} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <CellMark value={row.operativita} />
                      </td>
                      <td className="py-4 pl-4 text-center">
                        <CellMark value={row.crescita} />
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
