import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  CalendarCheck,
  Check,
  Clock,
  Globe,
  MessageSquareText,
  QrCode,
  ShieldCheck,
  Star,
  UtensilsCrossed,
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

const MENUARY_OPERATING_MOMENTS = [
  {
    icon: QrCode,
    title: "Menu che cambia davvero",
    text: "Piatti esauriti, allergeni, stagionalita e prezzi non restano chiusi in un PDF vecchio: il menu online si aggiorna dal pannello e resta leggibile da mobile.",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1100&q=86",
    alt: "Tavolo di ristorante con menu, telefono e piatti condivisi",
  },
  {
    icon: CalendarCheck,
    title: "Prenotazioni senza caos",
    text: "Richieste, conferme, orari speciali e turni vengono raccolti in un flusso unico, cosi sala e gestione vedono la stessa situazione prima del servizio.",
    image: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1100&q=86",
    alt: "Sala ristorante apparecchiata prima del servizio serale",
  },
  {
    icon: MessageSquareText,
    title: "Google, recensioni e fiducia",
    text: "Orari, scheda Google, recensioni e contenuti pubblici restano coerenti: chi cerca il locale trova informazioni fresche prima di chiamare o prenotare.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1100&q=86",
    alt: "Staff di un locale al banco durante la preparazione del servizio",
  },
];

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
      <section className="relative isolate overflow-hidden border-b border-[var(--menuary-line)] bg-[#151f1b] text-white">
        <Image
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2400&q=88"
          alt="Sala di ristorante elegante durante il servizio"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(14,22,19,0.96)_0%,rgba(14,22,19,0.82)_44%,rgba(14,22,19,0.22)_100%),linear-gradient(180deg,rgba(14,22,19,0.16)_0%,rgba(14,22,19,0.88)_100%)]" />
        <div className="menuary-container relative grid min-h-[calc(82svh-5.75rem)] items-end gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <div className="menuary-fade-up max-w-4xl pb-4">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--menuary-gold)]">
              <UtensilsCrossed size={15} strokeWidth={1.7} />
              {h.heroLabel}
            </p>
            <h1 className="menuary-display mt-6 text-[clamp(3.2rem,7.6vw,6.8rem)] leading-[0.9] text-balance">
              {h.heroH1a}
              <br />
              <span className="italic text-[var(--menuary-gold)]">
                {h.heroH1b}
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-[17px] leading-[1.75] text-white/78">
              {h.heroSub}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link
                href="/contatti"
                className="menuary-button bg-white text-[var(--menuary-ink)] hover:bg-[var(--menuary-gold)]"
              >
                {h.ctaDemo}
              </Link>
              <Link href="#esempio" className="menuary-link menuary-link-light">
                {h.ctaExample}
                <ArrowUpRight size={16} strokeWidth={1.6} />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.16em] text-white/66">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  size={14}
                  strokeWidth={1.7}
                  className="text-[var(--menuary-gold)]"
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
                  className="text-white/62"
                />
                {multilangBadge}
              </span>
            </div>
          </div>

          <figure className="menuary-fade-up menuary-fade-up-d2 hidden pb-3 lg:block" aria-hidden>
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-[0.82fr_1.18fr]">
                <div className="border border-white/16 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/62">
                    {mockup.dashboardToday}
                  </p>
                  <p className="mt-2 text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                    12
                    <span className="ml-2 text-sm font-semibold text-white/62">
                      {mockup.dashboardBookings}
                    </span>
                  </p>
                </div>
                <div className="border border-white/16 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/62">
                    {mockup.dashboardHours}
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-tight text-white">
                    {mockup.dashboardUpdated}
                    <span className="ml-2 text-sm text-white/62">{mockup.dashboardUpdatedWhen}</span>
                  </p>
                </div>
              </div>
              <div className="relative min-h-[19rem] overflow-hidden border border-white/16">
                <Image
                  src="https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1300&q=86"
                  alt="Sala ristorante ordinata con tavoli pronti per le prenotazioni"
                  fill
                  sizes="42vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/76 via-black/18 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="inline-flex items-center gap-2 bg-white px-3 py-2 text-[12px] font-bold text-[var(--menuary-ink)] shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                    <CalendarCheck size={15} strokeWidth={1.8} className="text-[var(--menuary-copper)]" />
                    {mockup.phoneAction}
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-white/16 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/62">
                    {mockup.googleCard}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex gap-0.5 text-[var(--menuary-gold)]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-white">4,7</span>
                  </div>
                  <p className="mt-2 text-sm text-white/70">{mockup.googleOpen}</p>
                </div>
                <div className="border border-white/16 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/62">
                    {mockup.phoneMeta}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <Check size={15} strokeWidth={2} className="text-[var(--menuary-gold)]" />
                    {mockup.phoneStatus}
                  </div>
                </div>
              </div>
            </div>
          </figure>
        </div>
      </section>

      <LogosStripSection tenants={activeTenants} />
      <GoogleSyncSection />
      <section className="border-t border-[var(--menuary-line)] bg-[#151f1b] text-white">
        <div className="menuary-container py-20 lg:py-24">
          <div className="grid items-end gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="menuary-section-label text-[var(--menuary-gold)]">
                {locale === "it" ? "Dentro il servizio" : "Inside service"}
              </p>
              <h2 className="menuary-display mt-6 text-[clamp(2.4rem,5vw,4.6rem)] leading-[0.96]">
                {locale === "it"
                  ? "Non foto belle a caso: scene che succedono ogni sera."
                  : "Not random pretty photos: scenes that happen every night."}
              </h2>
            </div>
            <p className="max-w-xl text-[16px] leading-[1.75] text-white/70 lg:justify-self-end">
              {locale === "it"
                ? "Menuary nasce per il lavoro quotidiano di ristoranti, bar e locali: informazioni da aggiornare, clienti da rassicurare, richieste da non perdere e reputazione da proteggere."
                : "Menuary is built for the daily work of restaurants, bars and venues: information to update, guests to reassure, requests to capture and reputation to protect."}
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {MENUARY_OPERATING_MOMENTS.map((moment) => {
              const Icon = moment.icon;
              return (
                <article key={moment.title} className="overflow-hidden border border-white/14 bg-white/[0.06]">
                  <div className="relative min-h-72">
                    <Image
                      src={moment.image}
                      alt={moment.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-transparent" />
                    <div className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center bg-white text-[var(--menuary-ink)]">
                      <Icon size={19} strokeWidth={1.8} />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-medium leading-tight" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                      {moment.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-white/68">{moment.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
        <div className="menuary-container py-20 lg:py-24">
          <div className="max-w-3xl">
            <p className="menuary-section-label">
              {locale === "it" ? "Mercati food" : "Food markets"}
            </p>
            <h2 className="menuary-display mt-6 text-[clamp(2.1rem,4.4vw,3.8rem)] leading-[1.05]">
              {locale === "it"
                ? "Siti web per ristoranti, pizzerie, bar e locali."
                : "Websites for restaurants, pizzerias, bars and venues."}
            </h2>
            <p className="mt-6 max-w-2xl text-[16px] leading-[1.75] text-[var(--menuary-muted)]">
              {locale === "it"
                ? "Menuary copre le ricerche più importanti per chi vuole farsi trovare online: sito per ristorante, menu digitale, prenotazioni online, ordini e presenza locale su Google."
                : "Menuary covers the main discovery paths for food businesses: restaurant website, digital menu, online bookings, ordering and local Google presence."}
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {seoVerticals.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-7"
              >
                <h3 className="menuary-display text-[1.55rem] leading-tight">{item.title}</h3>
                <p className="mt-4 text-[15px] leading-[1.65] text-[var(--menuary-muted)]">
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
