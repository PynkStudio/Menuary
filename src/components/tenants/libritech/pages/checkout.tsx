"use client";

import { useState, useEffect } from "react";
import { useShopCartStore, shopCartTotal } from "@/store/shop-cart-store";

const BASE_PATH = "/libritech";

export function LibritechCheckoutPage() {
  const lines = useShopCartStore((s) => s.lines);
  const clear = useShopCartStore((s) => s.clear);
  const total = shopCartTotal(lines);
  const [hydrated, setHydrated] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    indirizzo: "",
    cap: "",
    citta: "",
    note: "",
  });

  useEffect(() => { setHydrated(true); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.email || !form.indirizzo || !form.citta || !form.cap) return;
    setSubmitting(true);
    // Simulazione invio ordine (500ms) — in produzione chiamerebbe un endpoint
    setTimeout(() => {
      clear();
      setDone(true);
      setSubmitting(false);
    }, 500);
  }

  if (!hydrated) return null;

  if (done) {
    return (
      <div className="lt-site lt-mesh-bg">
        <div className="lt-wrap lt-checkout">
          <div className="lt-success">
            <div className="lt-success-icon">✓</div>
            <h2>Ordine confermato!</h2>
            <p>
              Grazie per il tuo acquisto. Riceverai una email di conferma con i dettagli
              della spedizione entro pochi minuti.
            </p>
            <a
              href={BASE_PATH}
              className="lt-btn-primary"
              style={{ marginTop: "0.5rem", padding: "0.75rem 1.5rem", fontSize: "0.9375rem" }}
            >
              Torna al catalogo
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="lt-site lt-mesh-bg">
        <div className="lt-wrap lt-checkout">
          <div className="lt-success">
            <div className="lt-success-icon" style={{ background: "#f1f5f9", color: "#94a3b8" }}>🛒</div>
            <h2 style={{ color: "#64748b" }}>Carrello vuoto</h2>
            <p>Aggiungi qualche libro prima di procedere al checkout.</p>
            <a
              href={BASE_PATH}
              className="lt-btn-primary"
              style={{ marginTop: "0.5rem", padding: "0.75rem 1.5rem", fontSize: "0.9375rem" }}
            >
              Vai al catalogo
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lt-site lt-mesh-bg">
      {/* ── Header minimale ── */}
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
            <span style={{ fontSize: "0.875rem", color: "#64748b" }}>Checkout sicuro</span>
          </div>
        </div>
      </header>

      <main className="lt-wrap lt-checkout">
        <a href={BASE_PATH} className="lt-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Torna al catalogo
        </a>

        <div className="lt-checkout-grid">
          {/* ── Form spedizione ── */}
          <form className="lt-form-panel" onSubmit={handleSubmit}>
            <h2>Dati di spedizione</h2>

            <div className="lt-form-grid">
              <div className="lt-form-field">
                <label className="lt-form-label" htmlFor="nome">Nome *</label>
                <input id="nome" name="nome" className="lt-form-input" placeholder="Mario" value={form.nome} onChange={handleChange} required />
              </div>
              <div className="lt-form-field">
                <label className="lt-form-label" htmlFor="cognome">Cognome</label>
                <input id="cognome" name="cognome" className="lt-form-input" placeholder="Rossi" value={form.cognome} onChange={handleChange} />
              </div>
              <div className="lt-form-field">
                <label className="lt-form-label" htmlFor="email">Email *</label>
                <input id="email" name="email" type="email" className="lt-form-input" placeholder="mario@esempio.it" value={form.email} onChange={handleChange} required />
              </div>
              <div className="lt-form-field">
                <label className="lt-form-label" htmlFor="telefono">Telefono</label>
                <input id="telefono" name="telefono" type="tel" className="lt-form-input" placeholder="+39 333 000 0000" value={form.telefono} onChange={handleChange} />
              </div>
              <div className="lt-form-field lt-form-field-full">
                <label className="lt-form-label" htmlFor="indirizzo">Indirizzo *</label>
                <input id="indirizzo" name="indirizzo" className="lt-form-input" placeholder="Via Roma, 1" value={form.indirizzo} onChange={handleChange} required />
              </div>
              <div className="lt-form-field">
                <label className="lt-form-label" htmlFor="cap">CAP *</label>
                <input id="cap" name="cap" className="lt-form-input" placeholder="20100" value={form.cap} onChange={handleChange} required />
              </div>
              <div className="lt-form-field">
                <label className="lt-form-label" htmlFor="citta">Città *</label>
                <input id="citta" name="citta" className="lt-form-input" placeholder="Milano" value={form.citta} onChange={handleChange} required />
              </div>
              <div className="lt-form-field lt-form-field-full">
                <label className="lt-form-label" htmlFor="note">Note ordine</label>
                <input id="note" name="note" className="lt-form-input" placeholder="Consegna in orario mattutino, ecc." value={form.note} onChange={handleChange} />
              </div>
            </div>

            <button
              type="submit"
              className="lt-btn-primary lt-submit-btn"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <span>Elaborazione…</span>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span>Conferma ordine · €{total.toFixed(2)}</span>
                </>
              )}
            </button>

            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.75rem", textAlign: "center" }}>
              Demo: nessun addebito reale verrà effettuato.
            </p>
          </form>

          {/* ── Riepilogo ordine ── */}
          <div className="lt-order-summary">
            <h3>Riepilogo ordine</h3>

            {lines.map((line) => (
              <div key={line.lineId} className="lt-order-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={line.imageUrl} alt={line.name} className="lt-order-line-img" />
                <div className="lt-order-line-info">
                  <span className="lt-order-line-name">{line.name}</span>
                  <span className="lt-order-line-qty">× {line.qty}</span>
                </div>
                <span className="lt-order-line-price">€{(line.price * line.qty).toFixed(2)}</span>
              </div>
            ))}

            <div style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--lt-border)", display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#64748b" }}>
              <span>Spedizione standard</span>
              <span>Gratuita</span>
            </div>

            <div className="lt-order-total-row">
              <span>Totale</span>
              <span style={{ color: "var(--lt-amber)" }}>€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
