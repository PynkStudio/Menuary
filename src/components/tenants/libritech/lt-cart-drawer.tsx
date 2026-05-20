"use client";

import { useShopCartStore, shopCartTotal } from "@/store/shop-cart-store";

const CHECKOUT_PATH = "/libritech/checkout";

export function LtCartDrawer() {
  const lines = useShopCartStore((s) => s.lines);
  const incLine = useShopCartStore((s) => s.incLine);
  const removeLine = useShopCartStore((s) => s.removeLine);
  const setOpen = useShopCartStore((s) => s.setOpen);
  const total = shopCartTotal(lines);

  return (
    <>
      {/* Overlay */}
      <div
        className="lt-drawer-overlay"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="lt-drawer" role="dialog" aria-label="Carrello" aria-modal="true">
        <div className="lt-drawer-header">
          <h2 className="lt-drawer-title">
            Carrello{lines.length > 0 && <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: "0.9rem" }}> ({lines.length})</span>}
          </h2>
          <button
            type="button"
            className="lt-drawer-close"
            onClick={() => setOpen(false)}
            aria-label="Chiudi carrello"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="lt-drawer-body">
          {lines.length === 0 ? (
            <div className="lt-drawer-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#cbd5e1" }} aria-hidden="true">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 500 }}>Il carrello è vuoto</p>
              <p style={{ margin: 0, fontSize: "0.8125rem" }}>Aggiungi qualche libro dal catalogo</p>
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.lineId} className="lt-cart-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={line.imageUrl} alt={line.name} className="lt-cart-line-img" />
                <div className="lt-cart-line-info">
                  <span className="lt-cart-line-name">{line.name}</span>
                  <span className="lt-cart-line-price">€{(line.price * line.qty).toFixed(2)}</span>
                  <div className="lt-cart-line-controls">
                    <button type="button" className="lt-qty-btn" style={{ width: 28, height: 28, fontSize: "0.875rem" }} onClick={() => incLine(line.lineId, -1)} aria-label="Diminuisci">−</button>
                    <span className="lt-qty-value" style={{ fontSize: "0.875rem" }}>{line.qty}</span>
                    <button type="button" className="lt-qty-btn" style={{ width: 28, height: 28, fontSize: "0.875rem" }} onClick={() => incLine(line.lineId, 1)} aria-label="Aumenta">+</button>
                    <button type="button" className="lt-cart-remove" onClick={() => removeLine(line.lineId)} aria-label="Rimuovi">Rimuovi</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <div className="lt-drawer-footer">
            <div className="lt-drawer-total">
              <span>Totale</span>
              <span>€{total.toFixed(2)}</span>
            </div>
            <a
              href={CHECKOUT_PATH}
              className="lt-btn-primary lt-drawer-checkout-btn"
              onClick={() => setOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <span>Vai al checkout</span>
            </a>
          </div>
        )}
      </div>
    </>
  );
}
