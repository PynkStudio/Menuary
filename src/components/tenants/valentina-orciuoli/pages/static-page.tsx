"use client";

/* eslint-disable @next/next/no-img-element */
import { ArrowRight, ExternalLink, Instagram } from "lucide-react";
import { ValentinaOrciuoliHeader } from "@/components/tenants/valentina-orciuoli/vo-header";
import {
  amazonHref,
  authorPortraitSrc,
  furyHref,
  instagramHref,
  linktreeHref,
  trilogy,
} from "@/components/tenants/valentina-orciuoli/content";

type ValentinaPageKind = "libri" | "autrice" | "eventi" | "contatti";

export function ValentinaOrciuoliStaticPage({ page }: { page: ValentinaPageKind }) {
  return (
    <main className="vo-site">
      <section className="vo-subpage-hero">
        <div className="vo-subpage-bg" aria-hidden="true" />
        <ValentinaOrciuoliHeader />
        <div className="vo-subpage-intro">
          <span className="vo-dragon-mark">Valentina Orciuoli</span>
          <h1>{pageTitles[page]}</h1>
          <p>{pageLeads[page]}</p>
        </div>
      </section>

      {page === "libri" && (
        <section className="vo-section vo-trilogy-section vo-subpage-section">
          <div className="vo-trilogy-bg" aria-hidden="true" />
          <div className="vo-trilogy-intro">
            <span className="vo-dragon-mark">The Emotion Dragons Trilogy</span>
            <h2>I libri</h2>
            <p>Fantasy orientale, draghi ed emozioni.</p>
          </div>
          <div className="vo-trilogy-grid">
            {trilogy.map((book) => (
              <article className="vo-trilogy-card" key={book.n}>
                <div className="vo-trilogy-cover" data-empty={!book.coverSrc || undefined}>
                  {book.coverSrc ? <img src={book.coverSrc} alt={book.coverAlt} loading="lazy" /> : <span>{book.n}</span>}
                </div>
                <span className="vo-trilogy-volume">Volume {book.n}</span>
                <h3>{book.title}</h3>
                <p>{book.desc}</p>
                {book.href ? (
                  <a href={book.href} target="_blank" rel="noopener noreferrer">
                    {book.state} <ArrowRight size={13} />
                  </a>
                ) : (
                  <small>{book.state}</small>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {page === "autrice" && (
        <section className="vo-section vo-author-section vo-subpage-section">
          <div className="vo-author-copy">
            <span className="vo-dragon-mark">Chi è</span>
            <h2>Valentina</h2>
            <p>
              Valentina Orciuoli studia comunicazione e marketing dopo una laurea in relazioni internazionali.
              Scrive fantasy, storie di draghi, magia e romance: mondi in cui le emozioni non restano astratte,
              ma prendono corpo, squame e destino.
            </p>
            <a className="vo-text-link" href={linktreeHref} target="_blank" rel="noopener noreferrer">
              Segui l&apos;autrice <ArrowRight size={15} />
            </a>
          </div>
          <div className="vo-author-seal">
            <img src={authorPortraitSrc} alt="Valentina Orciuoli" />
            <p>Ink, moonlight, dragons.</p>
          </div>
        </section>
      )}

      {page === "eventi" && (
        <section className="vo-section vo-events-section vo-subpage-section">
          <div className="vo-event-panel">
            <span className="vo-dragon-mark">Calendario</span>
            <h2>Eventi</h2>
            <p>
              Presentazioni, firmacopie e incontri con i lettori verranno pubblicati qui appena confermati.
              Per inviti, festival e collaborazioni editoriali puoi contattare Valentina dai suoi canali ufficiali.
            </p>
            <a className="vo-text-link" href={linktreeHref} target="_blank" rel="noopener noreferrer">
              Apri Linktree <ExternalLink size={14} />
            </a>
          </div>
          <div className="vo-event-list" aria-label="Eventi in programma">
            <article>
              <span>In aggiornamento</span>
              <h3>Nuove date in arrivo</h3>
              <p>Il calendario pubblico sara aggiornato con luogo, orario e modalita di partecipazione.</p>
            </article>
          </div>
        </section>
      )}

      {page === "contatti" && (
        <section className="vo-section vo-contact-section vo-subpage-section">
          <div>
            <span className="vo-dragon-mark">Contatti</span>
            <h2>Canali ufficiali</h2>
            <p>Per seguire aggiornamenti sui libri, eventi e nuove uscite, trovi tutti i link ufficiali qui.</p>
          </div>
          <div className="vo-contact-links">
            <a href={instagramHref} target="_blank" rel="noopener noreferrer">
              <Instagram size={17} /> Instagram
            </a>
            <a href={linktreeHref} target="_blank" rel="noopener noreferrer">
              Linktree <ExternalLink size={16} />
            </a>
            <a href={amazonHref} target="_blank" rel="noopener noreferrer">
              Anxiety su Amazon <ExternalLink size={16} />
            </a>
            <a href={furyHref} target="_blank" rel="noopener noreferrer">
              Fury su Amazon <ExternalLink size={16} />
            </a>
          </div>
        </section>
      )}
    </main>
  );
}

const pageTitles: Record<ValentinaPageKind, string> = {
  libri: "Libri",
  autrice: "Autrice",
  eventi: "Eventi",
  contatti: "Contatti",
};

const pageLeads: Record<ValentinaPageKind, string> = {
  libri: "La trilogia fantasy orientale dove ogni emozione ha il suo drago.",
  autrice: "Una voce fantasy tra romance, magia e immaginario orientale.",
  eventi: "Date, incontri e presentazioni dell'autrice.",
  contatti: "Link ufficiali, social e canali per seguire Valentina.",
};
