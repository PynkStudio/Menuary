import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";

const STUDIO_PRINCIPLES = [
  {
    title: "Un locale alla volta",
    body: "Non scaliamo a forza. Ogni progetto inizia in cucina, in sala, davanti al cliente. Solo dopo arriviamo al sito.",
  },
  {
    title: "Niente template",
    body: "Costruiamo da zero ciò che serve. Quello che riusiamo è il rigore, non l'estetica: ogni ristorante deve sembrare se stesso.",
  },
  {
    title: "La tecnica non si vede",
    body: "Velocità, sicurezza, manutenzione restano un nostro problema. Tu vedi un sito ordinato che fa quello che serve.",
  },
  {
    title: "Tempo lungo",
    body: "Non lanciamo siti, li teniamo vivi. Aggiornamenti, contenuti stagionali, evoluzioni del prodotto. Anno per anno.",
  },
];

const STUDIO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=900&q=80",
    alt: "Mise en place",
  },
  {
    src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80",
    alt: "Servizio in sala",
  },
  {
    src: "https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=900&q=80",
    alt: "Carta dei vini",
  },
];

export function MarketingAboutPage() {
  return (
    <MarketingShell>
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-20 lg:pt-28 lg:pb-24">
          <div className="grid items-end gap-14 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Lo studio</p>
              <h1 className="menuary-display mt-7 text-[clamp(3rem,6.8vw,6rem)]">
                Disegniamo siti per ristoranti.
                <br />
                <span className="italic text-[var(--menuary-copper)]">Un locale alla volta.</span>
              </h1>
            </div>
            <p className="menuary-fade-up menuary-fade-up-d1 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:text-right">
              Menuary è uno studio digitale specializzato in ristorazione. Lavoriamo con
              chef, proprietari e direttori di sala per portare online il loro modo di
              accogliere, una pagina alla volta.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="menuary-container py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
            <div className="grid grid-cols-2 gap-3 self-start">
              {STUDIO_IMAGES.map((im, i) => (
                <div
                  key={im.src}
                  className={`menuary-photo aspect-[4/5] ${i === 0 ? "row-span-2 col-span-1" : ""}`}
                >
                  <Image
                    src={im.src}
                    alt={im.alt}
                    width={900}
                    height={1125}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

            <div>
              <p className="menuary-section-label">Manifesto</p>
              <p className="menuary-quote mt-8">
                Crediamo che un ristorante meriti un sito coerente con la stessa cura che
                mette in un piatto. Non meno, mai di più.
              </p>
              <div className="mt-12 space-y-px border-t border-[var(--menuary-line)]">
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
        </div>
      </section>

      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">Cosa offriamo</p>
              <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">
                Quattro mestieri sotto un solo tetto.
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)]">
                Quello che un tempo si chiedeva a tre fornitori diversi, oggi vive in un
                solo posto — con le persone che capiscono il tuo locale.
              </p>
            </div>

            <ul className="grid gap-px border-t border-[var(--menuary-line)] sm:grid-cols-2">
              {[
                ["Design", "Identità visiva, tipografia, fotografia, copywriting."],
                ["Sviluppo", "Sito, menu digitale, prenotazioni, ordini, QR di sala."],
                ["Gestione", "Aggiornamenti, contenuti stagionali, supporto continuo."],
                ["Strategia", "Posizionamento, fidelizzazione, evoluzione del prodotto."],
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

      <section className="bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
        <div className="menuary-container py-20 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <h2 className="menuary-display text-[clamp(2.4rem,5vw,4.4rem)]">
              Vuoi vedere come lavoriamo?
              <br />
              <span className="italic text-[var(--menuary-gold)]">Parla con lo studio.</span>
            </h2>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/contatti" className="menuary-button menuary-button-accent">
                Richiedi una proposta
              </Link>
              <Link href="/pricing" className="menuary-link menuary-link-light">
                Vedi l&apos;offerta
                <ArrowUpRight size={16} strokeWidth={1.6} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
