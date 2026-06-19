"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
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
    eyebrow: "MENU ONLINE",
    title: "Scegli dal sito",
    body: "Apri la carta, controlli prezzi e disponibilità, poi mandi l'ordine senza cercare il volantino.",
  },
  {
    icon: MessageCircle,
    eyebrow: "NORA MESSAGGI",
    title: "Scrivi a Nora",
    body: "Nora capisce l'ordine, chiede quello che manca e prepara un riepilogo chiaro per Kimos.",
  },
  {
    icon: PhoneCall,
    eyebrow: "NORA TELEFONO",
    title: "Chiama e ordina",
    body: "Se preferisci parlare, Nora prende la chiamata e usa lo stesso menu aggiornato del sito.",
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
            Pizzeria, kebab e fritti in zona Santa Giulia: menu grande,
            ordine veloce e Nora pronta a raccogliere richieste da messaggio o telefono.
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
              <MessageCircle size={17} /> Scrivi a Nora
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
          <div className="km-nora-ticket" aria-label="Nora assistente ordini">
            <Bot size={18} />
            <div>
              <strong>Nora</strong>
              <span>prende ordini da messaggi e chiamate</span>
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
          <p className="km-section-code">KMS / NORA ORDINI</p>
          <h2>Ordini come vuoi.<br /><span>Risponde Nora.</span></h2>
        </div>
        <div className="km-nora-panel">
          <div className="km-nora-copy">
            <p className="km-section-code">Assistente del locale</p>
            <h3>Nora tiene insieme menu, messaggi e telefono.</h3>
            <span>
              Il cliente può scrivere o chiamare. Nora raccoglie gusti, quantità,
              orario e recapito, poi passa al locale un ordine leggibile.
            </span>
          </div>
          <div className="km-nora-chat" aria-label="Esempio conversazione con Nora">
            <p><strong>Cliente</strong><span>Una pizza Kimos, un kebab e patatine.</span></p>
            <p><strong>Nora</strong><span>Perfetto. Ritiro o consegna?</span></p>
            <p><strong>Cliente</strong><span>Ritiro alle 20:15.</span></p>
            <p><strong>Nora</strong><span>Ordine pronto per conferma.</span></p>
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
            Scrivi a Nora <MessageCircle size={17} />
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
