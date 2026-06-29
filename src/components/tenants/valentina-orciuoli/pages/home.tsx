"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Instagram, Music2 } from "lucide-react";
import Link from "next/link";
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
  valentinaBasePath,
} from "@/components/tenants/valentina-orciuoli/content";

export function ValentinaOrciuoliHomePage() {
  const newsletter = useValentinaNewsletter();
  const staffHref = getTenantGestioneExternalHref("valentina-orciuoli");

  return (
    <main className="vo-site vo-home-site">
      <div className="vo-home-header">
        <ValentinaOrciuoliHeader variant="home" />
      </div>
      <section id="top" className="vo-hero">
        <div className="vo-hero-cosmos" aria-hidden="true" />
        <div className="vo-hero-shade" aria-hidden="true" />

        <div className="vo-hero-inner">
          <motion.div
            className="vo-hero-copy"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1>
              <span>Valentina</span>
              <span>Orciuoli</span>
            </h1>
            <div className="vo-hero-byline">
              <span aria-hidden="true" />
              <p>Autrice italiana</p>
              <span aria-hidden="true" />
            </div>
            <p className="vo-hero-series">Fantasy romance e noir psicologico</p>
            <p className="vo-hero-manifesto">
              Le storie sono specchi.
              <br />
              Attraverso metafore e simboli raccontano
              <br />
              ciò che spesso non riusciamo a dire.
            </p>
            <div className="vo-hero-actions">
              <a className="vo-btn vo-btn-primary vo-btn-trilogy" href="#libri">
                Scopri i miei libri <span aria-hidden="true">✦</span>
              </a>
            </div>
          </motion.div>
          <motion.div
            className="vo-hero-portrait-wrap"
            initial={{ opacity: 0, scale: 0.96, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
          >
            <Link
              className="vo-hero-portrait-link"
              href={`${valentinaBasePath}/autrice`}
              aria-label="Vai alla pagina Chi sono di Valentina Orciuoli"
            >
              <img src="/valentina-orciuoli/sfondo-valentina.webp" alt="Valentina Orciuoli" />
              <span aria-hidden="true">Chi sono</span>
            </Link>
          </motion.div>
        </div>
        <span className="vo-hero-signature" aria-hidden="true">VO✦</span>
      </section>

      <div className="vo-sticky-header-region">
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
