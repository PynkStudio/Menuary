"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { getGovernanceArticle } from "../ai-governance-data";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, faqSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

export function PynkAiGovernanceArticlePage({ slug }: { slug: string }) {
  const article = getGovernanceArticle(slug);
  const href = useTenantLocalizedHref();
  if (!article) return null;

  const path = `/blog/ai-governance/${article.slug}`;
  const jsonLd = [
    organizationSchema(),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog AI Governance", path: "/blog/ai-governance" },
      { name: article.title, path },
    ]),
    faqSchema(article.faq),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      author: { "@type": "Organization", name: "PYNK STUDIO" },
      publisher: organizationSchema(),
      mainEntityOfPage: path,
      articleSection: "AI Governance",
      keywords: article.topics.join(", "),
    },
  ];

  return (
    <PynkShell>
      <PynkJsonLd data={jsonLd} />
      <main className="pynk-page">
        <article>
          <section className="pynk-hero pynk-hero-sub pynk-ai-article-hero">
            <div className="pynk-glow pynk-glow-tl" aria-hidden />
            <div className="pynk-container-wide pynk-ai-blog-hero-grid">
              <div>
                <p className="pynk-eyebrow pynk-eyebrow-chip">AI Governance · {article.readingTime}</p>
                <h1 className="pynk-hero-title pynk-ai-hero-title">{article.title}</h1>
              </div>
              <div>
              <p className="pynk-hero-subtitle pynk-ai-hero-copy">{article.description}</p>
              <div className="pynk-stack-chips pynk-mt-24">
                {article.topics.map((topic) => (
                  <span key={topic} className="pynk-chip">
                    {topic}
                  </span>
                ))}
              </div>
              </div>
            </div>
          </section>

          <section className="pynk-section">
            <div className="pynk-container pynk-ai-article-layout">
              <aside className="pynk-ai-article-aside">
                <Link href={href("/blog/ai-governance")} className="pynk-link-cta">
                  Torna alla categoria
                </Link>
                <Link href={href("/ai-governance")} className="pynk-link-cta">
                  Servizi AI Governance
                </Link>
              </aside>
              <div className="pynk-ai-article-body">
                {article.sections.map((section) => (
                  <section key={section.title}>
                    <h2>{section.title}</h2>
                    <p>{section.body}</p>
                  </section>
                ))}
                <section>
                  <h2>FAQ tecniche</h2>
                  <div className="pynk-ai-faq-list pynk-ai-faq-list-article">
                    {article.faq.map((item) => (
                      <div key={item.q} className="pynk-panel pynk-panel-sm">
                        <h3 className="pynk-panel-title-sm">{item.q}</h3>
                        <p className="pynk-panel-desc">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </section>
        </article>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-center-col">
            <h2 className="pynk-section-title">Dalla teoria al sistema in produzione.</h2>
            <p className="pynk-section-lead">Progettiamo architetture AI, policy, workflow e integrazioni partendo dai processi reali.</p>
            <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-btn-island pynk-group">
              <span>Prenota una consulenza tecnica</span>
              <span className="pynk-btn-orb">
                <ArrowRight className="pynk-icon-sm pynk-arrow" />
              </span>
            </Link>
          </div>
        </section>
      </main>
    </PynkShell>
  );
}
