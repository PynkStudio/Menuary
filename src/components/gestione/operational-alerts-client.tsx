"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing } from "lucide-react";
import { ArrivalAlertsProvider } from "@/lib/notifications/arrival-context";
import { NotificationMuteToggle } from "@/components/gestione/notification-controls";

type OperationalPortal = "ordini" | "cassa" | "cucina" | "kiosk" | "rider";

function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

function OperationalPresence({ tenantId, portal, locationId }: { tenantId: string; portal: OperationalPortal; locationId?: string }) {
  useEffect(() => {
    let stopped = false;

    const sendPresence = (visible: boolean) => {
      if (stopped) return;
      const body = JSON.stringify({
        tenantId,
        portal,
        locationId: locationId ?? null,
        visible,
      });
      void fetch("/api/operational/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    };
    const ping = () => sendPresence(document.visibilityState === "visible" && document.hasFocus());
    const markHidden = () => sendPresence(false);

    ping();
    const id = window.setInterval(ping, 10_000);
    window.addEventListener("visibilitychange", ping);
    window.addEventListener("focus", ping);
    window.addEventListener("blur", ping);
    window.addEventListener("pagehide", markHidden);
    return () => {
      stopped = true;
      window.clearInterval(id);
      window.removeEventListener("visibilitychange", ping);
      window.removeEventListener("focus", ping);
      window.removeEventListener("blur", ping);
      window.removeEventListener("pagehide", markHidden);
    };
  }, [locationId, portal, tenantId]);

  return null;
}

function PushButton({ tenantId }: { tenantId: string }) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const hidden = useMemo(() => permission === "unsupported" || permission === "granted" || permission === "denied", [permission]);
  if (hidden) return null;

  async function enable() {
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;

      const reg = await navigator.serviceWorker.register("/menuary-sw.js");
      const keyRes = await fetch("/api/push/vapid-public-key", { cache: "no-store" });
      const { publicKey } = (await keyRes.json()) as { publicKey?: string };
      if (!publicKey) return;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON() as PushSubscriptionJSON;
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return;
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          userAgent: navigator.userAgent,
        }),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="ga-btn ga-btn-ghost" onClick={() => void enable()} disabled={busy}>
      <BellRing size={14} strokeWidth={2.4} /> {busy ? "Attivo..." : "Attiva push"}
    </button>
  );
}

export function OperationalAlertsClient({
  tenantId,
  portal,
  locationId,
  children,
}: {
  tenantId: string;
  portal: OperationalPortal;
  locationId?: string;
  children?: React.ReactNode;
}) {
  return (
    <ArrivalAlertsProvider tenantId={tenantId} locationId={locationId} refreshOnChange enableReadyChannel={portal !== "cucina"}>
      <OperationalPresence tenantId={tenantId} portal={portal} locationId={locationId} />
      {children}
    </ArrivalAlertsProvider>
  );
}

export function OperationalAlertControls({ tenantId }: { tenantId: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <PushButton tenantId={tenantId} />
      <NotificationMuteToggle className="ga-btn ga-btn-ghost" />
    </div>
  );
}
