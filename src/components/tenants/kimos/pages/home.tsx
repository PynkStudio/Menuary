"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Flame,
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  ShoppingBag,
  Star,
} from "lucide-react";
import { Footer } from "@/components/tenant-shell/footer";
import { ReviewsSection } from "@/components/modules/reviews/reviews-section";
import {
  VenueAddressBlock,
  VenueGoogleMapsLink,
  VenueHoursList,
  VenueMapFrame,
  VenuePhoneDisplay,
  VenueWhatsappLink,
} from "@/components/modules/reservations/venue-display";
import { getTenantContent } from "@/lib/tenant-content";
import { getGoogleRatingForTenant } from "@/lib/reviews-data";
import { useTenant } from "@/components/core/tenant-provider";

const categories = [
  {
    title: "Pizze",
    body: "Classiche, giganti, rosse, bianche e componibili.",
    tag: "Forno",
  },
  {
    title: "Kebab",
    body: "Panino, piadina, piatto e menu con patatine.",
    tag: "Spiedo",
  },
  {
    title: "Panini",
    body: "Cotoletta, hamburger, falafel e salse di casa.",
    tag: "Grill",
  },
  {
    title: "Fritti",
    body: "Patatine, crocchette, nuggets, alette e box misti.",
    tag: "Fryer",
  },
];

const highlights = [
  {
    title: "Pizza Kimos",
    body: "Pomodoro San Marzano, fior di latte, salame piccante e olio EVO. Pronta in 8 minuti.",
    price: "€ 9,50",
  },
  {
    title: "Kebab nel pane",
    body: "Pane caldo, vitello e pollo allo spiedo, salse di casa. Aggiungi patatine al menu.",
    price: "€ 7,00",
  },
  {
    title: "Box famiglia",
    body: "Due pizze giganti, kebab in piatto, fritti misti e bibite. Pensato per quattro.",
    price: "€ 32,00",
  },
];

export function KimosHomePage() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const rating = getGoogleRatingForTenant(tenant.id);
  const menuHref = `/${tenant.previewSlug ?? tenant.id}/menu`;

  return (
    <main className="km-site">
      <header className="km-header">
        <a href="#top" className="km-brand" aria-label="Pizzeria Kimos home">
          <Image src="/kimos/logo.svg" alt="Pizzeria Kimos" width={210} height={64} priority />
        </a>
        <nav className="km-nav" aria-label="Navigazione principale">
          <Link href={menuHref}>Menu</Link>
          <a href="#recensioni">Recensioni</a>
          <a href="#contatti">Contatti</a>
        </nav>
        <Link href={menuHref} className="km-button km-button-hot km-header-order">
          Ordina <ShoppingBag size={16} />
        </Link>
      </header>

      <section id="top" className="km-hero">
        <div className="km-hero-copy">
          <p className="km-kicker">Pizzeria &amp; Kebab · Santa Giulia, Milano</p>
          <h1>
            Pizza e kebab
            <br />
            <span>come si deve.</span>
          </h1>
          <p className="km-hero-text">
            Forno caldo, spiedo che gira, panini e fritti fatti al momento.
            Da Kimos in zona Santa Giulia ordini, passi a ritirare o te lo portiamo noi.
          </p>
          <div className="km-hero-tags" aria-label="Punti forti Kimos">
            <span><Flame size={13} /> Forno a legna</span>
            <span><Flame size={13} /> Spiedo kebab</span>
            <span><Clock3 size={13} /> Ritiro in 15 min</span>
          </div>
          <div className="km-actions">
            <Link href={menuHref} className="km-button km-button-hot">
              Guarda il menu <ArrowRight size={17} />
            </Link>
            <VenueWhatsappLink className="km-button km-button-outline">
              <MessageCircle size={17} /> Ordina su WhatsApp
            </VenueWhatsappLink>
          </div>
          <a
            href={rating.profileUrl}
            className="km-rating"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${rating.average.toFixed(1)} su Google, ${rating.count} recensioni`}
          >
            <span className="km-rating-score">{rating.average.toFixed(1).replace(".", ",")}</span>
            <span className="km-rating-star"><Star size={15} fill="currentColor" /></span>
            <span>{rating.count} recensioni Google</span>
          </a>
        </div>

        <div className="km-hero-board" aria-label="Menu fotografico Pizzeria Kimos">
          <div className="km-board-photo km-board-photo-main">
            <Image
              src="/kimos/menu-board-spread.png"
              alt="Menu fotografico Kimos con panini kebab, piadine, fritti e piatti"
              fill
              priority
              sizes="(max-width: 900px) 92vw, 47vw"
            />
          </div>
          <div className="km-board-photo km-board-photo-side">
            <Image
              src="/kimos/menu-board-kebab.png"
              alt="Pagina menu Kimos dedicata a kebab e panini"
              fill
              sizes="(max-width: 900px) 38vw, 14vw"
            />
          </div>
          <div className="km-board-photo km-board-photo-plates">
            <Image
              src="/kimos/menu-board-plates.png"
              alt="Pagina menu Kimos con pizze, fritti e piatti pronti"
              fill
              sizes="(max-width: 900px) 52vw, 19vw"
            />
          </div>
          <div className="km-board-stamp">
            <span>APERTO</span>
            <strong>7 / 7</strong>
          </div>
          <div className="km-order-ticket" aria-label="Ordini Pizzeria Kimos">
            <PhoneCall size={18} />
            <div>
              <strong>Ordini</strong>
              <span>telefono, WhatsApp e online</span>
            </div>
          </div>
        </div>
      </section>

      <section className="km-marquee" aria-label="Specialità Kimos">
        <span>Pizza</span>
        <i aria-hidden="true" />
        <span>Kebab</span>
        <i aria-hidden="true" />
        <span>Fritti</span>
        <i aria-hidden="true" />
        <span>Panini</span>
        <i aria-hidden="true" />
        <span>Consegna a domicilio</span>
      </section>

      <section className="km-intro">
        <div>
          <h2>La nostra<br /><span>carta.</span></h2>
          <p className="km-intro-sub">
            Tutto quello che prepariamo ogni giorno, dal forno e dallo spiedo.
          </p>
        </div>
        <div>
          <div className="km-category-grid">
            {categories.map(({ title, body, tag }) => (
              <Link key={title} href={menuHref} className="km-category">
                <span className="km-category-tag">{tag}</span>
                <strong>{title}</strong>
                <small>{body}</small>
                <em><ArrowRight size={14} /> Vedi</em>
              </Link>
            ))}
          </div>
          <Link href={menuHref} className="km-button km-button-hot km-intro-cta">
            Menu completo con prezzi <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section id="menu" className="km-highlight">
        <div className="km-section-heading">
          <h2>I più<br /><span>ordinati.</span></h2>
          <p>Tre scelte dalla carta di Kimos: pizza, kebab e un ordine da condividere in famiglia.</p>
        </div>
        <div className="km-highlight-grid">
          {highlights.map(({ title, body, price }) => (
            <article key={title} className="km-highlight-card">
              <header>
                <em>{price}</em>
              </header>
              <h3>{title}</h3>
              <p>{body}</p>
              <Link href={menuHref} className="km-highlight-cta">
                Ordina <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
        <div className="km-highlight-foot">
          <Flame size={18} />
          <span>Prezzi e disponibilità aggiornati nel menu online.</span>
        </div>
      </section>

      <div id="recensioni" className="km-reviews">
        <ReviewsSection />
      </div>

      <section id="contatti" className="km-visit">
        <div className="km-visit-copy">
          <h2>Dove<br /><span>trovarci.</span></h2>
          <p className="km-visit-text">
            A pochi minuti da Milano Rogoredo. Passa da Kimos oppure ordina per
            il ritiro o la consegna a domicilio.
          </p>
          <dl className="km-contact-list">
            <div>
              <dt><MapPin size={17} /> Indirizzo</dt>
              <dd><VenueAddressBlock multiline={false} /></dd>
            </div>
            <div>
              <dt><Phone size={17} /> Telefono</dt>
              <dd><VenuePhoneDisplay /></dd>
            </div>
            <div>
              <dt><Clock3 size={17} /> Orari</dt>
              <VenueHoursList variant="find-us" />
            </div>
          </dl>
          <div className="km-visit-actions">
            <VenueWhatsappLink className="km-button km-button-hot">
              <MessageCircle size={16} /> Scrivi su WhatsApp
            </VenueWhatsappLink>
            <a href="tel:02513404" className="km-button km-button-outline km-button-outline-dark">
              <Phone size={16} /> Chiama
            </a>
            <VenueGoogleMapsLink className="km-button km-button-outline km-button-outline-dark">
              Google Maps <ExternalLink size={16} />
            </VenueGoogleMapsLink>
          </div>
        </div>
        <div className="km-map">
          <VenueMapFrame title={content.findUs.mapTitle} className="h-full w-full" />
        </div>
      </section>

      <div className="km-footer">
        <Footer />
      </div>
    </main>
  );
}
