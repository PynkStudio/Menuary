"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { voHref, voRoute } from "@/components/tenants/valentina-orciuoli/routes";

export function useValentinaNewsletter() {
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [newsletterPending, setNewsletterPending] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  async function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    // Il checkbox è `required`, ma leggiamo il suo valore reale invece di darlo
    // per scontato: se in futuro il form venisse inviato via `requestSubmit()`
    // saltando la validazione nativa, il consenso resterebbe comunque esplicito.
    const consent = form.get("consent") === "on";
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
          consent,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Iscrizione non riuscita.");
      setNewsletterSent(true);
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
    handleNewsletterSubmit,
  };
}

export function ValentinaNewsletterForm({
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
  /**
   * L'informativa cui questo consenso si riferisce deve essere **quella del
   * tenant**, e va raggiunta dall'indirizzo da cui si sta leggendo.
   *
   * Qui c'era un `/privacy` nudo: sul dominio custom cadeva per caso sulla
   * pagina giusta, in preview finiva sull'informativa della piattaforma. È il
   * link peggiore da sbagliare — sta accanto alla casella con cui si presta il
   * consenso — e per questo prende il prefisso di host e lingua come ogni
   * altro link del volume.
   */
  const privacyHref = voHref("/privacy", voRoute(usePathname() ?? ""));

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
        <span>Accetto la <Link href={privacyHref}>privacy policy</Link> e l&apos;invio della newsletter.</span>
      </label>
      {sent ? <small>Controlla la tua casella email: ti abbiamo mandato un link per confermare l&apos;iscrizione.</small> : null}
      {error ? <small role="alert">{error}</small> : null}
    </form>
  );
}
