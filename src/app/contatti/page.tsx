import type { Metadata } from "next";
import { headers } from "next/headers";
import { MapPin, Instagram, Facebook } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { ContattiReserveCards } from "@/components/contatti-reserve-cards";
import { ReservationRequestForm } from "@/components/reservation-request-form";
import { MarketingLeadForm } from "@/components/marketing/lead-form";
import {
  VenueAddressBlock,
  VenueHoursList,
} from "@/components/venue-display";
import { getPlatformModeFromHost } from "@/lib/platform";

export async function generateMetadata(): Promise<Metadata> {
  const mode = getPlatformModeFromHost((await headers()).get("host"));
  return mode === "marketing"
    ? {
        title: "Contatti",
        description:
          "Raccontaci il tuo ristorante e scopri come Menuary puo trasformarlo in un sito su misura.",
      }
    : {
        title: "Contatti & Prenotazioni",
        description:
          "Prenota da Be Pork su WhatsApp o chiamaci. Via Quintino Sella 128, 70123 Bari. Orari, mappa, social.",
      };
}

function TenantContactsPage() {
  return (
    <>
      <section className="bg-pork-ink pt-32 pb-12 text-pork-cream md:pt-40 md:pb-16">
        <div className="container-wide">
          <span className="chip-mustard">Contatti & prenotazioni</span>
          <h1 className="headline mt-4 text-6xl sm:text-7xl lg:text-8xl text-balance">
            Scegli il tavolo,
            <br />
            <span className="text-pork-mustard">al resto pensiamo noi.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pork-cream/75">
            Ci prenoti su WhatsApp in due clic. Se preferisci la voce, il telefono suona lo stesso.
          </p>
        </div>
      </section>

      <section className="bg-pork-cream py-16 md:py-20">
        <div className="container-wide grid gap-6 lg:grid-cols-3">
          <ContattiReserveCards />
          <ReservationRequestForm />
        </div>
      </section>

      <section className="bg-pork-cream pb-20">
        <div className="container-wide grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-pork-ink/5">
            <div>
              <p className="impact-title text-2xl text-pork-red">Dove siamo</p>
              <address className="mt-2 flex items-start gap-3 not-italic">
                <MapPin size={20} className="mt-1 shrink-0 text-pork-ink/60" />
                <VenueAddressBlock className="text-pork-ink/80" />
              </address>
              <a
                href={siteConfig.maps.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-pork-red hover:underline"
              >
                Apri in Google Maps →
              </a>
            </div>

            <div>
              <p className="impact-title text-2xl text-pork-red">Orari</p>
              <VenueHoursList variant="contatti" />
            </div>

            <div>
              <p className="impact-title text-2xl text-pork-red">Seguici</p>
              <div className="mt-3 flex gap-3">
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-4 py-2 font-semibold text-pork-cream hover:bg-pork-red"
                >
                  <Instagram size={16} /> Instagram
                </a>
                <a
                  href={siteConfig.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-4 py-2 font-semibold text-pork-cream hover:bg-pork-red"
                >
                  <Facebook size={16} /> Facebook
                </a>
              </div>
            </div>
          </div>

          <div className="relative h-96 overflow-hidden rounded-3xl shadow-xl ring-1 ring-pork-ink/10 lg:h-auto">
            <iframe
              title="Mappa Be Pork"
              src={siteConfig.maps.embedUrl}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </>
  );
}

function MarketingContactsPage() {
  return (
    <div className="menuary-shell min-h-screen bg-[var(--menuary-paper)] px-5 py-10 text-[var(--menuary-ink)] sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <section className="pt-6 lg:sticky lg:top-10">
          <p className="menuary-eyebrow">
            contatti Menuary
          </p>
          <h1 className="menuary-display mt-5 text-[clamp(3rem,6vw,6.4rem)]">
            Raccontaci il tuo ristorante. Ti mostriamo come potrebbe vivere online.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-9 text-[var(--menuary-muted)]">
            Partiamo da cucina, atmosfera, clientela e modo di lavorare. Da li costruiamo
            una proposta concreta: sito, menu, prenotazioni, ordini e strumenti utili al tuo locale.
          </p>

          <div className="mt-9 grid gap-3">
            {[
              "Un sito personalizzato sul carattere del ristorante",
              "Menu digitale, prenotazioni e ordini se ti servono",
              "Gestione semplice per aggiornare contenuti e servizi",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] bg-[var(--menuary-porcelain)] px-4 py-3 text-sm font-semibold shadow-[0_18px_45px_rgba(48,43,35,0.05)] ring-1 ring-[var(--menuary-line)]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <MarketingLeadForm />
      </div>
    </div>
  );
}

export default async function ContattiPage() {
  const mode = getPlatformModeFromHost((await headers()).get("host"));
  return mode === "marketing" ? <MarketingContactsPage /> : <TenantContactsPage />;
}
