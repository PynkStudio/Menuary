"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Send,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";

const heroImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=85";

const storyImage =
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=85";

const menuItems = [
  {
    name: "Pique Macho",
    price: "15€",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=900&q=85",
    desc: "Manzo, salsicce, cipolla, pomodori, paprika, uova e patate.",
  },
  {
    name: "Planchita",
    price: "25€",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=85",
    desc: "Costata di manzo, cipolla, pomodoro, salsiccia, pollo, uova e manioca.",
  },
  {
    name: "Fideos Uchu",
    price: "10€",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85",
    desc: "Manzo, pasta, cipolla, pomodori, piselli, uova, fagioli, carota e patate.",
  },
  {
    name: "Silpancho",
    price: "12€",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=85",
    desc: "Manzo impanato, riso, cipolla, pomodori, paprika, uova e patatine fritte.",
  },
];

export function JuniorFoodHomePage() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const [sent, setSent] = useState(false);

  const phoneHref = `tel:${content.contact.phone.replace(/[^\d+]/g, "")}`;
  const mapsHref = content.maps.searchUrl;

  return (
    <main className="jf-site">
      <header className="jf-header">
        <a className="jf-brand" href="#top" aria-label="Junior Food home">
          Junior Food
        </a>
        <nav className="jf-nav" aria-label="Menu principale">
          <a href="#menu">Menu</a>
          <a href="#storia">La Storia</a>
          <a href="#visita">Visita</a>
          <a href="#contatti">Contatti</a>
        </nav>
        <a className="jf-button jf-button-primary jf-header-cta" href="#prenota">
          Prenota
        </a>
      </header>

      <section id="top" className="jf-hero">
        <div className="jf-hero-copy">
          <div className="jf-overline">
            <span aria-hidden="true" />
            Autentica cucina Sud Americana
          </div>
          <h1>Assapora il ritmo del Sud America nel tuo piatto.</h1>
          <p className="jf-hero-text">
            La tradizione culinaria latina incontra il gusto contemporaneo. Scopri il nostro menu tra specialita iconiche, street food gourmet e cocktail esotici pensati per accendere la tua serata.
          </p>
          <div className="jf-hero-actions">
            <a className="jf-button jf-button-primary" href="#prenota">
              Prenota <ArrowRight size={17} />
            </a>
            <a className="jf-button jf-button-outline" href="#menu">
              Menu
            </a>
          </div>
          <div className="jf-rating" aria-label="Google Rating 4.0">
            <strong>4.0</strong>
            <Star size={24} fill="currentColor" aria-hidden="true" />
            <span>Google Rating</span>
          </div>
        </div>

        <div className="jf-hero-media">
          <Image
            src={heroImage}
            alt="Feijoada servita in tavola"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 42vw"
          />
          <div className="jf-special-card">
            <span>Specialita</span>
            <strong>Feijoada</strong>
          </div>
        </div>
      </section>

      <section id="storia" className="jf-story">
        <div className="jf-story-image">
          <Image
            src={storyImage}
            alt="Cena conviviale con piatti sudamericani"
            fill
            sizes="(max-width: 900px) 100vw, 28vw"
          />
        </div>
        <div className="jf-story-copy">
          <p className="jf-section-label">La nostra Storia</p>
          <h2>I veri profumi dell&apos;America Latina</h2>
          <p>
            Junior nasce per essere un ponte tra culture, dove la cottura lenta della carne alla griglia e la freschezza degli ingredienti tropicali si incontrano. Per noi la tavola e sinonimo di festa, accoglienza e storie da condividere.
          </p>
        </div>
      </section>

      <section id="menu" className="jf-menu">
        <div className="jf-section-head">
          <p className="jf-section-label">Il menu</p>
          <h2>I piu amati</h2>
        </div>
        <div className="jf-dishes" role="list">
          {menuItems.map((item) => (
            <article key={item.name} className="jf-dish" role="listitem">
              <div className="jf-dish-image">
                <Image src={item.image} alt={item.name} fill sizes="(max-width: 900px) 100vw, 22vw" />
              </div>
              <div className="jf-dish-title">
                <h3>{item.name}</h3>
                <strong>{item.price}</strong>
              </div>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="visita" className="jf-visit">
        <div className="jf-visit-panel">
          <h2>Vieni a trovarci</h2>
          <p>
            Siamo nascosti in un angolo tranquillo del centro storico. I clienti senza prenotazione sono i benvenuti, ma per la cena consigliamo di prenotare.
          </p>
          <dl className="jf-visit-info">
            <div>
              <dt>
                <MapPin size={18} /> Indirizzo
              </dt>
              <dd>{content.address.full}</dd>
            </div>
            <div>
              <dt>
                <Clock size={18} /> Pranzo
              </dt>
              <dd>12:00 - 15:00</dd>
            </div>
            <div>
              <dt>
                <Clock size={18} /> Cena
              </dt>
              <dd>15:00 - 00:00</dd>
            </div>
            <div>
              <dt>
                <Phone size={18} /> Prenotazione
              </dt>
              <dd>
                <a href={phoneHref}>{content.contact.phone}</a>
              </dd>
            </div>
          </dl>
          <a className="jf-button jf-button-light" href={mapsHref} target="_blank" rel="noopener noreferrer">
            Get direction <ArrowRight size={16} />
          </a>
        </div>
        <div className="jf-map" aria-label={content.findUs.mapTitle}>
          <div className="jf-map-roads" aria-hidden="true">
            <span className="jf-road jf-road-one" />
            <span className="jf-road jf-road-two" />
            <span className="jf-road jf-road-three" />
            <span className="jf-road jf-road-four" />
          </div>
          <div className="jf-map-pin">
            <MapPin size={22} aria-hidden="true" />
            <strong>Junior Food</strong>
            <small>{content.address.full}</small>
          </div>
        </div>
      </section>

      <section id="prenota" className="jf-booking">
        <div className="jf-section-head jf-section-head-center">
          <p className="jf-section-label">Prenotazioni</p>
          <h2>Prenota il tuo tavolo</h2>
          <p>Inviaci un messaggio e ti daremo conferma entro un&apos;ora.</p>
        </div>

        <form
          className="jf-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <label>
            <span>Nome</span>
            <input name="name" type="text" required />
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" required />
          </label>
          <label>
            <span>Data</span>
            <input name="date" type="date" required />
          </label>
          <label>
            <span>Numero di persone</span>
            <input name="people" type="number" min="1" max="20" required />
          </label>
          <label className="jf-form-wide">
            <span>Descrizione richiesta (opzionale)</span>
            <textarea name="message" rows={5} />
          </label>
          <button className="jf-submit" type="submit">
            {sent ? (
              <>
                <CheckCircle2 size={20} /> Richiesta inviata
              </>
            ) : (
              <>
                Conferma richiesta <Send size={18} />
              </>
            )}
          </button>
        </form>
      </section>

      <footer id="contatti" className="jf-footer">
        <a className="jf-brand" href="#top">
          junior food
        </a>
        <div className="jf-footer-links">
          <a href="#menu">
            <UtensilsCrossed size={16} /> Menu
          </a>
          <a href="#prenota">
            <CalendarDays size={16} /> Prenota
          </a>
          <a href={phoneHref}>
            <Phone size={16} /> {content.contact.phone}
          </a>
        </div>
        <p>© 2026 — Made in Bergamo.</p>
      </footer>
    </main>
  );
}
