"use client";

import { useState, useEffect } from "react";
import { libritechCatalog } from "@/lib/libritech-catalog";
import { useShopCartStore, shopCartCount } from "@/store/shop-cart-store";
import { LtCartDrawer } from "@/components/tenants/libritech/lt-cart-drawer";
import { SlabbbyWishlistButton } from "@/components/modules/shop/slabbby-wishlist-btn";

const BASE_PATH = "/libritech";

export function LibritechBookDetailPage({ bookId }: { bookId: string }) {
  const book = libritechCatalog.find((b) => b.id === bookId);
  const addLine = useShopCartStore((s) => s.addLine);
  const lines = useShopCartStore((s) => s.lines);
  const setOpen = useShopCartStore((s) => s.setOpen);
  const openDrawer = useShopCartStore((s) => s.openDrawer);
  const [hydrated, setHydrated] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  const count = hydrated ? shopCartCount(lines) : 0;

  if (!book) {
    return (
      <div className="lt-site lt-mesh-bg">
        <div className="lt-wrap" style={{ paddingTop: "4rem", textAlign: "center" }}>
          <p style={{ color: "#64748b" }}>Libro non trovato.</p>
          <a href={BASE_PATH} className="lt-back-link" style={{ display: "inline-flex", marginTop: "1rem" }}>
            ← Torna al catalogo
          </a>
        </div>
      </div>
    );
  }

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      addLine({
        bookId: book!.id,
        name: book!.name,
        price: book!.price,
        imageUrl: book!.imageUrl,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const productUrl = `https://demo.bizery.it${BASE_PATH}/${book.id}`;

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
              <a href={`${BASE_PATH}#catalogo`} className="lt-nav-link">Catalogo</a>
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

      <main className="lt-wrap lt-detail-wrap">
        <a href={BASE_PATH} className="lt-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Torna al catalogo
        </a>

        <div className="lt-detail-grid lt-fade-up">
          {/* Immagine */}
          <div className="lt-detail-img-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={book.imageUrl} alt={book.name} className="lt-detail-img" />
            <div className="lt-detail-img-ring" />
          </div>

          {/* Pannello dettaglio */}
          <div className="lt-detail-panel">
            <div>
              <p className="lt-detail-eyebrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Dettaglio libro
              </p>
              <h1 className="lt-detail-title">{book.name}</h1>
            </div>

            <p className="lt-detail-desc">{book.description}</p>

            <div className="lt-detail-actions">
              {/* Prezzo */}
              <div className="lt-price-box">
                <p className="lt-price-label">Prezzo</p>
                <p className="lt-price-value">€{book.price.toFixed(2)}</p>
              </div>

              {/* Quantità + Aggiungi al carrello */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="lt-qty-row">
                  <span style={{ fontSize: "0.8125rem", color: "#64748b", fontWeight: 600 }}>Quantità</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
                    <button type="button" className="lt-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuisci">−</button>
                    <span className="lt-qty-value">{qty}</span>
                    <button type="button" className="lt-qty-btn" onClick={() => setQty((q) => q + 1)} aria-label="Aumenta">+</button>
                  </div>
                </div>

                <button
                  type="button"
                  className={`lt-btn-primary lt-add-btn${added ? " lt-fade-up" : ""}`}
                  onClick={handleAddToCart}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {added
                      ? <><polyline points="20 6 9 17 4 12" /></>
                      : (<><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>)
                    }
                  </svg>
                  <span>{added ? "Aggiunto!" : "Aggiungi al carrello"}</span>
                </button>

                {/* Slabbby wishlist — sotto il tasto carrello */}
                <SlabbbyWishlistButton
                  product={{
                    id: book.id,
                    name: book.name,
                    price: book.price.toFixed(2),
                    imageUrl: book.imageUrl,
                    productUrl,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Cart drawer ── */}
      {hydrated && openDrawer && <LtCartDrawer />}
    </div>
  );
}
