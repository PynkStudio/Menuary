"use client";

import { buildLoginUrl, type LoginFrom } from "@/lib/login-url";

const POPUP_NAME = "menuary_login";
const POPUP_W = 480;
const POPUP_H = 660;
const LOGIN_ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://login.menuary.it"
    : "http://login.menuary.localhost:3000";

export interface LoginPopupOptions {
  from: LoginFrom;
  next?: string;
  /** Chiamato quando il login è andato a buon fine */
  onSuccess: () => void;
  /** Chiamato se l'utente chiude il popup senza fare login */
  onCancel?: () => void;
}

/**
 * Apre il login centralizzato.
 * - Desktop: popup centrato
 * - Mobile / popup bloccati: fallback a navigazione diretta
 * - App mobile (futuro): potrà intercettare `from=app.*` per deep link
 */
export function openLoginPopup(options: LoginPopupOptions): void {
  const url = buildLoginUrl({ from: options.from, next: options.next, popup: true });

  // Mobile → redirect diretto
  if (isMobile()) {
    window.location.href = buildLoginUrl({ from: options.from, next: options.next });
    return;
  }

  const left = Math.round((screen.width - POPUP_W) / 2);
  const top = Math.round((screen.height - POPUP_H) / 2);
  const features = [
    `width=${POPUP_W}`,
    `height=${POPUP_H}`,
    `left=${left}`,
    `top=${top}`,
    "toolbar=0,scrollbars=0,status=0,menubar=0,location=0",
  ].join(",");

  const popup = window.open(url, POPUP_NAME, features);

  // Se il browser ha bloccato il popup, fallback a redirect
  if (!popup || popup.closed) {
    window.location.href = buildLoginUrl({ from: options.from, next: options.next });
    return;
  }

  function handleMessage(e: MessageEvent) {
    if (e.origin !== LOGIN_ORIGIN) return;
    if (e.data?.type !== "menuary_auth_success") return;
    cleanup();
    popup?.close();
    options.onSuccess();
  }

  // Polling per rilevare chiusura manuale del popup
  const pollTimer = setInterval(() => {
    if (popup.closed) {
      cleanup();
      options.onCancel?.();
    }
  }, 500);

  function cleanup() {
    window.removeEventListener("message", handleMessage);
    clearInterval(pollTimer);
  }

  window.addEventListener("message", handleMessage);
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
}

/** Da chiamare nella pagina di auth-success dentro il popup */
export function notifyParentAndClose(from: string): void {
  if (typeof window === "undefined") return;
  window.opener?.postMessage({ type: "menuary_auth_success", from }, LOGIN_ORIGIN);
  // Piccolo delay per assicurarsi che il cookie sia propagato prima della chiusura
  setTimeout(() => window.close(), 150);
}
