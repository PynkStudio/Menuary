"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Instagram, Music2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import {
  useValentinaNewsletter,
  ValentinaNewsletterPanel,
  ValentinaNewsletterPopup,
} from "@/components/tenants/valentina-orciuoli/newsletter";
import { ValentinaOrciuoliHeader } from "@/components/tenants/valentina-orciuoli/vo-header";
import {
  amazonHref,
  amazonStoreHref,
  anxietyCoverSrc,
  authorPortraitSrc,
  instagramHref,
  tiktokHref,
  trilogy,
  trilogyHref,
} from "@/components/tenants/valentina-orciuoli/content";

export function ValentinaOrciuoliHomePage() {
  const newsletter = useValentinaNewsletter();
  const staffHref = getTenantGestioneExternalHref("valentina-orciuoli");
  const headerRegionRef = useRef<HTMLDivElement>(null);
  const [headerProgress, setHeaderProgress] = useState(0);

  useEffect(() => {
    function updateHeaderProgress() {
      const region = headerRegionRef.current;
      if (!region) return;
      const top = region.getBoundingClientRect().top;
      const viewport = window.innerHeight || 1;
      const progress = (viewport * 0.92 - top) / (viewport * 0.74);
      setHeaderProgress(Math.max(0, Math.min(1, progress)));
    }

    updateHeaderProgress();
    window.addEventListener("scroll", updateHeaderProgress, { passive: true });
    window.addEventListener("resize", updateHeaderProgress);
    return () => {
      window.removeEventListener("scroll", updateHeaderProgress);
      window.removeEventListener("resize", updateHeaderProgress);
    };
  }, []);

  return (
    <main className="vo-site">
      <section id="top" className="vo-hero">
        <div className="vo-hero-art" aria-hidden="true" />
        <div className="vo-hero-shade" aria-hidden="true" />

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
              <a className="vo-btn vo-btn-primary vo-btn-trilogy" href={trilogyHref} target="_blank" rel="noopener noreferrer">
                Scopri la Trilogia dei Draghi delle Emozioni <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        </div>
        <a className="vo-scroll-cue" href="#libri" aria-label="Scorri verso i contenuti">
          <span />
          Scorri
        </a>
      </section>

      <div className="vo-sticky-header-region" ref={headerRegionRef}>
        <motion.div className="vo-header-reveal" style={{ opacity: headerProgress, y: 22 * (1 - headerProgress) }}>
          <ValentinaOrciuoliHeader />
        </motion.div>

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
              <article className="vo-trilogy-card" data-book={book.slug} data-volume={book.n} key={book.n}>
                <div className="vo-trilogy-cover" data-empty={!book.coverSrc || undefined}>
                  {book.coverSrc ? (
                    <img src={book.coverSrc} alt={book.coverAlt} loading="lazy" />
                  ) : (
                    <span>{book.n}</span>
                  )}
                </div>
                <span className="vo-trilogy-volume">{book.volumeLabel ?? `Volume ${book.n}`}</span>
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
            <ValentinaNewsletterPanel
              sent={newsletter.newsletterSent}
              pending={newsletter.newsletterPending}
              error={newsletter.newsletterError}
              onSubmit={newsletter.handleNewsletterSubmit}
            />
          </div>
          <div className="vo-author-seal">
            <img src={authorPortraitSrc} alt="Valentina Orciuoli" />
            <p>Ink, moonlight, dragons.</p>
          </div>
        </section>

        <footer id="contatti" className="vo-footer">
          <div>
            <strong>Valentina Orciuoli</strong>
            <p>Author site ufficiale · fantasy, draghi ed emozioni.</p>
          </div>
          <div className="vo-footer-links">
            <a href={instagramHref} target="_blank" rel="noopener noreferrer">
              <Instagram size={15} /> Instagram
            </a>
            <a href={tiktokHref} target="_blank" rel="noopener noreferrer">
              <Music2 size={15} /> TikTok
            </a>
            <a href={amazonStoreHref} target="_blank" rel="noopener noreferrer">
              <BookOpen size={15} /> Amazon
            </a>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/cookie">Cookie Policy</Link>
            <a className="vo-footer-staff-link" href={staffHref} target="_blank" rel="noopener noreferrer">
              Staff
            </a>
          </div>
        </footer>
      </div>

      <ValentinaNewsletterPopup
        open={newsletter.showNewsletterPopup}
        sent={newsletter.newsletterSent}
        pending={newsletter.newsletterPending}
        error={newsletter.newsletterError}
        onClose={newsletter.closeNewsletterPopup}
        onSubmit={newsletter.handleNewsletterSubmit}
      />
    </main>
  );
}
