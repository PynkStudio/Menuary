"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Blocks, Check, CheckCircle2, CloudCog, Code2, Database, Gauge, LockKeyhole, Network, Search, Settings2, ShieldCheck, Smartphone } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const capabilityIcons = [Code2, Network, Database, LockKeyhole, CloudCog, Smartphone] as const;
const methodIcons = [Search, Settings2, Blocks, Gauge] as const;

function ConsulenzaInner() {
  const c = usePynkCopy().consulenzaPage;
  const href = useTenantLocalizedHref();
  const reveal = { initial: false as const };

  return (
    <div className="pynk-page pynk-b2b-page">
      <main>
        <section className="pynk-b2b-hero">
          <div className="pynk-b2b-hero-grid" aria-hidden />
          <div className="pynk-container pynk-b2b-hero-layout">
            <div className="pynk-b2b-hero-copy">
              <motion.p {...reveal} className="pynk-eyebrow-chip"><span className="pynk-b2b-status" aria-hidden />{c.eyebrow}</motion.p>
              <motion.h1 {...reveal} className="pynk-b2b-title">{c.titleLead} <span>{c.titleAccent}</span></motion.h1>
              <motion.p {...reveal} className="pynk-b2b-lead">{c.intro1}<strong>{c.introStrong}</strong>{c.intro2}</motion.p>
              <motion.div {...reveal} className="pynk-b2b-actions">
                <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">{c.heroCta}<ArrowRight className="pynk-icon-sm pynk-arrow" /></Link>
                <a href="#competenze" className="pynk-b2b-text-link">{c.heroSecondary}</a>
              </motion.div>
              <motion.ul {...reveal} className="pynk-b2b-assurances">
                {c.assurances.map((item) => <li key={item}><Check className="pynk-icon-xs" />{item}</li>)}
              </motion.ul>
            </div>

            <motion.aside {...reveal} className="pynk-b2b-system" aria-label={c.systemLabel}>
              <div className="pynk-b2b-system-head"><span><span className="pynk-b2b-status" aria-hidden />{c.systemLabel}</span><span>01</span></div>
              <div className="pynk-b2b-system-core"><div className="pynk-b2b-core-icon"><ShieldCheck aria-hidden /></div><p>{c.systemTitle}</p><span>{c.systemSubtitle}</span></div>
              <div className="pynk-b2b-system-rows">
                {c.systemRows.map((row, index) => <div key={row.label}><span>0{index + 1}</span><strong>{row.label}</strong><small>{row.value}</small><CheckCircle2 className="pynk-icon-sm" aria-label={c.verifiedLabel} /></div>)}
              </div>
            </motion.aside>
          </div>
        </section>

        <section className="pynk-b2b-proof" aria-label={c.proofLabel}><div className="pynk-container pynk-b2b-proof-inner">{c.proofItems.map((item) => <span key={item}>{item}</span>)}</div></section>

        <section id="competenze" className="pynk-section pynk-b2b-section">
          <div className="pynk-container">
            <motion.div {...reveal} className="pynk-b2b-section-head"><p className="pynk-eyebrow">{c.capabilitiesEyebrow}</p><h2>{c.capabilitiesTitle}</h2><p>{c.capabilitiesBody}</p></motion.div>
            <div className="pynk-b2b-capabilities">
              {c.capabilities.map((item, index) => { const Icon = capabilityIcons[index]; return <article key={item.title}><div className="pynk-b2b-capability-icon"><Icon aria-hidden /></div><div><h3>{item.title}</h3><p>{item.desc}</p></div></article>; })}
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-b2b-section pynk-b2b-method-section">
          <div className="pynk-container pynk-b2b-method-layout">
            <motion.div {...reveal} className="pynk-b2b-method-copy"><p className="pynk-eyebrow">{c.methodEyebrow}</p><h2>{c.methodTitleLead} <span>{c.methodTitleAccent}</span></h2><p>{c.methodIntro}</p><div className="pynk-b2b-deliverable"><ShieldCheck aria-hidden /><div><strong>{c.deliverableTitle}</strong><span>{c.deliverableBody}</span></div></div></motion.div>
            <ol className="pynk-b2b-method-list">
              {c.framework.slice(0, 4).map((step, index) => { const Icon = methodIcons[index]; return <li key={step.number}><span className="pynk-b2b-method-number">0{index + 1}</span><Icon aria-hidden /><div><h3>{step.title}</h3><p>{step.desc}</p></div></li>; })}
            </ol>
          </div>
        </section>

        <section className="pynk-section pynk-b2b-section"><div className="pynk-container pynk-b2b-fit"><motion.div {...reveal}><p className="pynk-eyebrow">{c.fitEyebrow}</p><h2>{c.targetTitleLead} <span>{c.targetTitleAccent}</span></h2></motion.div><ul>{c.target.map((line) => <li key={line}><CheckCircle2 aria-hidden /><span>{line}</span></li>)}</ul></div></section>

        <section className="pynk-section pynk-b2b-final-wrap"><motion.div {...reveal} className="pynk-container pynk-b2b-final"><div><p className="pynk-eyebrow">{c.finalEyebrow}</p><h2>{c.finalTitleLead} <span>{c.finalTitleAccent}</span></h2><p>{c.finalBody}</p></div><Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">{c.finalCta}<ArrowRight className="pynk-icon-sm pynk-arrow" /></Link></motion.div></section>
      </main>
      <div className="pynk-b2b-mobile-cta"><Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-group">{c.mobileCta}<ArrowRight className="pynk-icon-sm pynk-arrow" /></Link></div>
    </div>
  );
}

export function PynkStudioConsulenzaPage() { return <PynkShell><ConsulenzaInner /></PynkShell>; }
