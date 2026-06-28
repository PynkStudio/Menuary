"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { pynkSolutions } from "../pynk-solutions";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, itemListSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

export function PynkSolutionsIndexPage() {
  const href = useTenantLocalizedHref();
  const jsonLd = [
    organizationSchema(),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Soluzioni", path: "/soluzioni" },
    ]),
    itemListSchema(
      "Soluzioni AI per le aziende",
      pynkSolutions.map((solution) => ({ name: solution.h1, path: `/soluzioni/${solution.slug}` })),
    ),
  ];

  return (
    <PynkShell>
      <PynkJsonLd data={jsonLd} />
      <main className="pynk-page">
        <section className="pynk-hero pynk-hero-sub pynk-ai-blog-hero">
          <div className="pynk-glow pynk-glow-tr" aria-hidden />
          <div className="pynk-container-wide pynk-ai-blog-hero-grid">
            <div>
              <p className="pynk-eyebrow pynk-eyebrow-chip">Soluzioni AI · per la tua attività</p>
              <h1 className="pynk-hero-title pynk-ai-hero-title">L&apos;AI per problemi concreti, spiegata semplice</h1>
            </div>
            <p className="pynk-hero-subtitle pynk-ai-hero-copy">
              Hai un problema, non una tecnologia da capire. Parti da qui: ChatGPT in azienda, assistenti per i clienti,
              automazione documenti, AI per il tuo settore e come rispettare l&apos;AI Act. Te lo costruiamo noi.
            </p>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container">
            <div className="pynk-ai-blog-grid">
              {pynkSolutions.map((solution, index) => (
                <Link
                  key={solution.slug}
                  href={href(`/soluzioni/${solution.slug}`)}
                  className={`pynk-panel pynk-ai-blog-card pynk-ai-blog-card-${(index % 6) + 1}`}
                >
                  <div className="pynk-card-kind">{solution.eyebrow}</div>
                  <h2 className="pynk-panel-title">{solution.h1}</h2>
                  <p className="pynk-panel-desc">{solution.intro}</p>
                  <span className="pynk-card-cta">
                    Scopri come <ArrowRight className="pynk-icon-xs" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-center-col">
            <h2 className="pynk-section-title">Non sai da dove iniziare?</h2>
            <p className="pynk-section-lead">
              Raccontaci il tuo problema in parole semplici. Ti diciamo se e come l&apos;AI può aiutarti, senza venderti fumo.
            </p>
            <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-btn-island">
              <span>Parla con noi</span>
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
