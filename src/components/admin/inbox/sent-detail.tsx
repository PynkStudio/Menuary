"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrackingEventsForEmail } from "@/lib/email/tracking-queries";
import { TRACKING_EVENT_LABELS, TRACKING_EVENT_COLORS } from "@/lib/email/tracking-types";
import type { SentEmail } from "@/lib/email/sent-queries";
import type { TrackingEvent } from "@/lib/email/tracking-queries";
import type { ResendTrackingEventType } from "@/lib/email/tracking-types";

type Props = {
  email: SentEmail;
  onClose: () => void;
};

const STATUS_BADGE: Record<SentEmail["status"], string> = {
  sent:             "bg-blue-50 text-blue-600",
  delivered:        "bg-green-50 text-green-600",
  delivery_delayed: "bg-yellow-50 text-yellow-600",
  bounced:          "bg-red-50 text-red-600",
  complained:       "bg-orange-50 text-orange-600",
};

const STATUS_LABELS: Record<SentEmail["status"], string> = {
  sent:             "Inviata",
  delivered:        "Consegnata",
  delivery_delayed: "Ritardo consegna",
  bounced:          "Rimbalzata",
  complained:       "Segnata spam",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export function SentDetail({ email, onClose }: Props) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);

  useEffect(() => {
    if (!email.resend_message_id) return;
    getTrackingEventsForEmail(email.resend_message_id)
      .then(setEvents)
      .catch(console.error);
  }, [email.resend_message_id]);

  const displayFrom = email.from_name
    ? `${email.from_name} <${email.from_address}>`
    : email.from_address;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-[var(--ma-line)] px-5 py-3">
        <button
          onClick={onClose}
          className="menuary-admin-nav-link mr-2 !w-auto gap-1.5 !px-2 !py-1.5 text-sm"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Indietro</span>
        </button>
        <div className="flex-1" />
        <button onClick={onClose} className="menuary-admin-nav-link !w-auto !px-2 !py-1.5 lg:hidden">
          <X size={16} />
        </button>
      </div>

      {/* Header */}
      <div className="border-b border-[var(--ma-line)] px-5 py-4">
        <div className="mb-2 flex flex-wrap items-start gap-2">
          <h2 className="flex-1 text-lg font-semibold text-[var(--ma-ink)] leading-snug">
            {email.subject || "(nessun oggetto)"}
          </h2>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", STATUS_BADGE[email.status])}>
            {STATUS_LABELS[email.status]}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--ma-muted)]">
          <span><span className="font-medium text-[var(--ma-ink)]">Da:</span> {displayFrom}</span>
          <span><span className="font-medium text-[var(--ma-ink)]">A:</span> {email.to_addresses.join(", ")}</span>
          <span>{fmtDate(email.created_at)}</span>
        </div>
      </div>

      {/* Tracking timeline */}
      {events.length > 0 && (
        <div className="border-b border-[var(--ma-line)] px-5 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ma-muted)]">Tracking</p>
          <div className="flex flex-wrap gap-2">
            {events.map((ev) => {
              const label = TRACKING_EVENT_LABELS[ev.event_type as ResendTrackingEventType] ?? ev.event_type;
              const color = TRACKING_EVENT_COLORS[ev.event_type as ResendTrackingEventType] ?? "bg-gray-50 text-gray-600";
              const meta = ev.metadata as Record<string, unknown>;
              const clickLink =
                meta.click && typeof meta.click === "object"
                  ? String((meta.click as Record<string, unknown>).link ?? "")
                  : "";
              return (
                <div key={ev.id} className={cn("rounded-lg px-2.5 py-1.5 text-xs", color)}>
                  <span className="font-medium">{label}</span>
                  <span className="ml-1.5 opacity-70">{fmtTime(ev.created_at)}</span>
                  {clickLink && (
                    <span className="ml-1.5 max-w-[140px] truncate align-bottom opacity-70 inline-block">
                      {clickLink}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Corpo */}
      <div className="flex-1 overflow-y-auto p-5">
        {email.html_body ? (
          <iframe
            srcDoc={email.html_body}
            className="h-full min-h-96 w-full rounded-lg border border-[var(--ma-line)]"
            sandbox="allow-same-origin"
            title="Corpo email"
          />
        ) : (
          <p className="text-sm text-[var(--ma-muted)]">(Nessun contenuto)</p>
        )}
      </div>
    </div>
  );
}
