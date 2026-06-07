"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { Mail, X } from "lucide-react";

const newsletterStorageKey = "valentina-orciuoli-newsletter-popup-seen";

export function useValentinaNewsletter() {
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [newsletterSent, setNewsletterSent] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(newsletterStorageKey)) return;

      window.localStorage.setItem(newsletterStorageKey, "true");
      const popupTimer = window.setTimeout(() => setShowNewsletterPopup(true), 700);

      return () => window.clearTimeout(popupTimer);
    } catch {
      setShowNewsletterPopup(true);
    }
  }, []);

  function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsletterSent(true);
    setShowNewsletterPopup(false);
  }

  return {
    newsletterSent,
    showNewsletterPopup,
    closeNewsletterPopup: () => setShowNewsletterPopup(false),
    handleNewsletterSubmit,
  };
}

export function ValentinaNewsletterPanel({
  sent,
  onSubmit,
}: {
  sent: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div id="newsletter" className="vo-newsletter-panel">
      <span className="vo-dragon-mark">Vuoi saperne di più su Valentina?</span>
      <p>
        Iscriviti con il tuo indirizzo email per ricevere notizie, aggiornamenti
        e contenuti esclusivi.
      </p>
      <ValentinaNewsletterForm sent={sent} onSubmit={onSubmit} />
    </div>
  );
}

export function ValentinaNewsletterPopup({
  open,
  sent,
  onClose,
  onSubmit,
}: {
  open: boolean;
  sent: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!open) return null;

  return (
    <div className="vo-newsletter-modal" role="presentation">
      <motion.div
        className="vo-newsletter-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vo-newsletter-title"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <button
          className="vo-newsletter-close"
          type="button"
          aria-label="Chiudi newsletter"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <Mail className="vo-newsletter-icon" size={24} aria-hidden="true" />
        <span className="vo-dragon-mark">Newsletter</span>
        <h2 id="vo-newsletter-title">Vuoi saperne di più su Valentina?</h2>
        <p>
          Iscriviti con il tuo indirizzo email per ricevere notizie, aggiornamenti
          e contenuti esclusivi.
        </p>
        <ValentinaNewsletterForm sent={sent} onSubmit={onSubmit} compact />
      </motion.div>
    </div>
  );
}

function ValentinaNewsletterForm({
  compact = false,
  sent,
  onSubmit,
}: {
  compact?: boolean;
  sent: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="vo-newsletter-form" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor={compact ? "vo-popup-email" : "vo-newsletter-email"}>
        Indirizzo email
      </label>
      <input
        id={compact ? "vo-popup-email" : "vo-newsletter-email"}
        name="email"
        type="email"
        placeholder="La tua email"
        required
      />
      <button type="submit">Iscriviti</button>
      {sent ? <small>Grazie, la tua iscrizione è stata registrata.</small> : null}
    </form>
  );
}
