"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronDown, MessageCircle, UtensilsCrossed } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import { VenueWhatsappLink } from "@/components/modules/reservations/venue-display";
import { usePlatformMode } from "@/components/core/platform-mode-provider";
import { useDocaCopy } from "@/lib/doca-i18n";
import { DocaLanguageSelector } from "@/components/tenants/doca/doca-language-selector";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

export function Hero() {
  const reduceMotion = useReducedMotion();
  const tenant = useTenant();
  const mode = usePlatformMode();
  const pathname = usePathname();
  const content = getTenantContent(tenant.id);
  const isDoca = tenant.id === "doca";
  const docaCopy = useDocaCopy();
  const tenantHref = useTenantLocalizedHref();
  const isPathPreview = !!tenant.previewSlug && pathname?.startsWith(`/${tenant.previewSlug}`);
  const baseMenuHref =
    (mode === "preview" || isPathPreview) && tenant.previewSlug
      ? `/${tenant.previewSlug}/menu`
      : "/menu";
  const menuHref = tenantHref(baseMenuHref);

  const scrollToNext = () => {
    document.getElementById("tre-anime")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  if (isDoca) {
    return (
      <section className="doca-hero relative isolate overflow-hidden">
        <div className="doca-checker doca-checker-top" aria-hidden="true" />
        <div className="doca-checker doca-checker-bottom" aria-hidden="true" />

        <div className="container-wide relative z-10">
          <div className="doca-hero-grid">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
              className="doca-hero-copy"
            >
              <DocaLanguageSelector />
              <div className="doca-logo-word" aria-label="Doca">
                DOCA
              </div>
              <h1 className="doca-hero-title">
                <span>Pane,</span>
                <span>caffè,</span>
                <em>saudade.</em>
              </h1>
              <p className="doca-hero-text">
                {docaCopy.heroBody}
              </p>
              <div className="doca-hero-actions">
                <VenueWhatsappLink className="doca-button doca-button-primary">
                  <CalendarDays size={20} />
                  {docaCopy.reserve}
                </VenueWhatsappLink>
                <Link href={menuHref} className="doca-button doca-button-secondary">
                  <UtensilsCrossed size={20} />
                  {docaCopy.menu}
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.08, ease: "easeOut" }}
              className="doca-hero-board"
            >
              <div className="doca-photo doca-photo-main">
                <Image
                  src="/doca/proprietaria-finestrella.webp"
                  alt="Queren Girardi alla finestrella di Doca"
                  fill
                  priority
                  sizes="(max-width: 1024px) 92vw, 520px"
                  className="object-cover"
                />
              </div>
              <div className="doca-photo doca-photo-box">
                <Image
                  src="/doca/pao-de-queijo.webp"
                  alt="Pao de queijo appena sfornati"
                  fill
                  sizes="(max-width: 1024px) 48vw, 250px"
                  className="object-cover"
                />
              </div>
              <div className="doca-photo doca-photo-sign">
                <Image
                  src="/doca/torta-carota-brigadeiro.webp"
                  alt="Torta di carote con brigadeiro"
                  fill
                  sizes="(max-width: 1024px) 46vw, 230px"
                  className="object-cover"
                />
              </div>
              <DocaFloatingFood reduceMotion={reduceMotion} />
            </motion.div>
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToNext}
          className="doca-scroll"
          aria-label="Scorri alla sezione successiva"
        >
          <span>{docaCopy.scroll}</span>
          <ChevronDown className="size-6" strokeWidth={2} />
        </button>
      </section>
    );
  }

  return (
    <section className="tenant-hero relative isolate overflow-hidden bg-pork-ink pb-20 pt-[calc(7rem+env(safe-area-inset-top))] text-pork-cream md:pb-28 md:pt-[calc(9rem+env(safe-area-inset-top))]">
      <div className="absolute inset-0 -z-10">
        <Image
          src={content.hero.backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          className={reduceMotion ? "object-cover opacity-40" : "animate-slow-zoom object-cover opacity-40"}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-pork-ink via-pork-ink/80 to-pork-brick/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-pork-ink via-transparent to-transparent" />
      </div>

      <div className="container-wide relative">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }
            }
            className="max-w-3xl"
          >
            <span className="tenant-hero-eyebrow inline-flex items-center gap-2 rounded-full bg-pork-mustard/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-pork-mustard ring-1 ring-pork-mustard/30">
              {content.hero.eyebrow}
            </span>
            <h1 className="headline mt-6 text-6xl text-pork-cream sm:text-7xl md:text-8xl lg:text-[9rem]">
              {content.hero.titleLead}
              <br />
              {" "}
              <span className="text-pork-mustard">{content.hero.titleAccent}</span>
            </h1>
            <p className="mt-6 max-w-xl text-xl text-pork-cream/85 text-pretty">
              {content.hero.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <VenueWhatsappLink className="btn-mustard text-base">
                <MessageCircle size={20} />
                {content.hero.ctaLabel}
              </VenueWhatsappLink>
              <Link href={menuHref} className="btn-ghost-light text-base">
                <UtensilsCrossed size={20} />
                Guarda il menu
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: -4 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.8, delay: 0.1, ease: "easeOut" }
            }
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto aspect-square w-full max-w-md isolate">
              <Image
                src={content.showcaseLogoSrc}
                alt={content.showcaseLogoAlt}
                fill
                priority
                unoptimized
                sizes="(max-width: 1024px) 0vw, 400px"
                className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-6 md:pb-10">
        <motion.button
          type="button"
          onClick={scrollToNext}
          className="pointer-events-auto flex flex-col items-center gap-1 text-pork-cream/55 transition-colors hover:text-pork-mustard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pork-mustard"
          aria-label="Scorri alla sezione successiva"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 1, duration: 0.5 }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.35em]">
            Scorri
          </span>
          <motion.span
            aria-hidden
            animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
            transition={
              reduceMotion
                ? undefined
                : { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
            }
          >
            <ChevronDown className="size-7" strokeWidth={2.25} />
          </motion.span>
        </motion.button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-16 bg-gradient-to-b from-transparent to-pork-cream" />
    </section>
  );
}

function DocaFloatingFood({ reduceMotion }: { reduceMotion: boolean | null }) {
  const animation = reduceMotion ? undefined : { y: [0, -8, 0], rotate: [-1, 2, -1] };
  const transition = reduceMotion
    ? undefined
    : { repeat: Infinity, duration: 3.4, ease: "easeInOut" as const };

  return (
    <div className="doca-characters" aria-hidden="true">
      <motion.span className="doca-floating-food doca-floating-coffee" animate={animation} transition={transition}>☕</motion.span>
      <motion.span
        className="doca-floating-food doca-floating-bread"
        animate={reduceMotion ? undefined : { y: [0, 7, 0], rotate: [2, -2, 2] }}
        transition={reduceMotion ? undefined : { repeat: Infinity, duration: 3.9, ease: "easeInOut", delay: 0.3 }}
      >🥖</motion.span>
      <motion.span
        className="doca-floating-food doca-floating-cake"
        animate={reduceMotion ? undefined : { y: [0, -6, 0], rotate: [0, -3, 0] }}
        transition={reduceMotion ? undefined : { repeat: Infinity, duration: 3.1, ease: "easeInOut", delay: 0.5 }}
      >🍰</motion.span>
    </div>
  );
}
