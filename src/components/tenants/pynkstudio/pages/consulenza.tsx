"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutGrid,
  ListOrdered,
  Phone,
  Search,
  Users,
  Wrench,
} from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const checkupIcons = [Phone, ClipboardList, Users, Search, FileText] as const;
const frameworkIcons = [Search, ListOrdered, LayoutGrid, Wrench, BarChart3] as const;

function ConsulenzaInner() {
  const copy = usePynkCopy();
  const c = copy.consulenzaPage;
  const href = useTenantLocalizedHref();

  return (
    <div className="pynk-page">
      <section className="pynk-hero pynk-hero-sub">
        <div className="pynk-glow pynk-glow-tl" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pynk-eyebrow">
            {c.eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="pynk-hero-title"
          >
            {c.titleLead} <span className="pynk-accent">{c.titleAccent}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="pynk-hero-subtitle"
          >
            {c.intro1}
            <strong className="pynk-strong">{c.introStrong}</strong>
            {c.intro2}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}>
            <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group pynk-mt-12">
              {c.heroCta}
              <ArrowRight className="pynk-icon-sm pynk-arrow" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="pynk-section-head"
          >
            <h2 className="pynk-section-title">
              {c.checkupTitleLead} <span className="pynk-accent">{c.checkupTitleAccent}</span>
            </h2>
            <p className="pynk-section-lead">{c.checkupBody}</p>
          </motion.div>
          <div className="pynk-steps">
            {c.stepsCheckup.map((s, i) => {
              const Icon = checkupIcons[i];
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="pynk-step"
                >
                  <div className="pynk-panel-icon pynk-panel-icon-sm">
                    <Icon className="pynk-icon-sm" />
                  </div>
                  <div>
                    <h3 className="pynk-step-title">{s.title}</h3>
                    <p className="pynk-step-desc">{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt">
        <div className="pynk-container pynk-grid-2 pynk-grid-loose">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="pynk-section-title pynk-section-title-sm">
              {c.targetTitleLead} <span className="pynk-accent">{c.targetTitleAccent}</span>
            </h2>
            <ul className="pynk-check-list">
              {c.target.map((line) => (
                <li key={line}>
                  <CheckCircle2 className="pynk-icon-sm pynk-check" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="pynk-section-title pynk-section-title-sm">
              {c.deliverablesTitleLead} <span className="pynk-accent">{c.deliverablesTitleAccent}</span>
            </h2>
            <ul className="pynk-check-list">
              {c.deliverables.map((d) => (
                <li key={d}>
                  <CheckCircle2 className="pynk-icon-sm pynk-check" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
            <p className="pynk-note pynk-mt-24">{c.deliverablesNote}</p>
          </motion.div>
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pynk-section-title pynk-center"
          >
            {c.methodTitleLead} <span className="pynk-accent">{c.methodTitleAccent}</span>
          </motion.h2>
          <div className="pynk-steps pynk-mt-24">
            {c.framework.map((step, i) => {
              const Icon = frameworkIcons[i];
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="pynk-step"
                >
                  <div className="pynk-panel-icon">
                    <span className="pynk-step-number">{step.number}</span>
                    <Icon className="pynk-sr-only" aria-hidden />
                  </div>
                  <div>
                    <h3 className="pynk-step-title pynk-step-title-lg">{step.title}</h3>
                    <p className="pynk-step-desc">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="pynk-note pynk-center pynk-mt-24">
            {c.methodNote}
          </motion.p>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt">
        <div className="pynk-container pynk-center-col">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="pynk-final">
            <h2 className="pynk-section-title">
              {c.finalTitleLead} <span className="pynk-accent">{c.finalTitleAccent}</span>?
            </h2>
            <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
              {c.finalCta}
              <ArrowRight className="pynk-icon-sm pynk-arrow" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export function PynkStudioConsulenzaPage() {
  return (
    <PynkShell>
      <ConsulenzaInner />
    </PynkShell>
  );
}
