"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, BellOff } from "lucide-react";

const TENANT_ID = "pynkstudio";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "unsupported" | "default" | "granted" | "denied" | "working";

export function PushEnableToggle() {
  const [state, setState] = useState<State>("default");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    setState(Notification.permission as State);
  }, []);

  const enable = async () => {
    setError(null);
    setState("working");
    try {
      const reg = await navigator.serviceWorker.register("/pynk-sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission as State);
        return;
      }
      const keyRes = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        setError("Chiave push non configurata sul server.");
        setState("default");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: TENANT_ID,
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error("subscribe_failed");
      setState("granted");
    } catch (e) {
      console.warn("[push-toggle]", e);
      setError("Attivazione fallita. Riprova.");
      setState("default");
    }
  };

  if (state === "unsupported") {
    return (
      <span className="pynk-admin-push-pill" data-variant="off">
        <BellOff size={15} /> Notifiche non supportate su questo browser
      </span>
    );
  }
  if (state === "granted") {
    return (
      <span className="pynk-admin-push-pill" data-variant="on">
        <BellRing size={15} /> Notifiche attive
      </span>
    );
  }
  if (state === "denied") {
    return (
      <span className="pynk-admin-push-pill" data-variant="off">
        <BellOff size={15} /> Notifiche bloccate nel browser
      </span>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={enable}
        disabled={state === "working"}
        className="pynk-admin-btn-primary"
      >
        <Bell size={15} />
        {state === "working" ? "Attivo…" : "Attiva notifiche su questo dispositivo"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
