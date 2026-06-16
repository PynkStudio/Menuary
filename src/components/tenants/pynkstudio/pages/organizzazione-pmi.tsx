"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";

type Feedback = { kind: "success" | "error"; text: string } | null;

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
  const f = copy.contattiPage.form;
  const phoneHref = copy.contattiPage.phoneHref;
  const phoneLabel = copy.contattiPage.phoneLabel;

  const [formData, setFormData] = useState({ name: "", company: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const scrollToForm = () => {
    document.getElementById("pynk-lp-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!formData.name || !formData.email) {
      setFeedback({ kind: "error", text: f.errorRequired });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFeedback({ kind: "error", text: f.errorEmail });
      return;
    }

    setSending(true);
    try {
      const details = [
        formData.company && `Azienda: ${formData.company}`,
        formData.phone && `Telefono: ${formData.phone}`,
      ]
        .filter(Boolean)
        .join("\n");
      const message = formData.message.trim() || "Richiesta call gratuita dalla landing organizzazione PMI.";

      const res = await fetch("/api/tenant/pynkstudio/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          // Tag della sorgente: distingue i lead della campagna Google nelle email in arrivo.
          subject: "Landing organizzazione PMI — richiesta call",
          message: details ? `${details}\n\n${message}` : message,
        }),
      });
      if (!res.ok) throw new Error("send_failed");

      setFeedback({ kind: "success", text: f.success });
      setFormData({ name: "", company: "", email: "", phone: "", message: "" });
    } catch {
      setFeedback({ kind: "error", text: f.errorGeneric });
    } finally {
      setSending(false);
    }
  };

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
            <button type="button" onClick={scrollToForm} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
              {c.heroCtaPrimary}
              <ArrowRight className="pynk-icon-sm pynk-arrow" />
            </button>
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

      {/* ── Lead form ────────────────────────────────────────── */}
      <section id="pynk-lp-form" className="pynk-section pynk-section-alt">
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

          <motion.form
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onSubmit={handleSubmit}
            autoComplete="on"
            className="pynk-form"
          >
            <div className="pynk-form-row">
              <div className="pynk-field">
                <label htmlFor="lp-name">{f.name}</label>
                <input
                  id="lp-name"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={f.namePlaceholder}
                />
              </div>
              <div className="pynk-field">
                <label htmlFor="lp-company">{f.company}</label>
                <input
                  id="lp-company"
                  name="company"
                  autoComplete="organization"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder={f.companyPlaceholder}
                />
              </div>
            </div>

            <div className="pynk-form-row">
              <div className="pynk-field">
                <label htmlFor="lp-email">{f.email}</label>
                <input
                  id="lp-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={f.emailPlaceholder}
                />
              </div>
              <div className="pynk-field">
                <label htmlFor="lp-phone">
                  {f.phone} <span className="pynk-muted">{f.phoneOptional}</span>
                </label>
                <input
                  id="lp-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={f.phonePlaceholder}
                />
              </div>
            </div>

            <div className="pynk-field">
              <label htmlFor="lp-message">{f.message}</label>
              <textarea
                id="lp-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={f.messagePlaceholder}
              />
            </div>

            {feedback && <p className={`pynk-feedback pynk-feedback-${feedback.kind}`}>{feedback.text}</p>}

            <button type="submit" disabled={sending} className="pynk-btn pynk-btn-primary pynk-btn-block pynk-group">
              <Send className="pynk-icon-sm pynk-arrow" />
              {c.formTitle}
            </button>
            <p className="pynk-note pynk-center pynk-lp-reassurance">
              <ShieldCheck className="pynk-icon-xs pynk-accent" />
              {c.heroReassurance}
            </p>
          </motion.form>
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
