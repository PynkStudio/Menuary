import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { FAQSection } from "@/components/marketing/marketing-sections";
import { MENUARY_ORIGIN } from "@/lib/marketing-seo";
import {
  MENUARY_LANDING_BASE,
  MENUARY_LANDINGS,
  findMenuaryLanding,
  isMenuaryLandingPublished,
  menuaryLandingPath,
  publishedMenuaryLandings,
  type MenuaryLandingSlug,
} from "@/lib/menuary-landings";
import { LANDING_CONTENT } from "./landing-content";
import { LandingTracker } from "./landing-tracker";
import {
  Benefits,
  HowItWorks,
  LandingFinalCTA,
  MenuaryEcosystem,
  PainHero,
  ProblemSection,
  ProductDemo,
  RelatedSolutions,
  SolutionSection,
  landingContactHref,
  visible,
} from "./landing-sections";

function ogImage(title: string) {
  return `${MENUARY_ORIGIN}/api/og?brand=menuary&title=${encodeURIComponent(title)}`;
}

// Solo italiano: canonical auto-referenziante, niente cluster hreflang finché
// non esiste una traduzione vera (vedi CLAUDE.md, multilingua).
function landingMetadata({
  path,
  title,
  description,
  ogTitle,
  indexable,
}: {
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  indexable: boolean;
}): Metadata {
  const url = `${MENUARY_ORIGIN}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url, languages: { it: url, "x-default": url } },
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: "Menuary",
      locale: "it_IT",
      type: "website",
      images: [{ url: ogImage(ogTitle), width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: { card: "summary_large_image", title: ogTitle, description, images: [ogImage(ogTitle)] },
    robots: indexable ? undefined : { index: false, follow: false },
  };
}

export function menuaryLandingMetadata(slug: MenuaryLandingSlug): Metadata {
  const { seo } = LANDING_CONTENT[slug];
  return landingMetadata({
    path: menuaryLandingPath(slug),
    title: seo.title,
    description: seo.description,
    ogTitle: seo.ogTitle,
    indexable: isMenuaryLandingPublished(slug),
  });
}

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function MenuaryLandingPage({ slug }: { slug: MenuaryLandingSlug }) {
  const content = LANDING_CONTENT[slug];
  const entry = findMenuaryLanding(slug);
  const url = `${MENUARY_ORIGIN}${menuaryLandingPath(slug)}`;
  const faq = visible(content.faq);

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Menuary", item: MENUARY_ORIGIN },
        { "@type": "ListItem", position: 2, name: "Soluzioni per ristoranti", item: `${MENUARY_ORIGIN}${MENUARY_LANDING_BASE}` },
        { "@type": "ListItem", position: 3, name: entry?.label ?? content.seo.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: content.seo.title,
      description: content.seo.description,
      url,
      provider: { "@type": "Organization", name: "Menuary", url: MENUARY_ORIGIN },
      areaServed: { "@type": "Country", name: "Italia" },
      audience: { "@type": "BusinessAudience", audienceType: "Ristoranti, pizzerie, trattorie, bar e locali food" },
      inLanguage: "it",
    },
    ...(faq.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          },
        ]
      : []),
  ];

  return (
    <MarketingShell>
      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
      <LandingTracker landing={slug} />
      <PainHero content={content} label={entry?.label ?? ""} />
      <ProblemSection problem={content.problem} />
      <SolutionSection solution={content.solution} />
      <HowItWorks steps={content.steps} />
      <ProductDemo content={content} />
      <Benefits benefits={content.benefits} />
      <MenuaryEcosystem current={slug} />
      <RelatedSolutions slugs={content.related} current={slug} />
      {faq.length ? <FAQSection items={faq} kicker="Domande frequenti" title="Prima di chiederci una demo" /> : null}
      <LandingFinalCTA slug={slug} finalCta={content.finalCta} />
    </MarketingShell>
  );
}

/* ============================================================
   HUB — /ristoranti
   ============================================================ */

const HUB_SEO = {
  title: "Soluzioni per ristoranti: telefonate, ordini, menu, delivery e Google",
  description:
    "Telefonate perse, menu da aggiornare su ogni canale, software che non si parlano, recensioni Google. Menuary risolve i problemi operativi del ristorante con un unico sistema.",
  ogTitle: "Problemi diversi. Un solo sistema.",
};

export function menuaryLandingHubMetadata(): Metadata {
  return landingMetadata({ path: MENUARY_LANDING_BASE, ...HUB_SEO, indexable: true });
}

export function MenuaryLandingHub({ includeUnpublished }: { includeUnpublished: boolean }) {
  const landings = includeUnpublished ? [...MENUARY_LANDINGS] : publishedMenuaryLandings();
  return (
    <MarketingShell>
      <LandingTracker landing="hub" />
      <section className="relative overflow-hidden">
        <div className="menuary-hero absolute inset-0" aria-hidden />
        <div className="menuary-container relative pt-16 pb-20 lg:pt-24 lg:pb-24">
          <p className="menuary-opener menuary-fade-up">Soluzioni per ristoranti</p>
          <h1 className="menuary-statement mt-7 max-w-4xl text-[clamp(2.2rem,6vw,5.4rem)]">
            Problemi diversi.
            <br />
            <span className="italic text-[var(--menuary-copper)]">Un solo sistema.</span>
          </h1>
          <p className="menuary-fade-up menuary-fade-up-d2 mt-8 max-w-2xl text-[17px] leading-[1.75] text-[var(--menuary-ink)]/80">
            Telefono, prenotazioni, menu, ordini, cassa, delivery, Google: oggi sono pezzi separati. Menuary li collega, e permette a clienti, personale e titolare di lavorare con lo stesso sistema. Parti dal problema che senti di più.
          </p>
          <div className="menuary-reveal-row mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {landings.map((landing) => (
              <Link
                key={landing.slug}
                href={menuaryLandingPath(landing.slug)}
                data-landing-cta="related"
                className="group flex min-h-48 flex-col rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--menuary-ink)]"
              >
                <p className="text-[15px] leading-6 text-[var(--menuary-muted)]">{landing.pain}</p>
                <p className="menuary-display mt-auto inline-flex items-center gap-2 pt-8 text-[1.5rem] leading-tight">
                  {landing.label}
                  <ArrowUpRight size={18} strokeWidth={1.6} className="text-[var(--menuary-copper)]" />
                </p>
              </Link>
            ))}
          </div>
          <Link href={landingContactHref("hub")} data-landing-cta="primary" className="menuary-button menuary-button-accent mt-12 inline-flex">
            Parla con noi del tuo locale
          </Link>
        </div>
      </section>
      <MenuaryEcosystem />
    </MarketingShell>
  );
}
