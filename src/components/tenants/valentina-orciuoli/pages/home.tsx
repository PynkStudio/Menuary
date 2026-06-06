"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Instagram } from "lucide-react";

const amazonHref = "https://www.amazon.it/Anxiety-Valentina-Orciuoli-ebook/dp/B0F1KVZKFC";
const furyHref = "https://www.amazon.it/Fury-Emotion-Dragons-Trilogy-Vol-ebook/dp/B0GKWCS774";
const linktreeHref = "https://linktr.ee/valentina.orciuoli";
const instagramHref = "https://www.instagram.com/di.vale_in.peggio/";
const anxietyCoverSrc = "https://www.selfcreation.it/wp-content/uploads/2025/02/Anxiety-Valentina-Orciuoli.png";
const furyCoverSrc = "https://www.sakuraribooks.it/wp-content/uploads/2026/02/71z2LZ6a8XL._SL1406_.jpg";
const authorPortraitSrc = "https://www.selfcreation.it/wp-content/uploads/2024/11/Valentina-Orciuoli.jpg";

const trilogy = [
  {
    n: "I",
    title: "Anxiety",
    desc: "Il primo drago nasce dove la paura sembra piu forte della voce.",
    state: "Disponibile su Kindle",
    href: amazonHref,
    coverSrc: anxietyCoverSrc,
    coverAlt: "Copertina di Anxiety di Valentina Orciuoli",
  },
  {
    n: "II",
    title: "Fury",
    desc: "Un secolo prima del Dragone Nero dell'ansia, il Primo Long incarna la rabbia.",
    state: "Disponibile su Kindle",
    href: furyHref,
    coverSrc: furyCoverSrc,
    coverAlt: "Copertina di Fury di Valentina Orciuoli",
  },
  {
    n: "III",
    title: "Volume III",
    desc: "La chiusura della saga portera ogni emozione davanti alla sua forma piu antica.",
    state: "Cover reveal in arrivo",
    href: null,
    coverSrc: null,
    coverAlt: "",
  },
];

export function ValentinaOrciuoliHomePage() {
  return (
    <main className="vo-site">
      <section id="top" className="vo-hero">
        <div className="vo-hero-art" aria-hidden="true" />
        <div className="vo-hero-shade" aria-hidden="true" />
        <header className="vo-header">
          <a className="vo-brand" href="#top" aria-label="Valentina Orciuoli">
            <span className="vo-brand-mark">VO</span>
          </a>
          <nav className="vo-nav" aria-label="Menu principale">
            <a href="#top">Home</a>
            <a href="#libri">Libri</a>
            <a href="#autrice">Autrice</a>
            <a href="#contatti">Contatti</a>
          </nav>
        </header>

        <div className="vo-hero-inner">
          <motion.div
            className="vo-hero-copy"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1>Valentina Orciuoli</h1>
            <div className="vo-title-rule" aria-hidden="true" />
            <p>Fantasy orientale, emozioni antiche e draghi che respirano luce.</p>
            <div className="vo-hero-actions">
              <a className="vo-btn vo-btn-primary" href={amazonHref} target="_blank" rel="noopener noreferrer">
                Scopri Anxiety <ArrowRight size={16} />
              </a>
              <a className="vo-btn vo-btn-secondary" href={linktreeHref} target="_blank" rel="noopener noreferrer">
                Segui l&apos;autrice <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="libri" className="vo-book-showcase">
        <div className="vo-ink-bg" aria-hidden="true" />
        <motion.a
          className="vo-book-feature"
          href={amazonHref}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 30, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
          aria-label="Apri Anxiety su Amazon"
        >
          <div className="vo-book-cover">
            <img
              src={anxietyCoverSrc}
              alt="Anxiety di Valentina Orciuoli"
            />
          </div>
        </motion.a>
        <div className="vo-book-copy">
          <span className="vo-dragon-mark">龍</span>
          <h2>Anxiety</h2>
          <small>The Emotion Dragons Trilogy · Volume I</small>
          <p>
            Il primo libro della trilogia porta Neirè dentro le mura del palazzo imperiale
            di Errethera e trasforma l&apos;ansia in potere, drago e percorso di liberazione.
            Romantic fantasy dai tratti orientali, pubblicato il 17 marzo 2025.
          </p>
          <a href={amazonHref} target="_blank" rel="noopener noreferrer">
            Scopri di più <ArrowRight size={15} />
          </a>
        </div>
      </section>

      <section id="trilogia" className="vo-section vo-trilogy-section">
        <div className="vo-trilogy-bg" aria-hidden="true" />
        <div className="vo-trilogy-intro">
          <span className="vo-dragon-mark">The Emotion Dragons Trilogy</span>
          <h2>I libri</h2>
          <p>Storie che uniscono l&apos;oriente e il cuore.</p>
        </div>
        <div className="vo-trilogy-grid">
          {trilogy.map((book) => (
            <article className="vo-trilogy-card" key={book.n}>
              <div className="vo-trilogy-cover" data-empty={!book.coverSrc || undefined}>
                {book.coverSrc ? (
                  <img src={book.coverSrc} alt={book.coverAlt} loading="lazy" />
                ) : (
                  <span>{book.n}</span>
                )}
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

      <section id="autrice" className="vo-section vo-author-section">
        <div className="vo-author-copy">
          <span className="vo-dragon-mark">Chi è</span>
          <h2>Valentina</h2>
          <p>
            Valentina Orciuoli studia comunicazione e marketing dopo una laurea in
            relazioni internazionali. Scrive fantasy, storie di draghi, magia e romance:
            mondi in cui le emozioni non restano astratte, ma prendono corpo, squame e destino.
          </p>
        </div>
        <div className="vo-author-seal">
          <img src={authorPortraitSrc} alt="Valentina Orciuoli" />
          <p>Ink, moonlight, dragons.</p>
        </div>
      </section>

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
