"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Gestisce l'animazione di entrata/uscita di una modal.
 *
 * Uso:
 *   const { closing, requestClose, panelRef } = useModalAnimation(onClose);
 *   - applicare `panelRef` al div pannello
 *   - usare `closing` per switchare le classi in/out
 *   - chiamare `requestClose` invece di `onClose` direttamente
 */
export function useModalAnimation(onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const requestClose = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!closing) return;

    // Nessuna animazione se l'utente preferisce movimento ridotto → chiudi subito
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onCloseRef.current();
      return;
    }

    const el = panelRef.current;
    // Fallback nel caso animationend non scatti (es. display:none, zero-duration)
    const fallback = window.setTimeout(() => onCloseRef.current(), 450);

    if (!el) return () => clearTimeout(fallback);

    function onEnd() {
      clearTimeout(fallback);
      onCloseRef.current();
    }
    el.addEventListener("animationend", onEnd, { once: true });

    return () => {
      clearTimeout(fallback);
      el.removeEventListener("animationend", onEnd);
    };
  }, [closing]);

  return { closing, requestClose, panelRef };
}
