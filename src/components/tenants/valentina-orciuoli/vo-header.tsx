/* eslint-disable @next/next/no-img-element */
import { Instagram, Music2 } from "lucide-react";
import { instagramHref, tiktokHref, valentinaBasePath } from "./content";

export function ValentinaOrciuoliHeader({ variant = "default" }: { variant?: "default" | "home" }) {
  if (variant === "default") {
    return (
      <header className="vo-header">
        <a className="vo-brand" href={valentinaBasePath} aria-label="Valentina Orciuoli">
          <span className="vo-brand-mark">
            <img src="/valentina-orciuoli/logo.png" alt="" aria-hidden="true" />
          </span>
        </a>
        <nav className="vo-nav" aria-label="Menu principale">
          <a href={valentinaBasePath}>Home</a>
          <a href={`${valentinaBasePath}/libri`}>Libri</a>
          <a href={`${valentinaBasePath}/autrice`}>Autrice</a>
          <a href={`${valentinaBasePath}/eventi`}>Eventi</a>
          <a href={`${valentinaBasePath}/contatti`}>Contatti</a>
        </nav>
      </header>
    );
  }

  return (
    <header className="vo-header">
      <nav className="vo-nav vo-nav-primary" aria-label="Menu principale">
        <a href={valentinaBasePath}>Home</a>
        <a href={`${valentinaBasePath}/libri`}>Libri</a>
        <a href={`${valentinaBasePath}/autrice`}>Chi sono</a>
      </nav>
      <a className="vo-brand" href={valentinaBasePath} aria-label="Valentina Orciuoli, home">
        <span className="vo-brand-mark" aria-hidden="true">VO</span>
      </a>
      <nav className="vo-nav vo-nav-secondary" aria-label="Altre pagine">
        <a href={`${valentinaBasePath}/eventi`}>Eventi</a>
        <a href={`${valentinaBasePath}/contatti`}>Contatti</a>
      </nav>
      <div className="vo-header-socials" aria-label="Social">
        <a href={instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <Instagram size={18} strokeWidth={1.7} />
        </a>
        <a href={tiktokHref} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <Music2 size={18} strokeWidth={1.7} />
        </a>
      </div>
      <a className="vo-mobile-menu-link" href={`${valentinaBasePath}/libri`}>
        Menu libri
      </a>
    </header>
  );
}
