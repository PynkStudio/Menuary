"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useSettingsStore } from "@/store/settings-store";
import type { DaySchedule } from "@/lib/venue-hours";
import { defaultHoursWeek, defaultHoursWeekForTenant } from "@/lib/venue-hours";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import { useLocationOrNull } from "@/components/core/location-provider";
import { useDocaCopy, useDocaLanguage } from "@/lib/doca-i18n";
import {
  computeStatusFromSlots,
  getItalianDayLabels,
  groupWeek,
  resolveDay,
  todayMondayIndex,
  type HoursStatus,
  type SpecialDay,
} from "@/lib/hours-status";

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
  if (tenant.id === "kimos") {
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

/** Email principale effettiva: override admin, sede attiva o fallback tenant. */
export function useVenueContactEmail() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const location = useLocationOrNull()?.activeLocation;
  const override = useSettingsStore((s) => s.mainEmailOverride?.trim() ?? "");
  return override || location?.email?.trim() || content.contact.email?.trim() || "";
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
    if (tenant.id === "doca") {
      return {
        label: address,
        searchUrl: content.maps.searchUrl,
        embedUrl: content.maps.embedUrl,
      };
    }
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
  }, [address, content.address.full, content.maps.embedUrl, content.maps.searchUrl, googleLocation, location?.name, tenant.id]);
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

function useTenantSpecialHours(tenantId: string): SpecialDay[] {
  const [data, setData] = useState<SpecialDay[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tenant/${tenantId}/special-hours`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p: { specialHours?: SpecialDay[] } | null) => {
        if (!cancelled && p?.specialHours) setData(p.specialHours);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);
  return data;
}

function useNow(refreshMs = 60_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);
  return now;
}

const STATUS_DICT: Record<string, Record<HoursStatus["kind"], string>> = {
  it: {
    open: "Aperto",
    closing_soon: "Stiamo chiudendo",
    opening_soon: "Apriamo a breve",
    closed: "Chiuso",
  },
  pt: {
    open: "Aberto",
    closing_soon: "A fechar",
    opening_soon: "Abrimos em breve",
    closed: "Fechado",
  },
  en: {
    open: "Open",
    closing_soon: "Closing soon",
    opening_soon: "Opening soon",
    closed: "Closed",
  },
};

function statusBadgeClass(kind: HoursStatus["kind"]): string {
  switch (kind) {
    case "open":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/40";
    case "closing_soon":
    case "opening_soon":
      return "bg-amber-500/15 text-amber-400 border-amber-500/40";
    case "closed":
      return "bg-rose-500/15 text-rose-400 border-rose-500/40";
  }
}

function statusDotClass(kind: HoursStatus["kind"]): string {
  switch (kind) {
    case "open":
      return "bg-emerald-500";
    case "closing_soon":
    case "opening_soon":
      return "bg-amber-500";
    case "closed":
      return "bg-rose-500";
  }
}

function StatusBadge({ status, label }: { status: HoursStatus; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(status.kind)}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(status.kind)}`} />
      {label}
    </span>
  );
}

function formatSpecialDate(iso: string, locale: string): string {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString(
      locale === "pt" ? "pt-PT" : locale === "en" ? "en-GB" : "it-IT",
      { day: "2-digit", month: "short" },
    );
  } catch {
    return iso;
  }
}

function translateDayLabel(label: string, lang: string): string {
  if (lang === "it") return label;
  const dict: Record<string, Record<string, string>> = {
    pt: { Lunedì: "Segunda", Martedì: "Terça", Mercoledì: "Quarta", Giovedì: "Quinta", Venerdì: "Sexta", Sabato: "Sábado", Domenica: "Domingo" },
    en: { Lunedì: "Monday", Martedì: "Tuesday", Mercoledì: "Wednesday", Giovedì: "Thursday", Venerdì: "Friday", Sabato: "Saturday", Domenica: "Sunday" },
  };
  return dict[lang]?.[label] ?? label;
}

function localizedDayLabels(lang: string): readonly string[] {
  return getItalianDayLabels().map((l) => translateDayLabel(l, lang));
}

function localizedShortLabels(lang: string): readonly string[] {
  if (lang === "pt") return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  if (lang === "en") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
}

export function VenueHoursList({
  variant = "footer",
}: {
  variant?: "footer" | "contatti" | "find-us";
}) {
  const tenant = useTenant();
  const docaCopy = useDocaCopy();
  const docaLanguage = useDocaLanguage();
  const week = usePublicHours();
  const specials = useTenantSpecialHours(tenant.id);
  const now = useNow();

  const lang = tenant.id === "doca" ? docaLanguage : "it";
  const closedLabel = tenant.id === "doca" ? docaCopy.closed : "Chiuso";
  const statusLabels = STATUS_DICT[lang] ?? STATUS_DICT.it;

  const todayIdx = todayMondayIndex(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const today = useMemo(() => resolveDay(week, specials, now), [week, specials, now]);
  const yesterdayResolved = useMemo(
    () => resolveDay(week, specials, yesterday),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [week, specials, isoDateLocalForKey(yesterday)],
  );

  const status: HoursStatus = useMemo(() => {
    if (today.closed) return { kind: "closed" };
    return computeStatusFromSlots(
      today.slots.filter(Boolean),
      yesterdayResolved.closed ? [] : yesterdayResolved.slots.filter(Boolean),
      now,
    );
  }, [today, yesterdayResolved, now]);

  const groups = useMemo(
    () =>
      groupWeek(week, {
        todayIndex: todayIdx,
        dayLabels: localizedDayLabels(lang),
        shortLabels: localizedShortLabels(lang),
      }),
    [week, todayIdx, lang],
  );

  // Mostra solo i prossimi 60 giorni di straordinarie.
  const upcomingSpecials = useMemo(() => {
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 60);
    const todayIso = now.toISOString().slice(0, 10);
    return specials
      .filter((s) => s.date >= todayIso && new Date(s.date) <= limit)
      .slice(0, 6);
  }, [specials, now]);

  const isDark = variant === "footer";
  const isCompact = variant === "find-us";

  const groupRowKey = (idx: number) => `g-${idx}`;

  const renderSlots = (closed: boolean, slots: string[]) => {
    if (closed) return <span className="text-pork-red">{closedLabel}</span>;
    const cleaned = slots.filter(Boolean);
    if (!cleaned.length) return <span className="text-pork-red">{closedLabel}</span>;
    if (isCompact) return <>{cleaned.join(" / ")}</>;
    return (
      <>
        {cleaned.map((s) => (
          <div key={s}>{s}</div>
        ))}
      </>
    );
  };

  const todayHasSpecial = today.special !== null;

  const Container: "div" | "dd" = variant === "find-us" ? "dd" : "div";
  const containerClass =
    variant === "footer"
      ? "mt-4 space-y-2 text-sm"
      : variant === "contatti"
        ? "mt-3 space-y-2"
        : "mt-1 space-y-2 text-sm";

  const dayTextClass = isDark ? "font-semibold text-pork-cream/90" : "font-semibold";
  const slotTextClass = isDark ? "text-right text-pork-cream/70" : "text-right text-pork-ink/70";
  const todayHighlight = isDark
    ? "bg-pork-mustard/10 ring-1 ring-pork-mustard/40"
    : "bg-pork-mustard/10 ring-1 ring-pork-mustard/40";
  const specialBoxClass = isDark
    ? "border-pork-cream/15 bg-pork-cream/5 text-pork-cream/80"
    : "border-pork-ink/10 bg-pork-ink/5 text-pork-ink/80";

  return (
    <Container className={containerClass}>
      <ul className="space-y-1.5">
        {groups.map((g, i) => {
          // Se oggi è in questo gruppo MA c'è uno speciale per oggi,
          // l'orario settimanale viene mostrato barrato e lo speciale appare
          // sotto come riga "Oggi".
          const showTodayBadgeHere = g.containsToday && !todayHasSpecial;
          const stale = g.containsToday && todayHasSpecial;
          return (
            <li
              key={groupRowKey(i)}
              className={`flex items-start justify-between gap-3 rounded-md px-2 py-1.5 ${
                showTodayBadgeHere ? todayHighlight : ""
              }`}
            >
              <span className={`flex flex-wrap items-center gap-2 ${dayTextClass}`}>
                <span className={stale ? "line-through opacity-60" : ""}>{g.label}</span>
                {showTodayBadgeHere && <StatusBadge status={status} label={statusLabels[status.kind]} />}
              </span>
              <span className={`${slotTextClass} ${stale ? "line-through opacity-60" : ""}`}>
                {renderSlots(g.closed, g.slots)}
              </span>
            </li>
          );
        })}
      </ul>

      {todayHasSpecial && today.special && (
        <div
          className={`flex items-start justify-between gap-3 rounded-md border px-2.5 py-2 text-sm ${specialBoxClass}`}
        >
          <span className="flex flex-wrap items-center gap-2 font-semibold">
            <span>Oggi · {today.special.label?.trim() || "Orario speciale"}</span>
            <StatusBadge status={status} label={statusLabels[status.kind]} />
          </span>
          <span className="text-right">{renderSlots(today.closed, today.slots)}</span>
        </div>
      )}

      {upcomingSpecials.filter((s) => !today.special || s.date !== today.special.date).length > 0 && (
        <div className={`rounded-md border px-2.5 py-2 text-xs ${specialBoxClass}`}>
          <p className="mb-1 font-semibold opacity-80">Giorni speciali</p>
          <ul className="space-y-0.5">
            {upcomingSpecials
              .filter((s) => !today.special || s.date !== today.special.date)
              .map((s) => (
                <li key={s.date} className="flex items-start justify-between gap-3">
                  <span>
                    {formatSpecialDate(s.date, lang)}
                    {s.label ? ` · ${s.label}` : ""}
                  </span>
                  <span className="text-right">
                    {s.closed ? (
                      <span className="text-pork-red">{closedLabel}</span>
                    ) : (
                      s.slots.filter(Boolean).join(" / ") || "—"
                    )}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </Container>
  );
}

function isoDateLocalForKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
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
