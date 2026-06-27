"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { governanceBlogArticles } from "../ai-governance-data";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

export function PynkAiGovernanceBlogPage() {
  const href = useTenantLocalizedHref();
  const jsonLd = [
    organizationSchema(),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog/ai-governance" },
      { name: "AI Governance", path: "/blog/ai-governance" },
    ]),
  ];

  return (
    <PynkShell>
      <PynkJsonLd data={jsonLd} />
      <main className="pynk-page">
        <section className="pynk-hero pynk-hero-sub pynk-ai-blog-hero">
          <div className="pynk-glow pynk-glow-tr" aria-hidden />
          <div className="pynk-container-wide pynk-ai-blog-hero-grid">
            <div>
              <p className="pynk-eyebrow pynk-eyebrow-chip">Blog · AI Governance</p>
              <h1 className="pynk-hero-title pynk-ai-hero-title">Articoli tecnici su AI, architettura e governance</h1>
            </div>
            <p className="pynk-hero-subtitle pynk-ai-hero-copy">
              Pillar tecnici per capire LLM, RAG, agenti, tool calling, AI Act, logging, auditing e processi di adozione professionale.
            </p>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container">
            <div className="pynk-ai-blog-grid">
              {governanceBlogArticles.map((article, index) => (
                <Link key={article.slug} href={href(`/blog/ai-governance/${article.slug}`)} className={`pynk-panel pynk-ai-blog-card pynk-ai-blog-card-${(index % 6) + 1}`}>
                  <div className="pynk-card-kind">{article.readingTime}</div>
                  <h2 className="pynk-panel-title">{article.title}</h2>
                  <p className="pynk-panel-desc">{article.description}</p>
                  <div className="pynk-stack-chips">
                    {article.topics.map((topic) => (
                      <span key={topic} className="pynk-chip">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <span className="pynk-card-cta">
                    Leggi articolo <ArrowRight className="pynk-icon-xs" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-center-col">
            <h2 className="pynk-section-title">Vuoi applicare questi principi alla tua azienda?</h2>
            <p className="pynk-section-lead">Partiamo da sistemi, dati, ruoli e workflow reali. Poi scegliamo architettura e controlli.</p>
            <Link href={href("/ai-governance")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-btn-island">
              <span>Vai ad AI Governance</span>
              <span className="pynk-btn-orb">
                <ArrowRight className="pynk-icon-sm" />
              </span>
            </Link>
          </div>
        </section>
      </main>
    </PynkShell>
  );
}
