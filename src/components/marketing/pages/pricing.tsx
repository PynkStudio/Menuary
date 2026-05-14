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
    name: "Vetrina",
    tagline: "Solo il sito",
    monthly: "39",
    setup: "da € 690",
    body: "Per chi vuole essere scelto meglio online. La forma minima: identità, menu e contatti curati.",
    items: [
      "Sito su misura, dominio personalizzato",
      "Menu digitale aggiornabile",
      "Recensioni, foto, orari, contatti",
      "Hosting, SSL, backup inclusi",
      "Aggiornamenti tecnici continui",
    ],
  },
  {
    name: "Operatività",
    tagline: "Sito + gestionale",
    monthly: "129",
    setup: "da € 1.490",
    featured: true,
    body: "Per locali che vogliono trasformare il sito in uno strumento di lavoro. Più richieste, meno errori, margini sotto controllo.",
    items: [
      "Tutto di Vetrina",
      "Prenotazioni · ordini · delivery",
      "Magazzino con alert sotto soglia",
      "Food cost & margini in tempo reale",
      "CRM clienti e analytics",
      "Pannello staff, cucina, cassa",
    ],
  },
  {
    name: "Autopilota",
    tagline: "Gestionale + IA · 2026",
    monthly: "Custom",
    setup: "lista d'attesa",
    body: "Per chi vuole un'assistente IA che risponde al telefono 24/7, gestisce prenotazioni e ordini con la voce del locale.",
    items: [
      "Tutto di Operatività",
      "IA al telefono 24/7",
      "Prenotazioni e ordini autonomi",
      "Cloning vocale opzionale",
      "Multilingua nativa (IT, EN, FR, ES, DE)",
      "Supporto prioritario dedicato",
    ],
  },
];

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
  { label: "IA al telefono 24/7", vetrina: false, operativita: false, autopilota: "2026" },
  { label: "Cloning vocale", vetrina: false, operativita: false, autopilota: "2026" },
  {
    label: "Supporto",
    vetrina: "Standard",
    operativita: "Prioritario",
    autopilota: "Dedicato",
  },
];

const PRICING_FAQ = [
  {
    q: "C'è un vincolo annuale?",
    a: "No. I piani Menuary sono mensili, senza penali. Puoi cambiare piano o disdire con un mese di preavviso. Il setup iniziale resta acquisito.",
  },
  {
    q: "Cosa è incluso nel canone mensile?",
    a: "Hosting, dominio (se gestito da noi), certificati SSL, backup, aggiornamenti tecnici, sicurezza e tutte le nuove funzioni del prodotto, su qualsiasi modulo. Più il supporto del nostro team.",
  },
  {
    q: "Posso passare da un piano all'altro?",
    a: "Sì, in qualsiasi momento. Aggiungere prenotazioni, ordini, magazzino, food cost o CRM è una semplice attivazione, senza dover rifare il sito.",
  },
  {
    q: "Quando è disponibile l'IA al telefono?",
    a: "L'assistente IA vocale arriva nel 2026 in beta privata. Con il piano Autopilota entri nella lista d'attesa con priorità di accesso, e nel frattempo paghi solo Operatività finché la funzione non è attiva.",
  },
  {
    q: "Quanto tempo serve per andare online?",
    a: "Per Vetrina, in media 3–5 settimane dalla prima chiamata. Operatività richiede 4–6 settimane perché include magazzino, food cost e configurazione dei moduli operativi. Autopilota ha tempi dedicati legati al rollout dell'IA.",
  },
  {
    q: "Posso usare il mio dominio attuale?",
    a: "Certo. Possiamo configurare il tuo dominio esistente o registrarne uno nuovo per te. In entrambi i casi nessun costo aggiuntivo.",
  },
  {
    q: "Le commissioni su prenotazioni, ordini e delivery?",
    a: "Zero. Menuary non trattiene nulla sui tuoi ordini, prenotazioni o consegne. Quello che incassi è tuo, integrale. Eventuali fee dei corrieri delivery dipendono dal provider che scegli.",
  },
  {
    q: "Il gestionale magazzino e food cost servono davvero?",
    a: "Se il locale fattura più di 10–15.000€ al mese sì. Magazzino significa scorte sotto soglia automatiche, niente ingredienti scaduti, niente piatti tolti la sera. Food cost significa vedere il margine reale per piatto — e capire perché un piatto popolare in realtà costa più di quanto rende.",
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
                  {plan.featured
                    ? "Inizia con Operatività"
                    : plan.monthly === "Custom"
                      ? "Entra in lista d'attesa"
                      : "Richiedi proposta"}
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
