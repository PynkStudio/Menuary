"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Brain, ChevronDown, FileCheck2, Globe, Link2, Map, Monitor, Palette, ShieldCheck, Smartphone } from "lucide-react";
import { PynkShell, usePynkNerd } from "../pynk-shell";
import { PynkPortfolioCard, PynkStackChips } from "../pynk-cards";
import { pickPynkPortfolioPreview } from "../portfolio";
import { pynkT, usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const pillarIcons = [Globe, Smartphone, Monitor] as const;
const crossIcons = [Brain, Palette, Map, Link2] as const;

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.06 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

function HomeInner() {
  const copy = usePynkCopy();
  const { nerd } = usePynkNerd();
  const reduceMotion = useReducedMotion();
  const [preview] = useState(() => pickPynkPortfolioPreview());
  const href = useTenantLocalizedHref();

  return (
    <div className="pynk-page">
      <section className="pynk-hero">
        {!reduceMotion && (
          <div className="pynk-hero-blob" aria-hidden>
            <div className="pynk-blob pynk-blob-a" />
            <div className="pynk-blob pynk-blob-b" />
            <div className="pynk-blob pynk-blob-c" />
          </div>
        )}
        <div className="pynk-hero-veil" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={nerd ? "hero-n" : "hero-p"}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="pynk-hero-title">{pynkT(copy.homeHero.title, nerd)}</h1>
              <p className="pynk-hero-subtitle">{pynkT(copy.homeHero.subtitle, nerd)}</p>
            </motion.div>
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pynk-hero-ctas"
          >
            <Link href={href("/servizi")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
              {copy.homeHero.ctaPrimary}
              <ArrowRight className="pynk-icon-sm pynk-arrow" />
            </Link>
            <Link href={href("/lavori")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              {copy.homeHero.ctaSecondary}
            </Link>
          </motion.div>
          {!reduceMotion && (
            <motion.div className="pynk-hero-scroll" initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 1 }} aria-hidden>
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
                <ChevronDown className="pynk-icon" />
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="pynk-section-title"
          >
            Cosa <span className="pynk-accent">facciamo</span>
          </motion.h2>
          <p className="pynk-section-lead">{pynkT(copy.homeSectionLeads.whatWeDo, nerd)}</p>
          <motion.div
            className="pynk-grid-3"
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {copy.homeDevPillars.map((pillar, i) => {
              const Icon = pillarIcons[i];
              return (
                <motion.div key={pillar.id} variants={staggerItem} className="pynk-panel">
                  <div className="pynk-panel-icon">
                    <Icon className="pynk-icon" />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={`${pillar.id}-${nerd}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                      <h3 className="pynk-panel-title">{pynkT(pillar.title, nerd)}</h3>
                      <p className="pynk-panel-desc">{pynkT(pillar.desc, nerd)}</p>
                    </motion.div>
                  </AnimatePresence>
                  {nerd && <PynkStackChips items={pillar.stack} />}
                </motion.div>
              );
            })}
          </motion.div>
          <div className="pynk-center pynk-mt-24">
            <Link href={href("/servizi")} className="pynk-link-cta">
              Scheda servizi completa
              <ArrowRight className="pynk-icon-xs" />
            </Link>
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt">
        <div className="pynk-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="pynk-section-head"
          >
            <h2 className="pynk-section-title">
              Competenze <span className="pynk-accent">trasversali</span>
            </h2>
            <p className="pynk-section-lead">{pynkT(copy.homeSectionLeads.cross, nerd)}</p>
          </motion.div>
          <motion.div
            className="pynk-grid-2"
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          >
            {copy.homeCrossSkills.map((skill, i) => {
              const Icon = crossIcons[i];
              return (
                <motion.div key={skill.id} variants={staggerItem} className="pynk-panel pynk-panel-sm">
                  <div className="pynk-panel-icon pynk-panel-icon-soft">
                    <Icon className="pynk-icon-sm" />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={`${skill.id}-${nerd}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                      <h3 className="pynk-panel-title pynk-panel-title-sm">{pynkT(skill.title, nerd)}</h3>
                      <p className="pynk-panel-desc pynk-panel-desc-sm">{pynkT(skill.desc, nerd)}</p>
                    </motion.div>
                  </AnimatePresence>
                  {nerd && <PynkStackChips items={skill.stack} />}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container pynk-ai-split">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
            <p className="pynk-eyebrow">AI Governance</p>
            <h2 className="pynk-section-title pynk-section-title-left">
              AI utile, scalabile e <span className="pynk-accent">governata</span>.
            </h2>
            <p className="pynk-section-lead pynk-section-lead-left">
              Progettiamo chatbot, agenti, RAG, workflow e integrazioni AI con ruoli, dati, logging, supervisione e requisiti AI Act già considerati nell&apos;architettura.
            </p>
            <Link href={href("/ai-governance")} className="pynk-link-cta pynk-mt-24">
              Apri AI Governance
              <ArrowRight className="pynk-icon-xs" />
            </Link>
          </motion.div>
          <div className="pynk-grid-2 pynk-grid-tight">
            {[
              { title: "Architettura AI", body: "OpenAI, Claude, Gemini, Llama, Mistral, Qwen, RAG, agenti, MCP e tool calling.", Icon: Brain },
              { title: "Governance tecnica", body: "Workflow, accessi, versionamento, logging, auditing e supervisione umana.", Icon: ShieldCheck },
              { title: "AI Act", body: "Valutazione di ruolo, rischio, AI Literacy, documentazione e possibili obblighi.", Icon: FileCheck2 },
              { title: "Integrazioni", body: "CRM, ERP, WhatsApp, Microsoft 365, Google Workspace, email, database e API.", Icon: Link2 },
            ].map(({ title, body, Icon }) => {
              const TileIcon = Icon;
              return (
                <article key={title} className="pynk-panel pynk-panel-sm">
                  <div className="pynk-panel-icon pynk-panel-icon-soft">
                    <TileIcon className="pynk-icon-sm" />
                  </div>
                  <h3 className="pynk-panel-title-sm">{title}</h3>
                  <p className="pynk-panel-desc-sm">{body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="pynk-section-head"
          >
            <h2 className="pynk-section-title">{pynkT(copy.homePortfolio.title, nerd)}</h2>
            <p className="pynk-section-lead">{pynkT(copy.homePortfolio.subtitle, nerd)}</p>
          </motion.div>
          <div className="pynk-grid-3">
            {preview.map((item, i) => (
              <PynkPortfolioCard key={item.id} item={item} index={i} />
            ))}
          </div>
          <div className="pynk-center pynk-mt-24">
            <Link href={href("/lavori")} className="pynk-btn pynk-btn-outline">
              {pynkT(copy.homePortfolio.cta, nerd)}
            </Link>
          </div>
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container pynk-center-col">
          <AnimatePresence mode="wait">
            <motion.div key={nerd ? "sec-n" : "sec-p"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <h2 className="pynk-section-title">{pynkT(copy.homeSectorsStrip.title, nerd)}</h2>
              <p className="pynk-section-lead">{pynkT(copy.homeSectorsStrip.subtitle, nerd)}</p>
            </motion.div>
          </AnimatePresence>
          <div className="pynk-pills">
            {copy.homeSectorsStrip.pills.map((label) => (
              <span key={label} className="pynk-pill">
                {label}
              </span>
            ))}
          </div>
          <Link href={href("/settori")} className="pynk-btn pynk-btn-outline pynk-mt-24">
            {copy.homeSectorsStrip.cta}
          </Link>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt">
        <div className="pynk-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="pynk-consulting-card"
          >
            <AnimatePresence mode="wait">
              <motion.div key={nerd ? "c-n" : "c-p"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <h2 className="pynk-panel-title">{pynkT(copy.homeConsulting.title, nerd)}</h2>
                <p className="pynk-panel-desc">{pynkT(copy.homeConsulting.desc, nerd)}</p>
              </motion.div>
            </AnimatePresence>
            <Link href={href("/consulenza")} className="pynk-link-cta pynk-mt-12">
              {copy.homeConsulting.cta}
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container pynk-center-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="pynk-final"
          >
            <h2 className="pynk-section-title">
              {copy.homeFinal.titleLead} <span className="pynk-accent">{copy.homeFinal.titleAccent}</span>
            </h2>
            <p className="pynk-section-lead">{copy.homeFinal.body}</p>
            <Link href={href("/contattaci")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
              {copy.homeFinal.cta}
              <ArrowRight className="pynk-icon-sm pynk-arrow" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export function PynkStudioHomePage() {
  return (
    <PynkShell>
      <HomeInner />
    </PynkShell>
  );
}
