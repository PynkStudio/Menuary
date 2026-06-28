"use client";

import Link from "next/link";
import type React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Bot, BrainCircuit, CheckCircle2, ChevronRight, Database, FileCheck2, GitBranch, ShieldCheck, Wrench } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { governanceServices, leadMagnets } from "../ai-governance-data";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, faqSchema, organizationSchema, serviceSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const dailyBuilds = [
  "agenti AI",
  "chatbot",
  "voice AI",
  "workflow intelligenti",
  "sistemi documentali",
  "RAG",
  "knowledge base",
  "automazioni",
  "integrazioni",
  "API",
  "software custom",
];

const buildPipeline = [
  "LLM",
  "Prompt Layer",
  "Guardrails",
  "Tool Calling",
  "MCP",
  "Workflow",
  "API",
  "CRM",
  "ERP",
  "Utenti",
  "Analytics",
  "Monitoring",
  "Governance",
];

const architectureFlow = [
  ["Input", "richieste utenti, eventi, documenti"],
  ["LLM", "modello scelto per compito e privacy"],
  ["Tool Calling", "il modello agisce su funzioni e API"],
  ["Database", "stato, permessi, transazioni"],
  ["Knowledge Base", "RAG su fonti aziendali aggiornate"],
  ["Business Logic", "regole, validazioni, orchestrazione"],
  ["Output", "risposta verificata e tracciata"],
  ["Monitoring", "log, metriche, qualità nel tempo"],
  ["Governance", "policy, audit, versioni, responsabilità"],
] as const;

const techGroups = [
  {
    label: "Modelli LLM",
    reason: "Scegliamo il modello in base a compito, costo e privacy, non per moda.",
    items: ["OpenAI", "Claude", "Gemini", "Llama", "Mistral", "Qwen"],
  },
  {
    label: "Inference & routing",
    reason: "Cloud, locale o on-premise: serviamo e instradiamo i modelli dove servono.",
    items: ["Ollama", "vLLM", "OpenRouter"],
  },
  {
    label: "Orchestrazione agenti",
    reason: "Diamo ai modelli strumenti, memoria e controllo del flusso.",
    items: ["LangGraph", "Mastra", "MCP", "Tool Calling"],
  },
  {
    label: "Voice & telefonia",
    reason: "Portiamo l'AI sul canale vocale e telefonico, in tempo reale.",
    items: ["LiveKit", "Retell", "Twilio"],
  },
  {
    label: "Dati & retrieval",
    reason: "Knowledge base, RAG e memoria su basi dati solide.",
    items: ["Supabase", "PostgreSQL", "pgvector"],
  },
  {
    label: "Runtime & infrastruttura",
    reason: "Software di produzione: tipizzato, containerizzato, osservabile.",
    items: ["Next.js", "TypeScript", "Python", "FastAPI", "Docker", "Cloudflare"],
  },
];

const dailyCapabilities = [
  "Agenti AI",
  "Voice AI",
  "Knowledge Base",
  "RAG",
  "Document AI",
  "OCR",
  "Workflow approval",
  "Email automation",
  "CRM AI",
  "WhatsApp AI",
  "Computer Vision",
  "AI locale",
  "AI cloud",
  "Inference server",
  "Prompt management",
  "Guardrails",
  "Observability",
  "Human in the loop",
  "Versioning",
  "Logging",
  "Audit trail",
];

const deliveryProcess = [
  ["01", "Assessment", "Mappiamo sistemi, dati, processi e rischi reali.", "Report tecnico + roadmap prioritizzata"],
  ["02", "Architettura", "Disegniamo modelli, retrieval, tool, accessi e logging.", "Schema architetturale + scelte tecniche"],
  ["03", "Proof of Concept", "Prototipo misurabile su un caso d'uso concreto.", "PoC funzionante + dataset di valutazione"],
  ["04", "Implementazione", "Sviluppiamo sistema, integrazioni e guardrail in produzione.", "Codice, integrazioni, test"],
  ["05", "Deployment", "Rilascio controllato: cloud, on-premise o ibrido.", "Ambiente live + osservabilità"],
  ["06", "Governance", "Policy, ruoli, audit trail e supervisione umana.", "Framework di governance applicato"],
  ["07", "Supporto continuo", "Monitoraggio, aggiornamenti e ottimizzazione.", "SLA, review periodiche, evoluzione"],
] as const;

const adoptionFormats = [
  "Workshop",
  "Affiancamento",
  "Office hours",
  "Prompt review",
  "Workflow review",
  "Shadowing",
  "Sessioni pratiche",
  "Laboratori",
  "Casi reali",
  "Revisione processi",
];

const adoptionRoles = ["Manager", "HR", "Marketing", "IT", "Sviluppatori", "Customer Care", "Direzione"];

const trustCompare = [
  {
    label: "Società di consulenza",
    tag: "analizza e documenta",
    items: ["Analizza", "Scrive policy", "Forma il personale"],
  },
  {
    label: "Pynk Studio",
    tag: "progetta e costruisce",
    items: ["Analizza", "Progetta", "Sviluppa", "Integra", "Distribuisce", "Monitora", "Mantiene", "Forma", "Governa"],
  },
] as const;

const problems = [
  { title: "Shadow AI", body: "Tool introdotti senza inventario, owner o approvazione." },
  { title: "Dati esposti", body: "Documenti e segreti copiati in cloud senza regole tecniche." },
  { title: "Output non verificati", body: "Risposte usate nei processi senza review o log." },
  { title: "Versioni opache", body: "Modelli, prompt e knowledge base cambiano senza traccia." },
  { title: "Fornitori deboli", body: "Vendor scelti senza valutare API, lock-in e audit." },
];

const operatingLayers = [
  { label: "Business", detail: "caso d'uso · owner · impatto" },
  { label: "Data", detail: "fonti · permessi · qualità" },
  { label: "Model", detail: "LLM · RAG · agenti · eval" },
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
    q: "Siete consulenti o sviluppatori?",
    a: "Siamo un team di AI engineer e solution architect. Progettiamo e scriviamo il codice dei sistemi AI: chatbot, agenti, voice AI, RAG, integrazioni. La governance nasce da questa pratica quotidiana, non dal contrario.",
  },
  {
    q: "AI Governance significa solo AI Act?",
    a: "No. L'AI Act è una conseguenza. La governance è architettura, dati, ruoli, workflow, accessi, logging, versioning e manutenzione dei sistemi che mettiamo in produzione.",
  },
  {
    q: "Implementate davvero i sistemi o solo la documentazione?",
    a: "Li implementiamo. Sviluppiamo direttamente chatbot, agenti AI, voice AI, RAG, AI locale e cloud, workflow, automazioni, API e integrazioni con CRM, ERP e sistemi legacy.",
  },
];

export function PynkAiGovernancePage() {
  const href = useTenantLocalizedHref();
  const jsonLd = [
    organizationSchema(),
    serviceSchema(
      "AI Engineering e AI Governance per aziende",
      "Progettazione, sviluppo, integrazione e governo di sistemi di Intelligenza Artificiale conformi alle normative europee e utili al business.",
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
              <p className="pynk-eyebrow pynk-eyebrow-chip">AI Engineering · Architettura · Governance</p>
              <h1 className="pynk-hero-title pynk-ai-hero-title">
                AI Governance <span className="pynk-accent">per aziende</span>
              </h1>
              <p className="pynk-hero-subtitle pynk-ai-hero-copy">
                Progettiamo architetture AI, sviluppiamo il software, integriamo i modelli e portiamo agenti e workflow in
                produzione. La governance non è un servizio a parte: è il modo in cui teniamo sotto controllo i sistemi che
                costruiamo.
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
              <div className="pynk-ai-stack">
                <div className="pynk-ai-stack-control">
                  <div className="pynk-ai-stack-control-head">
                    <span className="pynk-ai-stack-control-name">Control</span>
                    <small>policy · log · audit · review</small>
                    <span className="pynk-ai-stack-chip">AI governata</span>
                  </div>
                  <div className="pynk-ai-stack-layers">
                    {operatingLayers.map((layer) => (
                      <div key={layer.label} className="pynk-ai-stack-layer">
                        <b>{layer.label}</b>
                        <small>{layer.detail}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pynk-ai-system-stream">
                <span><i>model</i> openai · claude · llama</span>
                <span><i>risk</i> ruolo + caso d&apos;uso</span>
                <span><i>trace</i> attiva</span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-ai-split">
            <div>
              <p className="pynk-eyebrow">Chi siamo</p>
              <h2 className="pynk-section-title pynk-section-title-left">La governance nasce dall&apos;ingegneria.</h2>
              <p className="pynk-panel-desc">
                Molte aziende offrono consulenza sull&apos;AI. Poche progettano davvero sistemi AI. Pynk Studio nasce come
                software house: ogni giorno costruiamo i sistemi che altri si limitano a descrivere. Per questo sappiamo anche
                governarli.
              </p>
              <p className="pynk-panel-desc">
                Non siamo i consulenti che spiegano l&apos;AI. Siamo gli ingegneri che i consulenti chiamano quando bisogna
                davvero costruire qualcosa.
              </p>
            </div>
            <div className="pynk-panel">
              <h3 className="pynk-panel-title">Ogni giorno progettiamo e sviluppiamo</h3>
              <div className="pynk-pills pynk-pills-left pynk-mt-24">
                {dailyBuilds.map((item) => (
                  <span key={item} className="pynk-pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container">
            <div className="pynk-section-head">
              <p className="pynk-eyebrow">Implementazione tecnica</p>
              <h2 className="pynk-section-title">Costruiamo direttamente i sistemi AI.</h2>
              <p className="pynk-section-lead">
                Non ci fermiamo allo strato del modello. Colleghiamo prompt, guardrail, tool, agenti e sistemi aziendali in
                un&apos;unica architettura tracciata.
              </p>
            </div>
            <div className="pynk-ai-pipeline">
              {buildPipeline.map((node, index) => (
                <span key={node} className="pynk-ai-pipeline-step">
                  <span className="pynk-ai-pipeline-node">{node}</span>
                  {index < buildPipeline.length - 1 && <ChevronRight className="pynk-icon-xs pynk-ai-pipeline-arrow" aria-hidden />}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-ai-split">
            <div>
              <p className="pynk-eyebrow">Architettura di un sistema</p>
              <h2 className="pynk-section-title pynk-section-title-left">Dietro ogni risposta c&apos;è una vera architettura.</h2>
              <p className="pynk-panel-desc">
                Un sistema AI affidabile non è un prompt. È un flusso progettato: input controllato, retrieval, logica di
                business, output verificato, monitoraggio e governance. Lo disegniamo e lo costruiamo end-to-end.
              </p>
              <Link href={href("/ai-governance/ai-architecture")} className="pynk-link-cta pynk-mt-24">
                Vai ad AI Architecture <ArrowRight className="pynk-icon-xs" />
              </Link>
            </div>
            <div className="pynk-ai-arch" aria-label="Flusso architetturale di un sistema AI">
              {architectureFlow.map(([label, detail]) => (
                <div key={label} className="pynk-ai-arch-node">
                  <b>{label}</b>
                  <small>{detail}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container">
            <div className="pynk-section-head">
              <p className="pynk-eyebrow">Stack tecnologico</p>
              <h2 className="pynk-section-title">Tecnologie con cui lavoriamo.</h2>
              <p className="pynk-section-lead">
                Non una lista di loghi. Ogni tecnologia ha un motivo: la usiamo perché risolve un problema preciso nei sistemi
                che mettiamo in produzione.
              </p>
            </div>
            <div className="pynk-ai-tech-grid">
              {techGroups.map((group) => (
                <article key={group.label} className="pynk-panel pynk-ai-tech-card">
                  <h3>{group.label}</h3>
                  <p>{group.reason}</p>
                  <div className="pynk-ai-tech-tags">
                    {group.items.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container">
            <div className="pynk-section-head">
              <p className="pynk-eyebrow">Prove di competenza</p>
              <h2 className="pynk-section-title">Cosa realizziamo ogni giorno.</h2>
              <p className="pynk-section-lead">
                Capacità che costruiamo e manteniamo in produzione per i nostri clienti, non slide di un catalogo.
              </p>
            </div>
            <div className="pynk-pills">
              {dailyCapabilities.map((item) => (
                <span key={item} className="pynk-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container-wide pynk-ai-risk-layout">
            <div className="pynk-ai-risk-copy">
              <p className="pynk-eyebrow">Rischi tecnici</p>
              <h2 className="pynk-section-title pynk-section-title-left">Il rischio legale nasce quasi sempre da un difetto di architettura.</h2>
            </div>
            <div className="pynk-ai-risk-grid">
              {problems.map((problem) => (
                <article key={problem.title} className="pynk-panel pynk-panel-sm pynk-ai-risk-card">
                  <AlertTriangle className="pynk-icon-sm pynk-ai-risk-icon" />
                  <h3>{problem.title}</h3>
                  <p>{problem.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container">
            <div className="pynk-section-head">
              <p className="pynk-eyebrow">Come lavoriamo</p>
              <h2 className="pynk-section-title">Dal primo assessment alla manutenzione.</h2>
              <p className="pynk-section-lead">Un processo da software house: ogni fase ha un deliverable concreto.</p>
            </div>
            <div className="pynk-steps pynk-ai-process">
              {deliveryProcess.map(([number, title, detail, deliverable]) => (
                <article key={number} className="pynk-step">
                  <span className="pynk-step-number">{number}</span>
                  <div>
                    <h3 className="pynk-step-title pynk-step-title-lg">{title}</h3>
                    <p className="pynk-step-desc">{detail}</p>
                    <span className="pynk-ai-process-deliver">{deliverable}</span>
                  </div>
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
                Otto servizi, un&apos;unica logica: ogni intervento è svolto da chi progetta e scrive il codice dei sistemi AI,
                non solo da chi li descrive.
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
                    <p className="pynk-ai-service-desc">{service.summary}</p>
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

        <section className="pynk-section pynk-section-alt pynk-ai-contrast-section">
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

        <section className="pynk-section">
          <div className="pynk-container pynk-ai-split">
            <div>
              <p className="pynk-eyebrow">AI Adoption Program</p>
              <h2 className="pynk-section-title pynk-section-title-left">Insegniamo a usare davvero l&apos;AI.</h2>
              <p className="pynk-panel-desc">
                Non un corso per rispettare una normativa. Un percorso operativo per portare l&apos;AI nel lavoro quotidiano:
                workshop, affiancamento, revisione di prompt e workflow reali, con profondità diversa per ogni ruolo.
              </p>
              <div className="pynk-ai-role-grid pynk-mt-24">
                {adoptionRoles.map((role) => (
                  <span key={role}>{role}</span>
                ))}
              </div>
            </div>
            <div className="pynk-panel">
              <h3 className="pynk-panel-title">Cosa comprende</h3>
              <div className="pynk-pills pynk-pills-left pynk-mt-24">
                {adoptionFormats.map((format) => (
                  <span key={format} className="pynk-pill">
                    {format}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-ai-split">
            <div>
              <p className="pynk-eyebrow">AI Act</p>
              <h2 className="pynk-section-title pynk-section-title-left">La conformità è una conseguenza, non il punto di partenza.</h2>
              <p className="pynk-panel-desc">
                Le aziende che progettano bene l&apos;AI sono anche quelle che arrivano più facilmente alla conformità. Ruoli,
                rischio e documentazione si gestiscono meglio quando architettura, dati e logging sono già fatti bene.
              </p>
              <Link href={href("/ai-act")} className="pynk-link-cta pynk-mt-24">
                Leggi la sezione AI Act <ArrowRight className="pynk-icon-xs" />
              </Link>
            </div>
            <div className="pynk-panel">
              <h3 className="pynk-panel-title">Valutazione preliminare degli obblighi AI Act</h3>
              <p className="pynk-panel-desc">
                Verifichiamo ruolo, rischio, documentazione necessaria e l&apos;eventuale necessità di una Fundamental Rights
                Impact Assessment, partendo dai sistemi reali.
              </p>
              <Link href={href("/ai-governance/valutazione-obblighi-ai-act")} className="pynk-btn pynk-btn-outline pynk-mt-24">
                Valuta gli obblighi
              </Link>
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container-wide">
            <div className="pynk-ai-contrast-head">
              <p className="pynk-eyebrow">Perché Pynk Studio</p>
              <h2>Chi analizza è una cosa. Chi costruisce è un&apos;altra.</h2>
            </div>
            <div className="pynk-ai-before-after">
              {trustCompare.map((column, columnIndex) => (
                <div key={column.label} className={`pynk-ai-ba-panel ${columnIndex === 1 ? "is-controlled" : ""}`}>
                  <span>{column.tag}</span>
                  <h3>{column.label}</h3>
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

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-ai-split">
            <div>
              <h2 className="pynk-section-title pynk-section-title-left">Risorse per partire</h2>
              <p className="pynk-section-lead pynk-section-lead-left">
                Risorse tecniche per trasformare l&apos;interesse sull&apos;AI in un percorso misurabile: checklist, guide,
                template e assessment.
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
            <h2 className="pynk-section-title">Serve costruire, non solo capire l&apos;AI?</h2>
            <p className="pynk-section-lead">
              Progettiamo, sviluppiamo, integriamo e manteniamo i tuoi sistemi AI. E li governiamo, perché li abbiamo costruiti noi.
            </p>
            <div className="pynk-hero-ctas">
              <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-btn-island">
                <span>Prenota una consulenza tecnica</span>
                <span className="pynk-btn-orb">
                  <ArrowRight className="pynk-icon-sm" />
                </span>
              </Link>
              <Link href={href("/blog/ai-governance")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
                Leggi il blog tecnico
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PynkShell>
  );
}
