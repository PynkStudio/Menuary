"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import Link from "next/link";

const newsletterStorageKey = "valentina-orciuoli-newsletter-popup-seen";

export function useValentinaNewsletter() {
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [newsletterPending, setNewsletterPending] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(newsletterStorageKey)) return;

      window.localStorage.setItem(newsletterStorageKey, "true");
      setShowNewsletterPopup(true);
    } catch {
      setShowNewsletterPopup(true);
    }
  }, []);

  useEffect(() => {
    if (!showNewsletterPopup) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [showNewsletterPopup]);

  async function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    setNewsletterPending(true);
    setNewsletterError(null);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "valentina-orciuoli",
          email,
          locale: document.documentElement.lang || "it",
          source: "valentina_orciuoli_site",
          consent: true,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Iscrizione non riuscita.");
      setNewsletterSent(true);
      setShowNewsletterPopup(false);
    } catch (error) {
      setNewsletterError(error instanceof Error ? error.message : "Iscrizione non riuscita.");
    } finally {
      setNewsletterPending(false);
    }
  }

  return {
    newsletterSent,
    newsletterPending,
    newsletterError,
    showNewsletterPopup,
    closeNewsletterPopup: () => setShowNewsletterPopup(false),
    handleNewsletterSubmit,
  };
}

export function ValentinaNewsletterPanel({
  sent,
  pending,
  error,
  onSubmit,
}: {
  sent: boolean;
  pending: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div id="newsletter" className="vo-newsletter-panel">
      <span className="vo-dragon-mark">Vuoi saperne di più su Valentina?</span>
      <p>
        Iscriviti con il tuo indirizzo email per ricevere notizie, aggiornamenti
        e contenuti esclusivi.
      </p>
      <ValentinaNewsletterForm sent={sent} pending={pending} error={error} onSubmit={onSubmit} />
    </div>
  );
}

export function ValentinaNewsletterPopup({
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
  if (!open) return null;

  return (
    <motion.div
      className="vo-newsletter-modal"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <motion.div
        className="vo-newsletter-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vo-newsletter-title"
        initial={{ opacity: 0, y: 34, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          className="vo-newsletter-close"
          type="button"
          aria-label="Chiudi newsletter"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <h2 id="vo-newsletter-title">Vuoi saperne di più su Valentina?</h2>
        <p>
          Iscriviti con il tuo indirizzo email per ricevere notizie, aggiornamenti
          e contenuti esclusivi.
        </p>
        <ValentinaNewsletterForm sent={sent} pending={pending} error={error} onSubmit={onSubmit} compact />
      </motion.div>
    </motion.div>
  );
}

function ValentinaNewsletterForm({
  compact = false,
  sent,
  pending,
  error,
  onSubmit,
}: {
  compact?: boolean;
  sent: boolean;
  pending: boolean;
  error: string | null;
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
      <button type="submit" disabled={pending}>{pending ? "Iscrizione..." : "Iscriviti"}</button>
      <label className="vo-newsletter-consent">
        <input name="consent" type="checkbox" required />
        <span>Accetto la <Link href="/privacy">privacy policy</Link> e l&apos;invio della newsletter.</span>
      </label>
      {sent ? <small>Grazie, la tua iscrizione è stata registrata.</small> : null}
      {error ? <small role="alert">{error}</small> : null}
    </form>
  );
}
