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
import { DEFAULT_MARKET, MARKET_HEADER, formatMarketLanguageBadge, normalizeMarketCode } from "@/lib/markets";
import { getMockupCopy } from "@/lib/localized-commercial-copy";
import { getLocale, getTranslations } from "@/i18n";
import { headers } from "next/headers";

const MENUARY_SEO_VERTICALS = {
  it: [
    {
      title: "Siti web per ristoranti",
      body: "Menu digitale, prenotazioni tavoli, galleria, recensioni Google e contenuti aggiornabili dal pannello.",
    },
    {
      title: "Siti per pizzerie e trattorie",
      body: "Menu stagionali, piatti del giorno, ordini online, allergeni e informazioni sempre disponibili da mobile.",
    },
    {
      title: "Siti per bar, bistrot e locali",
      body: "Orari, eventi, promozioni, Google Maps e pagine multilingua per clienti locali e turisti.",
    },
  ],
  en: [
    {
      title: "Websites for restaurants",
      body: "Digital menu, table bookings, gallery, Google reviews and content updates from one dashboard.",
    },
    {
      title: "Websites for pizzerias and trattorias",
      body: "Seasonal menus, daily specials, online orders, allergens and mobile-first information.",
    },
    {
      title: "Websites for bars, bistros and venues",
      body: "Opening hours, events, promotions, Google Maps and multilingual pages for locals and tourists.",
    },
  ],
};

export async function MarketingHomePage() {
  const { activeTenants, testimonials } = await getMarketingHomeData("food");
  const locale = await getLocale();
  const t = await getTranslations("marketing");
  const h = t.home;
  const requestHeaders = await headers();
  const market = normalizeMarketCode(requestHeaders.get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  const multilangPrefix = h.badgeMultilang.split("·")[0]?.trim() || h.badgeMultilang;
  const multilangBadge = formatMarketLanguageBadge(multilangPrefix, market);
  const mockup = getMockupCopy(locale, market, "food");
  const seoVerticals = locale === "it" ? MENUARY_SEO_VERTICALS.it : MENUARY_SEO_VERTICALS.en;

  return (
    <MarketingShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="menuary-hero absolute inset-0" aria-hidden />
        <div className="menuary-container relative pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid items-end gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div>
              <p className="menuary-opener menuary-fade-up">
                {h.heroLabel}
              </p>
              <h1 className="menuary-statement menuary-fade-up menuary-fade-up-d1 mt-7 text-[clamp(2.05rem,6.6vw,5.8rem)]">
                {h.heroH1a}
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  {h.heroH1b}
                </span>
              </h1>
              <p className="menuary-fade-up menuary-fade-up-d2 mt-8 max-w-xl text-[17px] leading-[1.75] text-[var(--menuary-ink)]/80">
                {h.heroSub}
              </p>
              <div className="menuary-fade-up menuary-fade-up-d3 mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link
                  href="/contatti"
                  className="menuary-button menuary-button-accent"
                >
                  {h.ctaDemo}
                </Link>
                <Link href="#esempio" className="menuary-link">
                  {h.ctaExample}
                  <ArrowUpRight size={16} strokeWidth={1.6} />
                </Link>
              </div>
              <div className="menuary-fade-up menuary-fade-up-d3 mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck
                    size={14}
                    strokeWidth={1.7}
                    className="text-[var(--menuary-sage)]"
                  />
                  {h.badgeFreeCall}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock
                    size={14}
                    strokeWidth={1.7}
                    className="text-[var(--menuary-gold)]"
                  />
                  {h.badgeOnline}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Globe
                    size={14}
                    strokeWidth={1.7}
                    className="text-[var(--menuary-muted)]"
                  />
                  {multilangBadge}
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
                        {mockup.dashboardToday}
                      </p>
                      <p className="menuary-display mt-1 text-2xl">
                        12
                        <span className="ml-1 text-xs font-medium text-[var(--menuary-muted)]">
                          {mockup.dashboardBookings}
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
                          {mockup.dashboardAverage}
                        </span>
                      </p>
                    </div>
                    <div className="menuary-module-tile">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                        {mockup.dashboardHours}
                      </p>
                      <p className="menuary-display mt-1 text-base leading-tight">
                        {mockup.dashboardUpdated}
                        <br />
                        <span className="text-xs font-medium text-[var(--menuary-muted)]">
                          {mockup.dashboardUpdatedWhen}
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
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC04" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                    </svg>
                  </span>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                    {mockup.googleCard}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="flex gap-0.5 text-[var(--menuary-copper)]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-[var(--menuary-ink)]">4,7</span>
                </div>
                <p className="mt-2 text-xs text-[var(--menuary-muted)]">
                  {mockup.googleOpen}
                </p>
              </div>

              {/* Mobile site preview */}
              <div className="absolute -bottom-8 -left-4 hidden w-[11rem] rounded-3xl border border-[var(--menuary-line)] bg-[var(--menuary-ink)] p-3 shadow-[0_30px_70px_-24px_rgba(24,35,31,0.4)] sm:block">
                <div className="menuary-phone-top" />
                <div className="rounded-2xl bg-[var(--menuary-paper)] p-3 text-[var(--menuary-ink)]">
                  <p className="menuary-display text-base leading-tight">
                    {mockup.phoneName[0]}
                    <br />
                    {mockup.phoneName[1]}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--menuary-muted)] font-bold">
                    {mockup.phoneMeta}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[var(--menuary-ink)]">
                    <CalendarCheck size={12} strokeWidth={1.8} className="text-[var(--menuary-copper)]" />
                    {mockup.phoneAction}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--menuary-muted)]">
                    <Check size={11} strokeWidth={2} className="text-[var(--menuary-sage)]" />
                    {mockup.phoneStatus}
                  </div>
                </div>
              </div>
            </figure>
          </div>
        </div>
      </section>

      <LogosStripSection tenants={activeTenants} />
      <GoogleSyncSection />
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
        <div className="menuary-container py-20 lg:py-24">
          <div className="menuary-reveal max-w-3xl">
            <p className="menuary-opener">
              {locale === "it" ? "Mercati food" : "Food markets"}
            </p>
            <h2 className="menuary-statement mt-7 text-[clamp(2rem,5vw,4.4rem)]">
              {locale === "it"
                ? "Siti web per ristoranti, pizzerie, bar e locali."
                : "Websites for restaurants, pizzerias, bars and venues."}
            </h2>
            <p className="mt-7 max-w-2xl text-[16px] leading-[1.75] text-[var(--menuary-ink)]/75">
              {locale === "it"
                ? "Menuary copre le ricerche più importanti per chi vuole farsi trovare online: sito per ristorante, menu digitale, prenotazioni online, ordini e presenza locale su Google."
                : "Menuary covers the main discovery paths for food businesses: restaurant website, digital menu, online bookings, ordering and local Google presence."}
            </p>
          </div>
          <div className="menuary-reveal-row mt-14 grid gap-px overflow-hidden rounded-2xl border border-[var(--menuary-line)] md:grid-cols-3">
            {seoVerticals.map((item, i) => (
              <article
                key={item.title}
                className="flex flex-col gap-4 bg-[var(--menuary-porcelain)] p-8 transition-colors duration-300 hover:bg-[#fffaf2]"
              >
                <span className="menuary-numeral text-[2.4rem] leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="menuary-display text-[1.6rem] leading-tight">{item.title}</h3>
                <p className="text-[15px] leading-[1.65] text-[var(--menuary-ink)]/70">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <LocalPresenceSection />
      <BenefitsEditorialSection />
      <TestimonialsSection reviews={testimonials} />
      <HomePricingSection />
      <AIIntegrationsTeaserSection />
      <FAQSection items={[...h.faq]} />
      <FinalCTASection />
    </MarketingShell>
  );
}
