"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { getGovernanceService } from "../ai-governance-data";
import { PynkCarousel } from "../pynk-carousel";
import { adoptionFormats, adoptionModules, adoptionRoles } from "../pynk-adoption-program";
import { PynkJsonLd } from "../pynk-json-ld";
import { PynkLegalPartnerNote } from "../pynk-legal-partner";
import { breadcrumbSchema, faqSchema, organizationSchema, serviceSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

export function PynkAiGovernanceServicePage({ slug }: { slug: string }) {
  const service = getGovernanceService(slug);
  const href = useTenantLocalizedHref();
  if (!service) return null;
  const scopeItems = service.includes.slice(0, 6);
  const isLiteracy = service.slug === "ai-literacy";

  const path = `/ai-governance/${service.slug}`;
  const jsonLd = [
    organizationSchema(),
    serviceSchema(service.title, service.metaDescription, path, service.title),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "AI Governance", path: "/ai-governance" },
      { name: service.title, path },
    ]),
    faqSchema(service.faq),
  ];

  return (
    <PynkShell>
      <PynkJsonLd data={jsonLd} />
      <main className="pynk-page">
        <section className="pynk-hero pynk-hero-sub pynk-ai-service-hero">
          <div className="pynk-glow pynk-glow-tl" aria-hidden />
          <div className="pynk-container-wide pynk-ai-service-hero-grid">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <p className="pynk-eyebrow pynk-eyebrow-chip">{service.eyebrow}</p>
              <h1 className="pynk-hero-title pynk-ai-hero-title">{service.title}</h1>
              <p className="pynk-hero-subtitle pynk-ai-hero-copy">{service.summary}</p>
              <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-btn-island pynk-group pynk-mt-24">
                <span>{service.cta}</span>
                <span className="pynk-btn-orb">
                  <ArrowRight className="pynk-icon-sm pynk-arrow" />
                </span>
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="pynk-ai-service-snapshot">
              <span>service blueprint</span>
              <strong>{service.shortTitle}</strong>
              <div>
                {service.includes.slice(0, 4).map((item) => (
                  <em key={item}>{item}</em>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container pynk-ai-split">
            <div>
              <h2 className="pynk-section-title pynk-section-title-left">{isLiteracy ? "Il percorso" : "Descrizione"}</h2>
              <p className="pynk-section-lead pynk-section-lead-left pynk-ai-service-description">{service.description}</p>
            </div>
            {isLiteracy ? (
              <div className="pynk-panel pynk-double-bezel">
                <h3 className="pynk-panel-title">Come si svolge</h3>
                <div className="pynk-pills pynk-pills-left pynk-mt-12">
                  {adoptionFormats.map((format) => (
                    <span key={format} className="pynk-pill">{format}</span>
                  ))}
                </div>
                <h3 className="pynk-panel-title pynk-mt-24">Modulato per ruolo</h3>
                <div className="pynk-ai-role-grid pynk-mt-12">
                  {adoptionRoles.map((role) => (
                    <span key={role}>{role}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pynk-panel pynk-double-bezel">
                <h3 className="pynk-panel-title">Comprende</h3>
                <div className="pynk-ai-token-list">
                  {scopeItems.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {isLiteracy && (
          <section className="pynk-section pynk-section-alt pynk-adoption-section">
            <div className="pynk-container">
              <div className="pynk-section-head">
                <p className="pynk-eyebrow">Programma formativo · {adoptionModules.length} moduli</p>
                <h2 className="pynk-section-title">Cosa comprende il percorso</h2>
                <p className="pynk-section-lead">
                  Moduli combinabili per ruolo. Ogni modulo unisce comprensione teorica e applicazione pratica: scorri per
                  vedere argomenti e valore di ciascuno.
                </p>
              </div>

              <PynkCarousel label="Moduli del percorso AI Adoption">
                {adoptionModules.map((module) => (
                  <article key={module.id} className="pynk-adoption-card">
                    <span className="pynk-adoption-kicker">{module.kicker}</span>
                    <h3 className="pynk-adoption-title">{module.title}</h3>
                    <p className="pynk-adoption-summary">{module.summary}</p>
                    <div className="pynk-adoption-topics">
                      <span className="pynk-adoption-topics-label">Argomenti</span>
                      <div className="pynk-stack-chips">
                        {module.topics.map((topic) => (
                          <span key={topic} className="pynk-chip">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pynk-adoption-value">
                      <div>
                        <span>Cosa capisci</span>
                        <p>{module.theory}</p>
                      </div>
                      <div>
                        <span>Cosa sai fare</span>
                        <p>{module.practice}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </PynkCarousel>
            </div>
          </section>
        )}

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-ai-use-benefit">
            <div className="pynk-ai-compact-block">
              <h2 className="pynk-section-title pynk-section-title-sm">Casi d&apos;uso</h2>
              <div className="pynk-ai-compact-list">
                {service.useCases.map((item, index) => (
                  <article key={item}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{item}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="pynk-ai-compact-block">
              <h2 className="pynk-section-title pynk-section-title-sm">Benefici</h2>
              <div className="pynk-ai-compact-list">
                {service.benefits.map((item, index) => (
                  <article key={item}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{item}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container">
            <div className="pynk-section-head">
              <h2 className="pynk-section-title">Processo di lavoro</h2>
              <p className="pynk-section-lead">Fasi chiare, output verificabili e responsabilità tecniche esplicite.</p>
            </div>
            <div className="pynk-steps pynk-steps-premium pynk-steps-horizontal">
              {service.process.map((step, index) => (
                <article key={step} className="pynk-step">
                  <div className="pynk-panel-icon pynk-panel-icon-sm">
                    <span className="pynk-step-number">{index + 1}</span>
                  </div>
                  <p className="pynk-step-desc">{step}</p>
                </article>
              ))}
            </div>
            {service.deliverables && (
              <div className="pynk-ai-deliverables">
                {service.deliverables.map((item) => (
                  <span key={item} className="pynk-pill">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {service.legalPartner && <PynkLegalPartnerNote />}

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container">
            <h2 className="pynk-section-title">FAQ</h2>
            <div className="pynk-ai-faq-list">
              {service.faq.map((item) => (
                <article key={item.q} className="pynk-panel pynk-panel-sm">
                  <h3 className="pynk-panel-title-sm">{item.q}</h3>
                  <p className="pynk-panel-desc">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container pynk-center-col">
            <h2 className="pynk-section-title">Trasformiamo il servizio in roadmap operativa.</h2>
            <div className="pynk-hero-ctas">
              <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-btn-island">
                <span>{service.cta}</span>
                <span className="pynk-btn-orb">
                  <ArrowRight className="pynk-icon-sm" />
                </span>
              </Link>
              <Link href={href("/ai-governance")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
                Torna ad AI Governance
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PynkShell>
  );
}
