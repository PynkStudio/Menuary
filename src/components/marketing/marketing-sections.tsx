import Link from "next/link";
import { ArrowUpRight, Check, Clock, Megaphone, Phone, Plus, ShieldCheck, Star } from "lucide-react";
import { fetchPricingPlans, type MarketingTenant } from "@/lib/marketing-data";
import { DEFAULT_MARKET, MARKET_HEADER, getMarket, normalizeMarketCode } from "@/lib/markets";
import { formatPricingAmount, formatSetupFrom, replacePriceToken } from "@/lib/pricing-format";
import { headers } from "next/headers";
import { getLocale } from "@/i18n";
import { localizedPath } from "@/lib/marketing-seo";
import { AICallSimulation, type AICallStep } from "./ai-call-simulation";

/* ============================================================
   LOGOS MARQUEE
   ============================================================ */

export async function LogosStripSection({ tenants }: { tenants: MarketingTenant[] }) {
  if (tenants.length === 0) return null;
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.logosStrip;
  const labels = tenants.map((t) => t.name);
  const minMarqueeItems = 8;
  const repeats = Math.max(2, Math.ceil(minMarqueeItems / labels.length));
  const track = Array.from({ length: repeats }, () => labels).flat();
  return (
    <section className="border-y border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-10 lg:py-14">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-12">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--menuary-muted)] sm:max-w-[12rem] sm:text-right">
            {t.label}
          </p>
          <div className="menuary-marquee flex-1">
            <div className="menuary-marquee-track">
              {track.map((label, i) => (
                <span
                  key={`${label}-${i}`}
                  className="font-[var(--font-menuary-display)] text-[clamp(1.4rem,2.4vw,2rem)] italic text-[var(--menuary-ink)]/70"
                  style={{ fontFamily: "var(--font-menuary-display), serif" }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ
   ============================================================ */

type FAQItem = { q: string; a: string };

export async function FAQSection({
  items,
  title,
  kicker,
}: {
  items: FAQItem[];
  title?: string;
  kicker?: string;
}) {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.faq;
  const resolvedKicker = kicker ?? t.kicker;
  const locale = await getLocale();
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="menuary-reveal">
            <p className="menuary-opener">{resolvedKicker}</p>
            <h2 className="menuary-statement mt-7 text-[clamp(2rem,4.8vw,4rem)]">
              {title ?? t.title}
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-7 text-[var(--menuary-ink)]/75">
              {t.notFound}{" "}
              <Link href={localizedPath("/contatti", locale)} className="menuary-link">
                {t.ctaLink}
                <ArrowUpRight size={14} strokeWidth={1.6} />
              </Link>
            </p>
          </div>
          <div>
            {items.map((f) => (
              <details key={f.q} className="menuary-faq-item group">
                <summary>
                  <span>{f.q}</span>
                  <span className="menuary-faq-toggle" aria-hidden>
                    <Plus size={16} strokeWidth={1.8} />
                  </span>
                </summary>
                <div className="menuary-faq-answer">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FINAL CTA
   ============================================================ */

export async function FinalCTASection() {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.finalCta;
  const locale = await getLocale();
  return (
    <section className="menuary-beat">
      <div className="menuary-container relative py-24 lg:py-32">
        <div className="menuary-reveal grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-20">
          <div>
            <p className="menuary-opener" data-tone="light">
              {t.label}
            </p>
            <h2 className="menuary-statement mt-7 text-[clamp(2.1rem,5.8vw,5.4rem)]">
              {t.h2a}
              <br />
              <span className="italic text-[var(--menuary-gold)]">
                {t.h2b}
              </span>
            </h2>
            <p className="mt-7 max-w-md text-[16px] leading-7 text-white/70">
              {t.sub}
            </p>
          </div>
          <div className="flex flex-col items-start gap-5">
            <Link
              href={localizedPath("/contatti", locale)}
              className="menuary-button menuary-button-accent"
            >
              {t.cta}
            </Link>
            <a
              href="mailto:hello@menuary.it"
              className="menuary-link menuary-link-light"
            >
              hello@menuary.it
              <ArrowUpRight size={16} strokeWidth={1.6} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   GOOGLE SYNC — "Google sempre aggiornato"
   ============================================================ */

const GOOGLE_SYNC_ICONS = [Star, Clock, Megaphone, ShieldCheck] as const;

export async function GoogleSyncSection() {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.googleSync;
  const cards = t.cards;
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="menuary-reveal max-w-3xl">
          <p className="menuary-opener">{t.label}</p>
          <h2 className="menuary-statement mt-7 text-[clamp(2rem,5vw,4.4rem)]">
            {t.h2}
          </h2>
          <p className="mt-7 max-w-xl text-[17px] leading-[1.7] text-[var(--menuary-ink)]/75">
            {t.sub}
          </p>
        </div>

        <div className="menuary-reveal-row mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, idx) => {
            const Icon = GOOGLE_SYNC_ICONS[idx] ?? Star;
            return (
              <div
                key={card.title}
                className="group flex flex-col rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--menuary-ink)] hover:shadow-[0_18px_50px_-20px_rgba(24,35,31,0.18)]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--menuary-ink)]/5 text-[var(--menuary-ink)]">
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <h3 className="menuary-display mt-6 text-[1.35rem] leading-tight">
                  {card.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-[var(--menuary-muted)]">
                  {card.body}
                </p>
                {card.note ? (
                  <p className="mt-5 border-t border-[var(--menuary-line)] pt-4 text-[11px] uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                    {card.note}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   LOCAL PRESENCE — Google / Yelp / TripAdvisor
   ============================================================ */

export async function LocalPresenceSection() {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.localPresence;
  const locale = await getLocale();
  return (
    <section className="menuary-beat border-t border-[var(--menuary-line)]">
      <div className="menuary-container relative py-24 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="menuary-reveal">
            <p className="menuary-opener" data-tone="light">{t.label}</p>
            <h2 className="menuary-statement mt-7 text-[clamp(2rem,5vw,4.4rem)]">
              {t.h2a}
              <br />
              <span className="italic text-[var(--menuary-gold)]">
                {t.h2b}
              </span>
            </h2>
            <p className="mt-7 max-w-lg text-[17px] leading-[1.7] text-white/70">
              {t.sub}
            </p>
            <Link href={localizedPath("/contatti", locale)} className="menuary-link menuary-link-light mt-8 inline-flex">
              {t.cta}
              <ArrowUpRight size={14} strokeWidth={1.6} />
            </Link>
          </div>

          <div className="menuary-reveal menuary-fade-up-d2 relative mx-auto w-full max-w-md">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
              {t.exampleLabel}
            </p>
            {/* Google card */}
            <div className="relative z-20 rounded-2xl border border-[var(--menuary-line)] bg-white p-5 shadow-[0_24px_60px_-24px_rgba(24,35,31,0.22)]">
              <div className="flex items-center gap-3">
                <GoogleGlyph />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                    Google
                  </p>
                  <p className="text-sm font-semibold truncate text-[var(--menuary-ink)]">
                    {t.googleOpen}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex gap-0.5 text-[var(--menuary-copper)]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-[var(--menuary-ink)]">
                  4,7
                </span>
                <span className="text-xs text-[var(--menuary-muted)]">
                  {t.googleUpdated}
                </span>
              </div>
            </div>

            {/* TripAdvisor card */}
            <div className="relative z-10 -mt-3 ml-12 rounded-2xl border border-[var(--menuary-line)] bg-white p-4 shadow-[0_20px_50px_-24px_rgba(24,35,31,0.18)]">
              <div className="flex items-center gap-3">
                <TripAdvisorGlyph />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                    Tripadvisor
                  </p>
                  <p className="text-sm font-semibold truncate text-[var(--menuary-ink)]">
                    {t.taExcellence}
                  </p>
                </div>
              </div>
            </div>

            {/* Yelp card */}
            <div className="relative z-0 -mt-3 ml-4 mr-12 rounded-2xl border border-[var(--menuary-line)] bg-white p-4 shadow-[0_16px_40px_-24px_rgba(24,35,31,0.18)]">
              <div className="flex items-center gap-3">
                <YelpGlyph />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                    Yelp
                  </p>
                  <p className="text-sm font-semibold truncate text-[var(--menuary-ink)]">
                    {t.yelpReviews}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GoogleGlyph() {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_var(--menuary-line)]">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
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
  );
}

function TripAdvisorGlyph() {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
      {/* TripAdvisor owl — green circle, two eyes */}
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden>
        <circle cx="20" cy="20" r="20" fill="#00AF87" />
        {/* left eye */}
        <circle cx="13" cy="21" r="6" fill="white" />
        <circle cx="13" cy="21" r="3.5" fill="#00AF87" />
        <circle cx="13" cy="21" r="2" fill="#1A1A1A" />
        <circle cx="12" cy="20" r="0.7" fill="white" />
        {/* right eye */}
        <circle cx="27" cy="21" r="6" fill="white" />
        <circle cx="27" cy="21" r="3.5" fill="#00AF87" />
        <circle cx="27" cy="21" r="2" fill="#1A1A1A" />
        <circle cx="26" cy="20" r="0.7" fill="white" />
        {/* beak */}
        <ellipse cx="20" cy="27" rx="2.5" ry="1.5" fill="white" opacity="0.9" />
      </svg>
    </span>
  );
}

function YelpGlyph() {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#D32323]">
      {/* Yelp burst star */}
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="white">
        <path d="M12.27 12.56l-3.93 1.06a.5.5 0 0 1-.6-.64l1.58-3.67a.5.5 0 0 1 .88-.06l2.35 2.61a.5.5 0 0 1-.28.7zm1.37-.96l2.08-3.43a.5.5 0 0 1 .85.06l1.24 3.8a.5.5 0 0 1-.57.65l-3.32-.43a.5.5 0 0 1-.28-.65zm-4.83 4.28l-3.59-1.6a.5.5 0 0 1-.1-.86l3.08-2.25a.5.5 0 0 1 .76.28l.51 3.83a.5.5 0 0 1-.66.6zm9.04 1.14l-3.6 1.53a.5.5 0 0 1-.67-.57l.46-3.85a.5.5 0 0 1 .75-.37l3.13 2.2a.5.5 0 0 1-.07.86zm-4.43 3.83l.04 3.9a.5.5 0 0 1-.78.42l-3.22-2.12a.5.5 0 0 1 .07-.86l3.18-1.77a.5.5 0 0 1 .71.43z" />
      </svg>
    </span>
  );
}

/* ============================================================
   BENEFITS — editorial 4-card grid
   ============================================================ */

export async function BenefitsEditorialSection() {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.benefits;
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="menuary-reveal max-w-3xl">
          <p className="menuary-opener">{t.label}</p>
          <h2 className="menuary-statement mt-7 text-[clamp(2.1rem,5.6vw,5rem)]">
            {t.h2a}
            <br />
            <span className="italic text-[var(--menuary-copper)]">
              {t.h2b}
            </span>
          </h2>
        </div>

        <div className="menuary-reveal-row mt-16 grid gap-px overflow-hidden border-y border-[var(--menuary-line)] sm:grid-cols-2 lg:grid-cols-4">
          {t.cards.map((card) => (
            <div
              key={card.n}
              className="flex flex-col bg-[var(--menuary-paper)] p-8 transition-colors duration-300 hover:bg-[#fffaf2]"
            >
              <p className="menuary-numeral" aria-hidden>
                {card.n}
              </p>
              <h3 className="menuary-display mt-7 text-[1.5rem] leading-tight">
                {card.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-[var(--menuary-ink)]/70">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HOME PRICING — 3 piani (Presenza / Prenotazioni / Operatività)
   ============================================================ */



export async function HomePricingSection() {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.homePricing;
  const locale = await getLocale();
  const h = await headers();
  const marketCode = normalizeMarketCode(h.get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  const market = getMarket(marketCode);
  const pricingPlans = await fetchPricingPlans(marketCode);
  const perMonthLabel = t.perMonth.replace(/[€$£]\s*/, "");
  const copyById = new Map(t.plans.map((plan) => [plan.id, plan]));
  const plans = pricingPlans.map((plan) => {
    const copy = copyById.get(plan.slug) ?? t.plans[0];
    const currency = plan.currency ?? market.currency;
    return {
      ...copy,
      id: plan.slug,
      price_annual: plan.price_annual,
      price_monthly: plan.price_monthly,
      currency,
      monthly: formatPricingAmount(plan.price_annual, currency, market.locale),
      monthlyBilling: formatPricingAmount(plan.price_monthly, currency, market.locale),
      setup: formatSetupFrom(plan.setup_from, currency, market.locale),
      highlighted: plan.is_featured === true,
    };
  });
  return (
    <section
      id="prezzi"
      className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]"
    >
      <div className="menuary-container py-24 lg:py-32">
        <div className="menuary-reveal grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="menuary-opener">{t.label}</p>
            <h2 className="menuary-statement mt-7 text-[clamp(2.1rem,5.6vw,5rem)]">
              {t.h2a}
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                {t.h2b}
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-[1.6] text-[var(--menuary-ink)]/75">
            {t.sub}
          </p>
        </div>

        <div className="menuary-reveal-row mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => {
            const highlighted = plan.highlighted === true;
            const saving = (plan.price_monthly - plan.price_annual) * 12;
            const formattedSaving = formatPricingAmount(saving, plan.currency, market.locale);
            return (
              <article
                key={plan.id}
                className={
                  "relative flex flex-col rounded-3xl border bg-[var(--menuary-paper)] p-8 transition-all duration-200 " +
                  (highlighted
                    ? "border-[var(--menuary-ink)] shadow-[0_30px_70px_-30px_rgba(24,35,31,0.32)] lg:scale-[1.02]"
                    : "border-[var(--menuary-line)] hover:border-[var(--menuary-ink)]")
                }
              >
                {highlighted ? (
                  <span className="absolute -top-3 left-8 inline-flex items-center rounded-full bg-[var(--menuary-copper)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    {t.mostChosen}
                  </span>
                ) : null}

                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                  {/* Il piano in evidenza ha già il badge: niente doppio "Più scelto". */}
                  {highlighted ? t.plans[0].eyebrow : plan.eyebrow}
                </p>
                <h3 className="menuary-display mt-2 text-[1.9rem] leading-tight">
                  {plan.name}
                </h3>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="menuary-display text-[3.4rem] leading-none tabular-nums">
                    {plan.monthly}
                  </span>
                  <span className="text-sm text-[var(--menuary-muted)]">
                    {perMonthLabel}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[var(--menuary-muted)]">
                  {t.annualBilling} ·{" "}
                  <span className="font-semibold text-[var(--menuary-sage)]">
                    {replacePriceToken(t.savingsLabel, "amount", formattedSaving)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-[var(--menuary-muted)]">
                  {t.monthlyLabel
                    .replace(/[€$£]?\{price\}/, plan.monthlyBilling)
                    .replace("{setup}", plan.setup)}
                </p>

                <div className="my-7 h-px bg-[var(--menuary-line)]" />

                {plan.inherits ? (
                  <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--menuary-ink)]">
                    {plan.inherits}
                  </p>
                ) : null}

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-[15px] leading-[1.5] text-[var(--menuary-ink)]"
                    >
                      <Check
                        size={16}
                        strokeWidth={2}
                        className="mt-1 shrink-0 text-[var(--menuary-sage)]"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  <Link
                    href={localizedPath("/contatti", locale)}
                    className={
                      "menuary-button " +
                      (highlighted
                        ? "menuary-button-accent"
                        : "menuary-button-light")
                    }
                  >
                    {plan.ctaLabel}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
          {t.vatNote}
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   AI INTEGRATIONS — sezione secondaria opzionale
   ============================================================ */

export async function AIIntegrationsTeaserSection() {
  const sections = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections;
  const t = sections.aiTeaser;
  const locale = await getLocale();
  return (
    <section className="menuary-beat-copper border-t border-[var(--menuary-line)]">
      <div className="menuary-container relative py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="menuary-reveal">
            <p className="menuary-opener" style={{ color: "#fff7ef" }}>{t.label}</p>
            <h2 className="menuary-statement mt-7 text-[clamp(1.9rem,4.6vw,3.7rem)] text-[#fff7ef]">
              {t.h2}
            </h2>
            <p className="mt-6 max-w-lg text-[16px] leading-[1.7] text-[#fff7ef]/85">
              {t.sub}
            </p>
            <p className="mt-5 flex w-fit items-center gap-2 rounded-full border border-[#fff7ef]/30 px-3.5 py-1.5 text-[13px] text-[#fff7ef]">
              <Phone size={13} strokeWidth={1.8} />
              {sections.homePricing.aiTitle}
            </p>
            <Link href={localizedPath("/contatti", locale)} className="menuary-link menuary-link-light mt-8 inline-flex">
              {t.cta}
              <ArrowUpRight size={14} strokeWidth={1.6} />
            </Link>
          </div>

          <AICallSimulation
            liveLabel={t.mockupLive}
            handledLabel={t.mockupCallHandled}
            script={t.mockupScript as readonly AICallStep[]}
          />
        </div>
      </div>
    </section>
  );
}
