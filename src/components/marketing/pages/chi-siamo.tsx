import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { FAQSection, FinalCTASection } from "@/components/marketing/marketing-sections";

// ─── Principi ─────────────────────────────────────────────────────────────────

const STUDIO_PRINCIPLES = [
  {
    title: "Un locale alla volta",
    body: "Non scaliamo a forza. Ogni progetto inizia ascoltando il proprietario, guardando la sala, capendo come viene curata l'accoglienza. Solo dopo arriviamo al sito.",
  },
  {
    title: "Niente template",
    body: "Non esiste una versione base da personalizzare. Il sito nasce da zero — font, palette, gerarchia, tono di voce — rispecchiando l'identità del locale, non quella di un tema WordPress da €49.",
  },
  {
    title: "Design system prima del codice",
    body: "Prima di scrivere una riga definiamo il sistema visivo: tipografia, scala cromatica, spaziatura, micro-interazioni. Un ristorante con identità forte merita un sito che la porta avanti, non che la appiattisce.",
  },
  {
    title: "La tecnica non si vede",
    body: "Velocità, sicurezza, manutenzione restano un nostro problema. Tu vedi un sito ordinato che fa quello che serve — e che su Google si comporta meglio dei concorrenti.",
  },
  {
    title: "Tempo lungo",
    body: "Non consegniamo un sito e sparisco. Lo teniamo vivo: aggiornamenti stagionali, nuove funzioni, evoluzioni del prodotto. Anno per anno, come un rapporto.",
  },
];

// ─── Come nasce un sito ────────────────────────────────────────────────────────

const PROCESS_STEPS = [
  {
    n: "01",
    title: "Ascolto",
    body: "Una chiamata (o una visita, quando ha senso). Capiamo il locale, la clientela, il tono di voce. Non facciamo brief generici.",
  },
  {
    n: "02",
    title: "Identità visiva",
    body: "Palette cromatica, tipografia, fotografia. Elementi che nascono da quello che il locale già è — non da quello che sembrano i concorrenti.",
  },
  {
    n: "03",
    title: "Design system",
    body: "Prima di aprire l'editor definiamo le regole: componenti, spaziatura, scala, motion. Il sistema poi scala su ogni pagina senza perdere coerenza.",
  },
  {
    n: "04",
    title: "Sviluppo",
    body: "Sito, menu digitale, prenotazioni, Google Maps. Tutto integrato nella stessa piattaforma — niente plugin di terze parti che si rompono da soli.",
  },
  {
    n: "05",
    title: "Go-live & oltre",
    body: "Online entro 7 giorni dalla firma. Poi aggiornamenti continui: stagione nuova, carta nuova, eventi, promozioni. Senza mandare un'email a un'agenzia.",
  },
];

// ─── Perché nel 2026 ──────────────────────────────────────────────────────────

const WHY_2026 = [
  {
    title: "Google ti giudica prima del cliente",
    body: "L'86% delle persone cerca un ristorante online prima di andare. La scheda Google, le recensioni, il sito — decidono se si prenotano da te o dal locale accanto.",
  },
  {
    title: "Le OTA prendono la commissione, tu fai il lavoro",
    body: "TheFork, Yelp, OpenTable trattengono fino al 10-15% per prenotazione. Il tuo sito non prende nulla. Una prenotazione diretta al giorno già copre il canone annuale.",
  },
  {
    title: "Instagram non è tuo — e Google non lo indicizza",
    body: "I follower possono sparire, l'algoritmo cambia, il profilo non appare nelle ricerche Google. Il sito è un asset tuo, che rimane e si accumula nel tempo.",
  },
  {
    title: "Il sito è la prima sala",
    body: "Prima ancora di vedere il menu, il cliente entra nel tuo spazio digitale. Se la cura è quella di un volantino fotocopiato, è già un segnale sbagliato.",
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const STUDIO_FAQ = [
  {
    q: "A cosa serve davvero un sito nel 2026?",
    a: "Serve a controllare la tua presenza online invece di affidarla ad altri. Google ti giudica prima ancora che il cliente apra la porta: orari aggiornati, recensioni, foto, posizione. Un sito ben fatto su una piattaforma solida si posiziona meglio di un profilo Instagram, raccoglie prenotazioni senza commissioni e ti rappresenta sette giorni su sette, anche a mezzanotte.",
  },
  {
    q: "Non basta un profilo Instagram?",
    a: "No, per due motivi fondamentali. Primo: Google non indicizza i contenuti di Instagram — se qualcuno cerca 'ristorante vicino a me', il tuo profilo social non appare. Secondo: Instagram è una piattaforma di terzi; l'algoritmo può cambiare, l'account può essere sospeso, i follower possono diminuire. Il sito è un asset che possiedi e che cresce nel tempo.",
  },
  {
    q: "Qual è la differenza tra un vostro sito e un template WordPress?",
    a: "Un template è un vestito confezionato in serie: puoi cambiare i colori, ma la struttura è quella di migliaia di altri siti. I nostri siti nascono da un design system costruito sull'identità del tuo locale — font, palette, gerarchia visiva, tono di voce, microanimazioni. Quando guardi il sito devi pensare 'questo sembra noi', non 'ho già visto questa struttura da qualche parte'.",
  },
  {
    q: "Cosa vuol dire 'design system identitario'?",
    a: "Prima del sito definiamo le regole visive del locale: la coppia tipografica (il font del titolo e quello del testo), la scala di colori (primario, secondario, accenti), le proporzioni degli spazi, il modo in cui gli elementi entrano nello schermo. Queste regole si applicano poi a ogni pagina, ogni card, ogni bottone — creando un'esperienza coerente, riconoscibile, professionale.",
  },
  {
    q: "Quando un sito si ripaga?",
    a: "Prima di quanto pensi. TheFork e le OTA trattengono fino al 10-15% per prenotazione. Se il tuo sito porta anche solo una prenotazione diretta al giorno — invece che passare da una piattaforma — su base annua il risparmio supera ampiamente il costo del canone. E questo senza contare il valore della presenza Google, delle recensioni integrate e della reputazione digitale.",
  },
  {
    q: "Quanto ci vuole per andare online?",
    a: "Entro 7 giorni dalla firma del contratto. La configurazione iniziale (onboarding, design, sviluppo) viene completata prima — in media 2-4 settimane — poi il go-live avviene in un giorno.",
  },
  {
    q: "Come nasce il design del mio sito?",
    a: "Inizia con una chiamata (o una visita se il locale è vicino). Guardiamo la sala, il menu, le foto, il tono di voce che usate sui social. Poi costruiamo un sistema visivo coerente — non scegliamo font e colori a caso, li ricaviamo da quello che il locale già è. Solo allora iniziamo a scrivere codice.",
  },
  {
    q: "Posso aggiornare il sito da solo?",
    a: "Sì. Menu, orari, foto, eventi, prezzi: tutto si aggiorna dal pannello Menuary senza toccare il codice, senza mandare email a nessuno. Le modifiche vanno online in pochi secondi, anche dalla cassa tra un turno e l'altro.",
  },
  {
    q: "Lavorate solo a Milano?",
    a: "No. Lo studio è a Milano, ma seguiamo locali in tutta Italia. La maggior parte del lavoro avviene da remoto. Quando ha senso — per un sopralluogo fotografico o un onboarding complesso — veniamo da voi.",
  },
];

// ─── Componente principale ────────────────────────────────────────────────────

export function MarketingAboutPage() {
  return (
    <MarketingShell>
      {/* HERO */}
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-20 lg:pt-28 lg:pb-24">
          <div className="grid items-end gap-14 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Lo studio</p>
              <h1 className="menuary-display mt-7 text-[clamp(3rem,6.8vw,6rem)] text-balance">
                Ogni ristorante merita
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  un sito che lo rappresenti.
                </span>
              </h1>
            </div>
            <p className="menuary-fade-up menuary-fade-up-d1 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:text-right">
              Menuary è uno studio digitale specializzato in ristorazione. Niente
              template, niente identità in serie. Ogni sito nasce da un design
              system costruito sul locale — sulla sua sala, sulla sua cucina,
              sul suo modo di accogliere.
            </p>
          </div>
        </div>
      </section>

      {/* MANIFESTO + PRINCIPI */}
      <section>
        <div className="menuary-container py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
            <div>
              <p className="menuary-section-label">Manifesto</p>
              <p className="menuary-quote mt-8">
                Un ristorante mette cura in ogni dettaglio — il piatto, il
                calice, la luce sul tavolo. Il sito deve fare lo stesso.
                Non meno, mai di meno.
              </p>
              <p className="mt-8 text-[15px] leading-7 text-[var(--menuary-muted)]">
                Crediamo che il digitale sia un&apos;estensione della sala, non
                un volantino online. Per questo non usiamo template: costruiamo
                un sistema visivo che nasce dall&apos;identità del locale e la
                porta avanti su ogni schermo.
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
                    <h3 className="menuary-display text-2xl">{p.title}</h3>
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

      {/* PERCHÉ NEL 2026 */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div>
              <p className="menuary-section-label">Perché adesso</p>
              <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)] text-balance">
                A cosa serve un sito
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  nel 2026?
                </span>
              </h2>
              <p className="mt-7 max-w-md text-[15px] leading-[1.75] text-[var(--menuary-muted)]">
                Non a "esserci online". Serve a controllare come vieni trovato,
                come vieni percepito e quante prenotazioni passano per le
                piattaforme che ti prendono la commissione invece che arrivare
                direttamente da te.
              </p>
              <Link href="/contatti" className="menuary-link mt-8 inline-flex">
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
                  <h3 className="menuary-display text-[1.25rem] leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.7] text-[var(--menuary-muted)]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COME NASCE UN SITO */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
            <div>
              <p className="menuary-section-label">Il processo</p>
              <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.4vw,3.8rem)] text-balance">
                Come nasce
                <br />
                il tuo sito.
              </h2>
              <p className="mt-6 text-[15px] leading-[1.75] text-[var(--menuary-muted)]">
                Non iniziamo dall&apos;editor. Iniziamo dall&apos;identità —
                poi costruiamo il sistema che la porta avanti.
              </p>
            </div>

            <ol className="border-t border-[var(--menuary-line)]">
              {PROCESS_STEPS.map((step) => (
                <li
                  key={step.n}
                  className="grid gap-6 border-b border-[var(--menuary-line)] py-8 sm:grid-cols-[auto_1fr] sm:gap-10"
                >
                  <span className="menuary-display text-[var(--menuary-copper)] text-base font-medium">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="menuary-display text-2xl">{step.title}</h3>
                    <p className="mt-3 text-[15px] leading-7 text-[var(--menuary-muted)]">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* COSA OFFRIAMO */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">Cosa offriamo</p>
              <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">
                Quattro mestieri
                <br />
                sotto un solo tetto.
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)]">
                Quello che un tempo richiedeva tre fornitori diversi — agenzia
                creativa, sviluppatore, consulente gestionale — oggi vive in
                un solo posto, con chi conosce il settore.
              </p>
            </div>

            <ul className="grid gap-px border-t border-[var(--menuary-line)] sm:grid-cols-2">
              {[
                [
                  "Design",
                  "Identità visiva costruita sul locale: font, palette, fotografia, copywriting. Ogni elemento nasce da quello che sei, non da quello che sembrano i concorrenti.",
                ],
                [
                  "Sviluppo",
                  "Sito, menu digitale, prenotazioni, ordini, QR di sala, Google Maps integrato. Niente plugin di terze parti — una sola piattaforma che regge tutto.",
                ],
                [
                  "Gestione",
                  "Aggiornamenti di orari, carte stagionali, eventi, promozioni. Da un pannello semplice, senza mandare email a nessuno.",
                ],
                [
                  "Presenza locale",
                  "Google Business, recensioni, Yelp, TripAdvisor. Tutto aggiornato da un unico posto — così il cliente trova informazioni corrette ovunque cerchi.",
                ],
              ].map(([t, b]) => (
                <li
                  key={t}
                  className="border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-8 sm:border-l sm:first:border-l-0 sm:[&:nth-child(2)]:border-l"
                >
                  <h3 className="menuary-display text-2xl">{t}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-[var(--menuary-muted)]">{b}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TEMPLATE VS CUSTOM — confronto editoriale */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-24 lg:py-28">
          <p className="menuary-section-label text-center mb-14">Template vs. su misura</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:gap-10 max-w-4xl mx-auto">
            {/* Template */}
            <div className="rounded-3xl border border-[var(--menuary-line)] p-8 bg-[var(--menuary-porcelain)]">
              <h3 className="menuary-display text-2xl text-[var(--menuary-muted)]">
                Un template
              </h3>
              <ul className="mt-7 space-y-4 text-[15px] text-[var(--menuary-muted)]">
                {[
                  "Struttura uguale a migliaia di altri siti",
                  "Personalizzabile nei colori, non nell'identità",
                  "Plugin che si aggiornano (e si rompono) da soli",
                  "Google non premia i siti lenti e generici",
                  "Rappresenta una categoria, non il tuo locale",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 shrink-0 text-[var(--menuary-line)] select-none">×</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Su misura */}
            <div className="rounded-3xl border border-[var(--menuary-ink)] bg-[var(--menuary-paper)] p-8">
              <h3 className="menuary-display text-2xl">
                Su misura con Menuary
              </h3>
              <ul className="mt-7 space-y-4 text-[15px]">
                {[
                  "Design system costruito sull'identità del locale",
                  "Font, palette e struttura originali",
                  "Una sola piattaforma integrata — niente plugin",
                  "Velocità tecnica e SEO curati nel codice",
                  "Riconoscibile: sembra te, non un tema",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      size={16}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-[var(--menuary-sage)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection
        items={STUDIO_FAQ}
        kicker="Domande frequenti"
        title="Tutto quello che ci viene chiesto — prima di iniziare."
      />

      {/* CTA */}
      <FinalCTASection />
    </MarketingShell>
  );
}
