"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
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
          <span className="vo-dragon-mark">{pageEyebrows[page]}</span>
          <h1>{pageTitles[page]}</h1>
          {pageLeads[page] &&
            pageLeads[page].split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
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
            <a className="vo-text-link" href={linktreeHref} target="_blank" rel="noopener noreferrer">
              Segui l&apos;autrice <ArrowRight size={15} />
            </a>
          </div>
          <div className="vo-author-seal">
            <img src={authorPortraitSrc} alt="Valentina Orciuoli" />
          </div>
        </section>
      )}

      {page === "eventi" && (
        <section className="vo-section vo-events-section vo-subpage-section">
          <div className="vo-event-list" aria-label="Eventi in programma">
            <article>
              <span>In aggiornamento</span>
              <h3>Nuove date in arrivo</h3>
              <p>
                Presentazioni, firmacopie e incontri con i lettori verranno pubblicati qui appena confermati.
                Per inviti, festival e collaborazioni editoriali puoi contattare Valentina{" "}
                <Link href="/contatti">qui</Link>.
              </p>
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

      <footer id="contatti" className="vo-footer">
        <div>
          <strong>Valentina Orciuoli</strong>
          <p>Author site demo su piattaforma Bizery.</p>
        </div>
        <div className="vo-footer-links">
          <a href={instagramHref} target="_blank" rel="noopener noreferrer">
            <Instagram size={15} /> Instagram
          </a>
          <a href={linktreeHref} target="_blank" rel="noopener noreferrer">
            Linktree <ExternalLink size={14} />
          </a>
          <a href={amazonHref} target="_blank" rel="noopener noreferrer">
            Amazon <ExternalLink size={14} />
          </a>
        </div>
      </footer>
    </main>
  );
}

const pageTitles: Record<ValentinaPageKind, string> = {
  libri: "Valentina Orciuoli",
  autrice: "Scopri chi è",
  eventi: "Date speciali, incontri e presentazioni di",
  contatti: "Contatti",
};

const pageEyebrows: Record<ValentinaPageKind, string> = {
  libri: "Scopri i libri di",
  autrice: "Autrice",
  eventi: "Eventi",
  contatti: "Valentina Orciuoli",
};

const pageLeads: Record<ValentinaPageKind, string> = {
  libri: "La trilogia fantasy orientale dove ogni emozione ha il suo drago.",
  autrice:
    "Valentina Orciuoli è un’autrice italiana di fantasy romance e romantasy. Laureata in Relazioni Internazionali e studentessa di Comunicazione e Marketing, coltiva da sempre una grande passione per le storie fantastiche, i mondi popolati da draghi e magia, e le trame romance capaci di intrecciare emozioni intense e avventura.\n\nCon Anxiety, primo volume della saga The Emotion Dragons Trilogy, dà vita a un universo narrativo in cui sentimenti, potere e destino si incontrano. Fury, secondo capitolo della trilogia, amplia questo mondo raccontandone nuove sfumature e radici.\n\nAttraverso la sua scrittura, Valentina unisce immaginazione, introspezione e romanticismo, accompagnando i lettori in viaggi dove le emozioni diventano forza, conflitto e magia.",
  eventi: "",
  contatti: "Link ufficiali, social e canali per seguire Valentina.",
};
