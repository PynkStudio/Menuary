"use client";

import { useState } from "react";
import { CalendarOff, Clock, Settings, X } from "lucide-react";
import { useSettingsStore } from "@/store/settings-store";
import { useHydrated } from "@/components/core/providers";
import type { ReservationTimeMode } from "@/store/settings-store";

function endOfDay(daysFromNow: number): number {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function formatSuspensionEnd(ts: number): string {
  return new Date(ts).toLocaleDateString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReservationSettingsPanel() {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [disableFrom, setDisableFrom] = useState("");
  const [disableTo, setDisableTo] = useState("");

  const suspendModule = useSettingsStore((s) => s.suspendModule);
  const setModuleEnabled = useSettingsStore((s) => s.setModuleEnabled);
  const moduleSuspensions = useSettingsStore((s) => s.moduleSuspensions);
  const reservationTimeSettings = useSettingsStore((s) => s.reservationTimeSettings);
  const set = useSettingsStore((s) => s.set);

  if (!hydrated) return null;

  const suspension = moduleSuspensions["reservations"];
  const isSuspended =
    suspension &&
    (suspension.disabledUntil === null || suspension.disabledUntil > Date.now());

  function patchTime<K extends keyof typeof reservationTimeSettings>(
    key: K,
    value: (typeof reservationTimeSettings)[K],
  ) {
    set({ reservationTimeSettings: { ...reservationTimeSettings, [key]: value } });
  }

  function applyDateRange() {
    if (!disableFrom || !disableTo) return;
    const to = new Date(`${disableTo}T23:59:59`).getTime();
    suspendModule("reservations", to);
    setDisableFrom("");
    setDisableTo("");
  }

  return (
    <div className="ga-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ga-btn ga-btn-ghost flex w-full items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2 font-bold">
          <Settings size={15} strokeWidth={2.2} />
          Impostazioni prenotazioni
          {isSuspended && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
              SOSPESE
            </span>
          )}
        </span>
        <span className="text-xs opacity-50">{open ? "Chiudi" : "Apri"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-6 border-t border-[var(--ga-border)] pt-4">

          {/* ── Sospensione rapida ── */}
          <section className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-bold">
              <CalendarOff size={14} strokeWidth={2.3} />
              Disabilita prenotazioni
            </p>

            {isSuspended ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
                <span className="flex-1">
                  {suspension?.disabledUntil === null
                    ? "Prenotazioni disabilitate a tempo indeterminato."
                    : `Sospese fino al ${formatSuspensionEnd(suspension!.disabledUntil!)}.`}
                </span>
                <button
                  type="button"
                  onClick={() => setModuleEnabled("reservations", true)}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-700 px-3 py-1 text-xs font-bold text-white hover:bg-amber-800"
                >
                  <X size={11} /> Riattiva
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => suspendModule("reservations", endOfDay(0))}
                  className="ga-btn ga-btn-ghost text-sm"
                >
                  Solo oggi
                </button>
                <button
                  type="button"
                  onClick={() => suspendModule("reservations", endOfDay(3))}
                  className="ga-btn ga-btn-ghost text-sm"
                >
                  Prossimi 3 giorni
                </button>
                <button
                  type="button"
                  onClick={() => suspendModule("reservations", null)}
                  className="ga-btn ga-btn-ghost text-sm"
                >
                  A tempo indeterminato
                </button>
              </div>
            )}

            {!isSuspended && (
              <div className="flex flex-wrap items-end gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase opacity-50">Dal</span>
                  <input
                    type="date"
                    value={disableFrom}
                    onChange={(e) => setDisableFrom(e.target.value)}
                    className="ga-input"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase opacity-50">Al</span>
                  <input
                    type="date"
                    value={disableTo}
                    min={disableFrom || undefined}
                    onChange={(e) => setDisableTo(e.target.value)}
                    className="ga-input"
                  />
                </label>
                <button
                  type="button"
                  disabled={!disableFrom || !disableTo}
                  onClick={applyDateRange}
                  className="ga-btn ga-btn-primary disabled:opacity-40"
                >
                  Applica
                </button>
              </div>
            )}
          </section>

          {/* ── Orari accettazione prenotazioni ── */}
          <section className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Clock size={14} strokeWidth={2.3} />
              Orari accettazione prenotazioni
            </p>
            <p className="text-xs opacity-55">
              Gli orari qui configurati determinano gli slot mostrati nel form di prenotazione pubblica.
            </p>

            <div className="flex gap-3">
              {(["opening_offset", "fixed"] as ReservationTimeMode[]).map((mode) => (
                <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reservationTimeMode"
                    value={mode}
                    checked={reservationTimeSettings.mode === mode}
                    onChange={() => patchTime("mode", mode)}
                    className="accent-[var(--ga-accent)]"
                  />
                  {mode === "opening_offset" ? "Basati sugli orari di apertura" : "Orari fissi"}
                </label>
              ))}
            </div>

            {reservationTimeSettings.mode === "opening_offset" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase opacity-50">
                    Minuti dopo apertura (inizio)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={15}
                    value={reservationTimeSettings.startOffsetMinutes}
                    onChange={(e) => patchTime("startOffsetMinutes", Math.max(0, Number(e.target.value)))}
                    className="ga-input"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase opacity-50">
                    Minuti prima chiusura (fine)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={15}
                    value={reservationTimeSettings.endOffsetMinutes}
                    onChange={(e) => patchTime("endOffsetMinutes", Math.max(0, Number(e.target.value)))}
                    className="ga-input"
                  />
                </label>
              </div>
            )}

            {reservationTimeSettings.mode === "fixed" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase opacity-50">Dalle</span>
                  <input
                    type="time"
                    value={reservationTimeSettings.fixedStartTime}
                    onChange={(e) => patchTime("fixedStartTime", e.target.value)}
                    className="ga-input"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase opacity-50">Alle</span>
                  <input
                    type="time"
                    value={reservationTimeSettings.fixedEndTime}
                    onChange={(e) => patchTime("fixedEndTime", e.target.value)}
                    className="ga-input"
                  />
                </label>
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}
