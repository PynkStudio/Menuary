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
  const setOpen = useShopCartStore((s) => s.setOpen);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Blocca lo scroll del body
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Chiude con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
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
      setOpen(true); // apre il cassetto carrello
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
        {/* Colonna immagine */}
        <div className="lt-modal-img-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={book.imageUrl} alt={book.name} className="lt-modal-img" />
          <div className="lt-modal-img-scrim" />
          <button
            type="button"
            className="lt-modal-close"
            onClick={onClose}
            aria-label="Chiudi"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Colonna dettaglio */}
        <div className="lt-modal-panel">
          <p className="lt-modal-eyebrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Dettaglio libro
          </p>

          <h2 className="lt-modal-title">{book.name}</h2>
          <p className="lt-modal-desc">{book.description}</p>

          <div className="lt-modal-divider" />

          {/* Prezzo */}
          <div className="lt-modal-price-row">
            <span className="lt-modal-price-label">Prezzo</span>
            <span className="lt-modal-price">€{book.price.toFixed(2)}</span>
          </div>

          {/* Quantità */}
          <div className="lt-modal-qty-row">
            <span className="lt-modal-qty-label">Quantità</span>
            <div className="lt-modal-qty-controls">
              <button type="button" className="lt-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuisci">−</button>
              <span>{qty}</span>
              <button type="button" className="lt-qty-btn" onClick={() => setQty((q) => q + 1)} aria-label="Aumenta">+</button>
            </div>
          </div>

          {/* Azioni */}
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
              <span>{added ? "Aggiunto! Apro il carrello…" : "Aggiungi al carrello"}</span>
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
