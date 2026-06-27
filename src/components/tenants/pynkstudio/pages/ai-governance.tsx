"use client";

import Link from "next/link";
import type React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bot, BrainCircuit, CheckCircle2, Database, FileCheck2, GitBranch, ShieldCheck, Wrench } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { governanceServices, leadMagnets } from "../ai-governance-data";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, faqSchema, organizationSchema, serviceSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const platformBuilds = [
  "chatbot",
  "agenti AI",
  "voice AI",
  "sistemi RAG",
  "AI locale",
  "AI cloud",
  "LLM on-premise",
  "workflow",
  "automazioni",
  "software personalizzato",
  "API",
  "integrazioni",
];

const problems = [
  "strumenti AI introdotti senza inventario, owner o criteri di approvazione",
  "dati aziendali copiati in servizi cloud senza regole tecniche chiare",
  "output usati nei processi senza verifica, logging o supervisione umana",
  "modelli, prompt e knowledge base aggiornati senza versionamento",
  "fornitori AI valutati solo sul prezzo, non su dati, API, lock-in e audit",
];

const faq = [
  {
    q: "AI Governance significa solo AI Act?",
    a: "No. L'AI Act è una parte della governance. La governance include architettura, dati, ruoli, workflow, accessi, logging, policy, monitoraggio e manutenzione.",
  },
  {
    q: "Il problema principale è ChatGPT?",
    a: "No. Il problema è l'assenza di processi: strumenti non inventariati, dati non classificati, output non verificati e responsabilità non assegnate.",
  },
  {
    q: "PYNK STUDIO implementa anche i sistemi AI?",
    a: "Sì. Progettiamo e realizziamo direttamente chatbot, agenti AI, voice AI, RAG, AI locale, AI cloud, workflow, automazioni, API e integrazioni.",
  },
];

export function PynkAiGovernancePage() {
  const href = useTenantLocalizedHref();
  const jsonLd = [
    organizationSchema(),
    serviceSchema(
      "AI Governance per aziende",
      "Progettazione, implementazione e governo di sistemi di Intelligenza Artificiale conformi alle normative europee e utili al business.",
      "/ai-governance",
      governanceServices.map((service) => service.title),
    ),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "AI Governance", path: "/ai-governance" },
    ]),
    faqSchema(faq),
  ];

  return (
    <PynkShell>
      <PynkJsonLd data={jsonLd} />
      <main className="pynk-page">
        <section className="pynk-hero pynk-ai-hero">
          <div className="pynk-glow pynk-glow-tr" aria-hidden />
          <div className="pynk-container-wide pynk-ai-hero-grid">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.72 }}>
              <p className="pynk-eyebrow pynk-eyebrow-chip">AI Governance · Architettura · AI Act</p>
              <h1 className="pynk-hero-title pynk-ai-hero-title">
                AI Governance <span className="pynk-accent">per aziende</span>
              </h1>
              <p className="pynk-hero-subtitle pynk-ai-hero-copy">
                Progettiamo, implementiamo e governiamo sistemi di Intelligenza Artificiale conformi alle normative europee e realmente utili al business.
              </p>
              <div className="pynk-hero-ctas pynk-hero-ctas-left">
                <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-btn-island pynk-group">
                  <span>Richiedi un AI Assessment</span>
                  <span className="pynk-btn-orb">
                    <ArrowRight className="pynk-icon-sm pynk-arrow" />
                  </span>
                </Link>
                <Link href={href("/ai-governance/ai-architecture")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
                  Parla con un AI Architect
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 34, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.12 }}
              className="pynk-ai-hero-system"
              aria-label="Sistema AI governato"
            >
              <div className="pynk-ai-system-top">
                <span>governance runtime</span>
                <strong>RAG / Agent / Audit</strong>
              </div>
              <div className="pynk-ai-system-core">
                <span className="pynk-ai-node is-hot">policy</span>
                <span className="pynk-ai-node">accessi</span>
                <span className="pynk-ai-node">retrieval</span>
                <span className="pynk-ai-node">tool</span>
                <span className="pynk-ai-node">human review</span>
                <span className="pynk-ai-node">log</span>
              </div>
              <div className="pynk-ai-system-stream">
                <span>model: claude/openai/llama</span>
                <span>risk: role + use case</span>
                <span>trace: enabled</span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container pynk-ai-split">
            <div>
              <p className="pynk-eyebrow">Il punto non è il tool</p>
              <h2 className="pynk-section-title pynk-section-title-left">Ogni azienda sta introducendo AI. Poche stanno governando il processo.</h2>
              <p className="pynk-section-lead pynk-section-lead-left">
                ChatGPT, Copilot, Gemini, Claude, chatbot verticali e automazioni entrano nei reparti prima che esistano inventario, policy, ruoli e log. Il rischio nasce quando l&apos;AI diventa processo senza essere progettata come sistema.
              </p>
            </div>
            <div className="pynk-ai-terminal pynk-double-bezel" aria-label="Esempio di processo AI governato">
              {["input classificato", "retrieval con permessi", "modello selezionato", "tool calling controllato", "human review", "logging e audit"].map((step, index) => (
                <span key={step} style={{ "--pynk-row": index } as React.CSSProperties}>
                  {step}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container">
            <div className="pynk-section-head">
              <h2 className="pynk-section-title">Senza governance i rischi sono tecnici prima che legali</h2>
              <p className="pynk-section-lead">
                Una buona architettura riduce esposizione dei dati, output non verificati, errori operativi e anche rischio normativo.
              </p>
            </div>
            <div className="pynk-ai-risk-grid">
              {problems.map((problem) => (
                <article key={problem} className="pynk-panel pynk-panel-sm">
                  <ShieldCheck className="pynk-icon-sm pynk-check" />
                  <p className="pynk-panel-desc">{problem}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container">
            <div className="pynk-section-head">
              <h2 className="pynk-section-title">Servizi AI Governance</h2>
              <p className="pynk-section-lead">
                Dalla valutazione iniziale all&apos;architettura, dall&apos;AI Literacy alle integrazioni in produzione.
              </p>
            </div>
            <div className="pynk-ai-service-grid">
              {governanceServices.map((service, index) => {
                const Icon = [BrainCircuit, GitBranch, FileCheck2, ShieldCheck, Database, Bot, Wrench, CheckCircle2, FileCheck2][index] ?? BrainCircuit;
                return (
                  <Link key={service.slug} href={href(`/ai-governance/${service.slug}`)} className={`pynk-panel pynk-ai-service-card pynk-ai-service-card-${index + 1}`}>
                    <div className="pynk-panel-icon pynk-panel-icon-soft">
                      <Icon className="pynk-icon-sm" />
                    </div>
                    <h3 className="pynk-panel-title">{service.title}</h3>
                    <p className="pynk-panel-desc">{service.summary}</p>
                    <span className="pynk-card-cta">
                      Apri servizio <ArrowRight className="pynk-icon-xs" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-ai-split">
            <div>
              <p className="pynk-eyebrow">AI Act nella governance</p>
              <h2 className="pynk-section-title pynk-section-title-left">Gli obblighi dipendono da ruolo e rischio.</h2>
              <p className="pynk-section-lead pynk-section-lead-left">
                Provider, deployer, importatori e distributori non hanno lo stesso perimetro. Anche il livello di rischio cambia gli obblighi: sistemi vietati, alto rischio, AI Literacy, documentazione e governance vanno valutati sul sistema reale.
              </p>
              <Link href={href("/ai-act")} className="pynk-link-cta pynk-mt-24">
                Leggi la sezione AI Act <ArrowRight className="pynk-icon-xs" />
              </Link>
            </div>
            <div className="pynk-panel">
              <h3 className="pynk-panel-title">Valutazione preliminare degli obblighi AI Act</h3>
              <p className="pynk-panel-desc">
                Verifichiamo ruolo, rischio, documentazione necessaria e l&apos;eventuale necessità di predisporre una Fundamental Rights Impact Assessment.
              </p>
              <Link href={href("/ai-governance/valutazione-obblighi-ai-act")} className="pynk-btn pynk-btn-outline pynk-mt-24">
                Valuta gli obblighi
              </Link>
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container">
            <div className="pynk-section-head">
              <h2 className="pynk-section-title">Implementiamo direttamente i sistemi AI</h2>
              <p className="pynk-section-lead">
                La governance è più solida quando chi la progetta sa anche costruire i sistemi: modelli, API, dati, workflow e deployment.
              </p>
            </div>
            <div className="pynk-pills">
              {platformBuilds.map((item) => (
                <span key={item} className="pynk-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-ai-split">
            <div>
              <h2 className="pynk-section-title pynk-section-title-left">Risorse per partire</h2>
              <p className="pynk-section-lead pynk-section-lead-left">
                Lead magnet tecnici per trasformare l&apos;interesse sull&apos;AI in un percorso misurabile: checklist, guide, template e assessment.
              </p>
            </div>
            <div className="pynk-ai-resource-marquee" aria-label="Risorse lead generation">
              <div className="pynk-ai-resource-track">
                {[...leadMagnets, ...leadMagnets].map((lead, index) => (
                  <Link key={`${lead}-${index}`} href={href("/contattaci")} className="pynk-ai-resource">
                    {lead}
                    <ArrowRight className="pynk-icon-xs" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container pynk-center-col">
            <h2 className="pynk-section-title">Serve una roadmap AI concreta?</h2>
            <p className="pynk-section-lead">
              Portiamo l&apos;AI nei processi aziendali con architettura, governance, integrazione e manutenzione.
            </p>
            <div className="pynk-hero-ctas">
              <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-btn-island">
                <span>Prenota una consulenza tecnica</span>
                <span className="pynk-btn-orb">
                  <ArrowRight className="pynk-icon-sm" />
                </span>
              </Link>
              <Link href={href("/blog/ai-governance")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
                Leggi il blog AI Governance
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PynkShell>
  );
}
