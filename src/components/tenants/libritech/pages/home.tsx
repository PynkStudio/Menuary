"use client";

import { useState, useEffect } from "react";
import { libritechCatalog } from "@/lib/libritech-catalog";
import { useShopCartStore, shopCartCount } from "@/store/shop-cart-store";
import { LtCartDrawer } from "@/components/tenants/libritech/lt-cart-drawer";

const BASE_PATH = "/libritech";

export function LibritechHomePage() {
  const lines = useShopCartStore((s) => s.lines);
  const setOpen = useShopCartStore((s) => s.setOpen);
  const openDrawer = useShopCartStore((s) => s.openDrawer);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { setHydrated(true); }, []);

  const count = hydrated ? shopCartCount(lines) : 0;
  const filtered = search.trim()
    ? libritechCatalog.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.description.toLowerCase().includes(search.toLowerCase()),
      )
    : libritechCatalog;

  return (
    <div className="lt-site lt-mesh-bg">
      {/* ── Header ── */}
      <header className="lt-header">
        <div className="lt-wrap">
          <div className="lt-header-inner lt-glass-panel">
            <a href={BASE_PATH} className="lt-logo-link">
              <div className="lt-logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <span className="lt-logo-name">LibriTech</span>
            </a>

            <nav className="lt-nav">
              <a href="#catalogo" className="lt-nav-link">Catalogo</a>
              <a href="#contatti" className="lt-nav-link">Contatti</a>
              <button
                type="button"
                className="lt-cart-btn"
                onClick={() => setOpen(true)}
                aria-label="Apri carrello"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Carrello
                {count > 0 && <span className="lt-cart-badge">{count}</span>}
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="lt-wrap" style={{ paddingTop: "1.5rem", paddingBottom: "4rem", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* ── Hero ── */}
        <section className="lt-hero lt-fade-up">
          <div className="lt-hero-blob-1" />
          <div className="lt-hero-blob-2" />
          <div className="lt-hero-inner">
            <h1>
              La tua prossima lettura inizia{" "}
              <span className="lt-gradient-text">da qui.</span>
            </h1>
            <p className="lt-hero-subtitle">
              30 titoli tra satira, strategia e tecnica per founder, investitori e
              chiunque lavori con un foglio Excel aperto e troppe aspettative.
            </p>
            <div className="lt-hero-actions">
              <a href="#catalogo" className="lt-btn-primary" style={{ padding: "0.75rem 1.5rem", fontSize: "0.9375rem" }}>
                <span>Sfoglia il catalogo</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── Search ── */}
        <div style={{ position: "relative" }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Cerca titolo o descrizione…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lt-form-input"
            style={{ paddingLeft: "2.75rem", borderRadius: "0.875rem" }}
          />
        </div>

        {/* ── Catalog ── */}
        <section id="catalogo">
          <div className="lt-section-head" style={{ marginBottom: "1.5rem" }}>
            <div>
              <p className="lt-section-eyebrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Catalogo
              </p>
              <h2 className="lt-section-title">
                {search ? <>Risultati per &ldquo;{search}&rdquo;</> : "I titoli del momento"}
              </h2>
            </div>
            <p className="lt-count">
              {filtered.length} {filtered.length === 1 ? "libro" : "libri"} disponibil{filtered.length === 1 ? "e" : "i"}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "#94a3b8" }}>
              <p style={{ fontSize: "1rem" }}>Nessun titolo trovato per &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            <div className="lt-book-grid">
              {filtered.map((book) => (
                <article key={book.id} className="lt-book-card lt-card-elevated">
                  <div className="lt-book-img-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={book.imageUrl} alt={book.name} className="lt-book-img" loading="lazy" />
                    <div className="lt-book-img-overlay" />
                    <div className="lt-book-badge">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      In vetrina
                    </div>
                  </div>
                  <div className="lt-book-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <h2 className="lt-book-title">{book.name}</h2>
                      <p className="lt-book-desc">{book.description}</p>
                    </div>
                    <div className="lt-book-footer">
                      <span className="lt-book-price">€{book.price.toFixed(2)}</span>
                      <a
                        href={`${BASE_PATH}/${book.id}`}
                        className="lt-btn-primary"
                        style={{ padding: "0.625rem 1rem", fontSize: "0.875rem" }}
                      >
                        <span>Scopri</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Footer ── */}
        <footer id="contatti" style={{ borderTop: "1px solid var(--lt-border)", paddingTop: "2rem", color: "#64748b", fontSize: "0.875rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0.5rem" }}>
            <span>© {new Date().getFullYear()} LibriTech · Via della Startup, 42 · 20124 Milano</span>
            <span>Demo tenant su piattaforma Bizery</span>
          </div>
        </footer>
      </main>

      {/* ── Cart drawer ── */}
      {hydrated && openDrawer && <LtCartDrawer />}
    </div>
  );
}
