import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  AIPhoneSection,
  AudiencesSection,
  BigNumbersSection,
  ComparisonSection,
  DemosSection,
  FAQSection,
  FeaturesSection,
  FinalCTASection,
  IntegrationsSection,
  LogosStripSection,
  ModuleShowcasesSection,
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
    q: "Come funziona l'IA al telefono?",
    a: "L'assistente vocale risponde 24/7 con la voce del locale: prende prenotazioni e le scrive in agenda, accetta ordini d'asporto, suggerisce piatti del giorno. Cloning vocale opzionale e cinque lingue native (IT, EN, FR, ES, DE).",
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
    q: "Quanto tempo serve per andare online?",
    a: "Per il piano Vetrina, in media 3–5 settimane dalla prima chiamata al go-live. Operatività richiede 4–6 settimane. Autopilota aggiunge 2 settimane per il training della voce e la calibrazione dei flussi telefonici.",
  },
  {
    q: "Chi gestisce sicurezza, hosting e manutenzione?",
    a: "Tutto incluso. Hosting, certificati SSL, backup, aggiornamenti tecnici e nuove funzioni del prodotto fanno parte del canone annuale — incluse le evoluzioni della piattaforma su tutti i moduli. Il contratto è annuale, senza possibilità di recesso anticipato, ma puoi cambiare piano in qualsiasi momento.",
  },
  {
    q: "Lavorate solo a Milano o in tutta Italia?",
    a: "Lo studio è a Milano, ma seguiamo ristoranti in tutta Italia. La maggior parte del lavoro avviene da remoto, con uno o due sopralluoghi quando serve davvero.",
  },
];

export function MarketingHomePage() {
  return (
    <MarketingShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="menuary-hero absolute inset-0" aria-hidden />
        <div className="menuary-container relative pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid items-end gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
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
                magazzino, food cost, CRM. E un&apos;IA che risponde al
                telefono con la voce del locale, 24/7.
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
                  9 moduli integrati + IA
                </span>
              </div>
            </div>

            {/* HERO COMPOSITION — photo + floating IA badge */}
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

              {/* Floating IA card */}
              <div
                aria-hidden
                className="absolute -bottom-6 -left-6 hidden w-[16rem] rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)]/95 p-4 backdrop-blur-md shadow-[0_24px_60px_-20px_rgba(24,35,31,0.32)] sm:block"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--menuary-ink)] text-[var(--menuary-gold)]">
                    <Phone size={16} strokeWidth={1.8} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--menuary-muted)] font-bold">
                      IA al telefono
                    </p>
                    <p className="text-sm font-semibold truncate">
                      Prenotazione · 21:00 · 2 cop.
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
                className="absolute -top-5 right-3 hidden rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)]/95 px-4 py-3 backdrop-blur-md shadow-[0_24px_60px_-20px_rgba(24,35,31,0.28)] md:block"
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--menuary-muted)] font-bold">
                  Food cost · live
                </p>
                <p className="menuary-display text-xl mt-1">
                  Margine{" "}
                  <span className="text-[#3f4f37]">68%</span>
                </p>
              </div>

              <figcaption className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
                <span>— Studio Menuary</span>
                <span>Milano · Italia</span>
              </figcaption>
            </figure>
          </div>

          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4 lg:gap-14">
            {[
              ["9", "moduli integrati"],
              ["+40", "ristoranti attivi"],
              ["24/7", "assistente IA"],
              ["0", "commissioni"],
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

      {/* MODULE DEEP-DIVES — food cost, magazzino, CRM mini mockups */}
      <ModuleShowcasesSection />

      {/* AI PHONE — live, full receptionist */}
      <AIPhoneSection />

      {/* PRODUCT PREVIEW — menu editor mockup */}
      <ProductPreviewSection />

      {/* COMPARISON — Menuary vs tradizionale */}
      <ComparisonSection />

      {/* BIG NUMBERS — impact metrics */}
      <BigNumbersSection />

      {/* AUDIENCES */}
      <AudiencesSection />

      {/* TESTIMONIALS */}
      <TestimonialsSection />

      {/* INTEGRATIONS */}
      <IntegrationsSection />

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
