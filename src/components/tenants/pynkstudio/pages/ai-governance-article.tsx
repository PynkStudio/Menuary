"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { getGovernanceArticle, governanceBlogArticles } from "../ai-governance-data";
import { PynkJsonLd } from "../pynk-json-ld";
import { articleSchema, breadcrumbSchema, faqSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const sectionId = (index: number) => `sez-${index + 1}`;

export function PynkAiGovernanceArticlePage({ slug }: { slug: string }) {
  const article = getGovernanceArticle(slug);
  const href = useTenantLocalizedHref();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!article) return null;

  const index = governanceBlogArticles.findIndex((a) => a.slug === article.slug);
  const prev = index > 0 ? governanceBlogArticles[index - 1] : null;
  const next = index >= 0 && index < governanceBlogArticles.length - 1 ? governanceBlogArticles[index + 1] : null;
  const related = (article.related ?? [])
    .map((relatedSlug) => governanceBlogArticles.find((a) => a.slug === relatedSlug))
    .filter((a): a is (typeof governanceBlogArticles)[number] => Boolean(a));

  const path = `/blog/ai-governance/${article.slug}`;
  const jsonLd = [
    organizationSchema(),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog AI Governance", path: "/blog/ai-governance" },
      { name: article.title, path },
    ]),
    faqSchema(article.faq),
    articleSchema({
      title: article.title,
      description: article.description,
      path,
      keywords: article.topics,
    }),
  ];

  return (
    <PynkShell>
      <PynkJsonLd data={jsonLd} />
      <div className="pynk-ai-read-progress" aria-hidden style={{ transform: `scaleX(${progress})` }} />
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
                <p className="pynk-ai-toc-title">In questo articolo</p>
                <nav className="pynk-ai-toc">
                  {article.sections.map((section, i) => (
                    <a key={section.title} href={`#${sectionId(i)}`}>
                      {section.title}
                    </a>
                  ))}
                  <a href="#takeaways">In sintesi</a>
                  <a href="#faq">FAQ tecniche</a>
                </nav>
                <div className="pynk-ai-toc-links">
                  <Link href={href("/blog/ai-governance")} className="pynk-link-cta">
                    Torna alla categoria
                  </Link>
                  <Link href={href("/ai-governance")} className="pynk-link-cta">
                    Servizi AI Governance
                  </Link>
                </div>
              </aside>

              <div className="pynk-ai-article-body">
                <p className="pynk-ai-article-lead">{article.intro}</p>

                {article.sections.map((section, i) => (
                  <section key={section.title} id={sectionId(i)} className="pynk-ai-article-section">
                    <h2>{section.title}</h2>
                    {section.body.split("\n\n").map((paragraph, p) => (
                      <p key={p}>{paragraph}</p>
                    ))}
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="pynk-ai-article-list">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                    {section.block && (
                      <figure className="pynk-ai-codeblock">
                        {section.block.caption && <figcaption>{section.block.caption}</figcaption>}
                        <pre>
                          {section.block.lines.map((line, l) => (
                            <code key={l}>{line}</code>
                          ))}
                        </pre>
                      </figure>
                    )}
                  </section>
                ))}

                {article.takeaways.length > 0 && (
                  <section id="takeaways" className="pynk-ai-takeaways">
                    <h2>In sintesi</h2>
                    <ul>
                      {article.takeaways.map((item) => (
                        <li key={item}>
                          <Check className="pynk-icon-xs" aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section id="faq" className="pynk-ai-article-section">
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

                {(prev || next) && (
                  <nav className="pynk-ai-article-nav">
                    {prev ? (
                      <Link href={href(`/blog/ai-governance/${prev.slug}`)} className="pynk-ai-article-nav-link">
                        <span className="pynk-ai-article-nav-dir">
                          <ArrowLeft className="pynk-icon-xs" /> Precedente
                        </span>
                        <strong>{prev.title}</strong>
                      </Link>
                    ) : (
                      <span />
                    )}
                    {next && (
                      <Link href={href(`/blog/ai-governance/${next.slug}`)} className="pynk-ai-article-nav-link is-next">
                        <span className="pynk-ai-article-nav-dir">
                          Successivo <ArrowRight className="pynk-icon-xs" />
                        </span>
                        <strong>{next.title}</strong>
                      </Link>
                    )}
                  </nav>
                )}
              </div>
            </div>
          </section>

          {related.length > 0 && (
            <section className="pynk-section pynk-section-alt">
              <div className="pynk-container">
                <div className="pynk-section-head">
                  <h2 className="pynk-section-title">Articoli correlati</h2>
                </div>
                <div className="pynk-ai-related-grid">
                  {related.map((item) => (
                    <Link key={item.slug} href={href(`/blog/ai-governance/${item.slug}`)} className="pynk-panel pynk-ai-related-card">
                      <div className="pynk-card-kind">{item.readingTime}</div>
                      <h3 className="pynk-panel-title-sm">{item.title}</h3>
                      <p className="pynk-panel-desc">{item.description}</p>
                      <span className="pynk-card-cta">
                        Leggi <ArrowRight className="pynk-icon-xs" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </article>

        <section className="pynk-section">
          <div className="pynk-container pynk-center-col">
            <h2 className="pynk-section-title">Dalla teoria al sistema in produzione.</h2>
            <p className="pynk-section-lead">
              Non spieghiamo soltanto come funziona: progettiamo, sviluppiamo e governiamo architetture AI, agenti, RAG e
              integrazioni partendo dai processi reali.
            </p>
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
