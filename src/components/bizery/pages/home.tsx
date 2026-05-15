import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Users,
  TrendingUp,
  Boxes,
  BarChart2,
  Building2,
  Check,
  Plus,
} from "lucide-react";
import { BizeryShell } from "@/components/bizery/bizery-shell";
import { PRICING_PLANS, annualSaving } from "@/lib/platform-pricing";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80";

const FEATURES: { icon: typeof CalendarCheck; title: string; body: string; tone?: "dark" }[] = [
  {
    icon: BookOpen,
    title: "Sito aziendale su misura",
    body: "Identità, servizi, orari e contatti costruiti sul tuo brand. Niente template: ogni pagina rispecchia davvero la tua azienda.",
  },
  {
    icon: CalendarCheck,
    title: "Prenotazioni e appuntamenti",
    body: "Agenda integrata con conferme automatiche, promemoria ai clienti e calendario operativo. Zero telefonate per fissare un appuntamento.",
    tone: "dark",
  },
  {
    icon: BookOpen,
    title: "Listino servizi digitale",
    body: "Catalogo dei tuoi servizi consultabile da sito e QR. Aggiornalo in due clic, sempre online, sempre aggiornato.",
  },
  {
    icon: Users,
    title: "CRM clienti",
    body: "Storico clienti, preferenze, ricorrenze e note operative. Sai chi hai davanti prima ancora che apra bocca.",
  },
  {
    icon: TrendingUp,
    title: "Analytics e report",
    body: "Appuntamenti per fascia oraria, servizi più richiesti, scontrino medio. Dati chiari per decidere meglio.",
    tone: "dark",
  },
  {
    icon: Boxes,
    title: "Costi e margini",
    body: "Collega materiali e ore operative ai singoli servizi. Vedi il margine reale — prima di comunicare il listino.",
  },
  {
    icon: Building2,
    title: "Multi-sede",
    body: "Gestisci più sedi con un unico account. Listini differenziati, report comparativi e permessi staff per sede.",
  },
  {
    icon: ShieldCheck,
    title: "Staff e ruoli",
    body: "Permessi granulari per ogni membro del team: chi può vedere la cassa, chi gestisce gli appuntamenti, chi modifica i servizi.",
  },
];

const FAQ = [
  {
    q: "Posso usare solo il sito, senza la gestione appuntamenti?",
    a: "Sì. Bizery è modulare: parti dal piano Vetrina con sito + listino digitale, e quando vuoi accendi appuntamenti, CRM, analytics o multi-sede senza dover rifare nulla.",
  },
  {
    q: "Quanto tempo serve per andare online?",
    a: "Per il piano Vetrina, in media 3–5 settimane dalla prima chiamata al go-live. Il piano Operatività richiede 4–6 settimane per includere l'agenda e la configurazione dei moduli operativi.",
  },
  {
    q: "Il contratto è annuale?",
    a: "Sì. La durata minima è di 12 mesi senza recesso anticipato. Puoi però cambiare piano — salire o scendere — in qualsiasi momento: la variazione è attiva dal mese successivo.",
  },
  {
    q: "Cosa è incluso nel canone?",
    a: "Hosting, dominio (se gestito da noi), certificati SSL, backup, aggiornamenti tecnici e tutte le nuove funzioni del prodotto. Più il supporto del nostro team.",
  },
  {
    q: "Ci sono commissioni su prenotazioni o vendite?",
    a: "Zero. Bizery non trattiene nulla sulle tue prenotazioni o transazioni. Quello che incassi è tuo, integrale.",
  },
  {
    q: "Lavorate solo a Milano o in tutta Italia?",
    a: "Lo studio è a Milano, ma seguiamo aziende in tutta Italia. La maggior parte del lavoro avviene da remoto, con un sopralluogo quando serve davvero.",
  },
];

export function BizeryHomePage() {
  return (
    <BizeryShell>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, var(--menuary-porcelain) 0%, var(--menuary-paper) 60%)",
          }}
          aria-hidden
        />
        <div className="menuary-container relative pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid items-end gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Piattaforma operativa per aziende di servizi</p>
              <h1
                className="mt-7 text-[clamp(2.8rem,7vw,6.2rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Il sistema operativo
                <br />
                della tua azienda.
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  Sito, agenda, clienti.
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-[17px] leading-[1.75] text-[var(--menuary-muted)]">
                Bizery è una piattaforma modulare per studi professionali, saloni, centri
                benessere, officine e qualsiasi azienda di servizi: dal sito su misura
                alla gestione completa — appuntamenti, listino, CRM, analytics e multi-sede.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link href="/contatti" className="menuary-button menuary-button-accent">
                  Richiedi una proposta
                </Link>
                <Link href="#moduli" className="menuary-link">
                  Come puoi usarlo
                  <ArrowUpRight size={16} strokeWidth={1.6} />
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={14} strokeWidth={1.7} className="text-[var(--menuary-sage)]" />
                  Prima chiamata gratuita
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={14} strokeWidth={1.7} className="text-[var(--menuary-copper)]" />
                  8 moduli integrati
                </span>
              </div>
            </div>

            {/* Hero image */}
            <figure className="menuary-fade-up menuary-fade-up-d2 relative">
              <div className="menuary-photo aspect-[4/5] w-full">
                <Image
                  src={HERO_IMAGE}
                  alt="Team in ufficio in una azienda di servizi"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 44vw"
                  className="object-cover"
                />
              </div>

              {/* Floating appuntamento card */}
              <div
                aria-hidden
                className="absolute -bottom-6 -left-6 hidden w-[17rem] rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)]/95 p-4 backdrop-blur-md shadow-[0_24px_60px_-20px_rgba(15,23,42,0.22)] sm:block"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
                    <CalendarCheck size={16} strokeWidth={1.8} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--menuary-muted)] font-bold">
                      Nuovo appuntamento
                    </p>
                    <p className="text-sm font-semibold truncate">
                      Giovedì 29 · ore 14:30
                    </p>
                  </div>
                  <span className="relative inline-flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--menuary-sage)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--menuary-sage)]" />
                  </span>
                </div>
              </div>

              {/* Floating stat */}
              <div
                aria-hidden
                className="absolute -top-5 right-3 hidden rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)]/95 px-4 py-3 backdrop-blur-md shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] md:block"
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--menuary-muted)] font-bold">
                  Margine · live
                </p>
                <p
                  className="text-xl mt-1 font-medium"
                  style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                >
                  Servizio{" "}
                  <span className="text-[var(--menuary-sage)]">72%</span>
                </p>
              </div>

              <figcaption className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
                <span>— Studio Bizery</span>
                <span>Milano · Italia</span>
              </figcaption>
            </figure>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4 lg:gap-14">
            {[
              ["8", "moduli integrati"],
              ["+30", "aziende attive"],
              ["0", "commissioni"],
              ["24h", "supporto incluso"],
            ].map(([n, l]) => (
              <div key={l} className="menuary-stat">
                <p
                  className="text-4xl font-medium"
                  style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                >
                  {n}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id="moduli"
        className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]"
      >
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:items-end">
            <div>
              <p className="menuary-section-label">Otto moduli, un solo prodotto</p>
              <h2
                className="mt-6 text-[clamp(2.4rem,5vw,4.4rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Dal sito al
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  CRM clienti.
                </span>
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:justify-self-end lg:text-right">
              Bizery copre l&apos;intera catena operativa di un&apos;azienda di servizi: dalla
              vetrina online alla gestione agenda, dal CRM al controllo costi.
              Stesso linguaggio, stesso database, stesso supporto.
            </p>
          </div>

          <div className="mt-14 grid gap-px border-[var(--menuary-line)] sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <article
                  key={f.title}
                  className="menuary-feature-card"
                  data-tone={f.tone ?? "light"}
                >
                  <div className="menuary-feature-icon">
                    <Icon size={18} strokeWidth={1.6} />
                  </div>
                  <h3 className="text-[1.15rem] font-semibold leading-snug">{f.title}</h3>
                  <p className="text-[14px] leading-6">{f.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="menuary-section-label justify-center">Offerta</p>
            <h2
              className="mt-6 text-[clamp(2.4rem,5vw,4.2rem)] font-medium leading-[1.05] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              Parti dal sito giusto.
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                Aggiungi solo ciò che serve.
              </span>
            </h2>
            <p className="mt-6 text-[15px] leading-7 text-[var(--menuary-muted)]">
              Tre piani per aziende di ogni dimensione. Prezzi chiari, zero commissioni
              su prenotazioni e transazioni.
            </p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <article
                key={plan.slug}
                className={
                  "relative flex flex-col gap-5 border p-8 transition-colors " +
                  (plan.is_featured
                    ? "border-[var(--menuary-copper)] bg-[var(--menuary-porcelain)] lg:-translate-y-2"
                    : "border-[var(--menuary-line)] bg-[var(--menuary-paper)] hover:border-[var(--menuary-ink)]/30")
                }
              >
                {plan.is_featured && (
                  <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-[var(--menuary-copper)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                    <Sparkles size={11} strokeWidth={2} />
                    Consigliato
                  </span>
                )}
                <div>
                  <h3
                    className="text-3xl font-medium tracking-[-0.02em]"
                    style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                  >
                    {plan.marketing_name}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--menuary-copper)]">
                    {plan.tagline}
                  </p>
                </div>
                <div>
                  <span className="menuary-price-tag">
                    <span className="amount">€{plan.price_annual}</span>
                    <span className="unit">/mese</span>
                  </span>
                  <p className="mt-1 text-xs text-[var(--menuary-muted)]">
                    <span className="font-semibold text-[var(--menuary-sage)]">
                      Risparmio €{annualSaving(plan)}/anno
                    </span>{" "}con pagamento annuale
                  </p>
                </div>
                <ul className="space-y-2.5 text-[14px]">
                  {plan.marketing_items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--menuary-copper)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contatti"
                  className={
                    "mt-auto inline-flex items-center justify-center gap-2 " +
                    (plan.is_featured
                      ? "menuary-button menuary-button-accent"
                      : "menuary-button menuary-button-light")
                  }
                >
                  {plan.cta_label ?? "Richiedi proposta"}
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-10 text-center text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
            Tutti i prezzi sono IVA esclusa · contratto annuale ·{" "}
            <Link href="/pricing" className="underline hover:text-[var(--menuary-ink)]">
              vedi tutte le funzioni
            </Link>
          </p>
        </div>
      </section>

      {/* ── COMPARISON: Bizery vs sito tradizionale ── */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 lg:items-center">
            <div>
              <p className="menuary-section-label">Perché Bizery</p>
              <h2
                className="mt-6 text-[clamp(2.2rem,4.4vw,3.8rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Non è un sito.
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  È il sistema operativo
                  <br />
                  della tua azienda.
                </span>
              </h2>
              <p className="mt-6 text-[15px] leading-7 text-[var(--menuary-muted)]">
                Un sito fermo vale poco. Bizery collega la vetrina online alla gestione
                quotidiana: gli appuntamenti si scrivono in agenda da soli, il CRM
                aggiorna i clienti in tempo reale, i costi si calcolano senza fogli Excel.
              </p>
              <Link href="/contatti" className="mt-8 menuary-button menuary-button-dark inline-flex">
                Inizia ora
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { label: "Sito aggiornabile in autonomia", bizery: true, old: false },
                { label: "Agenda prenotazioni integrata", bizery: true, old: false },
                { label: "CRM clienti nativo", bizery: true, old: false },
                { label: "Analytics e report", bizery: true, old: false },
                { label: "Costi e margini per servizio", bizery: true, old: false },
                { label: "Multi-sede con un account", bizery: true, old: false },
                { label: "Zero commissioni", bizery: true, old: false },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-5 py-3.5"
                >
                  <span className="text-[15px]">{row.label}</span>
                  <div className="flex items-center gap-6 shrink-0">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--menuary-muted)]">
                      <span className={row.bizery ? "text-[var(--menuary-sage)]" : "text-[var(--menuary-muted)]"}>
                        {row.bizery ? <Check size={14} /> : <Plus size={14} className="rotate-45" />}
                      </span>
                      Bizery
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--menuary-muted)]">
                      <span className="text-[var(--menuary-muted)]">
                        <Plus size={14} className="rotate-45" />
                      </span>
                      Tradizionale
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="mx-auto max-w-3xl">
            <p className="menuary-section-label">FAQ</p>
            <h2
              className="mt-6 mb-12 text-[clamp(2.2rem,4vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              Domande frequenti.
            </h2>
            <div>
              {FAQ.map((item) => (
                <details key={item.q} className="menuary-faq-item">
                  <summary>
                    {item.q}
                    <span className="menuary-faq-toggle" aria-hidden>
                      <Plus size={16} strokeWidth={1.8} />
                    </span>
                  </summary>
                  <p className="menuary-faq-answer">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        className="border-t border-[var(--menuary-line)]"
        style={{ background: "var(--menuary-ink)" }}
      >
        <div className="menuary-container py-24 text-center lg:py-28">
          <p
            className="text-xs uppercase tracking-[0.24em] text-[var(--menuary-paper)]/40 font-bold"
          >
            Inizia oggi
          </p>
          <h2
            className="mt-6 text-[clamp(2.6rem,6vw,5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--menuary-paper)]"
            style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
          >
            La tua azienda merita
            <br />
            <span className="italic text-[var(--menuary-copper)]">
              una piattaforma vera.
            </span>
          </h2>
          <p className="mt-8 text-[16px] leading-7 text-[var(--menuary-paper)]/60 max-w-md mx-auto">
            Prima chiamata gratuita. Proposta su misura in 48 ore.
            Nessun vincolo prima di firmare.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contatti" className="menuary-button menuary-button-accent">
              Richiedi una proposta
            </Link>
            <Link href="/pricing" className="menuary-link menuary-link-light">
              Vedi i piani
              <ArrowUpRight size={16} strokeWidth={1.6} />
            </Link>
          </div>
        </div>
      </section>
    </BizeryShell>
  );
}
