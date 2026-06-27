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
  { title: "Shadow AI", body: "Tool introdotti senza inventario, owner o approvazione." },
  { title: "Dati esposti", body: "Documenti e segreti copiati in cloud senza regole tecniche." },
  { title: "Output non verificati", body: "Risposte usate nei processi senza review o log." },
  { title: "Versioni opache", body: "Modelli, prompt e knowledge base cambiano senza traccia." },
  { title: "Fornitori deboli", body: "Vendor scelti senza valutare API, lock-in e audit." },
];

const governanceSignals = [
  ["Inventario", "sistemi, modelli, owner"],
  ["Dati", "fonti, permessi, retention"],
  ["Processi", "workflow, review, escalation"],
  ["Controllo", "logging, audit, versioni"],
] as const;

const operatingLayers = [
  { label: "Business", detail: "caso d'uso, owner, impatto" },
  { label: "Data", detail: "fonti, permessi, qualità" },
  { label: "Model", detail: "LLM, RAG, agenti, eval" },
  { label: "Control", detail: "policy, log, audit, review" },
] as const;

const governanceFlow = [
  ["01", "Inventario", "Tool e sistemi AI realmente usati"],
  ["02", "Classificazione", "Ruolo, rischio, dati e processi coinvolti"],
  ["03", "Architettura", "Modelli, retrieval, tool, accessi e logging"],
  ["04", "Operatività", "Policy, literacy, audit e miglioramento continuo"],
] as const;

const beforeAfter = [
  {
    title: "AI non governata",
    items: ["tool scelti dal singolo reparto", "dati caricati senza criterio", "output copiati nei processi", "nessun audit trail"],
  },
  {
    title: "AI governata",
    items: ["owner e workflow definiti", "permessi e fonti controllate", "human review dove serve", "log, versioni e responsabilità"],
  },
] as const;

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
                <span>operating model</span>
                <strong>AI in produzione</strong>
              </div>
              <div className="pynk-ai-orbit" aria-hidden>
                <div className="pynk-ai-orbit-core">
                  <strong>AI</strong>
                  <span>governata</span>
                </div>
                {operatingLayers.map((layer, index) => (
                  <div key={layer.label} className={`pynk-ai-orbit-node pynk-ai-orbit-node-${index + 1}`}>
                    <b>{layer.label}</b>
                    <small>{layer.detail}</small>
                  </div>
                ))}
              </div>
              <div className="pynk-ai-system-stream">
                <span>model: openai / claude / llama</span>
                <span>risk: role + use case</span>
                <span>trace: enabled</span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="pynk-section pynk-ai-contrast-section">
          <div className="pynk-container-wide">
            <div className="pynk-ai-contrast-head">
              <p className="pynk-eyebrow">Il punto non è il tool</p>
              <h2>Da uso spontaneo a sistema controllato.</h2>
            </div>
            <div className="pynk-ai-before-after">
              {beforeAfter.map((column, columnIndex) => (
                <div key={column.title} className={`pynk-ai-ba-panel ${columnIndex === 1 ? "is-controlled" : ""}`}>
                  <span>{columnIndex === 0 ? "senza processo" : "con governance"}</span>
                  <h3>{column.title}</h3>
                  <div>
                    {column.items.map((item, index) => (
                      <p key={item} style={{ "--pynk-row": index } as React.CSSProperties}>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pynk-ai-ba-bridge" aria-hidden>
                <span />
                <ArrowRight className="pynk-icon-sm" />
              </div>
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt pynk-ai-flow-section">
          <div className="pynk-container-wide">
            <div className="pynk-section-head">
              <h2 className="pynk-section-title">Il metodo in quattro passaggi</h2>
            </div>
            <div className="pynk-ai-flow-map">
              {governanceFlow.map(([number, title, detail], index) => (
                <article key={number} className="pynk-ai-flow-node" style={{ "--pynk-row": index } as React.CSSProperties}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container-wide pynk-ai-risk-layout">
            <div className="pynk-ai-risk-copy">
              <p className="pynk-eyebrow">Rischi tecnici</p>
              <h2 className="pynk-section-title pynk-section-title-left">Il rischio legale nasce spesso da un difetto di architettura.</h2>
            </div>
            <div className="pynk-ai-risk-grid">
              {problems.map((problem) => (
                <article key={problem.title} className="pynk-panel pynk-panel-sm pynk-ai-risk-card">
                  <ShieldCheck className="pynk-icon-sm pynk-check" />
                  <h3>{problem.title}</h3>
                  <p>{problem.body}</p>
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
                    <span className="pynk-ai-card-index">{String(index + 1).padStart(2, "0")}</span>
                    <div className="pynk-panel-icon pynk-panel-icon-soft">
                      <Icon className="pynk-icon-sm" />
                    </div>
                    <h3 className="pynk-panel-title">{service.title}</h3>
                    <div className="pynk-ai-mini-tags">
                      {service.includes.slice(0, 3).map((item) => (
                        <span key={item}>{item.split(",")[0]}</span>
                      ))}
                    </div>
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
              <div className="pynk-ai-role-grid">
                {["provider", "deployer", "importatore", "distributore"].map((role) => (
                  <span key={role}>{role}</span>
                ))}
              </div>
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
            </div>
            <div className="pynk-ai-signal-grid">
              {governanceSignals.map(([title, body]) => (
                <article key={title}>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </article>
              ))}
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
