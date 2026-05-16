import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck,
  Check,
  Clock,
  Globe,
  ShieldCheck,
  Star,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  AIIntegrationsTeaserSection,
  BenefitsEditorialSection,
  FAQSection,
  FinalCTASection,
  GoogleSyncSection,
  HomePricingSection,
  LocalPresenceSection,
  LogosStripSection,
  TestimonialsSection,
} from "@/components/marketing/marketing-sections";
import { getMarketingHomeData } from "@/lib/marketing-data";

const HOMEPAGE_FAQ = [
  {
    q: "Quanto tempo serve per andare online?",
    a: "Per il piano Presenza, in media 2–4 settimane dalla prima chiamata al go-live. Prenotazioni richiede 3–5 settimane. Operatività 4–6 settimane.",
  },
  {
    q: "Come si aggiorna Google?",
    a: "Aggiorni orari, eventi e descrizione dal pannello Menuary. Le modifiche vengono pubblicate sulla scheda Google e propagate sul sito. Le recensioni Google vengono riportate sul sito con aggiornamento periodico automatico.",
  },
  {
    q: "Posso disdire quando voglio?",
    a: "Sì. Il canone è mensile, senza penali di disdetta. Il setup iniziale è una tantum.",
  },
  {
    q: "Cosa è incluso nel canone?",
    a: "Hosting, dominio, certificati SSL, backup, aggiornamenti tecnici, supporto e nuove funzioni della piattaforma — incluse nel canone mensile.",
  },
  {
    q: "Lavorate solo a Milano o in tutta Italia?",
    a: "Lo studio è a Milano, ma seguiamo locali in tutta Italia. La maggior parte del lavoro avviene da remoto, con sopralluoghi quando serve.",
  },
  {
    q: "Posso cambiare piano in seguito?",
    a: "Sì, in qualsiasi momento. Si parte spesso da Presenza e si attivano Prenotazioni o Operatività quando serve, senza rifare nulla.",
  },
  {
    q: "Il sito è disponibile in più lingue?",
    a: "Sì. Ogni sito viene realizzato in versione multilingua di default, coprendo le principali lingue europee: italiano, inglese, francese, tedesco e spagnolo. Su richiesta è possibile aggiungere altre lingue in base all'utenza tipica del locale — ad esempio russo, arabo, cinese o giapponese per zone ad alta frequentazione turistica internazionale. Il costo delle lingue aggiuntive viene concordato in fase di preventivo.",
  },
];

export async function MarketingHomePage() {
  const { activeTenants, testimonials } = await getMarketingHomeData("food");

  return (
    <MarketingShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="menuary-hero absolute inset-0" aria-hidden />
        <div className="menuary-container relative pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid items-end gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">
                Per ristoranti, bar, trattorie
              </p>
              <h1 className="menuary-display mt-7 text-[clamp(2.6rem,6.4vw,5.6rem)] text-balance">
                Il tuo locale online,
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  senza complicazioni.
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-[17px] leading-[1.75] text-[var(--menuary-muted)]">
                Sito professionale, prenotazioni online e gestione semplificata
                di Google Maps e presenza digitale.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link
                  href="/contatti"
                  className="menuary-button menuary-button-accent"
                >
                  Richiedi una demo
                </Link>
                <Link href="#esempio" className="menuary-link">
                  Guarda un esempio
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
                  <Clock
                    size={14}
                    strokeWidth={1.7}
                    className="text-[var(--menuary-gold)]"
                  />
                  Online in 2–4 settimane
                </span>
                <span className="inline-flex items-center gap-2">
                  <Globe
                    size={14}
                    strokeWidth={1.7}
                    className="text-[var(--menuary-muted)]"
                  />
                  Multilingua · IT EN FR DE ES +
                </span>
              </div>
            </div>

            {/* HERO MOCKUP — dashboard + mobile + Google card */}
            <figure
              className="menuary-fade-up menuary-fade-up-d2 relative"
              aria-hidden
            >
              {/* Dashboard frame */}
              <div className="menuary-product-frame p-4">
                <div className="menuary-browser-bar">
                  <span />
                  <span />
                  <span />
                  <p>app.menuary.it</p>
                </div>
                <div className="menuary-admin-preview">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="menuary-module-tile">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                        Oggi
                      </p>
                      <p className="menuary-display mt-1 text-2xl">
                        12
                        <span className="ml-1 text-xs font-medium text-[var(--menuary-muted)]">
                          prenotazioni
                        </span>
                      </p>
                    </div>
                    <div className="menuary-module-tile">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                        Google
                      </p>
                      <p className="menuary-display mt-1 text-2xl">
                        4,7
                        <span className="ml-1 text-xs font-medium text-[var(--menuary-muted)]">
                          ★ media
                        </span>
                      </p>
                    </div>
                    <div className="menuary-module-tile">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                        Orari
                      </p>
                      <p className="menuary-display mt-1 text-base leading-tight">
                        Aggiornati
                        <br />
                        <span className="text-xs font-medium text-[var(--menuary-muted)]">
                          ieri
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Business card */}
              <div className="absolute -top-6 -right-2 hidden w-[15rem] rounded-2xl border border-[var(--menuary-line)] bg-white p-4 shadow-[0_24px_60px_-20px_rgba(24,35,31,0.28)] sm:block">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC04"
                        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                      />
                    </svg>
                  </span>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                    Google · scheda
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="flex gap-0.5 text-[var(--menuary-copper)]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-[var(--menuary-ink)]">
                    4,7
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--menuary-muted)]">
                  Aperto · chiude alle 23:00
                </p>
              </div>

              {/* Mobile site preview */}
              <div className="absolute -bottom-8 -left-4 hidden w-[11rem] rounded-3xl border border-[var(--menuary-line)] bg-[var(--menuary-ink)] p-3 shadow-[0_30px_70px_-24px_rgba(24,35,31,0.4)] sm:block">
                <div className="menuary-phone-top" />
                <div className="rounded-2xl bg-[var(--menuary-paper)] p-3 text-[var(--menuary-ink)]">
                  <p className="menuary-display text-base leading-tight">
                    Trattoria
                    <br />
                    Da Marco
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--menuary-muted)] font-bold">
                    Bologna · cucina tipica
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[var(--menuary-ink)]">
                    <CalendarCheck
                      size={12}
                      strokeWidth={1.8}
                      className="text-[var(--menuary-copper)]"
                    />
                    Prenota un tavolo
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--menuary-muted)]">
                    <Check
                      size={11}
                      strokeWidth={2}
                      className="text-[var(--menuary-sage)]"
                    />
                    Aperto oggi
                  </div>
                </div>
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF — locali clienti (mostra solo se ci sono tenant attivi) */}
      <LogosStripSection tenants={activeTenants} />

      {/* GOOGLE SEMPRE AGGIORNATO */}
      <GoogleSyncSection />

      {/* PRESENZA LOCALE — Google, Yelp, TripAdvisor */}
      <LocalPresenceSection />

      {/* BENEFICI */}
      <BenefitsEditorialSection />

      {/* TESTIMONIALS — recensioni reali da Google Places (mostra solo se popolato) */}
      <TestimonialsSection reviews={testimonials} />

      {/* PRICING */}
      <HomePricingSection />

      {/* AI INTEGRATIONS — secondaria, opzionale */}
      <AIIntegrationsTeaserSection />

      {/* FAQ */}
      <FAQSection items={HOMEPAGE_FAQ} />

      {/* FINAL CTA */}
      <FinalCTASection />
    </MarketingShell>
  );
}
