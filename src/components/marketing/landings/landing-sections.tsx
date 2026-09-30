import Link from "next/link";
import { ArrowUpRight, ChevronRight, ShieldCheck } from "lucide-react";
import {
  MENUARY_LANDING_BASE,
  MENUARY_LANDINGS,
  isFeatureReady,
  isMenuaryLandingPublished,
  menuaryLandingPath,
  findMenuaryLanding,
  type MenuaryLandingSlug,
} from "@/lib/menuary-landings";
import { MENUARY_EMAIL, MENUARY_PHONE_DISPLAY, MENUARY_PHONE_E164 } from "@/components/marketing/contact-info";
import { ECOSYSTEM_VOICES, type Gated, type LandingContent, type LandingDemoKey } from "./landing-content";
import { CallDemo } from "./demos/call-demo";
import { SelfOrderComparison, SelfOrderDemo } from "./demos/self-order-demo";
import { HubDemo, ServiceQueueDemo } from "./demos/hub-demo";
import { WhatsAppDemo, WhatsAppKinds } from "./demos/whatsapp-demo";
import { MenuSyncDemo } from "./demos/menu-sync-demo";
import { HoursSyncDemo, ReviewsDemo } from "./demos/reviews-demo";

export function visible<T>(items: Gated<T>[]): Gated<T>[] {
  return items.filter((item) => !item.requires || isFeatureReady(item.requires));
}

export function landingContactHref(slug: string): string {
  return `/contatti?landing=${slug}#richiesta`;
}

/* ============================================================
   HERO
   ============================================================ */

function HeroDemo({ demo }: { demo: LandingDemoKey }) {
  switch (demo) {
    case "call":
      return <CallDemo />;
    case "self-order":
      return <SelfOrderDemo />;
    case "hub":
      return <HubDemo />;
    case "whatsapp":
      return <WhatsAppDemo />;
    case "menu-sync":
      return <MenuSyncDemo />;
    case "reviews":
      return <ReviewsDemo aiDrafts={isFeatureReady("reviewReplyDrafts")} />;
  }
}

export function PainHero({ content, label }: { content: LandingContent; label: string }) {
  const { hero } = content;
  return (
    <section className="relative overflow-hidden">
      <div className="menuary-hero absolute inset-0" aria-hidden />
      <div className="menuary-container relative pt-10 pb-16 lg:pt-16 lg:pb-24">
        <nav aria-label="Percorso" className="menuary-fade-up text-xs text-[var(--menuary-muted)]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-[var(--menuary-ink)]">Menuary</Link>
            </li>
            <ChevronRight size={12} aria-hidden />
            <li>
              <Link href={MENUARY_LANDING_BASE} className="hover:text-[var(--menuary-ink)]">Soluzioni per ristoranti</Link>
            </li>
            <ChevronRight size={12} aria-hidden />
            <li aria-current="page" className="text-[var(--menuary-ink)]">{label}</li>
          </ol>
        </nav>
        <div className="mt-8 grid items-center gap-12 lg:mt-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
          <div>
            <p className="menuary-opener menuary-fade-up">{hero.kicker}</p>
            <h1 className="menuary-statement mt-6 text-[clamp(2.2rem,5.6vw,4.9rem)]">
              {hero.titleA}
              <br />
              <span className="italic text-[var(--menuary-copper)]">{hero.titleB}</span>
            </h1>
            <p className="menuary-fade-up menuary-fade-up-d2 mt-7 max-w-xl text-[17px] leading-[1.75] text-[var(--menuary-ink)]/80">
              {hero.sub}
            </p>
            <div className="menuary-fade-up menuary-fade-up-d3 mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link
                href={landingContactHref(content.slug)}
                data-landing-cta="primary"
                className="menuary-button menuary-button-accent"
              >
                {hero.primaryCta}
              </Link>
              <a href="#demo" data-landing-cta="secondary" className="menuary-link">
                {hero.secondaryCta}
                <ArrowUpRight size={16} strokeWidth={1.6} />
              </a>
            </div>
            <ul className="menuary-fade-up menuary-fade-up-d3 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[var(--menuary-muted)]">
              {hero.proof.map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <ShieldCheck size={14} strokeWidth={1.8} className="text-[var(--menuary-sage)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="menuary-fade-up menuary-fade-up-d2">
            <HeroDemo demo={content.demo.key} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   IL PROBLEMA
   ============================================================ */

export function ProblemSection({ problem }: { problem: LandingContent["problem"] }) {
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="menuary-reveal">
            <p className="menuary-opener">{problem.opener}</p>
            <h2 className="menuary-statement mt-7 text-[clamp(1.9rem,4.4vw,3.6rem)]">{problem.title}</h2>
            <div className="mt-8 max-w-xl space-y-5 text-[16px] leading-[1.8] text-[var(--menuary-ink)]/78">
              {problem.scene.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <ul className="menuary-reveal-row self-end border-t border-[var(--menuary-line)]">
            {visible(problem.bullets).map((bullet) => (
              <li
                key={bullet.text}
                className="border-b border-[var(--menuary-line)] py-5 font-[var(--font-menuary-display)] text-[1.15rem] leading-snug text-[var(--menuary-ink)]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                {bullet.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   LA SOLUZIONE
   ============================================================ */

export function SolutionSection({ solution }: { solution: LandingContent["solution"] }) {
  const points = visible(solution.points);
  return (
    <section className="menuary-beat">
      <div className="menuary-container relative py-20 lg:py-28">
        <div className="menuary-reveal grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="menuary-opener" data-tone="light">{solution.opener}</p>
            <h2 className="menuary-statement mt-7 text-[clamp(1.9rem,4.4vw,3.8rem)]">{solution.title}</h2>
          </div>
          <p className="max-w-lg text-[16px] leading-[1.75] text-white/72 lg:justify-self-end">{solution.body}</p>
        </div>
        <div
          className={
            "menuary-reveal-row mt-14 grid gap-px overflow-hidden border border-white/12 bg-white/12 sm:grid-cols-2 " +
            (points.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-2")
          }
        >
          {points.map((point) => (
            <article key={point.title} className="bg-[var(--menuary-ink)] p-7 lg:p-8">
              <h3 className="menuary-display text-[1.45rem] leading-tight">{point.title}</h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-white/68">{point.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   COME FUNZIONA
   ============================================================ */

export function HowItWorks({ steps }: { steps: LandingContent["steps"] }) {
  const items = visible(steps.items);
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
      <div className="menuary-container py-20 lg:py-28">
        <h2 className="menuary-reveal menuary-statement text-[clamp(1.9rem,4.4vw,3.6rem)]">{steps.title}</h2>
        <ol
          className={
            "menuary-reveal-row mt-12 grid gap-px overflow-hidden border-y border-[var(--menuary-line)] sm:grid-cols-2 " +
            (items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4")
          }
        >
          {items.map((item, index) => (
            <li key={item.title} className="flex flex-col bg-[var(--menuary-paper)] p-7">
              <span className="menuary-numeral text-[2.6rem]" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="menuary-display mt-6 text-[1.3rem] leading-tight">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-[1.65] text-[var(--menuary-ink)]/70">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ============================================================
   DEMO
   ============================================================ */

function SecondaryDemo({ demo }: { demo: LandingDemoKey }) {
  switch (demo) {
    case "call":
      return <CallDemo languages={["it", "en", "de", "fr"]} />;
    case "self-order":
      return <SelfOrderComparison />;
    case "hub":
      return <ServiceQueueDemo />;
    case "whatsapp":
      return <WhatsAppKinds />;
    case "menu-sync":
      return <MenuSyncDemo interactive />;
    case "reviews":
      return <HoursSyncDemo />;
  }
}

export function ProductDemo({ content }: { content: LandingContent }) {
  const { demo } = content;
  return (
    <section id="demo" className="scroll-mt-24 border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="menuary-reveal lg:sticky lg:top-28 lg:self-start">
            <p className="menuary-opener">{demo.opener}</p>
            <h2 className="menuary-statement mt-7 text-[clamp(1.9rem,4vw,3.4rem)]">{demo.title}</h2>
            <p className="mt-6 max-w-md text-[16px] leading-[1.75] text-[var(--menuary-ink)]/75">{demo.sub}</p>
            <Link
              href={landingContactHref(content.slug)}
              data-landing-cta="demo"
              className="menuary-link mt-8 inline-flex"
            >
              Vedilo con il menu del tuo locale
              <ArrowUpRight size={16} strokeWidth={1.6} />
            </Link>
          </div>
          <div>
            <SecondaryDemo demo={demo.key} />
            <p className="mt-4 text-xs text-[var(--menuary-muted)]">
              Esempio con i dati di un locale dimostrativo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   BENEFICI
   ============================================================ */

export function Benefits({ benefits }: { benefits: LandingContent["benefits"] }) {
  const items = visible(benefits.items);
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
      <div className="menuary-container py-20 lg:py-28">
        <h2 className="menuary-reveal menuary-statement text-[clamp(1.9rem,4.4vw,3.6rem)]">{benefits.title}</h2>
        <div className="menuary-reveal-row mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article key={item.title} className="menuary-feature-card">
              <h3 className="menuary-display text-[1.35rem] leading-tight">{item.title}</h3>
              <p className="text-[15px] leading-[1.65] text-[var(--menuary-muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FA PARTE DI MENUARY — ecosistema
   ============================================================ */

const ALL_ECOSYSTEM_NODES: Gated<{ label: string; slug: MenuaryLandingSlug }>[] = [
  { label: "Telefono", slug: "telefonate-prenotazioni-ai" },
  { label: "Prenotazioni", slug: "telefonate-prenotazioni-ai" },
  { label: "Menu", slug: "menu-delivery" },
  { label: "Ordini", slug: "gestionale" },
  { label: "Cassa", slug: "gestionale" },
  { label: "Delivery", slug: "menu-delivery" },
  { label: "Google", slug: "google-maps-recensioni" },
  { label: "IA al tavolo", slug: "self-order-ai", requires: "conversationalMenu" },
  { label: "WhatsApp", slug: "whatsapp" },
  { label: "QR e kiosk", slug: "gestionale" },
];

const ECOSYSTEM_NODES = visible(ALL_ECOSYSTEM_NODES);

// Ogni nodo è collegato ai due successivi e all'opposto: una rete, non una catena.
const ECOSYSTEM_EDGES = ECOSYSTEM_NODES.flatMap((_, i) => {
  const n = ECOSYSTEM_NODES.length;
  const half = Math.floor(n / 2);
  return [
    [i, (i + 1) % n],
    [i, (i + 3) % n],
    ...(i < half ? [[i, i + half]] : []),
  ] as [number, number][];
});

function nodePosition(index: number) {
  const angle = (index / ECOSYSTEM_NODES.length) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.round((50 + Math.cos(angle) * 41) * 100) / 100,
    y: Math.round((50 + Math.sin(angle) * 41) * 100) / 100,
  };
}

export function MenuaryEcosystem({ current }: { current?: MenuaryLandingSlug }) {
  const voices = visible(ECOSYSTEM_VOICES);
  return (
    <section className="menuary-beat border-t border-[var(--menuary-line)]">
      <div className="menuary-container relative py-20 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div className="menuary-reveal">
            <p className="menuary-opener" data-tone="light">Fa parte di Menuary</p>
            <h2 className="menuary-statement mt-7 text-[clamp(1.9rem,4.4vw,3.8rem)]">
              E questa è solo
              <br />
              <span className="italic text-[var(--menuary-gold)]">una parte di Menuary.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[16px] leading-[1.75] text-white/70">
              Non sono strumenti diversi con un&apos;IA ciascuno. È un unico sistema, con diversi punti di accesso e gli stessi dati: la stessa intelligenza che conosce e coordina il ristorante.
            </p>
            <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {voices.map((voice) => (
                <li key={voice.says} className="grid gap-1 py-4 sm:grid-cols-[0.42fr_0.58fr] sm:gap-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{voice.who}</p>
                    <p className="mt-1 text-[15px] text-white">{voice.says}</p>
                  </div>
                  <p className="text-[14px] leading-6 text-white/62">→ {voice.result}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="menuary-reveal relative mx-auto w-full max-w-[34rem]">
            <div className="relative aspect-square">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
                {ECOSYSTEM_EDGES.map(([a, b]) => {
                  const pa = nodePosition(a);
                  const pb = nodePosition(b);
                  return (
                    <line
                      key={`${a}-${b}`}
                      x1={pa.x}
                      y1={pa.y}
                      x2={pb.x}
                      y2={pb.y}
                      stroke="rgba(210,182,109,0.28)"
                      strokeWidth="0.25"
                    />
                  );
                })}
              </svg>
              <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/15 bg-[var(--menuary-paper)] text-center text-[var(--menuary-ink)] sm:h-28 sm:w-28">
                <span className="menuary-wordmark text-lg sm:text-xl">
                  menuary<span className="text-[var(--menuary-copper)]">.</span>
                </span>
                <span className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Stessi dati</span>
              </div>
              {ECOSYSTEM_NODES.map((node, index) => {
                const { x, y } = nodePosition(index);
                const published = isMenuaryLandingPublished(node.slug);
                const active = node.slug === current;
                const className =
                  "menuary-eco-node absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 text-[11px] sm:text-xs";
                const style = { left: `${x}%`, top: `${y}%` };
                return published && !active ? (
                  <Link
                    key={node.label}
                    href={menuaryLandingPath(node.slug)}
                    data-landing-cta="ecosystem"
                    className={className}
                    style={style}
                  >
                    {node.label}
                  </Link>
                ) : (
                  <span key={node.label} className={className} style={style} data-active={active}>
                    {node.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SOLUZIONI COLLEGATE
   ============================================================ */

export function RelatedSolutions({
  slugs,
  current,
  title = "Lo stesso sistema risolve anche questo",
}: {
  slugs: MenuaryLandingSlug[];
  current: MenuaryLandingSlug;
  title?: string;
}) {
  // Prima quelle scelte per la pagina, poi le altre pubblicate: sempre tre porte d'ingresso.
  const ordered = [...slugs, ...MENUARY_LANDINGS.map((landing) => landing.slug)];
  const items = [...new Set(ordered)]
    .filter((slug) => slug !== current && isMenuaryLandingPublished(slug))
    .slice(0, 3)
    .map(findMenuaryLanding)
    .filter((landing): landing is NonNullable<typeof landing> => Boolean(landing));
  if (items.length === 0) return null;
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
      <div className="menuary-container py-16 lg:py-20">
        <h2 className="menuary-reveal menuary-display text-[clamp(1.6rem,3vw,2.4rem)]">{title}</h2>
        <div className="menuary-reveal-row mt-8 grid gap-4 md:grid-cols-3">
          {items.map((landing) => (
            <Link
              key={landing.slug}
              href={menuaryLandingPath(landing.slug)}
              data-landing-cta="related"
              className="group flex flex-col rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--menuary-ink)]"
            >
              <p className="text-[15px] leading-6 text-[var(--menuary-muted)]">{landing.pain}</p>
              <p className="menuary-display mt-5 inline-flex items-center gap-2 text-[1.35rem] leading-tight">
                {landing.label}
                <ArrowUpRight size={18} strokeWidth={1.6} className="text-[var(--menuary-copper)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA FINALE
   ============================================================ */

export function LandingFinalCTA({ slug, finalCta }: { slug: string; finalCta: LandingContent["finalCta"] }) {
  return (
    <section className="menuary-beat-copper">
      <div className="menuary-container relative py-20 lg:py-28">
        <div className="menuary-reveal grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-20">
          <div>
            <h2 className="menuary-statement text-[clamp(2rem,5.4vw,4.8rem)] text-[#fff7ef]">
              {finalCta.titleA}
              <br />
              <span className="italic text-[var(--menuary-gold)]">{finalCta.titleB}</span>
            </h2>
            <p className="mt-7 max-w-md text-[16px] leading-7 text-[#fff7ef]/85">{finalCta.sub}</p>
          </div>
          <div className="flex flex-col items-start gap-5">
            <Link href={landingContactHref(slug)} data-landing-cta="final" className="menuary-button menuary-button-dark">
              {finalCta.cta}
            </Link>
            <a href={`tel:${MENUARY_PHONE_E164}`} data-landing-cta="final-phone" className="menuary-link menuary-link-light">
              {MENUARY_PHONE_DISPLAY}
              <ArrowUpRight size={16} strokeWidth={1.6} />
            </a>
            <a href={`mailto:${MENUARY_EMAIL}`} data-landing-cta="final-email" className="menuary-link menuary-link-light">
              {MENUARY_EMAIL}
              <ArrowUpRight size={16} strokeWidth={1.6} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
