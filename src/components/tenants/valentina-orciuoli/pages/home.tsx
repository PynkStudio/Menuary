"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BookOpen, ExternalLink, Instagram, Moon, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";

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

function ImperialDragon() {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -8]);

  return (
    <motion.div
      className="vo-dragon-field"
      style={{ y, rotate }}
      aria-hidden="true"
      animate={shouldReduceMotion ? undefined : { x: [0, 18, -10, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="vo-dragon-spine">
        {Array.from({ length: 18 }).map((_, index) => {
          const scale = 1 + Math.sin(index / 2) * 0.08;
          return (
            <span
              key={index}
              style={
                {
                  "--left": `${index * 4.8}%`,
                  "--offset": `${(index - 8) * 0.18}rem`,
                  "--rot": `${-20 + index * 3}deg`,
                  "--scale": scale.toFixed(3),
                } as CSSProperties
              }
            />
          );
        })}
      </div>
      <div className="vo-dragon-head">
        <span className="vo-dragon-eye" />
        <span className="vo-dragon-horn vo-dragon-horn-a" />
        <span className="vo-dragon-horn vo-dragon-horn-b" />
      </div>
    </motion.div>
  );
}

export function ValentinaOrciuoliHomePage() {
  return (
    <main className="vo-site">
      <div className="vo-atmosphere" aria-hidden="true">
        <div className="vo-moon" />
        <div className="vo-cloud vo-cloud-a" />
        <div className="vo-cloud vo-cloud-b" />
        <div className="vo-particles" />
        <ImperialDragon />
      </div>

      <header className="vo-header">
        <a className="vo-brand" href="#top" aria-label="Valentina Orciuoli">
          <span className="vo-brand-mark">VO</span>
          <span>Valentina Orciuoli</span>
        </a>
        <nav className="vo-nav" aria-label="Menu principale">
          <a href="#libri">Libri</a>
          <a href="#trilogia">Trilogia</a>
          <a href="#autrice">Autrice</a>
          <a href="#contatti">Contatti</a>
        </nav>
      </header>

      <section id="top" className="vo-hero">
        <motion.div
          className="vo-hero-copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1>Valentina Orciuoli</h1>
          <p>
            Fantasy orientale, emozioni antiche e draghi che respirano luce. Una saga in cui
            il mondo interiore diventa mitologia.
          </p>
          <div className="vo-hero-actions">
            <a className="vo-btn vo-btn-primary" href={amazonHref} target="_blank" rel="noopener noreferrer">
              Scopri Anxiety <ArrowRight size={16} />
            </a>
            <a className="vo-btn vo-btn-secondary" href={linktreeHref} target="_blank" rel="noopener noreferrer">
              Segui l'autrice <ExternalLink size={15} />
            </a>
          </div>
        </motion.div>

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
          <div className="vo-book-meta">
            <BookOpen size={16} />
            <span>The Emotion Dragons Trilogy · Volume I</span>
          </div>
        </motion.a>
      </section>

      <section id="libri" className="vo-section vo-book-section">
        <div className="vo-section-copy">
          <Moon size={22} />
          <h2>Anxiety</h2>
          <p>
            Il primo libro della trilogia porta Neirè dentro le mura del palazzo imperiale
            di Errethera e trasforma l'ansia in potere, drago e percorso di liberazione.
            Romantic fantasy dai tratti orientali, pubblicato il 17 marzo 2025.
          </p>
        </div>
        <div className="vo-book-panel">
          <span>Primo volume</span>
          <strong>The Emotion Dragons Trilogy</strong>
          <p>Disponibile in formato Kindle su Amazon Italia.</p>
          <a href={amazonHref} target="_blank" rel="noopener noreferrer">
            Acquista su Amazon <ArrowRight size={14} />
          </a>
        </div>
      </section>

      <section id="trilogia" className="vo-section vo-trilogy-section">
        <div className="vo-section-title">
          <Sparkles size={22} />
          <h2>Ogni emozione ha il suo drago.</h2>
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
        <div>
          <h2>Un'autrice per chi ama il fantastico quando parla di cose vere.</h2>
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
