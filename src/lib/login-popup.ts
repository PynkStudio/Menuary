"use client";

import { buildLoginUrl, type LoginFrom } from "@/lib/login-url";

const POPUP_NAME = "menuary_login";
const POPUP_W = 480;
const POPUP_H = 660;

export const LOGIN_ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://login.menuary.it"
    : "http://login.menuary.localhost:3000";

const MENUARY_DOMAIN = ".menuary.it";

export interface LoginPopupOptions {
  from: LoginFrom;
  next?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

/**
 * Apre il login centralizzato.
 * - Desktop: popup centrato con branding tenant
 * - Mobile / popup bloccati: fallback a navigazione diretta
 *
 * Flusso sessione:
 * - Parent su *.menuary.it → cookie .menuary.it già accessibile, solo router.refresh()
 * - Parent su dominio custom (bepork.it) → scambio token via /api/auth/set-session
 */
export function openLoginPopup(options: LoginPopupOptions): void {
  if (isMobile()) {
    window.location.href = buildLoginUrl({ from: options.from, next: options.next });
    return;
  }

  const parentOrigin = window.location.origin;
  const url = buildLoginUrl({
    from: options.from,
    next: options.next,
    popup: true,
    origin: parentOrigin,
  });

  const left = Math.round((screen.width - POPUP_W) / 2);
  const top = Math.round((screen.height - POPUP_H) / 2);
  const popup = window.open(
    url,
    POPUP_NAME,
    `width=${POPUP_W},height=${POPUP_H},left=${left},top=${top},toolbar=0,scrollbars=0,status=0,menubar=0`,
  );

  if (!popup || popup.closed) {
    window.location.href = buildLoginUrl({ from: options.from, next: options.next });
    return;
  }

  const needsTokenExchange = !isMenuarySubdomain(parentOrigin);

  async function handleMessage(e: MessageEvent) {
    if (e.origin !== LOGIN_ORIGIN) return;
    if (e.data?.type !== "menuary_auth_success") return;
    cleanup();
    popup?.close();

    if (needsTokenExchange) {
      const { access_token, refresh_token } = e.data as {
        access_token?: string;
        refresh_token?: string;
      };
      if (access_token && refresh_token) {
        try {
          await fetch("/api/auth/set-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token, refresh_token }),
          });
        } catch {
          // Session non impostata, router.refresh() mostrerà stato anonimo
        }
      }
    }

    options.onSuccess();
  }

  const pollTimer = setInterval(() => {
    if (popup.closed) {
      cleanup();
      options.onCancel?.();
    }
  }, 500);

  function cleanup() {
    window.removeEventListener("message", handleMessage as unknown as EventListener);
    clearInterval(pollTimer);
  }

  window.addEventListener("message", handleMessage as unknown as EventListener);
}

/**
 * Da chiamare nel popup dopo login riuscito.
 * Passa i token al parent per l'exchange su domini custom.
 */
export function notifyParentAndClose(options: {
  from: string;
  parentOrigin: string;
  accessToken: string;
  refreshToken: string;
}): void {
  if (typeof window === "undefined" || !window.opener) return;

  // Valida che il parentOrigin sia un'origine lecita prima di inviare i token
  if (!isAllowedOrigin(options.parentOrigin)) {
    console.warn("[login-popup] postMessage bloccato: origine non autorizzata", options.parentOrigin);
    window.close();
    return;
  }

  window.opener.postMessage(
    {
      type: "menuary_auth_success",
      from: options.from,
      access_token: options.accessToken,
      refresh_token: options.refreshToken,
    },
    options.parentOrigin,
  );

  // Piccolo delay per assicurarsi che il messaggio sia consegnato
  setTimeout(() => window.close(), 200);
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
}

function isMenuarySubdomain(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "menuary.it" || hostname.endsWith(MENUARY_DOMAIN);
  } catch {
    return false;
  }
}

/**
 * Origini autorizzate a ricevere token via postMessage.
 * Include tutti i sottodomini Menuary + domini tenant registrati.
 */
function isAllowedOrigin(origin: string): boolean {
  if (isMenuarySubdomain(origin)) return true;
  // Tenant con dominio custom — in futuro leggere da un registry
  const ALLOWED_CUSTOM = ["https://bepork.it", "https://www.bepork.it", "https://faak.it"];
  return ALLOWED_CUSTOM.includes(origin);
}
