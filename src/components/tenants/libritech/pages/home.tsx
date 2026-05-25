"use client";

import { useState, useEffect } from "react";
import type { LibritechBook } from "@/lib/libritech-catalog";
import { useShopCartStore, shopCartCount } from "@/store/shop-cart-store";
import { LtCartDrawer } from "@/components/tenants/libritech/lt-cart-drawer";
import { LtBookModal } from "@/components/tenants/libritech/lt-book-modal";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import { useMenuStore } from "@/store/menu-store";
import { useSupabaseMenuSync } from "@/lib/menu-sync-client";

const CATEGORIES = [
  { id: "all",      label: "Tutti" },
  { id: "startup",  label: "Startup & Founder" },
  { id: "tech",     label: "Tecnologia & IA" },
  { id: "finanza",  label: "Finanza & VC" },
  { id: "growth",   label: "Crescita" },
] as const;

type Category = (typeof CATEGORIES)[number]["id"];

const CATEGORY_KEYWORDS: Record<Exclude<Category, "all">, string[]> = {
  startup:  ["startup","founder","pitch","exit","burn","seed","unicorn","round","cap table","ipo","sindrome","board","venture"],
  tech:     ["algoritm","machine learning","prompt","intelligenza","robot","cripto","remote","data","excel","tech"],
  finanza:  ["cashflow","etf","pricing","debito","valutazioni","investitore","rendite","budget","round"],
  growth:   ["growth","hacking","side hustle","marketing","monetizza","ceo","meme","social"],
};

function matchesCategory(book: LibritechBook, cat: Category): boolean {
  if (cat === "all") return true;
  const hay = (book.name + " " + book.description).toLowerCase();
  return CATEGORY_KEYWORDS[cat].some((kw) => hay.includes(kw));
}

export function LibritechHomePage() {
  const tenant = useTenant();
  const syncStatus = useSupabaseMenuSync(tenant.id);
  const staffHref = getTenantGestioneExternalHref(tenant.id);
  const lines     = useShopCartStore((s) => s.lines);
  const setOpen   = useShopCartStore((s) => s.setOpen);
  const openDrawer = useShopCartStore((s) => s.openDrawer);

  const [hydrated,  setHydrated]  = useState(false);
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState<Category>("all");
  const [selected,  setSelected]  = useState<LibritechBook | null>(null);

  useEffect(() => { setHydrated(true); }, []);

  const count = hydrated ? shopCartCount(lines) : 0;
  const menuItems = useMenuStore((s) => s.items);
  const currentTenantId = useMenuStore((s) => s.currentTenantId);
  const books = menuItems
    .filter(() => currentTenantId === tenant.id && syncStatus !== "loading")
    .filter((item) => item.available)
    .map<LibritechBook>((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price: item.price.kind === "single" ? item.price.value : 0,
      imageUrl: item.image ?? "",
    }));

  const filtered = books.filter((b) => {
    const matchesCat  = matchesCategory(b, category);
    const matchesText = !search.trim() || (
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase())
    );
    return matchesCat && matchesText;
  });

  return (
    <div className="lt-site lt-mesh-bg">
      {/* ── Header ── */}
      <header className="lt-header">
        <div className="lt-wrap">
          <div className="lt-header-inner lt-glass-panel">
            <a href="#" className="lt-logo-link">
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

      <main className="lt-wrap" style={{ paddingTop: "1.5rem", paddingBottom: "5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* ── Hero ── */}
        <section className="lt-hero lt-fade-up">
          <div className="lt-hero-blob-1" />
          <div className="lt-hero-blob-2" />
          <div className="lt-hero-inner">
            <p style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.15)", padding: "0.3rem 0.875rem", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#a5b4fc", marginBottom: "1.25rem" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="6" /></svg>
              Bizery · Shop online attivo
            </p>
            <h1>
              I libri che cambiano
              <br />
              <span className="lt-gradient-text">il modo di fare impresa.</span>
            </h1>
            <p className="lt-hero-subtitle">
              30 titoli tra satira, strategia e tecnica per founder, investitori e chiunque lavori con un foglio Excel aperto e troppe aspettative.
            </p>
            <div className="lt-hero-actions">
              <a href="#catalogo" className="lt-btn-primary" style={{ padding: "0.75rem 1.5rem", fontSize: "0.9375rem" }}>
                <span>Sfoglia il catalogo</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
              <a href="#contatti" className="lt-btn-ghost">Chi siamo</a>
            </div>
          </div>

          {/* Pillole statistiche */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.75rem", marginTop: "2.5rem", position: "relative", zIndex: 1 }}>
            {[
              { val: "30", label: "titoli" },
              { val: "€16–33", label: "fascia prezzi" },
              { val: "♡", label: "Slabbby wishlist" },
            ].map(({ val, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", padding: "0.5rem 1.125rem", backdropFilter: "blur(8px)" }}>
                <span style={{ fontWeight: 800, fontSize: "0.9375rem", color: "white" }}>{val}</span>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Ricerca + filtri ── */}
        <div id="catalogo" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {/* Search */}
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

          {/* Filtri categoria */}
          <div className="lt-filters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`lt-filter-chip${category === cat.id ? " is-active" : ""}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Catalogo ── */}
        <section>
          <div className="lt-section-head" style={{ marginBottom: "1.25rem" }}>
            <div>
              <p className="lt-section-eyebrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Catalogo
              </p>
              <h2 className="lt-section-title">
                {search
                  ? <>Risultati per &ldquo;{search}&rdquo;</>
                  : category !== "all"
                    ? CATEGORIES.find((c) => c.id === category)?.label
                    : "Tutti i titoli"}
              </h2>
            </div>
            <p className="lt-count">
              {filtered.length} {filtered.length === 1 ? "libro" : "libri"}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "#94a3b8" }}>
              <p>Nessun titolo trovato{search ? ` per "${search}"` : ""}.</p>
            </div>
          ) : (
            <div className="lt-book-grid">
              {filtered.map((book) => (
                <article
                  key={book.id}
                  className="lt-book-card lt-card-elevated"
                  onClick={() => setSelected(book)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelected(book); }}
                  aria-label={`Apri dettaglio: ${book.name}`}
                >
                  <div className="lt-book-img-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={book.imageUrl} alt={book.name} className="lt-book-img" loading="lazy" />
                    <div className="lt-book-img-overlay" />
                    <div className="lt-book-img-hint">
                      <span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        Apri
                      </span>
                    </div>
                    <div className="lt-book-badge">
                      €{book.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="lt-book-body">
                    <h2 className="lt-book-title">{book.name}</h2>
                    <p className="lt-book-desc">{book.description}</p>
                    <div className="lt-book-footer">
                      <span className="lt-book-price">€{book.price.toFixed(2)}</span>
                      <span className="lt-book-cta">
                        Scopri
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
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
            <span>
              © {new Date().getFullYear()} LibriTech · Via della Startup, 42 · 20124 Milano
              {" · "}
              <a href={staffHref} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", opacity: 0.6 }}>Staff</a>
            </span>
            <a href="https://bizery.it" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>Powered by Bizery</a>
          </div>
        </footer>
      </main>

      {/* ── Modal dettaglio ── */}
      {selected !== null && (
        <LtBookModal book={selected} onClose={() => setSelected(null)} />
      )}

      {/* ── Cart drawer ── */}
      {hydrated && openDrawer && <LtCartDrawer />}
    </div>
  );
}
