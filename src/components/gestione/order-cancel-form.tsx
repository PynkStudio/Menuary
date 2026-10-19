"use client";

import { useActionState, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cancelOrderWithReason, type CancelOrderState } from "@/app/gestione/[tenantSlug]/ordini/actions";
import { ORDER_CANCELLATION_REASONS } from "@/lib/orders/cancellation";
import type { GestioneMessages } from "@/i18n/gestione";

type Props = {
  tenantSlug: string;
  orderId: string;
  /** ISO. Oltre questo istante il locale non può più annullare; null = senza limite. */
  deadline: string | null;
  disabled?: boolean;
  t: GestioneMessages["orders"]["cancelForm"];
};

function formatLeft(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const INITIAL: CancelOrderState = { ok: false, error: null };

export function OrderCancelForm({ tenantSlug, orderId, deadline, disabled, t }: Props) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [state, formAction, pending] = useActionState(cancelOrderWithReason, INITIAL);
  const deadlineMs = deadline ? new Date(deadline).getTime() : null;

  useEffect(() => {
    if (deadlineMs == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [deadlineMs]);

  const expired = deadlineMs != null && now >= deadlineMs;
  if (expired || state.error === "window_expired") {
    return <span className="ga-section-hint">{t.windowExpired}</span>;
  }

  return (
    <div className="ga-confirm-time">
      <button
        type="button"
        className="ga-btn ga-btn-ghost"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        suppressHydrationWarning
        title={deadlineMs != null ? t.timeLeft.replace("{time}", formatLeft(deadlineMs - now)) : undefined}
      >
        <X size={14} strokeWidth={2.4} /> {t.open}
        {deadlineMs != null && ` · ${formatLeft(deadlineMs - now)}`}
      </button>
      {open && (
        <div className="ga-confirm-time-popover">
          <form action={formAction}>
            <input type="hidden" name="tenantSlug" value={tenantSlug} />
            <input type="hidden" name="id" value={orderId} />
            <label className="ga-confirm-time-label" htmlFor={`cancel-reason-${orderId}`}>
              {t.reasonLabel}
            </label>
            <select id={`cancel-reason-${orderId}`} name="reason" className="ga-select" defaultValue="">
              <option value="">{t.reasonNone}</option>
              {ORDER_CANCELLATION_REASONS.map((code) => (
                <option key={code} value={code}>
                  {t.reasons[code]}
                </option>
              ))}
            </select>
            <label className="ga-confirm-time-label" htmlFor={`cancel-note-${orderId}`} style={{ marginTop: 8 }}>
              {t.noteLabel}
            </label>
            <textarea
              id={`cancel-note-${orderId}`}
              name="note"
              className="ga-input"
              rows={2}
              maxLength={500}
              placeholder={t.notePlaceholder}
            />
            {state.error && (
              <p className="ga-section-hint" role="alert">{t.failed}</p>
            )}
            <div className="ga-confirm-time-actions">
              <button type="submit" className="ga-btn ga-btn-primary" disabled={disabled || pending}>
                {t.confirm}
              </button>
              <button type="button" className="ga-btn ga-btn-ghost" onClick={() => setOpen(false)}>
                {t.back}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
