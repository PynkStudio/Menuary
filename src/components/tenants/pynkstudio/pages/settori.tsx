"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Briefcase, Building2, Factory, Landmark, ShoppingBag } from "lucide-react";
import { PynkShell, usePynkNerd } from "../pynk-shell";
import { PynkStackChips } from "../pynk-cards";
import { pynkT, usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const icons = [ShoppingBag, Briefcase, Factory, Landmark, Building2] as const;

const staggerParent = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } } };
const staggerItem = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const } },
};

function SettoriInner() {
  const copy = usePynkCopy();
  const { nerd } = usePynkNerd();
  const href = useTenantLocalizedHref();

  return (
    <div className="pynk-page">
      <section className="pynk-hero pynk-hero-sub">
        <div className="pynk-glow pynk-glow-bl" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={nerd ? "n" : "p"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="pynk-hero-title">{pynkT(copy.settoriPage.heroTitle, nerd)}</h1>
              <p className="pynk-hero-subtitle">{pynkT(copy.settoriPage.heroSubtitle, nerd)}</p>
            </motion.div>
          </AnimatePresence>
          <Link href={href("/servizi")} className="pynk-btn pynk-btn-primary pynk-group pynk-mt-24">
            {copy.settoriPage.heroCta}
            <ArrowRight className="pynk-icon-sm pynk-arrow" />
          </Link>
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container">
          <motion.div
            className="pynk-grid-2"
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-45px" }}
          >
            {copy.settoriCards.map((card, index) => {
              const Icon = icons[index] ?? Building2;
              return (
                <motion.article key={card.id} variants={staggerItem} whileHover={{ y: -3 }} className="pynk-panel">
                  <div className="pynk-panel-icon">
                    <Icon className="pynk-icon-sm" />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={`${card.id}-${nerd}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                      <h2 className="pynk-panel-title">{pynkT(card.title, nerd)}</h2>
                      <p className="pynk-panel-desc">{pynkT(card.desc, nerd)}</p>
                    </motion.div>
                  </AnimatePresence>
                  {nerd && <PynkStackChips items={card.stack} />}
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container pynk-center-col">
          <Link href={href("/contattaci")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
            {copy.settoriPage.bottomCta}
            <ArrowRight className="pynk-icon-sm pynk-arrow" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export function PynkStudioSettoriPage() {
  return (
    <PynkShell>
      <SettoriInner />
    </PynkShell>
  );
}
