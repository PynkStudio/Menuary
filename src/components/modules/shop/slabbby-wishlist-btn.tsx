"use client";

/**
 * SlabbbyWishlistButton — bottone wishlist Slabbby riutilizzabile per tutti i tenant shop.
 *
 * Posizionamento: va inserito SOTTO il tasto "Aggiungi al carrello" nella pagina di dettaglio
 * prodotto. NON deve comparire nella home/catalogo né sopra il titolo del prodotto.
 *
 * Nessun widget.js esterno: chiama window.Slabbby?.add() se disponibile,
 * altrimenti apre direttamente https://slabbby.com con i parametri prodotto.
 */

export type SlabbbyProduct = {
  id: string;
  name: string;
  price: string;       // es. "21.90"
  imageUrl: string;
  productUrl: string;
};

type Props = {
  product: SlabbbyProduct;
  /** Override del testo del bottone. Default: "Salvalo su Slabbby" */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function SlabbbyWishlistButton({ product, label = "Salvalo su Slabbby", className, style }: Props) {
  function handleSave() {
    // Prova prima l'API JS del widget (se caricato separatamente)
    const w = window as unknown as Record<string, unknown>;
    const api = w["Slabbby"] as { add?: (p: Record<string, string>) => void } | undefined;
    if (typeof api?.add === "function") {
      api.add({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.imageUrl,
        url: product.productUrl,
      });
      return;
    }
    // Fallback: apre Slabbby con i parametri via URL
    const params = new URLSearchParams({
      url: product.productUrl,
      title: product.name,
      price: product.price,
      image: product.imageUrl,
    });
    window.open(`https://slabbby.com/save?${params}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      aria-label={`${label}: ${product.name}`}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        width: "100%",
        minHeight: "44px",
        padding: "0.625rem 1.25rem",
        border: "none",
        borderRadius: "0.625rem",
        background: "#22c55e",
        color: "#fff",
        fontSize: "0.9375rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "background 160ms ease, transform 160ms ease",
        ...style,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#16a34a"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#22c55e"; }}
    >
      {/* Icona bookmark — stile identico al widget ufficiale */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {label}
    </button>
  );
}
