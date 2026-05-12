"use client";

import type { ReactNode } from "react";
import { useSettingsStore } from "@/store/settings-store";
import type { DaySchedule } from "@/lib/venue-hours";
import { defaultHoursWeek } from "@/lib/venue-hours";
import { useTenant } from "@/components/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";

function usePublicHours(): DaySchedule[] {
  const hw = useSettingsStore((s) => s.hoursWeek);
  if (hw && hw.length === 7) return hw;
  return defaultHoursWeek();
}

/** Telefono effettivo (override admin o default) + link tel: e wa.me. */
export function useVenueContactPhone() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const override = useSettingsStore((s) => s.phoneOverride?.trim() ?? "");
  const display = override || content.contact.phone;
  const telHref = `tel:${display.replace(/\s/g, "")}`;
  const waDigits = override ? display.replace(/\D/g, "") : content.contact.whatsappDigits;
  const waHref = (message?: string) =>
    `https://wa.me/${waDigits}?text=${encodeURIComponent(
      message ?? content.contact.whatsappMessage,
    )}`;
  return { display, telHref, waHref };
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
  children,
}: {
  message?: string;
  className?: string;
  children: ReactNode;
}) {
  const { waHref } = useVenueContactPhone();
  return (
    <a
      href={waHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export function VenueCopyrightAddress() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const override = useSettingsStore((s) => s.addressOverride?.trim() ?? "");
  const text = override
    ? override.replace(/\s*\n+\s*/g, " — ").trim()
    : content.address.full;
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
  const override = useSettingsStore((s) => s.addressOverride?.trim() ?? "");
  const raw = override || content.address.full;
  if (multiline && override) {
    return (
      <span className={`whitespace-pre-wrap ${className ?? ""}`}>{raw}</span>
    );
  }
  if (override) {
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
