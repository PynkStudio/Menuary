"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChefHat,
  Leaf,
  Mountain,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { VenueWhatsappLink } from "@/components/modules/reservations/venue-display";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const experiences = [
  {
    title: "La Cascina",
    text: "Un fienile trasformato in teatro gastronomico, con produzione a vista e ingredienti raccolti nel loro momento migliore.",
    href: "/chi-siamo",
    icon: ChefHat,
  },
  {
    title: "La Bottega",
    text: "Prodotti freschi, conserve, mieli aromatici e preparazioni nate dalla ricerca agricola della cascina.",
    href: "/menu",
    icon: ShoppingBag,
  },
  {
    title: "Errante Adventure",
    text: "Liofilizzati gourmet e kit outdoor per portare la cucina di Cascina Errante anche fuori dai sentieri battuti.",
    href: "/galleria",
    icon: Mountain,
  },
  {
    title: "Eventi e prive",
    text: "Esperienze itineranti, food truck premium e cene su misura per aziende, team e occasioni speciali.",
    href: "/prenota",
    icon: CalendarDays,
  },
];

const production = [
  "Microgreens e fiori edibili",
  "Erbe aromatiche idroponiche",
  "Mieli e conserve della casa",
  "Uova di papera e prodotti di cascina",
];

export function CascinaErranteHomePage() {
  const href = useTenantLocalizedHref();

  return (
    <div className="cascina-page">
      <section className="cascina-hero">
        <div className="cascina-hero-inner">
          <div className="cascina-hero-copy">
            <p className="cascina-kicker">Ristorante demo Menuary · Lombardia</p>
            <Image
              src="/cascina-errante/logo-horizontal.png"
              alt="Cascina Errante"
              width={902}
              height={264}
              priority
              className="cascina-hero-logo"
            />
            <h1>Poesia agricola, cucina a vista, fantasia operativa.</h1>
            <p className="cascina-lead">
              Cascina Errante e il tenant demo dove Menuary mostra tutto: menu,
              ordini, prenotazioni, cassa, staff, AI, pagamenti sandbox e moduli
              di crescita accesi insieme in un ristorante immaginato per testare
              il mondo reale.
            </p>
            <div className="cascina-actions">
              <Link href={href("/menu")} className="cascina-btn cascina-btn-primary">
                <UtensilsCrossed size={19} />
                Esplora il menu
              </Link>
              <VenueWhatsappLink className="cascina-btn cascina-btn-secondary">
                <CalendarDays size={19} />
                Prenota
              </VenueWhatsappLink>
            </div>
          </div>

          <div className="cascina-hero-board" aria-label="Punti chiave Cascina Errante">
            <div className="cascina-board-main">
              <Sparkles size={30} />
              <p>Ristorante laboratorio</p>
              <span>Front row cucina, sala panoramica, produzione osservabile.</span>
            </div>
            <div className="cascina-board-stat">
              <strong>10</strong>
              <span>posti chef table</span>
            </div>
            <div className="cascina-board-stat">
              <strong>20</strong>
              <span>tavoli in sala</span>
            </div>
          </div>
        </div>
      </section>

      <section className="cascina-band cascina-band-light">
        <div className="cascina-section-head">
          <p className="cascina-kicker">Quattro anime</p>
          <h2>Un tenant demo completo, con una storia sola.</h2>
        </div>
        <div className="cascina-experience-grid">
          {experiences.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={href(item.href)} className="cascina-experience">
                <Icon size={26} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span>
                  Apri <ArrowRight size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="cascina-production">
        <div>
          <p className="cascina-kicker">Produzione a vista</p>
          <h2>Ingredienti che diventano racconto prima di diventare piatto.</h2>
          <p>
            Il concept nasce intorno a serre idroponiche, pareti in vetro e una
            brigata che cucina davanti agli ospiti. Ogni modulo Menuary puo
            dialogare con questa narrazione: disponibilita prodotto, food cost,
            ordini, prenotazioni e comunicazioni automatiche.
          </p>
        </div>
        <ul>
          {production.map((item) => (
            <li key={item}>
              <Leaf size={18} />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="cascina-band cascina-band-dark">
        <div className="cascina-demo-panel">
          <ChefHat size={34} />
          <h2>Demo attiva con tutte le feature accese.</h2>
          <p>
            Usa Cascina Errante per provare l&apos;intero stack operativo Menuary:
            ordini al tavolo e asporto, kiosk, sala, cassa, CRM, fidelity,
            analytics, AI phone, AI WhatsApp, HubRise, newsletter, blog,
            linktree, pagamenti Stripe in sandbox e gestione completa.
          </p>
          <Link href={href("/ordina")} className="cascina-btn cascina-btn-primary">
            <ShoppingBag size={19} />
            Prova un ordine
          </Link>
        </div>
      </section>
    </div>
  );
}
