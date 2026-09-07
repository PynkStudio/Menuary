"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { voBookMemory } from "@/components/tenants/valentina-orciuoli/book/book-memory";
import { ValentinaNewsletterForm } from "@/components/tenants/valentina-orciuoli/newsletter";

/**
 * La cedola della newsletter è un oggetto fisico dentro il volume, non un popup
 * che aggredisce. È infilata fra le prime pagine e ne sporge solo la linguetta:
 * chi la nota la prende, chi non la vuole non la incontra mai.
 *
 * **Ci viene infilata sotto gli occhi.** Non era così: compariva già in pagina,
 * e una cedola che c'è da sempre è un elemento d'interfaccia, non un foglietto
 * lasciato lì da qualcuno. Alla prima apertura del volume scende dall'alto,
 * ruotata, e si posa fra le pagine — il gesto di chi mette un segnalibro. Poi
 * resta: il flag vive nella memoria della scheda, quindi non si ripete a ogni
 * giro di pagina.
 *
 * Ha due facce perché sta *dentro* la scena 3D del volume: quando il libro si
 * chiude e si gira per mostrare la quarta, il segnalibro gira con lui e da
 * dietro se ne deve vedere il retro — carta bianca — invece di sparire.
 */
export function VoNewsletterTab({
  onPick,
  reversed = false,
}: {
  onPick: () => void;
  /** Il volume è rigirato sulla quarta: del segnalibro si vede il retro. */
  reversed?: boolean;
}) {
  // Si legge in un effetto e non durante il render: il doppio montaggio di
  // StrictMode consumerebbe il flag e l'inserimento non si vedrebbe mai.
  const [slipping, setSlipping] = useState(false);
  useEffect(() => {
    if (voBookMemory.bookmarkSlipped) return;
    voBookMemory.bookmarkSlipped = true;
    setSlipping(true);
  }, []);

  return (
    <button
      type="button"
      className="vo-insert-tab"
      data-slipping={slipping || undefined}
      // Chi decide quale faccia si vede è lo stato del volume, non il culling
      // del browser: `backface-visibility` non regge dentro il 3D annidato del
      // libro, e la linguetta si vedeva a specchio invece che dal retro.
      data-reversed={reversed || undefined}
      onClick={onPick}
    >
      <span className="vo-insert-tab-face">
        <span className="vo-insert-tab-kicker">Newsletter</span>
        <span className="vo-insert-tab-label">Resta aggiornato</span>
      </span>
      <span className="vo-insert-tab-verso" aria-hidden="true" />
    </button>
  );
}

export function VoNewsletterInsert({
  open,
  sent,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  sent: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      // Finché la cedola è in primo piano il fuoco resta dentro: dietro c'è un
      // libro pieno di link, e uscirci con Tab lascerebbe la tastiera nel vuoto.
      if (event.key !== "Tab" || !cardRef.current) return;
      const focusable = cardRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div
      className="vo-insert-stage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      onClick={onClose}
    >
      <motion.div
        className="vo-insert-card"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vo-insert-title"
        onClick={(event) => event.stopPropagation()}
        // Sale dal libro, si raddrizza e si posa: è la stessa cedola, tirata su.
        initial={{ opacity: 0, y: 90, scale: 0.86, rotateX: 26, rotate: -5 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, rotate: -1.2 }}
        transition={{ type: "spring", stiffness: 130, damping: 20, mass: 1 }}
      >
        <span className="vo-insert-perf" aria-hidden="true" />
        <button type="button" className="vo-insert-close" onClick={onClose} ref={closeRef}>
          <X size={16} />
          <span className="sr-only">Chiudi</span>
        </button>

        <span className="vo-insert-kicker">Le Lettere dell&apos;Autrice</span>
        <h2 id="vo-insert-title">Vuoi restare vicino al racconto?</h2>
        <p>
          Una corrispondenza diretta tra me e te. Niente rumore di fondo, solo frammenti
          inediti, novità in anteprima e pensieri intimi che partono dal mio tavolo di
          lavoro per arrivare al tuo schermo.
        </p>
        <ValentinaNewsletterForm compact sent={sent} pending={pending} error={error} onSubmit={onSubmit} />
        <span className="vo-insert-mark" aria-hidden="true">
          龍
        </span>
      </motion.div>
    </motion.div>
  );
}
