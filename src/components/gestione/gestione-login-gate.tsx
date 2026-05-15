"use client";

import { useRouter } from "next/navigation";
import { openLoginPopup } from "@/lib/login-popup";
import type { LoginFrom } from "@/lib/login-url";

interface Props {
  tenantSlug: string;
  tenantName: string;
  accentColor: string;
}

/**
 * Login gate per gestione.bizery.it (e futuri portali cross-domain).
 *
 * Non può usare il redirect server-side perché dopo l'auth su login.menuary.it
 * il cookie .bizery.it non sarebbe disponibile. Usa invece il flusso popup:
 *   1. Apre login.menuary.it in popup con branding tenant
 *   2. Dopo il login, il popup invia i token via postMessage
 *   3. Il client chiama /api/auth/set-session → cookie origin-scoped
 *   4. router.refresh() → il server component rileva la sessione
 */
export function GestioneLoginGate({ tenantSlug, tenantName, accentColor }: Props) {
  const router = useRouter();
  const from: LoginFrom = `gestione-bizery.${tenantSlug}`;

  function handleLogin() {
    openLoginPopup({
      from,
      onSuccess() {
        router.refresh();
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <p
          className="mb-1 text-xs font-bold uppercase tracking-[0.2em] opacity-40"
          style={{ color: "inherit" }}
        >
          Bizery · {tenantName}
        </p>
        <h1 className="mt-2 text-2xl font-bold">Accesso richiesto</h1>
        <p className="mt-3 text-sm opacity-60">
          Accedi con le tue credenziali per accedere al pannello di gestione.
        </p>
        <button
          onClick={handleLogin}
          className="mt-8 w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: accentColor }}
        >
          Accedi
        </button>
      </div>
    </div>
  );
}
