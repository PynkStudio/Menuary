"use client";

import { libritechCatalog, type LibritechBook } from "@/lib/libritech-catalog";

const SITE_URL = "https://demo.bizery.it/libritech";

function BookCard({ book }: { book: LibritechBook }) {
  const productUrl = `${SITE_URL}/shop/${book.id}`;

  return (
    <article className="lt-book-card">
      <div className="lt-book-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={book.imageUrl} alt={book.name} loading="lazy" />
        <div className="lt-book-cover-overlay" />
      </div>

      <div className="lt-book-body">
        <h3 className="lt-book-title">{book.name}</h3>
        <p className="lt-book-desc">{book.description}</p>

        <div className="lt-book-footer">
          <span className="lt-book-price">€{book.price.toFixed(2)}</span>
          <div className="lt-book-actions">
            <button
              type="button"
              className="lt-wishlist-btn"
              data-slabbby-add
              data-slabbby-product-id={book.id}
              data-slabbby-product-name={book.name}
              data-slabbby-product-price={book.price.toFixed(2)}
              data-slabbby-product-image={book.imageUrl}
              data-slabbby-product-url={productUrl}
              aria-label={`Aggiungi "${book.name}" alla wishlist Slabbby`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              Wishlist
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function LibritechHomePage() {
  return (
    <div className="lt-site">
      {/* ── Nav ── */}
      <nav className="lt-nav">
        <div className="lt-container lt-nav-row">
          <a href="#" className="lt-logo">
            <span className="lt-logo-mark">L</span>
            <span>
              LibriTech
              <small>Tech &amp; Startup Books</small>
            </span>
          </a>

          <div className="lt-nav-links">
            <a href="#catalogo">Catalogo</a>
            <a href="#wishlist">Wishlist</a>
            <a href="#contatti">Contatti</a>
          </div>

          <a href="#catalogo" className="lt-btn lt-btn-primary">
            Esplora i libri
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lt-hero">
        <div className="lt-container lt-hero-inner">
          <div>
            <span className="lt-eyebrow">Libreria tech &amp; startup · Milano</span>
            <h1>
              Libri per chi
              <span>non sceglie il facile.</span>
            </h1>
            <p className="lt-hero-body">
              30 titoli tra satira, strategia e tecnica per founder, investitori e
              chiunque lavori con un foglio Excel aperto e troppe aspettative.
              Salva i tuoi preferiti nella wishlist Slabbby e trovali ovunque.
            </p>
            <div className="lt-hero-actions">
              <a href="#catalogo" className="lt-btn lt-btn-primary">
                Vai al catalogo
              </a>
              <a href="#contatti" className="lt-btn lt-btn-ghost">
                Contattaci
              </a>
            </div>
          </div>

          <div className="lt-hero-stats">
            <div className="lt-stat-card">
              <strong>
                30<em>+</em>
              </strong>
              <span>Titoli disponibili</span>
            </div>
            <div className="lt-stat-card">
              <strong>
                €16<em>–</em>33
              </strong>
              <span>Fascia di prezzo</span>
            </div>
            <div className="lt-stat-card">
              <strong>
                ♡<em> </em>
              </strong>
              <span>Wishlist Slabbby integrata</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Catalog ── */}
      <section id="catalogo" className="lt-catalog">
        <div className="lt-container">
          <div className="lt-section-head">
            <div>
              <span className="lt-eyebrow">Shop online</span>
              <h2>
                Il catalogo
                <span>completo</span>
              </h2>
              <p>
                Tutti i titoli disponibili. Usa il tasto wishlist per salvare i
                preferiti su Slabbby e ritrovarli su qualunque dispositivo.
              </p>
            </div>
            <span className="lt-catalog-count">
              {libritechCatalog.length} titoli
            </span>
          </div>

          <div className="lt-book-grid">
            {libritechCatalog.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contatti" className="lt-footer">
        <div className="lt-container">
          <div className="lt-footer-inner">
            <div className="lt-footer-brand">
              <div className="lt-logo">
                <span className="lt-logo-mark">L</span>
                <span>LibriTech</span>
              </div>
              <p>
                Libreria specializzata in tecnologia, startup e innovazione
                digitale. Libri che fanno ridere, pensare e — a volte — rileggere
                il proprio business plan.
              </p>
              <div style={{ marginTop: 16 }}>
                <span className="lt-slabbby-badge">♡ Powered by Slabbby</span>
              </div>
            </div>

            <div className="lt-footer-col">
              <h4>Catalogo</h4>
              <a href="#catalogo">Tutti i titoli</a>
              <a href="#catalogo">Startup &amp; VC</a>
              <a href="#catalogo">Tecnologia</a>
              <a href="#catalogo">Finanza</a>
            </div>

            <div className="lt-footer-col">
              <h4>Servizi</h4>
              <span>Spedizione in Italia</span>
              <span>Ritiro in sede</span>
              <span>Gift card</span>
              <a href="#wishlist">Wishlist Slabbby</a>
            </div>

            <div className="lt-footer-col">
              <h4>Contatti</h4>
              <span>Via della Startup, 42</span>
              <span>20124 Milano (MI)</span>
              <a href="mailto:ciao@libritech.it">ciao@libritech.it</a>
              <a href="tel:+390212345678">+39 02 1234 5678</a>
            </div>
          </div>

          <div className="lt-footer-bottom">
            <span>© {new Date().getFullYear()} LibriTech · P.IVA demo</span>
            <span>Demo tenant su piattaforma Bizery</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
