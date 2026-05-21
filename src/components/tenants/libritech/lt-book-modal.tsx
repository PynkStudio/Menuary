"use client";

import { useEffect, useState } from "react";
import { type LibritechBook } from "@/lib/libritech-catalog";
import { useShopCartStore } from "@/store/shop-cart-store";
import { SlabbbyWishlistButton } from "@/components/modules/shop/slabbby-wishlist-btn";

const SITE_URL = "https://demo.bizery.it/libritech";

type Props = {
  book: LibritechBook;
  onClose: () => void;
};

export function LtBookModal({ book, onClose }: Props) {
  const addLine = useShopCartStore((s) => s.addLine);
  const setOpen  = useShopCartStore((s) => s.setOpen);
  const [qty,   setQty]   = useState(1);
  const [added, setAdded] = useState(false);

  // Blocca lo scroll del body
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape per chiudere
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      addLine({ bookId: book.id, name: book.name, price: book.price, imageUrl: book.imageUrl });
    }
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      setOpen(true);
    }, 900);
  }

  const productUrl = `${SITE_URL}/${book.id}`;

  return (
    <div
      className="lt-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={book.name}
    >
      <div className="lt-modal">

        {/* ── Colonna immagine (dark) ── */}
        <div className="lt-modal-img-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={book.imageUrl} alt={book.name} className="lt-modal-img" />
          <div className="lt-modal-img-scrim" />

          {/* Prezzo sovrapposto in basso */}
          <div className="lt-modal-img-footer">
            <div className="lt-modal-img-price">
              <small>Prezzo</small>
              €{book.price.toFixed(2)}
            </div>
            <span className="lt-modal-img-tag">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              LibriTech
            </span>
          </div>

          {/* Tasto chiudi */}
          <button type="button" className="lt-modal-close" onClick={onClose} aria-label="Chiudi">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6"  x2="6"  y2="18" />
              <line x1="6"  y1="6"  x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Colonna dettaglio (chiaro) ── */}
        <div className="lt-modal-panel">

          {/* Bar in cima */}
          <div className="lt-modal-panel-bar">
            <div className="lt-modal-panel-dot" />
            <span className="lt-modal-panel-label">Dettaglio libro</span>
          </div>

          {/* Titolo */}
          <h2 className="lt-modal-title">{book.name}</h2>

          {/* Descrizione */}
          <p className="lt-modal-desc">{book.description}</p>

          <div className="lt-modal-sep" />

          {/* Prezzo + quantità sulla stessa riga */}
          <div className="lt-modal-buy-row">
            {/* Stepper quantità */}
            <div className="lt-modal-qty-box">
              <button type="button" className="lt-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuisci">−</button>
              <span>{qty}</span>
              <button type="button" className="lt-qty-btn" onClick={() => setQty((q) => q + 1)} aria-label="Aumenta">+</button>
            </div>

            {/* Prezzo */}
            <div className="lt-modal-price-chip">
              <small>Totale</small>
              <strong>€{(book.price * qty).toFixed(2)}</strong>
            </div>
          </div>

          {/* Bottoni */}
          <div className="lt-modal-actions">
            <button
              type="button"
              className="lt-btn-primary lt-add-btn"
              onClick={handleAddToCart}
              disabled={added}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {added
                  ? <polyline points="20 6 9 17 4 12" />
                  : (<><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>)
                }
              </svg>
              <span>{added ? "Aggiunto!" : "Aggiungi al carrello"}</span>
            </button>

            <SlabbbyWishlistButton
              product={{ id: book.id, name: book.name, price: book.price.toFixed(2), imageUrl: book.imageUrl, productUrl }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
