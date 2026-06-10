"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { PynkPortfolioCard } from "../pynk-cards";
import { pynkPortfolioItems } from "../portfolio";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

function LavoriInner() {
  const copy = usePynkCopy();
  const href = useTenantLocalizedHref();

  return (
    <div className="pynk-page">
      <section className="pynk-hero pynk-hero-sub pynk-hero-compact">
        <div className="pynk-glow pynk-glow-tr" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="pynk-hero-title">
            {copy.lavoriPage.titleLead} <span className="pynk-accent">{copy.lavoriPage.titleAccent}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="pynk-hero-subtitle"
          >
            {copy.lavoriPage.subtitle}
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="pynk-mt-24">
            <Link href={href("/contattaci")} className="pynk-btn pynk-btn-outline">
              {copy.lavoriPage.cta}
              <ArrowRight className="pynk-icon-xs" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="pynk-section pynk-section-tight" aria-labelledby="progetti-realizzati">
        <div className="pynk-container">
          <h2 id="progetti-realizzati" className="pynk-sr-only">
            {copy.lavoriPage.srTitle}
          </h2>
          <div className="pynk-grid-3">
            {pynkPortfolioItems.map((item, i) => (
              <PynkPortfolioCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function PynkStudioLavoriPage() {
  return (
    <PynkShell>
      <LavoriInner />
    </PynkShell>
  );
}
