"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, MapPin, Phone, Save } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { useHydrated } from "@/components/core/providers";
import { getTenantContent } from "@/lib/tenant-content";
import {
  cloneHoursWeek,
  defaultHoursWeek,
  defaultHoursWeekForTenant,
  hoursWeekEquals,
  sanitizeHoursWeek,
  type DaySchedule,
} from "@/lib/venue-hours";
import { useSettingsStore } from "@/store/settings-store";

export function ActivitySettingsPanel() {
  const hydrated = useHydrated();
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const settings = useSettingsStore();
  const setSettings = useSettingsStore((state) => state.set);
  const tenantDefaultHours = useMemo(() => defaultHoursWeekForTenant(tenant.id), [tenant.id]);
  const [addressDraft, setAddressDraft] = useState(settings.addressOverride);
  const [phoneDraft, setPhoneDraft] = useState(settings.phoneOverride);
  const [hoursDraft, setHoursDraft] = useState<DaySchedule[]>(() => defaultHoursWeekForTenant(tenant.id));

  useEffect(() => {
    if (!hydrated) return;
    const hours =
      tenant.id === "doca" && hoursWeekEquals(settings.hoursWeek, defaultHoursWeek())
        ? tenantDefaultHours
        : settings.hoursWeek;
    setAddressDraft(settings.addressOverride);
    setPhoneDraft(settings.phoneOverride);
    setHoursDraft(cloneHoursWeek(hours));
  }, [hydrated, settings.addressOverride, settings.hoursWeek, settings.phoneOverride, tenant.id, tenantDefaultHours]);

  const dirty = useMemo(
    () =>
      addressDraft !== settings.addressOverride ||
      phoneDraft !== settings.phoneOverride ||
      !hoursWeekEquals(hoursDraft, settings.hoursWeek),
    [addressDraft, hoursDraft, phoneDraft, settings.addressOverride, settings.hoursWeek, settings.phoneOverride],
  );

  function updateDay(index: number, patch: Partial<DaySchedule>) {
    setHoursDraft((current) =>
      current.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)),
    );
  }

  function save() {
    const nextHours = sanitizeHoursWeek(hoursDraft);
    setSettings({
      addressOverride: addressDraft,
      phoneOverride: phoneDraft,
      hoursWeek: nextHours,
    });
    setHoursDraft(cloneHoursWeek(nextHours));
  }

  if (!hydrated) {
    return <p style={{ color: "var(--ga-ink-faint)" }}>Caricamento...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <span className="ga-eyebrow">Dati attività</span>
        <h1 className="ga-heading">Indirizzo, contatti e orari</h1>
        <p className="ga-lead">
          Questi dati alimentano la pagina pubblica, i blocchi contatto e le informazioni operative del tenant.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <label className="ga-card">
          <span className="ga-card-title">
            <MapPin size={16} /> Indirizzo pubblico
          </span>
          <input
            value={addressDraft}
            onChange={(event) => setAddressDraft(event.target.value)}
            placeholder={content.address.full}
            className="ga-input mt-3"
          />
          <small className="ga-card-hint">
            Lascia vuoto per usare il dato tenant: {content.address.full}
          </small>
        </label>

        <label className="ga-card">
          <span className="ga-card-title">
            <Phone size={16} /> Telefono / WhatsApp
          </span>
          <input
            value={phoneDraft}
            onChange={(event) => setPhoneDraft(event.target.value)}
            placeholder={content.contact.phone}
            className="ga-input mt-3"
          />
          <small className="ga-card-hint">
            Lascia vuoto per usare il dato tenant: {content.contact.phone}
          </small>
        </label>
      </section>

      <section className="ga-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="ga-card-title" style={{ fontSize: 16 }}>
              <CalendarClock size={17} /> Orari tipici
            </h2>
            <p className="ga-card-hint" style={{ marginTop: 4, fontSize: 12 }}>
              Una o più fasce per giorno, separate da virgola.
            </p>
          </div>
          <Link href={`/gestione/${tenant.id}/google/orari`} className="ga-pill-link">
            Date straordinarie
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {hoursDraft.map((day, index) => (
            <div
              key={day.label}
              className="grid gap-3 rounded-xl p-3 sm:grid-cols-[120px_120px_1fr]"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--ga-border-soft)",
              }}
            >
              <strong className="self-center text-sm">{day.label}</strong>
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--ga-ink-muted)" }}
              >
                <input
                  type="checkbox"
                  className="ga-checkbox"
                  checked={day.closed}
                  onChange={(event) =>
                    updateDay(index, {
                      closed: event.target.checked,
                      slots: event.target.checked ? [] : day.slots.length ? day.slots : [""],
                    })
                  }
                />
                Chiuso
              </label>
              <input
                disabled={day.closed}
                value={day.slots.join(", ")}
                onChange={(event) =>
                  updateDay(index, {
                    slots: event.target.value.split(",").map((slot) => slot.trimStart()),
                  })
                }
                placeholder="09:00-13:00, 14:30-18:30"
                className="ga-input"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" disabled={!dirty} onClick={save} className="ga-btn ga-btn-primary">
          <Save size={15} /> Salva dati attività
        </button>
      </div>
    </div>
  );
}
