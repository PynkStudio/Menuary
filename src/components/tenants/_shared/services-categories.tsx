"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import { getModuleCopy } from "@/lib/vertical";

const v = {
  bg:           "rgb(var(--tenant-cream))",
  surface:      "rgb(var(--tenant-brick))",
  surfaceHover: "rgb(var(--tenant-brick) / 0.7)",
  text:         "rgb(var(--tenant-ink))",
  textMuted:    "rgb(var(--tenant-ink) / 0.55)",
  textFaint:    "rgb(var(--tenant-ink) / 0.3)",
  accent:       "rgb(var(--tenant-red))",
  accentSoft:   "rgb(var(--tenant-red) / 0.12)",
  accentRing:   "rgb(var(--tenant-red) / 0.25)",
  border:       "rgb(var(--tenant-ink) / 0.08)",
} as const;

const VARIANT_COLORS: Record<string, string> = {
  red:    "rgb(var(--tenant-red))",
  mustard:"rgb(var(--tenant-mustard))",
  green:  "rgb(var(--tenant-green))",
  pink:   "rgb(var(--tenant-pink))",
};

export function ServicesCategories() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const menuLabel = getModuleCopy("onlineMenu", tenant.vertical).label;

  return (
    <>
      {/* ── Categorie principali (equivalente ThreeSouls) ── */}
      <section
        id="servizi"
        style={{ backgroundColor: v.surface, color: v.text }}
        className="scroll-mt-20 py-20 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Intro */}
          <div className="mb-14 text-center">
            <span
              className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ backgroundColor: v.accentSoft, color: v.accent, boxShadow: `inset 0 0 0 1px ${v.accentRing}` }}
            >
              {content.soulsIntro.eyebrow}
            </span>
            <h2
              className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
              style={{ color: v.text }}
            >
              {content.soulsIntro.titleLead}{" "}
              <span style={{ color: v.accent }}>{content.soulsIntro.titleAccent}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed" style={{ color: v.textMuted }}>
              {content.soulsIntro.body}
            </p>
          </div>

          {/* Grid categorie */}
          <div className="grid gap-5 md:grid-cols-3">
            {content.souls.map((soul, i) => (
              <motion.a
                key={soul.id}
                href={soul.href}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
                className="group flex flex-col gap-4 rounded-2xl p-7 transition-all duration-300"
                style={{
                  backgroundColor: v.bg,
                  boxShadow: `inset 0 0 0 1px ${v.border}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${v.accentRing}, 0 8px 32px rgb(var(--tenant-ink) / 0.3)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${v.border}`;
                }}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: v.accent }}
                >
                  {soul.kicker}
                </span>
                <h3
                  className="text-xl font-bold leading-snug"
                  style={{ color: v.text }}
                >
                  {soul.title}
                </h3>
                <p className="flex-1 text-sm leading-relaxed" style={{ color: v.textMuted }}>
                  {soul.desc}
                </p>
                <span
                  className="inline-flex items-center gap-2 text-sm font-semibold transition-all group-hover:gap-3"
                  style={{ color: v.accent }}
                >
                  Scopri i servizi
                  <ArrowRight size={15} />
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Servizi in evidenza (equivalente SignatureDishes) ── */}
      <section
        style={{ backgroundColor: v.bg, color: v.text }}
        className="py-20 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Intro */}
          <div className="mb-14 text-center">
            <span
              className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ backgroundColor: v.accentSoft, color: v.accent, boxShadow: `inset 0 0 0 1px ${v.accentRing}` }}
            >
              {content.dishesIntro.eyebrow}
            </span>
            <h2
              className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
              style={{ color: v.text }}
            >
              {content.dishesIntro.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base" style={{ color: v.textMuted }}>
              {content.dishesIntro.subtitle}
            </p>
          </div>

          {/* Griglia servizi */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.dishes.map((dish, i) => {
              const accentColor = VARIANT_COLORS[dish.variant] ?? v.accent;
              return (
                <motion.a
                  key={dish.name}
                  href={dish.href}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: "easeOut" }}
                  className="group flex flex-col gap-3 rounded-xl p-5 transition-all duration-300"
                  style={{
                    backgroundColor: v.surface,
                    boxShadow: `inset 0 0 0 1px ${v.border}`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${accentColor.replace(")", " / 0.35)")}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${v.border}`;
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold leading-snug" style={{ color: v.text }}>
                      {dish.name}
                    </h3>
                    <span
                      className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  </div>
                  <p className="flex-1 text-sm leading-relaxed" style={{ color: v.textMuted }}>
                    {dish.desc}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: accentColor }}
                    >
                      {dish.price}
                    </span>
                    <ArrowRight
                      size={14}
                      className="transition-all duration-200 group-hover:translate-x-1"
                      style={{ color: v.textFaint }}
                    />
                  </div>
                </motion.a>
              );
            })}
          </div>

          <p className="mt-10 text-center text-sm" style={{ color: v.textFaint }}>
            {menuLabel} completo disponibile su appuntamento —{" "}
            <a
              href="#contatti"
              className="transition-colors hover:underline"
              style={{ color: v.accent }}
            >
              contattaci per un preventivo
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
