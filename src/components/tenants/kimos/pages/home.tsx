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
    body: "Tradizionali, giganti e componibili al trancio.",
    tag: "Forno",
  },
  {
    code: "02",
    title: "Kebab",
    body: "Panino, piadina o piatto completo dallo spiedo.",
    tag: "Spiedo",
  },
  {
    code: "03",
    title: "Panini",
    body: "Cotoletta, hamburger e falafel su pane caldo.",
    tag: "Grill",
  },
  {
    code: "04",
    title: "Fritti",
    body: "Alette, nuggets, crocchette, patatine e mix.",
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
    eyebrow: "WEB",
    title: "Ordini online",
    body: "Il menu Kimos è consultabile e ordinabile dal sito, con disponibilità e prezzi leggibili.",
  },
  {
    icon: MessageCircle,
    eyebrow: "WHATSAPP AI",
    title: "Scrivi come parli",
    body: "L'assistente raccoglie l'ordine su WhatsApp, verifica i dettagli e passa la comanda al locale.",
  },
  {
    icon: PhoneCall,
    eyebrow: "RETELL AI",
    title: "Chiama Kimos",
    body: "Per gli ordini telefonici, l'assistente vocale usa lo stesso menu e gli stessi orari del sito.",
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
            Pizza.
            <br />
            Kebab.
            <br />
            <span>Fame vera.</span>
          </h1>
          <p className="km-hero-text">
            Kimos è la pizzeria di quartiere che tiene insieme forno, spiedo e fritti:
            una carta ampia, ordini rapidi e due servizi ogni giorno.
          </p>
          <div className="km-actions">
            <Link href={menuHref} className="km-button km-button-hot">
              Vai al menu <ArrowRight size={17} />
            </Link>
            <VenueWhatsappLink className="km-button km-button-outline">
              <MessageCircle size={17} /> WhatsApp
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
          <div className="km-board-label">Menu Kimos / 01</div>
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
          <div className="km-board-stamp">
            <span>APERTO</span>
            <strong>7 / 7</strong>
          </div>
        </div>
      </section>

      <section className="km-marquee" aria-label="Specialità Kimos">
        <span>Pizza</span>
        <i>◆</i>
        <span>Kebab</span>
        <i>◆</i>
        <span>Fritti</span>
        <i>◆</i>
        <span>Panini</span>
        <i>◆</i>
        <span>Ordini online</span>
      </section>

      <section className="km-intro">
        <div>
          <p className="km-section-code">KMS / 02</p>
          <h2>Una carta ampia.<br /><span>Zero complicazioni.</span></h2>
        </div>
        <div>
          <p>
            Da Kimos trovi la pizza che conosci, il kebab preparato al momento e
            i fritti che completano l&apos;ordine. Il menu vive su una pagina dedicata:
            categorie chiare, prezzi visibili, ordine in pochi tap.
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
          <h2>Le scelte.<br /><span>Della cucina.</span></h2>
          <p>Una selezione dei piatti più richiesti, per chi vuole decidere in dieci secondi.</p>
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
          <span>Disponibilità e prezzi in tempo reale solo sul menu online.</span>
        </div>
      </section>

      <section id="ordina" className="km-channels">
        <div className="km-section-heading km-section-heading-light">
          <p className="km-section-code">KMS / ORDINI</p>
          <h2>Tre modi per ordinare.<br /><span>Un solo menu.</span></h2>
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
            Ordina su WhatsApp <MessageCircle size={17} />
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
