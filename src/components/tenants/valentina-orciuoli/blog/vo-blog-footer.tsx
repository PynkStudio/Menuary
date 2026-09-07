"use client";

import Link from "next/link";
import { useValentinaNewsletter, ValentinaNewsletterForm } from "@/components/tenants/valentina-orciuoli/newsletter";

export function VoBlogFooter({
  homeHref,
  privacyHref,
  cookieHref,
  gestioneHref,
}: {
  homeHref: string;
  privacyHref: string;
  cookieHref: string;
  gestioneHref: string;
}) {
  const newsletter = useValentinaNewsletter();

  return (
    <footer className="vo-blog-footer">
      <div className="vo-blog-footer-newsletter">
        <span className="vo-blog-kicker">Non perderti i prossimi appunti</span>
        <h2>Una lettera ogni tanto, mai spam.</h2>
        <ValentinaNewsletterForm
          sent={newsletter.newsletterSent}
          pending={newsletter.newsletterPending}
          error={newsletter.newsletterError}
          onSubmit={newsletter.handleNewsletterSubmit}
        />
      </div>
      {/* Stessa struttura del piede del volume: proprietà, note legali, area
          riservata e le due firme della piattaforma. */}
      <div className="vo-blog-footer-links">
        <Link href={homeHref}>© {new Date().getFullYear()} Valentina Orciuoli</Link>
        <span>
          <Link href={privacyHref}>Privacy Policy</Link>
          <Link href={cookieHref}>Cookie Policy</Link>
          <a href={gestioneHref} target="_blank" rel="noopener noreferrer">Gestione</a>
        </span>
        <span>
          Realizzato da{" "}
          <a href="https://pynkstudio.eu" target="_blank" rel="noopener noreferrer">PynkStudio</a>
          {" · "}
          <a href="https://weuseorpheo.com" target="_blank" rel="noopener noreferrer">Powered by Orpheo</a>
        </span>
      </div>
    </footer>
  );
}
