"use client";

import { Bell, BellOff } from "lucide-react";
import { useArrivalAlerts } from "@/lib/notifications/arrival-context";

/**
 * Pulsante mute/unmute del chime. Da inserire nell'header gestione/KDS.
 * Mostra anche un "dot" se ci sono notifiche non lette su qualsiasi canale.
 */
export function NotificationMuteToggle({
  className,
  ariaLabelMuted = "Riattiva avvisi sonori",
  ariaLabelOn = "Silenzia avvisi sonori",
}: {
  className?: string;
  ariaLabelMuted?: string;
  ariaLabelOn?: string;
}) {
  const { muted, toggleMute, counters } = useArrivalAlerts();
  const hasPending =
    counters.orders + counters.reservations + counters.ready > 0;

  return (
    <button
      type="button"
      onClick={toggleMute}
      className={className ?? "ga-icon-button"}
      aria-label={muted ? ariaLabelMuted : ariaLabelOn}
      aria-pressed={muted}
      data-has-pending={hasPending || undefined}
      style={{ position: "relative" }}
    >
      {muted ? (
        <BellOff size={15} strokeWidth={2} />
      ) : (
        <Bell size={15} strokeWidth={2} />
      )}
      {hasPending && !muted && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#e11d48",
            boxShadow: "0 0 0 2px var(--ga-header-bg, currentColor)",
          }}
        />
      )}
    </button>
  );
}

/**
 * Badge contatore per voce sidebar. Reso vuoto quando count=0.
 * Usa colori neutri (currentColor + accent CSS var) per non vincolare lo stile
 * del tenant: la shell di ogni tenant override-a `--ga-badge-bg`.
 */
export function ArrivalBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ga-nav-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 18,
        height: 18,
        padding: "0 5px",
        marginLeft: 8,
        borderRadius: 9,
        background: "var(--ga-badge-bg, #e11d48)",
        color: "var(--ga-badge-fg, #fff)",
        fontSize: 11,
        fontWeight: 800,
        lineHeight: 1,
      }}
      aria-label={`${count} nuovi`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
