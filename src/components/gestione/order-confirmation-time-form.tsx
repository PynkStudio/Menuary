"use client";

import { useMemo, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { confirmPendingOrder } from "@/app/gestione/[tenantSlug]/ordini/actions";

type TimeOption = {
  value: string;
  label: string;
  hint: string;
};

type Props = {
  tenantSlug: string;
  orderId: string;
  requestedTime: string | null;
  createdAt: string;
  disabled?: boolean;
  confirmLabel: string;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function roundUpToMinutes(date: Date, step: number): Date {
  const copy = new Date(date);
  const minutes = copy.getMinutes();
  const rounded = Math.ceil(minutes / step) * step;
  copy.setMinutes(rounded, 0, 0);
  return copy;
}

function parseRequestedTime(raw: string | null, base: Date): Date | null {
  const value = raw?.trim();
  if (!value || value.toLowerCase() === "asap") return null;

  const isoLike = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/);
  if (isoLike) {
    const parsed = new Date(`${isoLike[1]}T${pad(Number(isoLike[2]))}:${isoLike[3]}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const italianLike = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (italianLike) {
    const parsed = new Date(`${italianLike[3]}-${pad(Number(italianLike[2]))}-${pad(Number(italianLike[1]))}T${pad(Number(italianLike[4]))}:${italianLike[5]}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const timeOnly = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeOnly) return null;
  const parsed = new Date(base);
  parsed.setHours(Number(timeOnly[1]), Number(timeOnly[2]), 0, 0);
  if (parsed.getTime() < base.getTime() - 5 * 60 * 1000) parsed.setDate(parsed.getDate() + 1);
  return parsed;
}

function sameLocalDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function optionValue(date: Date, reference: Date): string {
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (sameLocalDate(date, reference)) return time;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${time}`;
}

function optionHint(date: Date, reference: Date): string {
  if (sameLocalDate(date, reference)) return "oggi";
  const tomorrow = new Date(reference);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (sameLocalDate(date, tomorrow)) return "domani";
  return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function buildOptions(requestedTime: string | null, createdAt: string): TimeOption[] {
  const created = new Date(createdAt);
  const reference = Number.isNaN(created.getTime()) ? new Date() : created;
  const now = new Date();
  const requested = parseRequestedTime(requestedTime, reference);
  const baseline = requested ?? roundUpToMinutes(new Date(Math.max(now.getTime(), reference.getTime()) + 30 * 60 * 1000), 5);
  const candidates = requested
    ? [baseline, 15, 30, 45, 60].map((offset, index) => {
        if (index === 0) return baseline;
        const date = new Date(baseline);
        date.setMinutes(date.getMinutes() + Number(offset));
        return date;
      })
    : [0, 15, 30, 45, 60].map((offset) => {
        const date = new Date(baseline);
        date.setMinutes(date.getMinutes() + offset);
        return date;
      });

  const seen = new Set<string>();
  return candidates.flatMap((date, index) => {
    const value = optionValue(date, reference);
    if (seen.has(value)) return [];
    seen.add(value);
    return [{
      value,
      label: index === 0 && requested ? `Richiesto dal cliente: ${value}` : value,
      hint: optionHint(date, reference),
    }];
  });
}

function inputDateTimeValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function customValueToOrderTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

export function OrderConfirmationTimeForm({
  tenantSlug,
  orderId,
  requestedTime,
  createdAt,
  disabled,
  confirmLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const options = useMemo(() => buildOptions(requestedTime, createdAt), [requestedTime, createdAt]);
  const [selected, setSelected] = useState(options[0]?.value ?? "");
  const defaultCustom = useMemo(() => inputDateTimeValue(new Date(Date.now() + 45 * 60 * 1000)), []);
  const [customValue, setCustomValue] = useState(defaultCustom);
  const effectiveValue = selected === "__custom" ? customValueToOrderTime(customValue) : selected;

  return (
    <div className="ga-confirm-time">
      <button type="button" className="ga-btn ga-btn-primary" disabled={disabled} onClick={() => setOpen((value) => !value)}>
        <Check size={14} strokeWidth={2.4} /> {confirmLabel}
      </button>

      {open && (
        <div className="ga-confirm-time-popover">
          <label className="ga-confirm-time-label" htmlFor={`confirm-time-${orderId}`}>
            Orario di consegna previsto
          </label>
          <select
            id={`confirm-time-${orderId}`}
            className="ga-select ga-confirm-time-select"
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value);
              if (event.target.value === "__custom") setCustomOpen(true);
            }}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} · {option.hint}
              </option>
            ))}
            <option value="__custom">Altro orario...</option>
          </select>
          <form action={confirmPendingOrder} className="ga-confirm-time-actions">
            <input type="hidden" name="tenantSlug" value={tenantSlug} />
            <input type="hidden" name="id" value={orderId} />
            <input type="hidden" name="expectedTime" value={effectiveValue} />
            <button type="submit" className="ga-btn ga-btn-primary" disabled={disabled || !effectiveValue}>
              <Clock size={14} strokeWidth={2.4} /> Conferma
            </button>
            <button type="button" className="ga-btn ga-btn-ghost" onClick={() => setOpen(false)}>
              <X size={14} strokeWidth={2.4} /> Chiudi
            </button>
          </form>
        </div>
      )}

      {customOpen && (
        <div className="ga-confirm-modal" role="dialog" aria-modal="true" aria-label="Imposta altro orario">
          <div className="ga-confirm-modal-panel">
            <h2>Altro orario</h2>
            <input
              className="ga-input"
              type="datetime-local"
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
            />
            <div className="ga-confirm-time-actions">
              <button
                type="button"
                className="ga-btn ga-btn-primary"
                onClick={() => {
                  setSelected("__custom");
                  setCustomOpen(false);
                }}
              >
                <Check size={14} strokeWidth={2.4} /> Usa orario
              </button>
              <button type="button" className="ga-btn ga-btn-ghost" onClick={() => setCustomOpen(false)}>
                <X size={14} strokeWidth={2.4} /> Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
