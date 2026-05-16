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
  const [addressDraft, setAddressDraft] = useState(settings.addressOverride);
  const [phoneDraft, setPhoneDraft] = useState(settings.phoneOverride);
  const [hoursDraft, setHoursDraft] = useState<DaySchedule[]>(defaultHoursWeek);

  useEffect(() => {
    if (!hydrated) return;
    setAddressDraft(settings.addressOverride);
    setPhoneDraft(settings.phoneOverride);
    setHoursDraft(cloneHoursWeek(settings.hoursWeek));
  }, [hydrated, settings.addressOverride, settings.hoursWeek, settings.phoneOverride]);

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
    return <p className="text-pork-ink/50">Caricamento...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-pork-red">
          Dati attività
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Indirizzo, contatti e orari
        </h1>
        <p className="mt-3 max-w-2xl text-pork-ink/60">
          Questi dati alimentano la pagina pubblica, i blocchi contatto e le informazioni operative del tenant.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <label className="rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10">
          <span className="mb-3 flex items-center gap-2 text-sm font-bold text-pork-ink">
            <MapPin size={18} /> Indirizzo pubblico
          </span>
          <input
            value={addressDraft}
            onChange={(event) => setAddressDraft(event.target.value)}
            placeholder={content.address.full}
            className="w-full rounded-xl border border-pork-ink/10 bg-pork-cream px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pork-red/30"
          />
          <small className="mt-2 block text-xs text-pork-ink/50">
            Lascia vuoto per usare il dato tenant: {content.address.full}
          </small>
        </label>

        <label className="rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10">
          <span className="mb-3 flex items-center gap-2 text-sm font-bold text-pork-ink">
            <Phone size={18} /> Telefono / WhatsApp
          </span>
          <input
            value={phoneDraft}
            onChange={(event) => setPhoneDraft(event.target.value)}
            placeholder={content.contact.phone}
            className="w-full rounded-xl border border-pork-ink/10 bg-pork-cream px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pork-red/30"
          />
          <small className="mt-2 block text-xs text-pork-ink/50">
            Lascia vuoto per usare il dato tenant: {content.contact.phone}
          </small>
        </label>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <CalendarClock size={19} /> Orari tipici
            </h2>
            <p className="mt-1 text-sm text-pork-ink/55">
              Una o più fasce per giorno, separate da virgola.
            </p>
          </div>
          <Link
            href={`/gestione/${tenant.id}/google/orari`}
            className="rounded-full border border-pork-ink/15 px-3 py-1.5 text-xs font-bold text-pork-ink/70 hover:text-pork-ink"
          >
            Date straordinarie
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {hoursDraft.map((day, index) => (
            <div
              key={day.label}
              className="grid gap-3 rounded-xl border border-pork-ink/10 bg-pork-cream p-3 sm:grid-cols-[120px_120px_1fr]"
            >
              <strong className="self-center text-sm">{day.label}</strong>
              <label className="flex items-center gap-2 text-sm text-pork-ink/70">
                <input
                  type="checkbox"
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
                className="w-full rounded-lg border border-pork-ink/10 bg-white px-3 py-2 text-sm outline-none disabled:opacity-40"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!dirty}
          onClick={save}
          className="inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
        >
          <Save size={16} /> Salva dati attività
        </button>
      </div>
    </div>
  );
}
