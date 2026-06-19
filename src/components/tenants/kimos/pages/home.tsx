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
  UtensilsCrossed,
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
    code: "01",
    title: "Pizze",
    body: "Classiche, giganti, rosse, bianche e componibili.",
    tag: "Forno",
  },
  {
    code: "02",
    title: "Kebab",
    body: "Panino, piadina, piatto e menu con patatine.",
    tag: "Spiedo",
  },
  {
    code: "03",
    title: "Panini",
    body: "Cotoletta, hamburger, falafel e salse di casa.",
    tag: "Grill",
  },
  {
    code: "04",
    title: "Fritti",
    body: "Patatine, crocchette, nuggets, alette e box misti.",
    tag: "Fryer",
  },
];

const highlights = [
  {
    code: "MENU 01",
    title: "Pizza Kimos",
    body: "Pomodoro San Marzano, fior di latte, salame piccante e olio EVO. Pronta in 8 minuti.",
    price: "€ 9,50",
  },
  {
    code: "MENU 02",
    title: "Kebab nel pane",
    body: "Pane caldo, vitello e pollo allo spiedo, salse di casa. Aggiungi patatine al menu.",
    price: "€ 7,00",
  },
  {
    code: "MENU 03",
    title: "Box famiglia",
    body: "Due pizze giganti, kebab in piatto, fritti misti e bibite. Pensato per quattro.",
    price: "€ 32,00",
  },
];

const channels = [
  {
    icon: ShoppingBag,
    eyebrow: "MENU",
    title: "Guarda la carta",
    body: "Pizze, kebab, panini e fritti con prezzi chiari prima di ordinare.",
  },
  {
    icon: MessageCircle,
    eyebrow: "WHATSAPP",
    title: "Scrivi al locale",
    body: "Manda l'ordine, indica ritiro o consegna e ricevi conferma da Kimos.",
  },
  {
    icon: PhoneCall,
    eyebrow: "TELEFONO",
    title: "Chiama Kimos",
    body: "Per ordini veloci, richieste sulla pizza gigante o indicazioni sulla consegna.",
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
          <a href="#ordina">Ordina</a>
          <a href="#recensioni">Recensioni</a>
          <a href="#contatti">Contatti</a>
        </nav>
        <Link href={menuHref} className="km-button km-button-hot km-header-order">
          Ordina <ShoppingBag size={16} />
        </Link>
      </header>

      <section id="top" className="km-hero">
        <div className="km-hero-copy">
          <p className="km-kicker">Santa Giulia · Milano · dal forno allo spiedo</p>
          <h1>
            Kimos.
            <br />
            Pizza.
            <br />
            <span>Kebab.</span>
          </h1>
          <p className="km-hero-text">
            Pizza al forno, kebab allo spiedo, panini e fritti in zona Santa Giulia.
            Guarda il menu, scegli cosa mangiare e ordina per ritiro o consegna.
          </p>
          <div className="km-hero-tags" aria-label="Punti forti Kimos">
            <span>Forno caldo</span>
            <span>Spiedo kebab</span>
            <span>Ritiro rapido</span>
          </div>
          <div className="km-actions">
            <Link href={menuHref} className="km-button km-button-hot">
              Vai al menu <ArrowRight size={17} />
            </Link>
            <VenueWhatsappLink className="km-button km-button-outline">
              <MessageCircle size={17} /> Scrivi su WhatsApp
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
          <div className="km-board-label">Menu fotografico / Kimos</div>
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
              <span>menu online, telefono e WhatsApp</span>
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
        <span>Ritiro e consegna</span>
      </section>

      <section className="km-intro">
        <div>
          <p className="km-section-code">KMS / 02</p>
          <h2>Pizza, kebab,<br /><span>fritti e panini.</span></h2>
        </div>
        <div>
          <p>
            Da Kimos trovi una carta da pizzeria di quartiere: classiche, giganti,
            kebab, panini, piadine, piatti e fritti. Apri il menu, controlli i prezzi
            e decidi subito cosa mettere nell&apos;ordine.
          </p>
          <div className="km-category-grid">
            {categories.map(({ code, title, body, tag }) => (
              <Link key={code} href={menuHref} className="km-category">
                <span>{code} · {tag}</span>
                <strong>{title}</strong>
                <small>{body}</small>
                <em><ArrowRight size={14} /> Apri</em>
              </Link>
            ))}
          </div>
          <Link href={menuHref} className="km-button km-button-hot km-intro-cta">
            Apri il menu completo <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section id="menu" className="km-highlight">
        <div className="km-section-heading">
          <p className="km-section-code">KMS / I PIÙ ORDINATI</p>
          <h2>Quando hai fame,<br /><span>vai sul sicuro.</span></h2>
          <p>Tre scelte dirette dalla carta Kimos: pizza, kebab e un ordine più grande da condividere.</p>
        </div>
        <div className="km-highlight-grid">
          {highlights.map(({ code, title, body, price }) => (
            <article key={code} className="km-highlight-card">
              <header>
                <span>{code}</span>
                <em>{price}</em>
              </header>
              <h3>{title}</h3>
              <p>{body}</p>
              <Link href={menuHref} className="km-highlight-cta">
                Vai al menu <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
        <div className="km-highlight-foot">
          <Flame size={18} />
          <span>Prezzi e disponibilità aggiornati nel menu online.</span>
        </div>
      </section>

      <section id="ordina" className="km-channels">
        <div className="km-section-heading km-section-heading-light">
          <p className="km-section-code">KMS / ORDINI</p>
          <h2>Scegli la pizza.<br /><span>Al resto pensa Kimos.</span></h2>
        </div>
        <div className="km-order-panel">
          <div className="km-order-copy">
            <p className="km-section-code">Ritiro e consegna</p>
            <h3>Ordina dal menu, su WhatsApp o al telefono.</h3>
            <span>
              Scegli cosa vuoi mangiare, indica quantità, orario e indirizzo se serve
              la consegna. Kimos ti conferma l&apos;ordine e prepara tutto in pizzeria.
            </span>
          </div>
          <div className="km-order-steps" aria-label="Informazioni ordini Pizzeria Kimos">
            <p><strong>1</strong><span>Apri il menu e scegli pizze, kebab, panini o fritti.</span></p>
            <p><strong>2</strong><span>Invia l&apos;ordine su WhatsApp o chiama il locale.</span></p>
            <p><strong>3</strong><span>Concorda ritiro in pizzeria o consegna in zona.</span></p>
            <p><strong>4</strong><span>Passa da Via Bruno Cassinari 3 o aspetta la consegna.</span></p>
          </div>
        </div>
        <div className="km-channel-grid">
          {channels.map(({ icon: Icon, eyebrow, title, body }) => (
            <article className="km-channel" key={eyebrow}>
              <div className="km-channel-icon"><Icon size={22} /></div>
              <p>{eyebrow}</p>
              <h3>{title}</h3>
              <span>{body}</span>
            </article>
          ))}
        </div>
        <div className="km-channel-actions">
          <Link href={menuHref} className="km-button km-button-warm">
            Apri il menu <UtensilsCrossed size={17} />
          </Link>
          <VenueWhatsappLink className="km-button km-button-quiet">
            WhatsApp <MessageCircle size={17} />
          </VenueWhatsappLink>
          <a href="tel:02513404" className="km-button km-button-quiet">
            Chiama <Phone size={17} />
          </a>
        </div>
      </section>

      <div id="recensioni" className="km-reviews">
        <ReviewsSection />
      </div>

      <section id="contatti" className="km-visit">
        <div className="km-visit-copy">
          <p className="km-section-code">KMS / DOVE SIAMO</p>
          <h2>Santa Giulia,<br /><span>Via Cassinari 3.</span></h2>
          <p className="km-visit-text">
            A pochi minuti da Milano Rogoredo. Passa da Kimos oppure ordina per
            il ritiro e la consegna.
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
          <VenueGoogleMapsLink className="km-button km-button-hot">
            Apri su Google Maps <ExternalLink size={16} />
          </VenueGoogleMapsLink>
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
