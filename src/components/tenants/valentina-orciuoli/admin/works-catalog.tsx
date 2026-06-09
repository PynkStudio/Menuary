"use client";

import { ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, Eye, Library, Newspaper, Radio } from "lucide-react";
import {
  amazonHref,
  furyHref,
  linktreeHref,
  trilogy,
  trilogyHref,
  valentinaBasePath,
} from "@/components/tenants/valentina-orciuoli/content";

const works = [
  {
    title: "Anxiety",
    meta: "The Emotion Dragons Trilogy - Volume I",
    status: "Pubblicato",
    href: amazonHref,
    desc: "Fantasy orientale e romantasy: l'ansia prende forma di drago e diventa potere narrativo.",
  },
  {
    title: "Fury",
    meta: "The Emotion Dragons Trilogy - Volume II",
    status: "Pubblicato",
    href: furyHref,
    desc: "Il secondo capitolo esplora rabbia, perdita e potere un secolo prima degli eventi di Anxiety.",
  },
  {
    title: "Tra fumo e ombre",
    meta: "Novel dark-noir",
    status: "Preordine",
    href: `${valentinaBasePath}/libri#tra-fumo-e-ombre`,
    desc: "Thriller psicologico in una Milano cupa, dove memoria, fumo e ombre guidano il mistero.",
  },
  {
    title: "Volume III",
    meta: "The Emotion Dragons Trilogy - Volume III",
    status: "In lavorazione",
    href: trilogyHref,
    desc: "La chiusura della trilogia portera ogni emozione davanti alla sua forma piu antica.",
  },
];

const pressItems = [
  { label: "Pagina libri", href: `${valentinaBasePath}/libri`, icon: BookOpen },
  { label: "Author store", href: trilogyHref, icon: Library },
  { label: "Link ufficiali", href: linktreeHref, icon: Radio },
];

export function ValentinaWorksCatalogAdmin() {
  const visibleWorks = works.filter((work) => work.status !== "In lavorazione").length;

  return (
    <div className="vo-admin-works ga-dashboard">
      <header className="vo-admin-works-hero">
        <div>
          <span className="ga-eyebrow">Catalogo opere</span>
          <h1 className="ga-heading">Libri e materiali editoriali</h1>
          <p className="ga-lead">
            Gestisci la presenza pubblica delle opere di Valentina Orciuoli: schede libro,
            link provider, press kit e percorsi verso lettori, eventi e community.
          </p>
        </div>
        <div className="vo-admin-works-actions">
          <a className="ga-btn ga-btn-ghost" href={`${valentinaBasePath}/libri`} target="_blank" rel="noopener noreferrer">
            <Eye size={15} /> Anteprima
          </a>
          <button className="ga-btn ga-btn-primary" type="button" disabled>
            <CheckCircle2 size={15} /> Pubblicato
          </button>
        </div>
      </header>

      <section className="vo-admin-works-stats" aria-label="Stato catalogo">
        <article className="ga-kpi">
          <span className="ga-kpi-label">Opere totali</span>
          <span className="ga-kpi-value">{works.length}</span>
        </article>
        <article className="ga-kpi">
          <span className="ga-kpi-label">Visibili online</span>
          <span className="ga-kpi-value">{visibleWorks}</span>
        </article>
        <article className="ga-kpi">
          <span className="ga-kpi-label">Saga principale</span>
          <span className="ga-kpi-value">{trilogy.length}</span>
        </article>
      </section>

      <section className="ga-section">
        <div className="ga-section-head">
          <h2 className="ga-section-title">Opere</h2>
          <span className="ga-section-hint">Schede pubbliche e provider</span>
        </div>
        <div className="vo-admin-work-list">
          {works.map((work) => (
            <article className="vo-admin-work-card" key={work.title}>
              <div>
                <span className="ga-module-status" data-status={work.status === "In lavorazione" ? "warn" : "ok"}>
                  {work.status}
                </span>
                <h3>{work.title}</h3>
                <p className="vo-admin-work-meta">{work.meta}</p>
                <p>{work.desc}</p>
              </div>
              <a href={work.href} target="_blank" rel="noopener noreferrer" aria-label={`Apri ${work.title}`}>
                <ArrowUpRight size={18} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="vo-admin-works-grid">
        <article className="ga-card">
          <div className="ga-section-head">
            <h2 className="ga-section-title">Press kit</h2>
            <Newspaper size={18} />
          </div>
          <p className="ga-lead">
            Bio, copertine, link autore e materiali per collaborazioni editoriali restano separati
            dal menu food e seguono il verticale creative.
          </p>
          <div className="vo-admin-press-links">
            {pressItems.map((item) => {
              const Icon = item.icon;
              return (
                <a href={item.href} target="_blank" rel="noopener noreferrer" key={item.label}>
                  <Icon size={15} />
                  {item.label}
                  <ArrowUpRight size={14} />
                </a>
              );
            })}
          </div>
        </article>

        <article className="ga-card">
          <div className="ga-section-head">
            <h2 className="ga-section-title">Booking eventi</h2>
            <CalendarDays size={18} />
          </div>
          <p className="ga-lead">
            Presentazioni, firmacopie e festival vengono gestiti dal modulo booking eventi,
            non dalle prenotazioni ristorante.
          </p>
          <a className="ga-btn ga-btn-ghost" href="prenotazioni">
            Apri booking eventi <ArrowUpRight size={14} />
          </a>
        </article>
      </section>
    </div>
  );
}
