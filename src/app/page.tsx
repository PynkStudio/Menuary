import { headers } from "next/headers";
import Link from "next/link";
import { Hero } from "@/components/hero";
import { ThreeSouls } from "@/components/three-souls";
import { SignatureDishes } from "@/components/signature-dishes";
import { FixedMenus } from "@/components/fixed-menus";
import { ReviewsSection } from "@/components/reviews-section";
import { FindUs } from "@/components/find-us";
import { DeliveryStrip } from "@/components/delivery-strip";
import { getPlatformModeFromHost } from "@/lib/platform";

function TenantHome() {
  return (
    <>
      <Hero />
      <ThreeSouls />
      <SignatureDishes />
      <FixedMenus />
      <ReviewsSection />
      <FindUs />
      <DeliveryStrip />
    </>
  );
}

function MarketingHome() {
  return (
    <div className="menuary-shell min-h-screen bg-[var(--menuary-paper)] text-[var(--menuary-ink)]">
      <section className="menuary-hero relative overflow-hidden px-5 pb-24 pt-5 sm:px-8 lg:px-12 lg:pb-32">
        <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-[var(--menuary-line)] py-5">
          <Link href="/" className="menuary-wordmark" aria-label="Menuary home">
            menuary
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            <Link href="#prodotto" className="menuary-nav-link">Prodotto</Link>
            <Link href="#ristoranti" className="menuary-nav-link">Per chi</Link>
            <Link href="#gestione" className="menuary-nav-link">Gestione</Link>
            <Link href="/pricing" className="menuary-nav-link">Offerta</Link>
          </div>
          <Link href="/contatti" className="menuary-button menuary-button-dark">
            Prenota una demo
          </Link>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-14 pt-14 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:pt-16">
          <div>
            <p className="menuary-eyebrow">siti personalizzati per ristoranti</p>
            <h1 className="menuary-display mt-6 max-w-5xl text-[clamp(3.2rem,7vw,6rem)]">
              Il tuo ristorante online, con la stessa cura che metti in sala.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--menuary-muted)] sm:text-xl sm:leading-9">
              Menuary crea un sito su misura per il tuo locale, fedele alla tua identita
              e pronto a far scegliere, prenotare, consultare il menu e ordinare. Che tu sia
              un fine dining, una pizzeria, una trattoria o un cocktail bar.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/contatti" className="menuary-button menuary-button-accent">
                Richiedi una proposta
              </Link>
              <Link href="#ristoranti" className="menuary-button menuary-button-light">
                Scopri gli stili
              </Link>
            </div>
          </div>

          <div className="menuary-product-frame">
            <div className="menuary-browser-bar">
              <span />
              <span />
              <span />
              <p>iltuoristorante.it</p>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="menuary-phone-preview">
                <div className="menuary-phone-top" />
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--menuary-copper)]">
                    menu digitale
                  </p>
                  {["Antipasti", "Primi", "Carta vini", "Dolci"].map((item, index) => (
                    <div key={item} className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span>{item}</span>
                      <span className="text-white/40">0{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="menuary-admin-preview">
                  <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                      dal sito oggi
                    </p>
                    <p className="mt-2 text-4xl font-semibold tabular-nums">37</p>
                    <p className="mt-1 text-sm text-[var(--menuary-muted)]">prenotazioni, richieste e ordini</p>
                  </div>
                  <div className="menuary-chart" aria-hidden="true">
                    <span style={{ height: "44%" }} />
                    <span style={{ height: "72%" }} />
                    <span style={{ height: "56%" }} />
                    <span style={{ height: "86%" }} />
                    <span style={{ height: "63%" }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {["Sito", "Menu", "Ordini", "Prenota"].map((item) => (
                    <div key={item} className="menuary-module-tile">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="prodotto" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="menuary-eyebrow">cosa fa per il tuo locale</p>
            <h2 className="menuary-display mt-5 text-[clamp(2.6rem,5vw,5.5rem)]">
              Un sito bello da vedere e comodo da usare, per te e per i clienti.
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[2rem] bg-[var(--menuary-line)] md:grid-cols-2">
            {[
              ["Identita su misura", "Colori, ritmo, testi, sezioni e atmosfera vengono costruiti intorno al tuo ristorante, non sopra un template generico."],
              ["Menu sempre aggiornato", "Piatti, prezzi, allergeni, foto, varianti e disponibilita restano ordinati e modificabili senza rifare il sito."],
              ["Prenotazioni e ordini", "I clienti trovano subito le azioni importanti: chiamare, prenotare, ordinare, consultare il menu o raggiungerti."],
              ["Gestione semplice", "Tu lavori sui contenuti del locale. Menuary gestisce in background pagine, servizi, flussi e aggiornamenti tecnici."],
            ].map(([title, body]) => (
              <article key={title} className="bg-[var(--menuary-paper)] p-7 md:p-9">
                <p className="menuary-kicker">{title}</p>
                <p className="mt-4 max-w-md text-base leading-8 text-[var(--menuary-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="ristoranti" className="bg-[var(--menuary-ink)] px-5 py-24 text-[var(--menuary-paper)] sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="menuary-eyebrow text-[var(--menuary-gold)]">un sito fedele al tuo stile</p>
            <h2 className="menuary-display mt-5 text-[clamp(2.8rem,6vw,6.2rem)]">
              Dal fine dining alla pizzeria, ogni locale deve sembrare se stesso.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {[
              ["Fine dining", "Una presenza essenziale, elegante, fotografica. Il sito accompagna la scelta senza appesantire l'esperienza."],
              ["Pizzerie e trattorie", "Menu leggibile, contatti chiari, ordini rapidi e contenuti concreti per chi decide in pochi secondi."],
              ["Cocktail bar e bistrot", "Atmosfera, eventi, carta beverage, prenotazioni e aggiornamenti stagionali sempre in primo piano."],
            ].map(([title, body], index) => (
              <article key={title} className="menuary-audience-card" style={{ transform: `translateY(${index * 18}px)` }}>
                <p className="menuary-kicker text-[var(--menuary-gold)]">{title}</p>
                <p className="mt-5 leading-8 text-white/68">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="gestione" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="menuary-eyebrow">Menuary lavora dietro le quinte</p>
            <h2 className="menuary-display mt-5 text-[clamp(2.6rem,5vw,5.4rem)]">
              Tu gestisci il ristorante. Il sito tiene insieme tutto il resto.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-9 text-[var(--menuary-muted)]">
              Menuary orchestra menu, richieste, prenotazioni, ordini, contenuti e servizi
              collegati. Per il cliente resta un sito chiaro e bello. Per te diventa uno
              strumento pratico che evita pezzi sparsi.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="https://demo.menuary.it/bepork-demo" className="menuary-button menuary-button-dark">
                Guarda un esempio informale
              </a>
              <a href="https://demo.menuary.it/faak-demo" className="menuary-button menuary-button-light">
                Guarda un esempio contemporaneo
              </a>
            </div>
          </div>
          <div className="menuary-demo-stack">
            {[
              ["01", "La tua identita", "Il sito riprende stile, tono, cucina, ambiente e priorita del locale."],
              ["02", "I servizi collegati", "Menu, prenotazioni, ordini, contatti e contenuti lavorano nello stesso ecosistema."],
              ["03", "Aggiornamenti continui", "Nuove funzioni e miglioramenti arrivano senza dover rifare tutto da capo."],
            ].map(([step, title, body]) => (
              <article key={step} className="menuary-step-card">
                <span>{step}</span>
                <div>
                  <p className="menuary-kicker">{title}</p>
                  <p className="mt-2 text-[var(--menuary-muted)]">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-12 lg:pb-32">
        <div className="mx-auto grid max-w-7xl gap-8 border-y border-[var(--menuary-line)] py-14 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="menuary-eyebrow">menuary.it</p>
            <h2 className="menuary-display mt-4 max-w-4xl text-[clamp(2.6rem,5vw,5.3rem)]">
              Porta online il tuo locale con un sito che sembra tuo, non di tutti.
            </h2>
          </div>
          <Link href="/contatti" className="menuary-button menuary-button-accent lg:self-end">
            Raccontaci il tuo ristorante
          </Link>
        </div>
      </section>
    </div>
  );
}

export default async function HomePage() {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);
  return mode === "marketing" ? <MarketingHome /> : <TenantHome />;
}
