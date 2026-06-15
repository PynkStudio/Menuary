import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { BizeryShell } from "@/components/bizery/bizery-shell";
import { getLocale } from "@/i18n";
import { localizedPath } from "@/lib/marketing-seo";

// ─── Principi ─────────────────────────────────────────────────────────────────

const STUDIO_PRINCIPLES = [
  {
    title: "Uno studio alla volta",
    body: "Non scaliamo a forza. Ogni progetto inizia ascoltando il titolare, capendo i servizi, il tipo di clientela e il modo in cui lo studio si distingue. Solo dopo arriviamo al sito.",
  },
  {
    title: "Niente template",
    body: "Non esiste una versione base da personalizzare. Il sito nasce da zero — font, palette, gerarchia, tono di voce — rispecchiando l'identità dello studio, non quella di un tema WordPress da €49.",
  },
  {
    title: "Design system prima del codice",
    body: "Prima di scrivere una riga definiamo il sistema visivo: tipografia, scala cromatica, spaziatura, micro-interazioni. Uno studio professionale merita un sito che porta avanti la sua identità, non che la appiattisce.",
  },
  {
    title: "La tecnica non si vede",
    body: "Velocità, sicurezza, manutenzione restano un nostro problema. Tu vedi un sito ordinato che fa quello che serve — e che su Google si comporta meglio dei concorrenti.",
  },
  {
    title: "Tempo lungo",
    body: "Non consegniamo un sito e sparisco. Lo teniamo vivo: aggiornamenti stagionali, nuove funzioni, evoluzioni del prodotto. Anno per anno, come un rapporto professionale.",
  },
];

// ─── Processo ─────────────────────────────────────────────────────────────────

const PROCESS_STEPS = [
  {
    n: "01",
    title: "Ascolto",
    body: "Una chiamata (o una visita). Capiamo lo studio, i servizi, la clientela, il tono di voce. Non facciamo brief generici.",
  },
  {
    n: "02",
    title: "Identità visiva",
    body: "Palette cromatica, tipografia, fotografia. Elementi che nascono da quello che lo studio già è — non da quello che sembrano i concorrenti.",
  },
  {
    n: "03",
    title: "Design system",
    body: "Prima di aprire l'editor definiamo le regole: componenti, spaziatura, scala. Il sistema poi scala su ogni pagina senza perdere coerenza.",
  },
  {
    n: "04",
    title: "Sviluppo",
    body: "Sito, listino servizi, appuntamenti, Google Maps. Tutto integrato nella stessa piattaforma — niente plugin di terze parti.",
  },
  {
    n: "05",
    title: "Go-live & oltre",
    body: "Online entro 7 giorni dalla firma. Poi aggiornamenti continui: nuovi servizi, prezzi, eventi, promozioni — senza aprire un ticket.",
  },
];

// ─── Perché nel 2026 ──────────────────────────────────────────────────────────

const WHY_2026 = [
  {
    title: "Google ti giudica prima del cliente",
    body: "L'86% delle persone cerca un professionista o uno studio online prima di contattarlo. Scheda Google, recensioni, sito: decidono se si prenota da te o dal concorrente.",
  },
  {
    title: "Le piattaforme prendono la commissione, tu fai il lavoro",
    body: "Booking, marketplace di settore e OTA trattengono fino al 15-20% per prenotazione. Il tuo sito non prende nulla. Un appuntamento diretto al giorno già copre il canone annuale.",
  },
  {
    title: "LinkedIn e Instagram non bastano",
    body: "Non gestiscono appuntamenti, non appaiono nelle ricerche Google Maps, non sono tuoi. Il sito è un asset che possiedi e che si accumula nel tempo.",
  },
  {
    title: "Il sito è la prima sala d'attesa",
    body: "Prima ancora di chiamarti, il potenziale cliente passa dal tuo sito. Se la cura è quella di un volantino fotocopiato, è già un segnale sbagliato.",
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const STUDIO_FAQ = [
  {
    q: "A cosa serve davvero un sito nel 2026 per uno studio professionale?",
    a: "Serve a controllare la tua presenza online invece di affidarla ad altri. Google ti giudica prima ancora che il cliente chiami: orari aggiornati, recensioni, foto, posizione. Un sito ben fatto su una piattaforma solida si posiziona meglio di un profilo social, raccoglie appuntamenti senza commissioni e rappresenta il tuo studio 24 ore su 24.",
  },
  {
    q: "Non bastano LinkedIn e Instagram?",
    a: "No, per due motivi fondamentali. Primo: Google non indicizza i contenuti di LinkedIn o Instagram — se qualcuno cerca 'avvocato vicino a me' o 'fisioterapista a Milano', il tuo profilo social non appare. Secondo: queste piattaforme non sono tue; l'algoritmo può cambiare, l'account può essere sospeso, i follower possono diminuire. Il sito è un asset che possiedi e che cresce nel tempo.",
  },
  {
    q: "Qual è la differenza tra un vostro sito e un template WordPress?",
    a: "Un template è un vestito confezionato in serie: puoi cambiare i colori, ma la struttura è quella di migliaia di altri siti. I nostri siti nascono da un design system costruito sull'identità dello studio — font, palette, gerarchia visiva, tono di voce. Quando guardi il sito devi pensare 'questo sembra noi', non 'ho già visto questa struttura da qualche parte'.",
  },
  {
    q: "Cosa significa 'design system identitario'?",
    a: "Prima del sito definiamo le regole visive dello studio: la coppia tipografica, la scala di colori, le proporzioni degli spazi. Queste regole si applicano poi a ogni pagina, ogni card, ogni bottone — creando un'esperienza coerente, riconoscibile, professionale.",
  },
  {
    q: "Quando un sito si ripaga?",
    a: "Prima di quanto pensi. Marketplace e piattaforme di settore trattengono fino al 15-20% per appuntamento. Se il tuo sito porta anche solo un appuntamento diretto al giorno — invece che passare da una piattaforma — su base annua il risparmio supera ampiamente il costo del canone.",
  },
  {
    q: "Quanto ci vuole per andare online?",
    a: "Entro 7 giorni dalla firma del contratto. La configurazione iniziale — onboarding, design, personalizzazione — avviene prima, in media 2–4 settimane.",
  },
  {
    q: "Come nasce il design del mio sito?",
    a: "Inizia con una chiamata. Guardiamo lo studio, i servizi, il materiale esistente, il tono di voce. Poi costruiamo un sistema visivo coerente — non scegliamo font e colori a caso, li ricaviamo da quello che lo studio già è. Solo allora iniziamo a scrivere codice.",
  },
  {
    q: "Posso aggiornare il sito da solo?",
    a: "Sì. Listino, orari, foto, servizi, eventi: tutto si aggiorna dal pannello senza toccare il codice, anche dallo smartphone tra un appuntamento e l'altro.",
  },
  {
    q: "Lavorate solo a Milano?",
    a: "No. Lo studio è a Milano, ma seguiamo studi e aziende in tutta Italia. La maggior parte del lavoro avviene da remoto. Quando ha senso, veniamo da voi.",
  },
  {
    q: "Il sito è disponibile in più lingue?",
    a: "Sì. Ogni sito viene realizzato in versione multilingua di default, coprendo le principali lingue europee: italiano, inglese, francese, tedesco e spagnolo. Su richiesta è possibile aggiungere altre lingue in base all'utenza tipica dello studio — ad esempio russo, arabo, cinese o giapponese. Il costo delle lingue aggiuntive viene concordato in fase di preventivo.",
  },
];

// ─── Componente principale ────────────────────────────────────────────────────

export async function BizeryAboutPage() {
  const locale = await getLocale();
  return (
    <BizeryShell>
      {/* Hero */}
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-20 lg:pt-28 lg:pb-24">
          <div className="grid items-end gap-14 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Lo studio</p>
              <h1
                className="mt-7 text-[clamp(3rem,6.8vw,6rem)] font-medium leading-[1.05] tracking-[-0.02em] text-balance"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Ogni studio merita
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  un sito che lo rappresenti.
                </span>
              </h1>
            </div>
            <p className="menuary-fade-up menuary-fade-up-d1 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:text-right">
              Bizery è la piattaforma digitale per studi professionali e aziende di
              servizi. Niente template, niente identità in serie. Ogni sito nasce da
              un design system costruito sullo studio — sui suoi servizi, sulla sua
              clientela, sul suo modo di lavorare.
            </p>
          </div>
        </div>
      </section>

      {/* Manifesto + Principi */}
      <section>
        <div className="menuary-container py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
            <div>
              <p className="menuary-section-label">Manifesto</p>
              <p
                className="mt-8 text-[1.45rem] leading-[1.55] font-medium tracking-[-0.01em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Uno studio professionale cura ogni dettaglio — la consulenza, la
                comunicazione, il rapporto col cliente. Il sito deve fare lo stesso.
                Non meno, mai di meno.
              </p>
              <p className="mt-8 text-[15px] leading-7 text-[var(--menuary-muted)]">
                Crediamo che il digitale sia un&apos;estensione dello studio, non una
                brochure online. Per questo non usiamo template: costruiamo un sistema
                visivo che nasce dall&apos;identità del cliente e la porta avanti su
                ogni schermo.
              </p>
            </div>

            <div className="border-t border-[var(--menuary-line)]">
              {STUDIO_PRINCIPLES.map((p, i) => (
                <div
                  key={p.title}
                  className="grid gap-4 border-b border-[var(--menuary-line)] py-8 sm:grid-cols-[auto_1fr] sm:gap-10"
                >
                  <span className="menuary-index">— {String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3
                      className="text-2xl font-medium"
                      style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                    >
                      {p.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--menuary-muted)]">
                      {p.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Perché nel 2026 */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div>
              <p className="menuary-section-label">Perché adesso</p>
              <h2
                className="mt-6 text-[clamp(2.2rem,4.6vw,4rem)] font-medium leading-[1.05] tracking-[-0.02em] text-balance"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                A cosa serve un sito
                <br />
                <span className="italic text-[var(--menuary-copper)]">nel 2026?</span>
              </h2>
              <p className="mt-7 max-w-md text-[15px] leading-[1.75] text-[var(--menuary-muted)]">
                Non a &ldquo;esserci online&rdquo;. Serve a controllare come vieni trovato,
                come vieni percepito e quanti appuntamenti passano per piattaforme
                che prendono la commissione invece di arrivare direttamente da te.
              </p>
              <Link href={localizedPath("/contatti", locale)} className="menuary-link mt-8 inline-flex">
                Parliamone
                <ArrowUpRight size={14} strokeWidth={1.6} />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {WHY_2026.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-6"
                >
                  <h3
                    className="text-[1.25rem] font-medium leading-snug"
                    style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.7] text-[var(--menuary-muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Processo */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
            <div>
              <p className="menuary-section-label">Il processo</p>
              <h2
                className="mt-6 text-[clamp(2.2rem,4.4vw,3.8rem)] font-medium leading-[1.05] tracking-[-0.02em] text-balance"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Come nasce
                <br />
                il tuo sito.
              </h2>
              <p className="mt-6 text-[15px] leading-[1.75] text-[var(--menuary-muted)]">
                Non iniziamo dall&apos;editor. Iniziamo dall&apos;identità — poi costruiamo
                il sistema che la porta avanti.
              </p>
            </div>

            <ol className="border-t border-[var(--menuary-line)]">
              {PROCESS_STEPS.map((step) => (
                <li
                  key={step.n}
                  className="grid gap-6 border-b border-[var(--menuary-line)] py-8 sm:grid-cols-[auto_1fr] sm:gap-10"
                >
                  <span
                    className="text-base font-medium text-[var(--menuary-copper)]"
                    style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                  >
                    {step.n}
                  </span>
                  <div>
                    <h3
                      className="text-2xl font-medium"
                      style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                    >
                      {step.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-7 text-[var(--menuary-muted)]">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Cosa offriamo */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">Cosa offriamo</p>
              <h2
                className="mt-6 text-[clamp(2.2rem,4.6vw,4rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Quattro mestieri
                <br />
                sotto un solo tetto.
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)]">
                Quello che un tempo richiedeva tre fornitori diversi — agenzia
                creativa, sviluppatore, consulente digitale — oggi vive in un
                solo posto, con chi conosce il settore dei servizi professionali.
              </p>
            </div>

            <ul className="grid gap-px border-t border-[var(--menuary-line)] sm:grid-cols-2">
              {[
                [
                  "Design",
                  "Identità visiva costruita sullo studio: font, palette, fotografia. Ogni elemento nasce da quello che sei, non da ciò che sembrano i concorrenti.",
                ],
                [
                  "Sviluppo",
                  "Sito, listino servizi, appuntamenti, Google Maps. Una sola piattaforma integrata — niente plugin di terze parti che si rompono da soli.",
                ],
                [
                  "Gestione",
                  "Aggiornamenti di orari, servizi, tariffe, news. Dal pannello, senza aprire un ticket, anche dallo smartphone tra un appuntamento e l'altro.",
                ],
                [
                  "Presenza locale",
                  "Google Business, recensioni, Yelp, TripAdvisor. Tutto aggiornato da un unico pannello — il cliente trova informazioni corrette ovunque cerchi.",
                ],
              ].map(([t, b]) => (
                <li
                  key={t}
                  className="border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-8 sm:border-l sm:first:border-l-0 sm:[&:nth-child(2)]:border-l"
                >
                  <h3
                    className="text-2xl font-medium"
                    style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                  >
                    {t}
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-[var(--menuary-muted)]">{b}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Template vs. su misura */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-24 lg:py-28">
          <p className="menuary-section-label text-center mb-14">Template vs. su misura</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:gap-10 max-w-4xl mx-auto">
            <div className="rounded-3xl border border-[var(--menuary-line)] p-8 bg-[var(--menuary-porcelain)]">
              <h3
                className="text-2xl font-medium text-[var(--menuary-muted)]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Un template
              </h3>
              <ul className="mt-7 space-y-4 text-[15px] text-[var(--menuary-muted)]">
                {[
                  "Struttura uguale a migliaia di altri siti",
                  "Personalizzabile nei colori, non nell'identità",
                  "Plugin che si aggiornano (e si rompono) da soli",
                  "Google non premia i siti lenti e generici",
                  "Rappresenta una categoria, non il tuo studio",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 shrink-0 text-[var(--menuary-line)] select-none">×</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-[var(--menuary-ink)] bg-[var(--menuary-paper)] p-8">
              <h3
                className="text-2xl font-medium"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Su misura con Bizery
              </h3>
              <ul className="mt-7 space-y-4 text-[15px]">
                {[
                  "Design system costruito sull'identità dello studio",
                  "Font, palette e struttura originali",
                  "Una sola piattaforma integrata — niente plugin",
                  "Velocità tecnica e SEO curati nel codice",
                  "Riconoscibile: sembra te, non un tema",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--menuary-sage)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">Domande frequenti</p>
              <h2
                className="mt-6 text-[clamp(2.2rem,4.4vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Tutto quello che ci viene chiesto — prima di iniziare.
              </h2>
              <p className="mt-6 max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
                Non hai trovato quello che cercavi?{" "}
                <Link href={localizedPath("/contatti", locale)} className="menuary-link">
                  Scrivici
                  <ArrowUpRight size={13} strokeWidth={1.8} />
                </Link>
              </p>
            </div>
            <div>
              {STUDIO_FAQ.map((item) => (
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

      {/* CTA */}
      <section className="border-t border-[var(--menuary-line)]" style={{ background: "var(--menuary-ink)" }}>
        <div className="menuary-container py-20 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <h2
              className="text-[clamp(2.4rem,5vw,4.4rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--menuary-paper)]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              Vuoi vedere come lavoriamo?
              <br />
              <span className="italic text-[var(--menuary-copper)]">Parla con lo studio.</span>
            </h2>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href={localizedPath("/contatti", locale)} className="menuary-button menuary-button-accent">
                Richiedi una proposta
              </Link>
              <Link href={localizedPath("/pricing", locale)} className="menuary-link menuary-link-light">
                Vedi l&apos;offerta
                <ArrowUpRight size={16} strokeWidth={1.6} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </BizeryShell>
  );
}
