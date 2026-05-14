import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80";

const PRODUCT_PILLARS = [
  {
    title: "Sistema operativo del locale",
    body: "Menu, ordini al tavolo e da asporto, prenotazioni, sala, cucina, magazzino e food cost, staff e turni, canali delivery, CRM e analytics. Un solo prodotto che copre l'intera catena operativa, non solo la vetrina online.",
  },
  {
    title: "Account Menuary per i clienti",
    body: "I clienti accedono con Menuary: preferenze e allergeni restano sul profilo. Il locale riceve dati utili solo dopo un ordine o una prenotazione in quel ristorante — privacy by design.",
  },
  {
    title: "Menu sempre vivo + IA sul listino",
    body: "Piatti, prezzi, allergeni, disponibilità aggiornati in minuti. Suggerimenti in carrello, assistente menu e ranking personalizzato quando il cliente è riconosciuto.",
  },
  {
    title: "Manutenzione e roadmap",
    body: "Aggiornamenti tecnici, sicurezza, RLS su database condiviso, integrazioni (Retell, WhatsApp) e nuovi moduli. Menuary mantiene la piattaforma; tu gestisci il servizio in sala.",
  },
];

const AUDIENCES = [
  {
    title: "Fine dining",
    body: "Una presenza misurata, fotografica, costruita per accompagnare la scelta del cliente prima ancora che varchi la porta.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Pizzerie & trattorie",
    body: "Menu leggibile, contatti chiari, ordini rapidi. Contenuti concreti per chi decide in trenta secondi sul marciapiede.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Cocktail bar & bistrot",
    body: "Atmosfera, carta beverage, eventi, aggiornamenti stagionali. Sempre in primo piano quello che sta succedendo stasera.",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80",
  },
];

const PROCESS = [
  ["01", "Ascolto", "Cucina, sala, clientela, tono. Partiamo dal locale, mai dal sito."],
  ["02", "Disegno", "Identità visiva, struttura, contenuti. Una proposta concreta, non un mood board."],
  ["03", "Costruzione", "Pagine, menu, prenotazioni, ordini. Tutto già allineato al tuo modo di lavorare."],
  ["04", "Vita", "Online il sito, aggiornamenti continui, miglioramenti e supporto nel tempo."],
];

const DEMOS = [
  {
    href: "https://demo.menuary.it/bepork-demo",
    label: "Be Pork · Bari",
    tag: "Trattoria contemporanea",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
  },
  {
    href: "https://demo.menuary.it/faak-demo",
    label: "Faak · Bari",
    tag: "Bistrot urban",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  },
];

export function MarketingHomePage() {
  return (
    <MarketingShell>
      {/* HERO */}
      <section className="relative">
        <div className="menuary-container pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid items-end gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Piattaforma per ristoranti</p>
              <h1 className="menuary-display mt-7 text-[clamp(3rem,7.4vw,6.4rem)]">
                Il gestionale del ristorante,
                <br />
                con la stessa cura
                <br />
                <span className="italic text-[var(--menuary-copper)]">che metti in sala.</span>
              </h1>
              <p className="mt-8 max-w-xl text-[17px] leading-[1.75] text-[var(--menuary-muted)]">
                Menuary unifica sito, menu digitale, ordini, prenotazioni, CRM e analytics in un
                unico database multi-tenant. I clienti possono accedere con il profilo Menuary: il
                locale riceve insight solo dopo un&apos;interazione reale — identità forte e
                operatività seria, senza template generici.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link href="/contatti" className="menuary-button menuary-button-accent">
                  Richiedi una proposta
                </Link>
                <Link href="/pricing" className="menuary-link">
                  Vedi l&apos;offerta
                  <ArrowUpRight size={16} strokeWidth={1.6} />
                </Link>
              </div>
            </div>

            <figure className="menuary-fade-up menuary-fade-up-d2 relative">
              <div className="menuary-photo aspect-[4/5] w-full">
                <Image
                  src={HERO_IMAGE}
                  alt="Servizio in sala in un ristorante"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 44vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
                <span>— Studio Menuary</span>
                <span>Bari · Italia</span>
              </figcaption>
            </figure>
          </div>

          <div className="mt-24 grid gap-10 border-t border-[var(--menuary-line)] pt-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-14">
            {[
              ["+40", "ristoranti seguiti"],
              ["12 anni", "in cucina digitale"],
              ["100%", "siti su misura"],
              ["0", "template"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="menuary-display text-4xl">{n}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT PILLARS */}
      <section id="prodotto" className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">Cosa facciamo</p>
              <h2 className="menuary-display mt-6 text-[clamp(2.4rem,5vw,4.4rem)]">
                Un sito bello da vedere.
                <br />
                Comodo da gestire.
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)]">
                Quattro fondamenta semplici, tenute insieme da un&apos;unica regia. Senza pezzi
                sparsi, senza strumenti che non parlano.
              </p>
            </div>

            <ol className="space-y-px overflow-hidden">
              {PRODUCT_PILLARS.map((p, i) => (
                <li
                  key={p.title}
                  className="grid gap-6 border-t border-[var(--menuary-line)] py-8 sm:grid-cols-[auto_1fr] sm:gap-10 sm:py-10 last:border-b"
                >
                  <p className="menuary-index-lg w-12 sm:w-16">{String(i + 1).padStart(2, "0")}</p>
                  <div>
                    <h3 className="menuary-display text-2xl sm:text-3xl">{p.title}</h3>
                    <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--menuary-muted)]">{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* AUDIENCES */}
      <section id="ristoranti" className="bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="menuary-section-label" style={{ color: "rgba(255,250,242,0.55)" }}>
                Per chi lavoriamo
              </p>
              <h2 className="menuary-display mt-6 text-[clamp(2.4rem,5vw,4.6rem)]">
                Dal fine dining al bistrot,
                <br />
                <span className="italic text-[var(--menuary-gold)]">ogni locale sembra se stesso.</span>
              </h2>
            </div>
            <p className="max-w-sm text-[15px] leading-7 text-white/65">
              Non lavoriamo a temi. Lavoriamo a ristoranti — uno alla volta, con il tempo
              di capire cosa rende ognuno diverso dagli altri.
            </p>
          </div>

          <div className="mt-16 grid gap-px border-t border-white/12 sm:grid-cols-3">
            {AUDIENCES.map((a) => (
              <article
                key={a.title}
                className="border-t border-white/12 pt-8 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0 sm:first:border-l-0 sm:first:pl-0"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <Image
                    src={a.image}
                    alt={a.title}
                    width={900}
                    height={1125}
                    className="h-full w-full object-cover grayscale"
                  />
                </div>
                <h3 className="menuary-display mt-6 text-2xl">{a.title}</h3>
                <p className="mt-3 max-w-xs text-[15px] leading-7 text-white/65">{a.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="bg-[var(--menuary-paper)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="mx-auto max-w-4xl">
            <p className="menuary-section-label">Una sola idea</p>
            <p className="menuary-quote mt-8">
              &ldquo;Il sito di un ristorante non è un biglietto da visita. È una conversazione
              che inizia prima che il cliente apra la porta — e dovrebbe avere lo stesso tono
              di quando lo accogli al tavolo.&rdquo;
            </p>
            <p className="mt-8 text-xs uppercase tracking-[0.22em] text-[var(--menuary-muted)]">
              — Studio Menuary
            </p>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="gestione" className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="menuary-section-label">Come lavoriamo</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.4rem,5vw,4.4rem)]">
              Quattro passi, lenti dove devono esserlo.
            </h2>
          </div>

          <div className="mt-14 grid gap-px border-t border-[var(--menuary-line)] sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map(([n, t, b]) => (
              <div
                key={n}
                className="border-b border-[var(--menuary-line)] py-10 sm:border-l sm:py-12 sm:pl-8 sm:first:border-l-0 sm:first:pl-0 lg:pr-6"
              >
                <p className="menuary-index-lg">{n}</p>
                <h3 className="menuary-display mt-6 text-2xl">{t}</h3>
                <p className="mt-3 max-w-xs text-[15px] leading-7 text-[var(--menuary-muted)]">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMOS */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="menuary-section-label">Esempi recenti</p>
              <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.4vw,4rem)]">
                Due locali, due voci diverse.
              </h2>
            </div>
            <p className="max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
              Esplora due ristoranti reali costruiti su Menuary. Stesso motore, identità opposte.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {DEMOS.map((d) => (
              <a
                key={d.href}
                href={d.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="menuary-photo aspect-[5/4] w-full">
                  <Image
                    src={d.image}
                    alt={d.label}
                    width={1100}
                    height={880}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">{d.tag}</p>
                    <p className="menuary-display mt-2 text-2xl">{d.label}</p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--menuary-line)] transition-colors group-hover:border-[var(--menuary-ink)] group-hover:bg-[var(--menuary-ink)] group-hover:text-[var(--menuary-paper)]">
                    <ArrowUpRight size={18} strokeWidth={1.6} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-20">
            <div>
              <p className="menuary-section-label" style={{ color: "rgba(255,250,242,0.55)" }}>
                Iniziamo
              </p>
              <h2 className="menuary-display mt-6 text-[clamp(2.6rem,5.2vw,5rem)]">
                Raccontaci il tuo ristorante.
                <br />
                <span className="italic text-[var(--menuary-gold)]">Ti rispondiamo con un&apos;idea concreta.</span>
              </h2>
            </div>
            <div className="flex flex-col items-start gap-5">
              <Link href="/contatti" className="menuary-button menuary-button-accent">
                Richiedi una proposta
              </Link>
              <a href="mailto:hello@menuary.it" className="menuary-link menuary-link-light">
                hello@menuary.it
                <ArrowUpRight size={16} strokeWidth={1.6} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
