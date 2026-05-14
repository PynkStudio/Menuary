"use client";

import { useState } from "react";
import { useHydrated } from "@/components/core/providers";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { TableOrderEntryModal } from "@/components/modules/table-orders/table-order-entry-modal";

function renderWithOptionalPlus(text: string) {
  if (!text.includes("+")) {
    return text;
  }
  const parts = text.split("+");
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="text-pork-mustard">+</span>
      )}
    </span>
  ));
}

function introParts(allowTakeaway: boolean, allowTableOrders: boolean): {
  body: string;
  showTableCta: boolean;
} {
  if (allowTakeaway && allowTableOrders) {
    return {
      body:
        "Aggiungi dal menu con il +. Asporto: chiudi l’ordine da qui. Al tavolo: QR sul tavolo oppure",
      showTableCta: true,
    };
  }
  if (allowTakeaway && !allowTableOrders) {
    return {
      body:
        "Aggiungi con il +; il cuore salva i preferiti. Chiudi l’ordine quando sei pronto.",
      showTableCta: false,
    };
  }
  if (!allowTakeaway && allowTableOrders) {
    return {
      body: "Il cuore salva i preferiti. Scansiona il QR in sala oppure",
      showTableCta: true,
    };
  }
  return {
    body: "Sfoglia i piatti e tieni i preferiti col cuore.",
    showTableCta: false,
  };
}

/** Hero testuale /menu + CTA ingresso tavolo (secondo impostazioni). */
export function MenuIntroParagraph() {
  const hydrated = useHydrated();
  const { allowTakeaway, allowTableOrders } = useEffectiveFeatures();
  const [modalOpen, setModalOpen] = useState(false);

  const { body, showTableCta } = hydrated
    ? introParts(allowTakeaway, allowTableOrders)
    : introParts(true, true);

  return (
    <>
      <p className="mt-6 max-w-2xl text-lg text-pork-cream/70">
        {renderWithOptionalPlus(body)}{" "}
        {showTableCta && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="font-semibold text-pork-mustard underline decoration-pork-mustard/50 underline-offset-4 hover:decoration-pork-mustard"
          >
            Inserisci il numero del tuo tavolo
          </button>
        )}
      </p>
      {showTableCta && (
        <TableOrderEntryModal open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
