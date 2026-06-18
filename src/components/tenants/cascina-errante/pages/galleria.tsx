"use client";

import Link from "next/link";
import { CalendarDays, ChefHat, Leaf, Sparkles, Users } from "lucide-react";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const events = [
  ["Wedding Party Villa Bellavista", "Settembre 2024", "120 ospiti", "Matrimonio"],
  ["Corporate Event Tesla Italia", "Agosto 2024", "80 ospiti", "Aziendale"],
  ["Festival Gastronomico", "Luglio 2024", "500 ospiti", "Festival"],
  ["Private Dinner Resort", "Giugno 2024", "24 ospiti", "Cena Privata"],
] as const;

export function CascinaErranteGalleryPage() {
  const href = useTenantLocalizedHref();

  return (
    <div className="ce-site">
      <section className="ce-page-hero ce-page-hero-forest">
        <p>Galleria</p>
        <h1>Ogni esperienza racconta una storia.</h1>
        <blockquote>
          Produzione a vista, brigata attore, ingredienti della cascina ed eventi
          itineranti: il mondo Errante prende forma davanti agli ospiti.
        </blockquote>
      </section>

      <section className="ce-gallery-scenes">
        <article>
          <ChefHat size={36} />
          <h2>Il Teatro della Cucina</h2>
          <p>Dieci posti esclusivi intorno alla cucina centrale in vetro.</p>
        </article>
        <article>
          <Leaf size={36} />
          <h2>Produzione a Vista</h2>
          <p>Serre idroponiche e ingredienti osservabili durante l&apos;intero ciclo.</p>
        </article>
        <article>
          <Sparkles size={36} />
          <h2>La Brigata Attore</h2>
          <p>Gli chef raccontano ogni ingrediente mentre lo trasformano.</p>
        </article>
      </section>

      <section className="ce-events-gallery">
        <div className="ce-heading">
          <p>Eventi & Privé</p>
          <h2>Eventi Realizzati</h2>
          <span>
            Alcuni dei momenti speciali che la brigata Errante ha contribuito a
            rendere indimenticabili.
          </span>
        </div>
        <div>
          {events.map(([title, date, guests, type], index) => (
            <article key={title} className={`ce-event-card ce-event-card-${index + 1}`}>
              <CalendarDays size={25} />
              <span>{date}</span>
              <h3>{title}</h3>
              <p><Users size={16} /> {guests} · {type}</p>
            </article>
          ))}
        </div>
        <Link href={href("/prenota")} className="ce-button ce-button-forest">
          Richiedi un evento su misura
        </Link>
      </section>
    </div>
  );
}
