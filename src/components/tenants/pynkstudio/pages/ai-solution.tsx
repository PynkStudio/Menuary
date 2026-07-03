"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { getPynkSolution } from "../pynk-solutions";
import { getGovernanceArticle, getGovernanceService } from "../ai-governance-data";
import { PynkJsonLd } from "../pynk-json-ld";
import { PynkLegalPartnerNote } from "../pynk-legal-partner";
import { breadcrumbSchema, courseSchema, faqSchema, organizationSchema, serviceSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

export function PynkSolutionPage({ slug }: { slug: string }) {
  const solution = getPynkSolution(slug);
  const href = useTenantLocalizedHref();
  if (!solution) return null;

  const path = `/soluzioni/${solution.slug}`;
  const relatedServices = solution.relatedServices.map(getGovernanceService).filter(Boolean);
  const relatedArticles = solution.relatedArticles.map(getGovernanceArticle).filter(Boolean);

  const jsonLd = [
    organizationSchema(),
    serviceSchema(solution.h1, solution.metaDescription, path, solution.h1),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Soluzioni", path: "/soluzioni" },
      { name: solution.h1, path },
    ]),
    faqSchema(solution.faq),
    ...(solution.slug === "formazione-ai-dipendenti"
      ? [courseSchema({ name: solution.h1, description: solution.metaDescription, path })]
      : []),
  ];

  return (
    <PynkShell>
      <PynkJsonLd data={jsonLd} />
      <main className="pynk-page">
        <section className="pynk-hero pynk-hero-sub pynk-ai-service-hero">
          <div className="pynk-glow pynk-glow-tl" aria-hidden />
          <div className="pynk-container-wide pynk-ai-service-hero-grid">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <p className="pynk-eyebrow pynk-eyebrow-chip">{solution.eyebrow}</p>
              <h1 className="pynk-hero-title pynk-ai-hero-title">{solution.h1}</h1>
              <p className="pynk-hero-subtitle pynk-ai-hero-copy">{solution.intro}</p>
              <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-btn-island pynk-group pynk-mt-24">
                <span>{solution.cta}</span>
                <span className="pynk-btn-orb">
                  <ArrowRight className="pynk-icon-sm pynk-arrow" />
                </span>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="pynk-ai-service-snapshot"
            >
              <span>cosa ottieni</span>
              <strong>{solution.deliverTitle}</strong>
              <div>
                {solution.deliver.slice(0, 4).map((item) => (
                  <em key={item}>{item}</em>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container-wide pynk-ai-risk-layout">
            <div className="pynk-ai-risk-copy">
              <p className="pynk-eyebrow">Il punto di partenza</p>
              <h2 className="pynk-section-title pynk-section-title-left">{solution.painsTitle}</h2>
            </div>
            <div className="pynk-ai-risk-grid">
              {solution.pains.map((pain) => (
                <article key={pain} className="pynk-panel pynk-panel-sm pynk-ai-risk-card pynk-solution-pain">
                  <AlertTriangle className="pynk-icon-sm pynk-ai-risk-icon" />
                  <p>{pain}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container">
            <div className="pynk-section-head">
              <h2 className="pynk-section-title">{solution.howTitle}</h2>
            </div>
            <div className="pynk-steps">
              {solution.how.map((step, index) => (
                <article key={step.title} className="pynk-step">
                  <span className="pynk-step-number">{index + 1}</span>
                  <div>
                    <h3 className="pynk-step-title pynk-step-title-lg">{step.title}</h3>
                    <p className="pynk-step-desc">{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container pynk-ai-split">
            <div>
              <p className="pynk-eyebrow">Il risultato</p>
              <h2 className="pynk-section-title pynk-section-title-left">{solution.deliverTitle}</h2>
              <p className="pynk-panel-desc">
                Non vendiamo slide: progettiamo, costruiamo e integriamo il sistema, e lo manteniamo nel tempo. La governance
                è inclusa, perché lo abbiamo costruito noi.
              </p>
            </div>
            <ul className="pynk-check-list">
              {solution.deliver.map((item) => (
                <li key={item}>
                  <Check className="pynk-icon-sm pynk-check" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {solution.legalPartner && <PynkLegalPartnerNote />}

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container">
            <h2 className="pynk-section-title">Domande frequenti</h2>
            <div className="pynk-ai-faq-list">
              {solution.faq.map((item) => (
                <article key={item.q} className="pynk-panel pynk-panel-sm">
                  <h3 className="pynk-panel-title-sm">{item.q}</h3>
                  <p className="pynk-panel-desc">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {(relatedServices.length > 0 || relatedArticles.length > 0) && (
          <section className="pynk-section">
            <div className="pynk-container pynk-ai-split">
              {relatedServices.length > 0 && (
                <div>
                  <h2 className="pynk-section-title pynk-section-title-left pynk-section-title-sm">Servizi collegati</h2>
                  <div className="pynk-solution-links">
                    {relatedServices.map((service) => (
                      <Link key={service!.slug} href={href(`/ai-governance/${service!.slug}`)} className="pynk-ai-resource">
                        {service!.title}
                        <ArrowRight className="pynk-icon-xs" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {relatedArticles.length > 0 && (
                <div>
                  <h2 className="pynk-section-title pynk-section-title-left pynk-section-title-sm">Approfondisci</h2>
                  <div className="pynk-solution-links">
                    {relatedArticles.map((article) => (
                      <Link key={article!.slug} href={href(`/blog/ai-governance/${article!.slug}`)} className="pynk-ai-resource">
                        {article!.title}
                        <ArrowRight className="pynk-icon-xs" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-center-col">
            <h2 className="pynk-section-title">Ne parliamo in parole semplici.</h2>
            <p className="pynk-section-lead">
              Niente tecnicismi: ti spieghiamo cosa serve davvero alla tua attività e cosa no. Poi, se ha senso, lo costruiamo.
            </p>
            <div className="pynk-hero-ctas">
              <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-btn-island">
                <span>{solution.cta}</span>
                <span className="pynk-btn-orb">
                  <ArrowRight className="pynk-icon-sm" />
                </span>
              </Link>
              <Link href={href("/soluzioni")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
                Tutte le soluzioni
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PynkShell>
  );
}
