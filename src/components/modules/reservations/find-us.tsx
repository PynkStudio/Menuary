"use client";

import { MapPin, Phone, Clock, MessageCircle } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import {
  VenueAddressBlock,
  VenueGoogleMapsLink,
  VenueHoursList,
  VenueMapFrame,
  VenuePhoneDisplay,
  VenueWhatsappLink,
} from "@/components/modules/reservations/venue-display";

export function FindUs() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const isDoca = tenant.id === "doca";

  return (
    <section className="tenant-find-us bg-pork-cream py-20 md:py-28">
      <div className="container-wide">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="chip-red">{content.findUs.eyebrow}</span>
            <h2 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance">
              {content.findUs.titleLead}
              <br />
              <span className="text-pork-red">{content.findUs.titleAccent}</span>
            </h2>
            <p className="mt-4 max-w-xl text-lg text-pork-ink/70">
              {content.findUs.body}
            </p>

            <dl className="mt-8 space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pork-red text-white">
                  <MapPin size={18} />
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-widest text-pork-ink/60">
                    Indirizzo
                  </dt>
                  <dd className="mt-0.5 text-pork-ink">
                    <VenueGoogleMapsLink className="font-semibold hover:underline">
                      <VenueAddressBlock multiline={false} />
                    </VenueGoogleMapsLink>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pork-mustard text-pork-ink">
                  <Phone size={18} />
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-widest text-pork-ink/60">
                    {isDoca ? "Contatto" : "Chiama"}
                  </dt>
                  <dd className="mt-0.5 text-pork-ink">
                    <VenuePhoneDisplay className="font-semibold hover:underline" />
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pork-ink text-pork-cream">
                  <Clock size={18} />
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-widest text-pork-ink/60">
                    Orari
                  </dt>
                  <VenueHoursList variant="find-us" />
                </div>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <VenueWhatsappLink className="btn-primary text-base">
                <MessageCircle size={20} />
                {isDoca ? content.hero.ctaLabel : "Prenota un tavolo"}
              </VenueWhatsappLink>
              <VenueGoogleMapsLink className="btn-ghost text-base">
                Apri in Google Maps
              </VenueGoogleMapsLink>
            </div>
          </div>

          <div className="relative h-[28rem] overflow-hidden rounded-3xl bg-pork-ink/5 shadow-xl ring-1 ring-pork-ink/10 lg:h-auto">
            <VenueMapFrame title={content.findUs.mapTitle} className="h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
