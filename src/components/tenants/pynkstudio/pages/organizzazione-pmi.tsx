"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  Phone,
  Search,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const benefitIcons = [Workflow, Users, ListChecks, Search] as const;
const processIcons = [Phone, ClipboardList, Search, CalendarClock] as const;

function MinimalHeader({ phoneHref, phoneLabel, cta }: { phoneHref: string; phoneLabel: string; cta: string }) {
  return (
    <header className="pynk-lp-header">
      <div className="pynk-container pynk-lp-header-inner">
        <span className="pynk-logo">
          <Image
            src="/pynkstudio/pynk-logo-transparent.png"
            alt="Pynk Studio"
            width={48}
            height={48}
            className="pynk-logo-img"
          />
          <span className="pynk-logo-text">PYNK STUDIO</span>
        </span>
        <a href={phoneHref} className="pynk-pill pynk-pill-contact pynk-lp-header-phone" aria-label={cta}>
          <Phone className="pynk-icon-xs pynk-accent" />
          <span>{phoneLabel}</span>
        </a>
      </div>
    </header>
  );
}

function OrganizzazioneInner() {
  const copy = usePynkCopy();
  const c = copy.organizzazionePage;
  const phoneHref = copy.contattiPage.phoneHref;
  const phoneLabel = copy.contattiPage.phoneLabel;
  const href = useTenantLocalizedHref();

  return (
    <div className="pynk-page">
      <MinimalHeader phoneHref={phoneHref} phoneLabel={phoneLabel} cta={c.heroCtaSecondary} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pynk-hero pynk-hero-sub">
        <div className="pynk-glow pynk-glow-tl" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pynk-pill pynk-lp-badge"
          >
            <CalendarClock className="pynk-icon-xs pynk-accent" />
            {c.badge}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="pynk-hero-title"
          >
            {c.heroTitleLead} <span className="pynk-accent">{c.heroTitleAccent}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="pynk-hero-subtitle"
          >
            {c.heroSubtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="pynk-hero-ctas"
          >
            <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
              {c.heroCtaPrimary}
              <ArrowRight className="pynk-icon-sm pynk-arrow" />
            </Link>
            <a href={phoneHref} className="pynk-btn pynk-btn-outline pynk-btn-lg pynk-group">
              <Phone className="pynk-icon-sm" />
              {c.heroCtaSecondary}
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="pynk-note pynk-center pynk-lp-reassurance"
          >
            <ShieldCheck className="pynk-icon-xs pynk-accent" />
            {c.heroReassurance}
          </motion.p>
        </div>
      </section>

      {/* ── Pain points ──────────────────────────────────────── */}
      <section className="pynk-section">
        <div className="pynk-container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pynk-section-title pynk-center"
          >
            {c.painTitleLead} <span className="pynk-accent">{c.painTitleAccent}</span>
          </motion.h2>
          <div className="pynk-lp-pains pynk-mt-24">
            {c.pains.map((pain, i) => (
              <motion.div
                key={pain}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="pynk-panel pynk-lp-pain"
              >
                <p>{pain}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────── */}
      <section className="pynk-section pynk-section-alt">
        <div className="pynk-container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pynk-section-title pynk-center"
          >
            {c.benefitsTitleLead} <span className="pynk-accent">{c.benefitsTitleAccent}</span>
          </motion.h2>
          <div className="pynk-lp-benefits pynk-mt-24">
            {c.benefits.map((b, i) => {
              const Icon = benefitIcons[i] ?? Workflow;
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                  className="pynk-panel pynk-lp-benefit"
                >
                  <div className="pynk-panel-icon">
                    <Icon className="pynk-icon" />
                  </div>
                  <h3 className="pynk-step-title pynk-step-title-lg">{b.title}</h3>
                  <p className="pynk-panel-desc">{b.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Process ──────────────────────────────────────────── */}
      <section className="pynk-section">
        <div className="pynk-container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pynk-section-title pynk-center"
          >
            {c.processTitleLead} <span className="pynk-accent">{c.processTitleAccent}</span>
          </motion.h2>
          <div className="pynk-steps pynk-mt-24">
            {c.process.map((step, i) => {
              const Icon = processIcons[i] ?? Search;
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
        </div>
      </section>

      {/* ── Deliverables ─────────────────────────────────────── */}
      <section className="pynk-section pynk-section-alt">
        <div className="pynk-container pynk-narrow">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pynk-section-title pynk-section-title-sm pynk-center"
          >
            {c.deliverTitleLead} <span className="pynk-accent">{c.deliverTitleAccent}</span>
          </motion.h2>
          <ul className="pynk-check-list pynk-mt-24">
            {c.deliverables.map((d) => (
              <li key={d}>
                <CheckCircle2 className="pynk-icon-sm pynk-check" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <p className="pynk-note pynk-mt-24 pynk-center">{c.deliverNote}</p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="pynk-section">
        <div className="pynk-container pynk-narrow">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pynk-section-title pynk-section-title-sm pynk-center"
          >
            {c.faqTitleLead} <span className="pynk-accent">{c.faqTitleAccent}</span>
          </motion.h2>
          <div className="pynk-lp-faq pynk-mt-24">
            {c.faq.map((item, i) => (
              <motion.details
                key={item.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="pynk-panel pynk-lp-faq-item"
              >
                <summary className="pynk-lp-faq-q">{item.q}</summary>
                <p className="pynk-lp-faq-a">{item.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA finale ───────────────────────────────────────── */}
      <section className="pynk-section pynk-section-alt">
        <div className="pynk-container pynk-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pynk-section-head"
          >
            <h2 className="pynk-section-title">
              {c.finalTitleLead} <span className="pynk-accent">{c.finalTitleAccent}</span>
            </h2>
            <p className="pynk-hero-subtitle">{c.finalSubtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="pynk-center pynk-mt-24"
          >
            <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
              {c.formTitle}
              <ArrowRight className="pynk-icon-sm pynk-arrow" />
            </Link>
            <p className="pynk-note pynk-center pynk-lp-reassurance pynk-mt-16">
              <ShieldCheck className="pynk-icon-xs pynk-accent" />
              {c.heroReassurance}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export function PynkStudioOrganizzazionePmiPage() {
  return (
    <PynkShell chromeless>
      <OrganizzazioneInner />
    </PynkShell>
  );
}
