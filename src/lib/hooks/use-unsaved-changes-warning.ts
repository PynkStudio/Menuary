"use client";

import { useEffect } from "react";

/**
 * Mostra il dialog nativo del browser "Vuoi uscire senza salvare?"
 * quando l'utente chiude la tab, ricarica la pagina o naviga su un URL esterno.
 * Per navigazione interna Next.js il draft autosalvato copre il recupero.
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}
