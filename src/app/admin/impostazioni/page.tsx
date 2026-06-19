"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, RotateCcw, Save, X } from "lucide-react";
import { useMenuStore } from "@/store/menu-store";
import {
  getLocalModuleEnabled,
  isModuleSuspensionActive,
  useSettingsStore,
} from "@/store/settings-store";
import { useHydrated } from "@/components/core/providers";
import { useTenant } from "@/components/core/tenant-provider";
import { siteConfig } from "@/lib/site-config";
import { HoursWeekEditor } from "@/components/admin/hours-week-editor";
import type { DaySchedule } from "@/lib/venue-hours";
import {
  cloneHoursWeek,
  defaultHoursWeek,
  hoursWeekEquals,
  sanitizeHoursWeek,
} from "@/lib/venue-hours";
import { cn } from "@/lib/utils";
import type { TenantFeatureFlags, TenantFeatureKey } from "@/lib/tenant";
import {
  formatFeatureDependencies,
  getMissingFeatureDependencies,
  isTenantFeatureEffective,
  resolveTenantFeatures,
  TENANT_MODULES,
  TENANT_MODULE_BY_KEY,
  TENANT_MODULE_CATEGORIES,
} from "@/lib/tenant-modules";

type SuspensionDialogState = {
  key: TenantFeatureKey;
  label: string;
} | null;

type SuspensionMode = "day-end" | "duration" | "manual";

function endOfServiceDay(hoursWeek: DaySchedule[], now = new Date()): Date {
  const scheduleIndex = (now.getDay() + 6) % 7;
  const day = hoursWeek[scheduleIndex];
  const fallback = new Date(now);
  fallback.setHours(23, 59, 0, 0);

  if (!day || day.closed) return fallback;

  const ends = day.slots
    .map((slot) => parseSlotEnd(slot, now))
    .filter((date): date is Date => Boolean(date));
  if (ends.length === 0) return fallback;

  const latest = new Date(Math.max(...ends.map((date) => date.getTime())));
  return latest.getTime() > now.getTime() ? latest : fallback;
}

function parseSlotEnd(slot: string, now: Date): Date | null {
  const match = slot.match(/(\d{1,2}):(\d{2}).*?(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const startHour = Number(match[1]);
  const startMinute = Number(match[2]);
  const endHour = Number(match[3]);
  const endMinute = Number(match[4]);
  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return null;
  }

  const start = new Date(now);
  start.setHours(startHour, startMinute, 0, 0);
  const end = new Date(now);
  end.setHours(endHour, endMinute, 0, 0);
  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1);
  }
  return end;
}

function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ModuleToggle({
  label,
  description,
  checked,
  blocked,
  blockReason,
  suspensionInfo,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  blocked?: boolean;
  blockReason?: string;
  suspensionInfo?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-pork-ink/10 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-bold">{label}</p>
          <p className="mt-1 text-sm text-pork-ink/60">{description}</p>
          {blockReason && (
            <p className="mt-2 rounded-xl bg-pork-mustard/25 px-3 py-2 text-xs font-bold text-pork-ink/70">
              {blockReason}
            </p>
          )}
          {suspensionInfo && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-xl bg-pork-red/10 px-3 py-2 text-xs font-bold text-pork-red">
              <Clock size={14} /> {suspensionInfo}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
          <span className="text-[10px] font-bold uppercase tracking-wide text-pork-ink/45">
            Stato operativo
          </span>
          <div
            className="inline-flex rounded-full bg-pork-ink/10 p-0.5"
            role="group"
            aria-label={`${label}: stato servizio`}
          >
            <button
              type="button"
              onClick={() => onChange(false)}
              disabled={blocked}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[5.5rem]",
                !checked
                  ? "bg-white text-pork-ink shadow-sm ring-1 ring-pork-ink/10"
                  : "text-pork-ink/45 hover:text-pork-ink/70",
              )}
            >
              Sospeso
            </button>
            <button
              type="button"
              onClick={() => onChange(true)}
              disabled={blocked}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[5.5rem]",
                checked
                  ? "bg-pork-red text-white shadow-sm"
                  : "text-pork-ink/45 hover:text-pork-ink/70",
              )}
            >
              Operativo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuspensionDialog({
  moduleLabel,
  dayEnd,
  onClose,
  onConfirm,
}: {
  moduleLabel: string;
  dayEnd: Date;
  onClose: () => void;
  onConfirm: (mode: SuspensionMode, minutes?: number) => void;
}) {
  const [mode, setMode] = useState<SuspensionMode>("day-end");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const durationMinutes =
    Math.max(0, Number(hours) || 0) * 60 + Math.max(0, Number(minutes) || 0);
  const canConfirm = mode !== "duration" || durationMinutes > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-pork-ink/65 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspension-title"
    >
      <div className="w-full max-w-xl rounded-3xl bg-pork-cream p-5 shadow-2xl ring-1 ring-pork-ink/10 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="impact-title text-xs text-pork-red">Sospendi servizio</p>
            <h2 id="suspension-title" className="headline mt-1 text-3xl">
              {moduleLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-pork-ink shadow-sm ring-1 ring-pork-ink/10"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <label className="flex cursor-pointer gap-3 rounded-2xl bg-white p-4 ring-1 ring-pork-ink/10">
            <input
              type="radio"
              name="suspension-mode"
              checked={mode === "day-end"}
              onChange={() => setMode("day-end")}
              className="mt-1 accent-pork-red"
            />
            <span>
              <span className="block font-bold">Fino alla fine della giornata</span>
              <span className="mt-1 block text-sm text-pork-ink/60">
                Torna operativo alle {formatDateTime(dayEnd.getTime())}, in base agli orari del
                locale.
              </span>
            </span>
          </label>

          <label className="block cursor-pointer rounded-2xl bg-white p-4 ring-1 ring-pork-ink/10">
            <span className="flex gap-3">
              <input
                type="radio"
                name="suspension-mode"
                checked={mode === "duration"}
                onChange={() => setMode("duration")}
                className="mt-1 accent-pork-red"
              />
              <span>
                <span className="block font-bold">Per un tempo specifico</span>
                <span className="mt-1 block text-sm text-pork-ink/60">
                  Imposta ore e minuti di sospensione.
                </span>
              </span>
            </span>
            {mode === "duration" && (
              <div className="mt-4 grid grid-cols-2 gap-3 pl-7">
                <label className="text-xs font-bold uppercase tracking-wide text-pork-ink/55">
                  Ore
                  <input
                    type="number"
                    min="0"
                    value={hours}
                    onChange={(event) => setHours(event.target.value)}
                    className="mt-1 w-full rounded-xl border-2 border-pork-ink/10 bg-pork-cream px-3 py-2 text-base font-bold outline-none focus:border-pork-red"
                  />
                </label>
                <label className="text-xs font-bold uppercase tracking-wide text-pork-ink/55">
                  Minuti
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(event) => setMinutes(event.target.value)}
                    className="mt-1 w-full rounded-xl border-2 border-pork-ink/10 bg-pork-cream px-3 py-2 text-base font-bold outline-none focus:border-pork-red"
                  />
                </label>
              </div>
            )}
          </label>

          <label className="flex cursor-pointer gap-3 rounded-2xl bg-white p-4 ring-1 ring-pork-ink/10">
            <input
              type="radio"
              name="suspension-mode"
              checked={mode === "manual"}
              onChange={() => setMode("manual")}
              className="mt-1 accent-pork-red"
            />
            <span>
              <span className="block font-bold">Fino a riattivazione manuale</span>
              <span className="mt-1 block text-sm text-pork-ink/60">
                Resta sospeso finché qualcuno non lo rimette operativo.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Annulla
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(mode, durationMinutes)}
            className="btn-primary text-sm disabled:pointer-events-none disabled:opacity-45"
          >
            Disattiva
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminImpostazioniPage() {
  const hydrated = useHydrated();
  const tenant = useTenant();
  const resetMenu = useMenuStore((s) => s.resetToSeed);
  const settings = useSettingsStore();
  const setSettings = useSettingsStore((s) => s.set);
  const setModuleEnabled = useSettingsStore((s) => s.setModuleEnabled);
  const suspendModule = useSettingsStore((s) => s.suspendModule);
  const resetSettingsDefaults = useSettingsStore((s) => s.resetDefaults);

  const [hoursDraft, setHoursDraft] = useState<DaySchedule[]>(defaultHoursWeek);
  const [phoneDraft, setPhoneDraft] = useState(settings.phoneOverride);
  const [addrDraft, setAddrDraft] = useState(settings.addressOverride);
  const [suspensionDialog, setSuspensionDialog] =
    useState<SuspensionDialogState>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!hydrated) return;
    setHoursDraft(cloneHoursWeek(settings.hoursWeek));
    setPhoneDraft(settings.phoneOverride);
    setAddrDraft(settings.addressOverride);
  }, [hydrated, settings.hoursWeek, settings.phoneOverride, settings.addressOverride]);

  useEffect(() => {
    const hasTimedSuspension = Object.values(settings.moduleSuspensions).some(
      (suspension) =>
        suspension?.disabledUntil !== null &&
        isModuleSuspensionActive(suspension, now),
    );
    if (!hasTimedSuspension) return;
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, [settings.moduleSuspensions, now]);

  const dirtyVenue = useMemo(
    () =>
      !hoursWeekEquals(hoursDraft, settings.hoursWeek) ||
      phoneDraft !== settings.phoneOverride ||
      addrDraft !== settings.addressOverride,
    [
      hoursDraft,
      phoneDraft,
      addrDraft,
      settings.hoursWeek,
      settings.phoneOverride,
      settings.addressOverride,
    ],
  );

  function saveVenue() {
    const nextHours = sanitizeHoursWeek(hoursDraft);
    setSettings({
      hoursWeek: nextHours,
      phoneOverride: phoneDraft,
      addressOverride: addrDraft,
    });
    setHoursDraft(cloneHoursWeek(nextHours));
    setPhoneDraft(phoneDraft);
    setAddrDraft(addrDraft);
  }

  function confirmSuspension(mode: SuspensionMode, minutes = 0) {
    if (!suspensionDialog) return;
    const disabledUntil =
      mode === "day-end"
        ? endOfServiceDay(settings.hoursWeek, new Date(now)).getTime()
        : mode === "duration"
          ? now + minutes * 60_000
          : null;
    suspendModule(suspensionDialog.key, disabledUntil);
    setSuspensionDialog(null);
    setNow(Date.now());
  }

  if (!hydrated) return <p className="text-pork-ink/50">Caricamento…</p>;

  const localFeatureFlags = Object.fromEntries(
    TENANT_MODULES.map((module) => [
      module.key,
      getLocalModuleEnabled(settings, module.key, now),
    ]),
  ) as TenantFeatureFlags;
  const resolvedLocalFeatureFlags = resolveTenantFeatures({
    ...tenant.features,
    ...localFeatureFlags,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {suspensionDialog && (
        <SuspensionDialog
          moduleLabel={suspensionDialog.label}
          dayEnd={endOfServiceDay(settings.hoursWeek, new Date(now))}
          onClose={() => setSuspensionDialog(null)}
          onConfirm={confirmSuspension}
        />
      )}

      <header>
        <p className="impact-title text-xs text-pork-red">Staff</p>
        <h1 className="headline text-4xl">Impostazioni</h1>
        <p className="mt-1 text-pork-ink/60">
          Sospensioni operative per ospiti e squadra, più i recapiti e gli orari mostrati al pubblico.
        </p>
        <p className="mt-3 rounded-xl bg-pork-mustard/25 px-4 py-3 text-sm text-pork-ink/80 ring-1 ring-pork-mustard/40">
          <strong>Operatività:</strong> questi interruttori non modificano il piano del locale.
          Servono solo a sospendere temporaneamente un servizio già abilitato da Menuary, per
          esempio quando la sala è piena o la cucina non accetta più asporto. Telefono, indirizzo
          e orari si applicano quando tocchi &quot;Salva modifiche&quot;.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="impact-title text-sm text-pork-ink/70">Servizi operativi</h2>
        <p className="text-xs text-pork-ink/55">
          Menuary abilita i moduli dal pannello centrale. Da qui il locale può solo metterli in
          pausa o riaprirli quando il servizio torna gestibile.
        </p>
        <div className="space-y-6">
          {TENANT_MODULE_CATEGORIES.map((category) => (
            <div key={category} className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wide text-pork-ink/45">
                {category}
              </h3>
              {TENANT_MODULES.filter((module) => module.category === category).map(
                (module) => {
                  const availableInPlan = isTenantFeatureEffective(
                    tenant.features,
                    module.key,
                  );
                  const missingLocal = getMissingFeatureDependencies(
                    {
                      ...tenant.features,
                      ...localFeatureFlags,
                    },
                    module.key,
                  );
                  const checked = Boolean(
                    availableInPlan && resolvedLocalFeatureFlags[module.key],
                  );
                  const dependencyNote = formatFeatureDependencies(module.key);
                  const suspension = settings.moduleSuspensions[module.key];
                  const activeSuspension = isModuleSuspensionActive(
                    suspension,
                    now,
                  );
                  const suspensionInfo = activeSuspension
                    ? suspension && suspension.disabledUntil === null
                      ? "Sospeso fino a riattivazione manuale"
                      : suspension?.disabledUntil
                        ? `Sospeso fino al ${formatDateTime(suspension.disabledUntil)}`
                        : undefined
                    : !checked && availableInPlan && missingLocal.length === 0
                      ? "Sospeso fino a riattivazione manuale"
                      : undefined;
                  const blockReason = !availableInPlan
                    ? "Servizio non incluso nel piano del locale. Può abilitarlo solo Menuary dalla console piattaforma."
                    : missingLocal.length > 0
                      ? `Per riaprirlo serve prima rendere operativo ${missingLocal
                          .map(
                            (dependency: TenantFeatureKey) =>
                              TENANT_MODULE_BY_KEY[dependency].label,
                          )
                          .join(" oppure ")}.`
                      : dependencyNote;

                  return (
                    <ModuleToggle
                      key={module.key}
                      label={module.label}
                      description={module.description}
                      checked={checked}
                      blocked={!availableInPlan}
                      blockReason={blockReason}
                      suspensionInfo={suspensionInfo}
                      onChange={(v) => {
                        if (v) {
                          setModuleEnabled(module.key, true);
                          setNow(Date.now());
                          return;
                        }
                        if (checked) {
                          setSuspensionDialog({
                            key: module.key,
                            label: module.label,
                          });
                          return;
                        }
                        setModuleEnabled(module.key, false);
                      }}
                    />
                  );
                },
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="impact-title text-sm text-pork-ink/70">
          Informazioni al pubblico
        </h2>
        <p className="text-sm text-pork-ink/60">
          Telefono e indirizzo vuoti → valori predefiniti del sito ({siteConfig.name}). Gli orari
          sono sempre definiti per giorno; modifica le fasce e poi salva.
        </p>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
            Orari (per giorno, più fasce)
          </label>
          <HoursWeekEditor value={hoursDraft} onChange={setHoursDraft} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
            Telefono (contatti e chiamata da smartphone)
          </label>
          <input
            type="text"
            value={phoneDraft}
            onChange={(e) => setPhoneDraft(e.target.value)}
            placeholder={siteConfig.contact.phone}
            className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
            Indirizzo (una o più righe)
          </label>
          <textarea
            rows={3}
            value={addrDraft}
            onChange={(e) => setAddrDraft(e.target.value)}
            placeholder={siteConfig.address.full}
            className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
          />
        </div>

        <button
          type="button"
          onClick={saveVenue}
          disabled={!dirtyVenue}
          className="btn-primary text-sm disabled:pointer-events-none disabled:opacity-40"
        >
          <Save size={16} /> Salva modifiche
        </button>
      </section>

      <section className="rounded-3xl border-2 border-dashed border-pork-red/40 bg-pork-red/5 p-6">
        <h2 className="flex items-center gap-2 impact-title text-sm text-pork-red">
          <AlertTriangle size={16} /> Zona pericolosa
        </h2>
        <p className="mt-2 text-sm text-pork-ink/70">
          Riporta piatti, prezzi, disponibilità, tavoli, sessioni e ordini allo stato iniziale
          fornito da ThePork. Le scelte di questa pagina (moduli e recapiti) non cambiano: per
          quelle usa &quot;Ripristina impostazioni&quot; qui sotto.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "Ripristinare menu, ordini, tavoli e sessioni allo stato iniziale?",
                )
              ) {
                resetMenu();
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-5 py-2.5 text-sm font-bold text-pork-cream hover:bg-pork-red"
          >
            <RotateCcw size={16} /> Ripristina menu e ordini
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Ripristinare tutti i toggle e i dati qui sopra?")) {
                resetSettingsDefaults();
                setHoursDraft(defaultHoursWeek());
                setPhoneDraft("");
                setAddrDraft("");
              }
            }}
            className="btn-ghost text-sm"
          >
            Ripristina impostazioni
          </button>
        </div>
      </section>
    </div>
  );
}
