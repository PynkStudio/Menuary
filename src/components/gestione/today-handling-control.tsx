"use client";

import { useEffect, useRef, useState } from "react";
import { AlarmClock, Check, Minus, Plus, RotateCcw, X } from "lucide-react";
import { setTodayHandlingOverride } from "@/app/gestione/[tenantSlug]/ordini/actions";

type Props = {
  tenantSlug: string;
  locationId: string | null;
  defaultMinutes: number;
  overrideMinutes: number | null;
};

const PRESETS = [15, 30, 45, 60, 90];
const DEFAULT_LOCATION_SCOPE = "__tenant_default__";
const MIN = 0;
const MAX = 600;

function clamp(value: number): number {
  if (!Number.isFinite(value)) return MIN;
  return Math.max(MIN, Math.min(MAX, Math.floor(value)));
}

export function TodayHandlingControl({ tenantSlug, locationId, defaultMinutes, overrideMinutes }: Props) {
  const hasOverride = overrideMinutes != null;
  const effective = overrideMinutes ?? defaultMinutes;
  const locationValue = locationId ?? DEFAULT_LOCATION_SCOPE;
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(effective);
  const rootRef = useRef<HTMLDivElement>(null);

  // Riallinea il campo quando i valori dal server cambiano (es. dopo un salvataggio).
  useEffect(() => {
    setMinutes(overrideMinutes ?? defaultMinutes);
  }, [overrideMinutes, defaultMinutes]);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="ga-handling" ref={rootRef}>
      <button
        type="button"
        className="ga-handling-trigger"
        data-override={hasOverride || undefined}
        onClick={() => setOpen((value) => !value)}
        title="Tempo di gestione: determina la prima consegna/ritiro disponibile."
      >
        <AlarmClock size={14} strokeWidth={2.4} />
        <span className="ga-handling-trigger-value">{effective} min</span>
        <span className="ga-handling-trigger-tag">{hasOverride ? "oggi" : "default"}</span>
      </button>

      {open && (
        <div className="ga-handling-popover">
          <div className="ga-handling-head">
            <span className="ga-confirm-time-label">Tempo di gestione</span>
            <p className="ga-handling-hint">
              Quanto serve per preparare un ordine. Determina la prima consegna o ritiro disponibile.
            </p>
          </div>

          <div className="ga-handling-state" data-override={hasOverride || undefined}>
            {hasOverride
              ? `Override attivo solo per oggi · default ${defaultMinutes} min`
              : `In uso il valore predefinito · ${defaultMinutes} min`}
          </div>

          <div className="ga-handling-stepper">
            <button
              type="button"
              className="ga-handling-step"
              aria-label="Diminuisci di 5 minuti"
              onClick={() => setMinutes((m) => clamp(m - 5))}
            >
              <Minus size={16} strokeWidth={2.6} />
            </button>
            <div className="ga-handling-field">
              <input
                type="number"
                min={MIN}
                max={MAX}
                step={5}
                value={minutes}
                onChange={(event) => setMinutes(clamp(Number(event.target.value)))}
                aria-label="Minuti di gestione per oggi"
              />
              <span>min</span>
            </div>
            <button
              type="button"
              className="ga-handling-step"
              aria-label="Aumenta di 5 minuti"
              onClick={() => setMinutes((m) => clamp(m + 5))}
            >
              <Plus size={16} strokeWidth={2.6} />
            </button>
          </div>

          <div className="ga-handling-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="ga-handling-preset"
                data-active={minutes === preset || undefined}
                onClick={() => setMinutes(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          <p className="ga-handling-note">{minutes === 0 ? "Consegna immediata (0 min)." : " "}</p>

          <div className="ga-confirm-time-actions">
            <form action={setTodayHandlingOverride}>
              <input type="hidden" name="tenantSlug" value={tenantSlug} />
              <input type="hidden" name="locationId" value={locationValue} />
              <input type="hidden" name="minutes" value={minutes} />
              <button type="submit" className="ga-btn ga-btn-primary">
                <Check size={14} strokeWidth={2.4} /> Salva per oggi
              </button>
            </form>
            {hasOverride && (
              <form action={setTodayHandlingOverride}>
                <input type="hidden" name="tenantSlug" value={tenantSlug} />
                <input type="hidden" name="locationId" value={locationValue} />
                <input type="hidden" name="minutes" value="" />
                <button type="submit" className="ga-btn ga-btn-ghost">
                  <RotateCcw size={14} strokeWidth={2.4} /> Ripristina default
                </button>
              </form>
            )}
            <button type="button" className="ga-btn ga-btn-ghost" onClick={() => setOpen(false)}>
              <X size={14} strokeWidth={2.4} /> Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
