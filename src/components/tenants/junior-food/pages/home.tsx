"use client";

import Image from "next/image";
import { Suspense } from "react";
import { ArrowRight, Star } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { Footer } from "@/components/tenant-shell/footer";
import { InteractiveMenu } from "@/components/modules/menu/interactive-menu";
import { FindUs } from "@/components/modules/reservations/find-us";
import { ReservationRequestForm } from "@/components/modules/reservations/reservation-request-form";
import { ReviewsSection } from "@/components/modules/reviews/reviews-section";
import { getGoogleRatingForTenant } from "@/lib/reviews-data";

const heroImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=85";

const storyImage =
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=85";

export function JuniorFoodHomePage() {
  const tenant = useTenant();
  const rating = getGoogleRatingForTenant(tenant.id);

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
          <a href="#recensioni">Recensioni</a>
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
          <div className="jf-rating" aria-label={`Google Rating ${rating.average.toFixed(1)}`}>
            <strong>{rating.average.toFixed(1).replace(".", ",")}</strong>
            <Star size={24} fill="currentColor" aria-hidden="true" />
            <span>{rating.count} recensioni Google</span>
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

      <section id="menu" className="jf-menu jf-menu-module">
        <div className="jf-section-head">
          <p className="jf-section-label">Il menu</p>
          <h2>Menu Junior Food</h2>
        </div>
        <Suspense fallback={<div className="jf-module-loading">Caricamento menu...</div>}>
          <InteractiveMenu />
        </Suspense>
      </section>

      <div id="visita" className="jf-findus-module">
        <FindUs />
      </div>

      <div id="recensioni" className="jf-reviews-module">
        <ReviewsSection />
      </div>

      <section id="prenota" className="jf-booking jf-booking-module">
        <div className="jf-section-head jf-section-head-center">
          <p className="jf-section-label">Prenotazioni</p>
          <h2>Prenota il tuo tavolo</h2>
          <p>Inviaci un messaggio e ti daremo conferma entro un&apos;ora.</p>
        </div>

        <div className="jf-booking-card">
          <ReservationRequestForm />
        </div>
      </section>

      <div id="contatti" className="jf-footer-module">
        <Footer />
      </div>
    </main>
  );
}
