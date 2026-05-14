import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  AIPhoneSection,
  AudiencesSection,
  DemosSection,
  FAQSection,
  FeaturesSection,
  FinalCTASection,
  LogosStripSection,
  PricingTeaserSection,
  ProcessSection,
  ProductLevelsSection,
  ProductPreviewSection,
  TestimonialsSection,
} from "@/components/marketing/marketing-sections";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80";

const HOMEPAGE_FAQ = [
  {
    q: "Posso usare solo il sito, senza il gestionale?",
    a: "Sì. Menuary è modulare: parti dal piano Vetrina con solo sito + menu digitale, e quando vuoi accendi prenotazioni, ordini, delivery, magazzino o food cost senza dover rifare nulla.",
  },
  {
    q: "Cosa gestisce esattamente il modulo magazzino?",
    a: "Ingredienti, scorte, fornitori, scadenze e alert sotto soglia. Le ricette legate al menu scalano automaticamente le quantità quando un piatto esce in cucina, così l'inventario resta allineato senza inserimento manuale.",
  },
  {
    q: "Come funziona il food cost?",
    a: "Definisci la ricetta di ciascun piatto (ingredienti + grammature). Menuary calcola costo materia prima per porzione, margine percentuale e suggerisce un prezzo target. Quando aumenta il costo di un fornitore, il margine si aggiorna in tempo reale.",
  },
  {
    q: "E l'IA al telefono, quando sarà disponibile?",
    a: "L'assistente IA vocale è in arrivo nel 2026 in beta privata. Puoi entrare nella lista d'attesa dalla pagina contatti — i clienti Menuary attivi avranno priorità di accesso.",
  },
  {
    q: "Quanto tempo serve per andare online?",
    a: "Per il piano Vetrina, in media 3–5 settimane dalla prima chiamata al go-live. I piani Operatività e Crescita dipendono dai moduli attivati e dai contenuti già pronti (foto, menu, ricette).",
  },
  {
    q: "Chi gestisce sicurezza, hosting e manutenzione?",
    a: "Tutto incluso. Hosting, certificati SSL, backup, aggiornamenti tecnici e nuove funzioni del prodotto fanno parte del canone mensile — incluse le evoluzioni della piattaforma su tutti i moduli.",
  },
  {
    q: "Lavorate solo a Bari o in tutta Italia?",
    a: "Lo studio è a Bari, ma seguiamo ristoranti in tutta Italia. La maggior parte del lavoro avviene da remoto, con uno o due sopralluoghi quando serve davvero.",
  },
];

export function MarketingHomePage() {
  return (
    <MarketingShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="menuary-hero absolute inset-0" aria-hidden />
        <div className="menuary-container relative pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid items-end gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">
                Piattaforma operativa per ristoranti
              </p>
              <h1 className="menuary-display mt-7 text-[clamp(2.8rem,7vw,6.2rem)]">
                Il sistema operativo
                <br />
                del tuo ristorante.
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  Sito, sala, cucina, IA.
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-[17px] leading-[1.75] text-[var(--menuary-muted)]">
                Menuary è una piattaforma modulare: dal sito su misura al
                gestionale completo — menu, prenotazioni, ordini, delivery,
                magazzino, food cost, CRM. E presto un&apos;IA che risponde al
                telefono con la voce del locale.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link
                  href="/contatti"
                  className="menuary-button menuary-button-accent"
                >
                  Richiedi una proposta
                </Link>
                <Link href="#livelli" className="menuary-link">
                  Come puoi usarlo
                  <ArrowUpRight size={16} strokeWidth={1.6} />
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck
                    size={14}
                    strokeWidth={1.7}
                    className="text-[var(--menuary-sage)]"
                  />
                  Prima chiamata gratuita
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles
                    size={14}
                    strokeWidth={1.7}
                    className="text-[var(--menuary-gold)]"
                  />
                  IA vocale in arrivo 2026
                </span>
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

          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4 lg:gap-14">
            {[
              ["9", "moduli integrati"],
              ["+40", "ristoranti seguiti"],
              ["24/7", "assistenza IA · 2026"],
              ["0", "template"],
            ].map(([n, l]) => (
              <div key={l} className="menuary-stat">
                <p className="menuary-display text-4xl">{n}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF MARQUEE */}
      <LogosStripSection />

      {/* PRODUCT LEVELS — how do you want to use Menuary? */}
      <ProductLevelsSection />

      {/* FEATURES (9 modules) */}
      <FeaturesSection />

      {/* PRODUCT PREVIEW */}
      <ProductPreviewSection />

      {/* AI PHONE — coming soon showcase */}
      <AIPhoneSection />

      {/* AUDIENCES */}
      <AudiencesSection />

      {/* TESTIMONIALS */}
      <TestimonialsSection />

      {/* PROCESS */}
      <ProcessSection />

      {/* DEMOS */}
      <DemosSection />

      {/* PRICING TEASER */}
      <PricingTeaserSection />

      {/* FAQ */}
      <FAQSection items={HOMEPAGE_FAQ} />

      {/* FINAL CTA */}
      <FinalCTASection />
    </MarketingShell>
  );
}
