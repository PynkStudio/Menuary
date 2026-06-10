"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bot, Globe, LayoutDashboard, Monitor, Smartphone } from "lucide-react";
import { PynkShell, usePynkNerd } from "../pynk-shell";
import { PynkStackChips } from "../pynk-cards";
import { pynkT, usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const icons = [Globe, LayoutDashboard, Smartphone, Monitor, Bot] as const;

const staggerParent = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] as const } },
};

function ServiziInner() {
  const copy = usePynkCopy();
  const { nerd } = usePynkNerd();
  const href = useTenantLocalizedHref();

  return (
    <div className="pynk-page">
      <section className="pynk-hero pynk-hero-sub">
        <div className="pynk-glow pynk-glow-tr" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={nerd ? "n" : "p"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="pynk-hero-title">{pynkT(copy.serviziPage.heroTitle, nerd)}</h1>
              <p className="pynk-hero-subtitle">{pynkT(copy.serviziPage.heroSubtitle, nerd)}</p>
            </motion.div>
          </AnimatePresence>
          <Link href={href("/contattaci")} className="pynk-btn pynk-btn-primary pynk-group pynk-mt-24">
            {copy.serviziPage.heroCta}
            <ArrowRight className="pynk-icon-sm pynk-arrow" />
          </Link>
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container">
          <motion.div
            className="pynk-stack-list"
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          >
            {copy.serviziCards.map((card, index) => {
              const Icon = icons[index] ?? Globe;
              return (
                <motion.article key={card.id} variants={staggerItem} whileHover={{ y: -3 }} className="pynk-panel pynk-service-card">
                  <div className="pynk-service-row">
                    <div className="pynk-panel-icon pynk-panel-icon-lg">
                      <Icon className="pynk-icon" />
                    </div>
                    <div className="pynk-service-body">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${card.id}-${nerd}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <h2 className="pynk-service-title">{pynkT(card.title, nerd)}</h2>
                          <p className="pynk-panel-desc">{pynkT(card.desc, nerd)}</p>
                        </motion.div>
                      </AnimatePresence>
                      {nerd && <PynkStackChips items={card.stack} />}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt">
        <div className="pynk-container pynk-center-col">
          <p className="pynk-note">{copy.serviziPage.bottomNote}</p>
          <Link href={href("/contattaci")} className="pynk-btn pynk-btn-outline">
            {copy.serviziPage.bottomCta}
          </Link>
        </div>
      </section>
    </div>
  );
}

export function PynkStudioServiziPage() {
  return (
    <PynkShell>
      <ServiziInner />
    </PynkShell>
  );
}
