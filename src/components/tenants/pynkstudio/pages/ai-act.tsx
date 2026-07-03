"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { aiActFaq } from "../ai-governance-data";
import { PynkJsonLd } from "../pynk-json-ld";
import { PynkLegalPartnerNote } from "../pynk-legal-partner";
import { breadcrumbSchema, faqSchema, organizationSchema, serviceSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const topics = [
  "cos'è l'AI Act",
  "quando si applica",
  "provider, deployer, importatori e distributori",
  "sistemi vietati",
  "sistemi ad alto rischio",
  "AI Literacy",
  "governance e documentazione",
];

const roles = [
  ["Provider", "Sviluppa o mette sul mercato un sistema AI con il proprio nome o marchio."],
  ["Deployer", "Usa un sistema AI sotto la propria autorità, salvo uso personale non professionale."],
  ["Importatore", "Immette sul mercato UE un sistema AI proveniente da un paese terzo."],
  ["Distributore", "Rende disponibile un sistema AI nella catena di fornitura senza essere provider o importatore."],
];

export function PynkAiActPage() {
  const href = useTenantLocalizedHref();
  const jsonLd = [
    organizationSchema(),
    serviceSchema(
      "Valutazione preliminare degli obblighi AI Act",
      "Analisi di ruolo, rischio, obblighi AI Act, governance, documentazione e possibile necessità di FRIA.",
      "/ai-act",
      "AI Act governance",
    ),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "AI Act", path: "/ai-act" },
    ]),
    faqSchema(aiActFaq),
  ];

  return (
    <PynkShell>
      <PynkJsonLd data={jsonLd} />
      <main className="pynk-page">
        <section className="pynk-hero pynk-hero-sub">
          <div className="pynk-glow pynk-glow-tr" aria-hidden />
          <div className="pynk-container pynk-hero-content">
            <p className="pynk-eyebrow">AI Act dentro la governance AI</p>
            <h1 className="pynk-hero-title">AI Act: obblighi, ruoli e rischio</h1>
            <p className="pynk-hero-subtitle">
              L&apos;AI Act non impone gli stessi obblighi a tutte le aziende. Il perimetro dipende dal ruolo ricoperto nella catena AI e dal livello di rischio del sistema.
            </p>
            <Link href={href("/ai-governance/valutazione-obblighi-ai-act")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-mt-24">
              Valutazione preliminare degli obblighi AI Act
            </Link>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container pynk-ai-split">
            <div>
              <h2 className="pynk-section-title pynk-section-title-left">Cos&apos;è e quando si applica</h2>
              <p className="pynk-section-lead pynk-section-lead-left">
                Il regolamento europeo sull&apos;AI disciplina sistemi di Intelligenza Artificiale in base a ruolo, rischio e contesto d&apos;uso. Non basta chiedersi se un&apos;azienda usa ChatGPT: bisogna capire cosa fa il sistema, su quali dati opera, chi lo fornisce e quali effetti produce.
              </p>
            </div>
            <div className="pynk-panel">
              <h3 className="pynk-panel-title">Da valutare</h3>
              <ul className="pynk-check-list pynk-mt-24">
                {topics.map((topic) => (
                  <li key={topic}>
                    <CheckCircle2 className="pynk-icon-sm pynk-check" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container">
            <div className="pynk-section-head">
              <h2 className="pynk-section-title">Ruoli previsti dal regolamento</h2>
              <p className="pynk-section-lead">La stessa azienda può avere ruoli diversi su sistemi diversi.</p>
            </div>
            <div className="pynk-grid-2">
              {roles.map(([role, body]) => (
                <article key={role} className="pynk-panel">
                  <h3 className="pynk-panel-title">{role}</h3>
                  <p className="pynk-panel-desc">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pynk-section">
          <div className="pynk-container pynk-ai-split">
            <div className="pynk-panel">
              <h3 className="pynk-panel-title">Sistemi vietati e ad alto rischio</h3>
              <p className="pynk-panel-desc">
                Alcuni usi sono vietati, altri rientrano in categorie ad alto rischio. La classificazione richiede contesto: settore, finalità, dati, impatto sulle persone e grado di autonomia del sistema.
              </p>
            </div>
            <div className="pynk-panel">
              <h3 className="pynk-panel-title">AI Literacy, governance e documentazione</h3>
              <p className="pynk-panel-desc">
                L&apos;alfabetizzazione AI, la documentazione e i controlli di governance devono essere proporzionati al ruolo e al rischio. Formazione, policy e logging devono riflettere il sistema reale, non un template generico.
              </p>
            </div>
          </div>
        </section>

        <section className="pynk-section pynk-section-alt">
          <div className="pynk-container pynk-center-col">
            <h2 className="pynk-section-title">FRIA: prima si verifica se serve.</h2>
            <p className="pynk-section-lead">
              Non vendiamo direttamente una Fundamental Rights Impact Assessment come prodotto standard. Offriamo una valutazione preliminare degli obblighi AI Act che comprende anche la verifica dell&apos;eventuale necessità di predisporla.
            </p>
            <Link href={href("/ai-governance/valutazione-obblighi-ai-act")} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
              Valuta ruolo e rischio
              <ArrowRight className="pynk-icon-sm pynk-arrow" />
            </Link>
          </div>
        </section>

        <PynkLegalPartnerNote />

        <section className="pynk-section">
          <div className="pynk-container">
            <h2 className="pynk-section-title">FAQ AI Act</h2>
            <div className="pynk-ai-faq-list">
              {aiActFaq.map((item) => (
                <article key={item.q} className="pynk-panel pynk-panel-sm">
                  <h3 className="pynk-panel-title-sm">{item.q}</h3>
                  <p className="pynk-panel-desc">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PynkShell>
  );
}
