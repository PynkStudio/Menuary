"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Wrench, Calendar, Car, ChevronDown } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";

// Colori tenant via CSS vars, senza token di tenant specifici.
const v = {
  bg:           "rgb(var(--tenant-cream))",
  surface:      "rgb(var(--tenant-brick))",
  text:         "rgb(var(--tenant-ink))",
  textMuted:    "rgb(var(--tenant-ink) / 0.6)",
  textFaint:    "rgb(var(--tenant-ink) / 0.35)",
  accent:       "rgb(var(--tenant-red))",
  accentSoft:   "rgb(var(--tenant-red) / 0.15)",
  accentRing:   "rgb(var(--tenant-red) / 0.3)",
  borderSubtle: "rgb(var(--tenant-ink) / 0.08)",
} as const;

const badges = [
  { Icon: Wrench,   text: "Diagnostica avanzata" },
  { Icon: Calendar, text: "Su appuntamento" },
  { Icon: Car,      text: "Auto & Moto" },
];

export function ServicesHero() {
  const reduceMotion = useReducedMotion();
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);

  const whatsappHref = content.contact.whatsappDigits
    ? `https://wa.me/${content.contact.whatsappDigits}?text=${encodeURIComponent(content.contact.whatsappMessage)}`
    : `tel:${content.contact.phone}`;

  return (
    <section
      style={{ backgroundColor: v.bg, color: v.text }}
      className="relative isolate overflow-hidden"
    >
      {/* Sfondo */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={content.hero.backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 0.18 }}
        />
        {/* vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${v.bg} 0%, color-mix(in srgb, ${v.bg} 92%, transparent) 60%, ${v.surface} 100%)`,
          }}
        />
        {/* gradient-to-bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-32"
          style={{ background: `linear-gradient(to bottom, transparent, ${v.bg})` }}
        />
        {/* griglia tecnica */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgb(var(--tenant-ink) / 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgb(var(--tenant-ink) / 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-[calc(6rem+env(safe-area-inset-top))] lg:px-8 lg:pb-32 lg:pt-[calc(8rem+env(safe-area-inset-top))]">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">

          {/* Testo */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Eyebrow */}
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{
                backgroundColor: v.accentSoft,
                color: v.accent,
                boxShadow: `inset 0 0 0 1px ${v.accentRing}`,
              }}
            >
              {content.hero.eyebrow}
            </span>

            {/* Titolo */}
            <div>
              <h1
                className="text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl"
                style={{ color: v.text }}
              >
                {content.hero.titleLead}
              </h1>
              <h1
                className="text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl"
                style={{ color: v.accent }}
              >
                {content.hero.titleAccent}
              </h1>
            </div>

            <p className="max-w-lg text-lg leading-relaxed" style={{ color: v.textMuted }}>
              {content.hero.body}
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-bold transition-opacity hover:opacity-85"
                style={{ backgroundColor: v.accent, color: "rgb(var(--tenant-cream))" }}
              >
                <Calendar size={18} />
                {content.hero.ctaLabel}
              </a>
              <a
                href="#servizi"
                className="inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold transition-colors"
                style={{
                  color: v.textMuted,
                  boxShadow: `inset 0 0 0 1px ${v.borderSubtle}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = v.text;
                  (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${v.accentRing}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = v.textMuted;
                  (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${v.borderSubtle}`;
                }}
              >
                <Wrench size={18} />
                Scopri i servizi
              </a>
            </div>

            {/* Badge tecnici */}
            <div className="flex flex-wrap gap-5 pt-2">
              {badges.map(({ Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: v.textFaint }}
                >
                  <Icon size={15} style={{ color: v.accent }} />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Immagine */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.12, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-2xl"
              style={{ boxShadow: `0 0 0 1px ${v.accentRing}, 0 24px 64px rgb(var(--tenant-ink) / 0.4)` }}
            >
              <Image
                src={content.hero.backdrop}
                alt={`${tenant.name} — officina`}
                fill
                priority
                sizes="(max-width: 1024px) 0vw, 600px"
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to top, ${v.bg} 0%, transparent 60%)` }}
              />
            </div>

            {/* Badge floating diagnostica */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.55 }}
              className="absolute -bottom-4 -left-6 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                backgroundColor: v.surface,
                boxShadow: `0 0 0 1px ${v.accentRing}, 0 12px 32px rgb(var(--tenant-ink) / 0.5)`,
              }}
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: v.accentSoft }}
              >
                <Wrench size={16} style={{ color: v.accent }} />
              </div>
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: v.accent }}
                >
                  Diagnostica OBD
                </div>
                <div className="text-xs" style={{ color: v.textFaint }}>
                  Multimarca · Risultato immediato
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <div className="mt-16 flex justify-center">
          <motion.a
            href="#servizi"
            aria-label="Scorri ai servizi"
            className="flex flex-col items-center gap-1"
            style={{ color: v.textFaint }}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { delay: 1.1, duration: 0.5 }}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Scopri</span>
            <motion.span
              animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
              transition={reduceMotion ? undefined : { repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ChevronDown size={20} />
            </motion.span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
