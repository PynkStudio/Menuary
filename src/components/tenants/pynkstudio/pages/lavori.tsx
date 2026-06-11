"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { PynkPortfolioCard } from "../pynk-cards";
import { pynkPortfolioItems } from "../portfolio";
import type { ShowcaseTenant } from "../showcase";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

function LavoriInner({ sites }: { sites: ShowcaseTenant[] }) {
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

      {sites.length > 0 && (
        <section className="pynk-section pynk-section-alt" aria-labelledby="siti-online">
          <div className="pynk-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="pynk-section-head"
            >
              <h2 id="siti-online" className="pynk-section-title">
                {copy.lavoriPage.sitesTitleLead} <span className="pynk-accent">{copy.lavoriPage.sitesTitleAccent}</span>
              </h2>
              <p className="pynk-section-lead">{copy.lavoriPage.sitesSubtitle}</p>
            </motion.div>
            <div className="pynk-grid-3">
              {sites.map((site, i) => (
                <motion.a
                  key={site.id}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4 }}
                  className="pynk-site-card"
                >
                  <span className="pynk-site-platform">{site.platform}</span>
                  <span className="pynk-site-name">{site.name}</span>
                  <span className="pynk-site-url">{site.url.replace(/^https?:\/\//, "")}</span>
                  <span className="pynk-site-cta">
                    {copy.lavoriPage.sitesVisit}
                    <ArrowUpRight className="pynk-icon-xs" />
                  </span>
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export function PynkStudioLavoriPage({ sites = [] }: { sites?: ShowcaseTenant[] }) {
  return (
    <PynkShell>
      <LavoriInner sites={sites} />
    </PynkShell>
  );
}
