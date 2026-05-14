"use client";

import Image from "next/image";
import Link from "next/link";
import { Instagram, Facebook, Phone, MapPin, Lock } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import {
  VenueAddressBlock,
  VenueCopyrightAddress,
  VenueHoursList,
  VenuePhoneDisplay,
  VenueWhatsappLink,
} from "@/components/modules/reservations/venue-display";
import { useEffectiveFeatures } from "@/lib/use-effective-features";

export function Footer() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const features = useEffectiveFeatures();
  return (
    <footer className="relative mt-16 bg-pork-ink pb-[env(safe-area-inset-bottom)] text-pork-cream">
      <div className="container-wide grid gap-12 pt-16 pb-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-4">
            <Image
              src={content.logoSrc}
              alt={content.logoAlt}
              width={72}
              height={72}
              unoptimized
              className="h-16 w-16 object-contain"
            />
            <div>
              <p className="impact-title text-3xl text-pork-mustard">{tenant.name}</p>
              <p className="text-sm text-pork-cream/70">
                {content.footer.tagline}
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-md text-pork-cream/70">
            {content.footer.body}
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href={content.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-pork-cream/20 text-pork-cream transition-colors hover:border-pork-mustard hover:text-pork-mustard"
              aria-label={content.social.instagramLabel}
            >
              <Instagram size={18} />
            </a>
            <a
              href={content.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-pork-cream/20 text-pork-cream transition-colors hover:border-pork-mustard hover:text-pork-mustard"
              aria-label={content.social.facebookLabel}
            >
              <Facebook size={18} />
            </a>
          </div>
        </div>

        <div>
          <p className="impact-title text-xl text-pork-mustard">Dove siamo</p>
          <address className="mt-4 flex items-start gap-3 not-italic text-pork-cream/80">
            <MapPin size={18} className="mt-1 shrink-0" />
            <VenueAddressBlock />
          </address>
          <div className="mt-4 flex items-center gap-3">
            <Phone size={18} className="shrink-0 text-pork-cream/80" />
            <VenuePhoneDisplay className="text-pork-cream/80 transition-colors hover:text-pork-mustard" />
          </div>
          <VenueWhatsappLink className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-pork-mustard hover:underline">
            Scrivici su WhatsApp →
          </VenueWhatsappLink>
        </div>

        <div>
          <p className="impact-title text-xl text-pork-mustard">Orari</p>
          <VenueHoursList variant="footer" />
        </div>
      </div>

      <div className="border-t border-pork-cream/10">
        <div className="container-wide flex flex-col gap-4 py-6 text-xs text-pork-cream/50 md:flex-row md:items-center md:justify-between">
          <p className="flex flex-wrap items-center gap-2">
            <span>
              © {new Date().getFullYear()} {tenant.name} — <VenueCopyrightAddress />
            </span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 text-pork-cream/30 hover:text-pork-mustard"
              aria-label="Area riservata"
            >
              <Lock size={10} /> Staff
            </Link>
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {tenant.id === "bepork" && (
              <span className="flex flex-wrap gap-x-3 gap-y-1 text-pork-cream/55">
                {features.modules.onlineMenu && (
                  <Link
                    href="/assistant-menu"
                    className="transition-colors hover:text-pork-mustard hover:underline"
                  >
                    Consigli menu
                  </Link>
                )}
                {features.modules.tableOrders && (
                  <Link
                    href="/tavolo"
                    className="transition-colors hover:text-pork-mustard hover:underline"
                  >
                    Tavolo QR
                  </Link>
                )}
                {features.modules.staffRoles && (
                  <Link
                    href="/staff"
                    className="transition-colors hover:text-pork-mustard hover:underline"
                  >
                    Turni staff
                  </Link>
                )}
                {features.modules.kitchenDisplay && (
                  <Link
                    href="/cucina"
                    className="transition-colors hover:text-pork-mustard hover:underline"
                  >
                    Cucina
                  </Link>
                )}
              </span>
            )}
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <Link
                href="/privacy"
                className="text-pork-cream/55 transition-colors hover:text-pork-mustard hover:underline"
              >
                Privacy
              </Link>
              <Link
                href="/cookie"
                className="text-pork-cream/55 transition-colors hover:text-pork-mustard hover:underline"
              >
                Cookie
              </Link>
            </span>
            <span className="hidden text-pork-cream/25 sm:inline" aria-hidden>
              ·
            </span>
            <span>
              Realizzato da{" "}
              <a
                href="https://pynkstudio.it"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pork-cream/70 transition-colors hover:text-pork-mustard hover:underline"
              >
                PynkStudio
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
