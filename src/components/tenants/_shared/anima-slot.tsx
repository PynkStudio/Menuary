"use client";

// Placeholder per i moduli reali da collegare dopo l'import Figma/Anima.
// Sostituisci <AnimaSlot name="menu" /> con il componente modulo corrispondente.

const SLOT_LABELS: Record<string, string> = {
  menu: "Menu / Listino prezzi",
  booking: "Prenotazioni / Appuntamenti",
  gallery: "Galleria foto",
  reviews: "Recensioni",
  contact: "Contatti",
  delivery: "Delivery / Asporto",
  shop: "Shop / Carrello",
};

export function AnimaSlot({ name }: { name: keyof typeof SLOT_LABELS | string }) {
  const label = SLOT_LABELS[name] ?? name;

  return (
    <div
      data-anima-slot={name}
      style={{
        minHeight: 80,
        border: "2px dashed rgba(15,23,42,0.2)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "1.5rem",
        background: "rgba(248,250,252,0.8)",
      }}
    >
      <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(15,23,42,0.35)" }}>
        slot:{name}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(15,23,42,0.5)" }}>
        {label}
      </span>
    </div>
  );
}
