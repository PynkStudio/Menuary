"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useSettingsStore } from "@/store/settings-store";
import type { DaySchedule } from "@/lib/venue-hours";
import { defaultHoursWeek, defaultHoursWeekForTenant } from "@/lib/venue-hours";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import { useLocationOrNull } from "@/components/core/location-provider";

type PublicGoogleMapLocation = {
  placeId: string | null;
  locationName: string | null;
};

function googleMapsSearchUrl(query: string, placeId?: string | null) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", query);
  if (placeId) url.searchParams.set("query_place_id", placeId);
  return url.toString();
}

function googleMapsEmbedUrl(query: string, placeId?: string | null) {
  const mapQuery = placeId ? `place_id:${placeId}` : query;
  return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
}

function usePublicHours(): DaySchedule[] {
  const tenant = useTenant();
  const hw = useSettingsStore((s) => s.hoursWeek);
  if (tenant.id === "doca") {
    return defaultHoursWeekForTenant(tenant.id);
  }
  if (tenant.id === "junior-food") {
    return defaultHoursWeekForTenant(tenant.id);
  }
  if (tenant.id === "nom-sushi") {
    return defaultHoursWeekForTenant(tenant.id);
  }
  if (tenant.id === "officinakam") {
    return [
      { label: "Lunedì", closed: false, slots: ["08:30 – 13:00", "14:30 – 18:30"] },
      { label: "Martedì", closed: false, slots: ["08:30 – 13:00", "14:30 – 18:30"] },
      { label: "Mercoledì", closed: false, slots: ["08:30 – 13:00", "14:30 – 18:30"] },
      { label: "Giovedì", closed: false, slots: ["08:30 – 13:00", "14:30 – 18:30"] },
      { label: "Venerdì", closed: false, slots: ["08:30 – 13:00", "14:30 – 18:30"] },
      { label: "Sabato", closed: false, slots: ["09:00 – 13:00"] },
      { label: "Domenica", closed: true, slots: [] },
    ];
  }
  if (hw && hw.length === 7) return hw;
  return defaultHoursWeek();
}

/** Telefono effettivo (override admin o default) + link tel: e wa.me. */
export function useVenueContactPhone() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const override = useSettingsStore((s) => s.phoneOverride?.trim() ?? "");
  const display = override || content.contact.phone;
  const telHref = content.contact.whatsappDigits
    ? `tel:${display.replace(/\s/g, "")}`
    : content.social.instagram;
  const waDigits = override ? display.replace(/\D/g, "") : content.contact.whatsappDigits;
  const waHref = (message?: string) =>
    waDigits
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
          message ?? content.contact.whatsappMessage,
        )}`
      : content.social.instagram;
  return { display, telHref, waHref };
}

export function useVenueAddressText() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const location = useLocationOrNull()?.activeLocation;
  const override = useSettingsStore((s) => s.addressOverride?.trim() ?? "");
  const locationAddress = location?.address?.trim();
  const locationCity = location?.city?.trim();
  if (locationAddress) {
    return locationCity && !locationAddress.toLowerCase().includes(locationCity.toLowerCase())
      ? `${locationAddress}, ${locationCity}`
      : locationAddress;
  }
  return override || content.address.full;
}

export function useVenueMap() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const location = useLocationOrNull()?.activeLocation;
  const address = useVenueAddressText();
  const [googleLocation, setGoogleLocation] = useState<PublicGoogleMapLocation | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tenant/${tenant.id}/map`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { google?: PublicGoogleMapLocation | null } | null) => {
        if (!cancelled) setGoogleLocation(payload?.google ?? null);
      })
      .catch(() => {
        if (!cancelled) setGoogleLocation(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tenant.id]);

  return useMemo(() => {
    const googleQuery =
      googleLocation?.locationName ||
      [location?.name, address].filter(Boolean).join(" ") ||
      content.address.full;
    const fallbackQuery = [location?.name, address].filter(Boolean).join(" ") || content.address.full;
    const query = googleLocation?.placeId || googleLocation?.locationName ? googleQuery : fallbackQuery;
    const placeId = googleLocation?.placeId ?? null;

    return {
      label: googleLocation?.locationName || location?.name || address,
      searchUrl: googleMapsSearchUrl(query, placeId),
      embedUrl: googleMapsEmbedUrl(query, placeId),
    };
  }, [address, content.address.full, googleLocation, location?.name]);
}

export function VenueGoogleMapsLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const map = useVenueMap();
  return (
    <a href={map.searchUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export function VenueMapFrame({
  title,
  className,
  style,
  dark = false,
}: {
  title: string;
  className?: string;
  style?: CSSProperties;
  dark?: boolean;
}) {
  const map = useVenueMap();
  return (
    <iframe
      title={title}
      src={map.embedUrl}
      className={className}
      width="100%"
      height="100%"
      style={{
        border: 0,
        display: "block",
        ...(dark
          ? { filter: "invert(90%) hue-rotate(180deg) brightness(0.95) contrast(0.9)" }
          : {}),
        ...style,
      }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}

export function VenueHoursList({
  variant = "footer",
}: {
  variant?: "footer" | "contatti" | "find-us";
}) {
  const hours = usePublicHours();

  if (variant === "find-us") {
    return (
      <dd className="mt-0.5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {hours.map((h) => (
          <div key={h.label} className="flex justify-between gap-3 text-sm">
            <span className="font-semibold">{h.label}</span>
            <span className="text-pork-ink/70">
              {h.closed ? (
                <span className="text-pork-red">Chiuso</span>
              ) : (
                h.slots.filter(Boolean).join(" / ") || "—"
              )}
            </span>
          </div>
        ))}
      </dd>
    );
  }

  if (variant === "contatti") {
    return (
      <ul className="mt-3 divide-y divide-pork-ink/10">
        {hours.map((h) => (
          <li key={h.label} className="flex justify-between py-2">
            <span className="font-semibold">{h.label}</span>
            <span className="text-pork-ink/70">
              {h.closed ? (
                <span className="font-semibold text-pork-red">Chiuso</span>
              ) : (
                h.slots.filter(Boolean).join(" / ") || "—"
              )}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="mt-4 space-y-1.5 text-sm">
      {hours.map((h) => (
        <li key={h.label} className="flex justify-between gap-4">
          <span className="font-semibold text-pork-cream/90">{h.label}</span>
          <span className="text-right text-pork-cream/70">
            {h.closed ? (
              <span className="text-pork-red">Chiuso</span>
            ) : h.slots.filter(Boolean).length ? (
              h.slots.filter(Boolean).map((s) => <div key={s}>{s}</div>)
            ) : (
              <span className="text-pork-red">Chiuso</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function VenuePhoneDisplay({ className }: { className?: string }) {
  const { display, telHref } = useVenueContactPhone();
  return (
    <a href={telHref} className={className}>
      {display}
    </a>
  );
}

export function VenueWhatsappLink({
  message,
  className,
  onClick,
  children,
}: {
  message?: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const { waHref } = useVenueContactPhone();
  return (
    <a
      href={waHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
}

export function VenueCopyrightAddress() {
  const text = useVenueAddressText().replace(/\s*\n+\s*/g, " — ").trim();
  return <>{text}</>;
}

export function VenueAddressBlock({
  className,
  multiline = true,
}: {
  className?: string;
  multiline?: boolean;
}) {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const location = useLocationOrNull()?.activeLocation;
  const override = useSettingsStore((s) => s.addressOverride?.trim() ?? "");
  const raw = useVenueAddressText();
  if (multiline && override) {
    return (
      <span className={`whitespace-pre-wrap ${className ?? ""}`}>{raw}</span>
    );
  }
  if (override || location?.address) {
    return <span className={className}>{raw}</span>;
  }
  return (
    <span className={className}>
      {content.address.street}
      <br />
      {content.address.zip} {content.address.city} (
      {content.address.province})
    </span>
  );
}
