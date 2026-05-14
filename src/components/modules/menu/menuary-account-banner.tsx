"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { usePlatformMode } from "@/components/core/platform-mode-provider";
import { useTenant } from "@/components/core/tenant-provider";

/** Stessa chiave su menu / ordina / tavolo: dismiss = ospite per tutta la sessione (per tenant). */
function storageKey(tenantId: string) {
  return `menuary_menu_auth_hint:${tenantId}`;
}

type PanelState = { loginHref: string };

export function MenuaryAccountBanner() {
  const mode = usePlatformMode();
  const tenant = useTenant();
  const key = useMemo(() => storageKey(tenant.id), [tenant.id]);

  const [panel, setPanel] = useState<PanelState | null>(null);

  useEffect(() => {
    if (mode !== "tenant" && mode !== "preview") {
      setPanel(null);
      return;
    }
    if (sessionStorage.getItem(key) === "1") {
      setPanel(null);
      return;
    }
    const returnTo = window.location.href;
    const loginHref = `/api/auth/menuary/start?return_to=${encodeURIComponent(returnTo)}`;
    setPanel({ loginHref });
  }, [key, mode]);

  if (!panel || (mode !== "tenant" && mode !== "preview")) {
    return null;
  }

  const dismiss = () => {
    sessionStorage.setItem(key, "1");
    setPanel(null);
  };

  return (
    <div
      role="region"
      aria-label="Menuary account sign-in"
      className="border-b border-pork-mustard/35 bg-pork-ink/90 px-4 py-3 text-pork-cream backdrop-blur-sm"
    >
      <div className="container-wide flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm leading-snug text-pork-cream/90 sm:max-w-2xl">
          Accedi con <strong className="text-pork-mustard">Menuary</strong> per
          un&apos;esperienza più personale (preferenze e allergeni sul tuo
          profilo). Puoi anche continuare come ospite.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link href={panel.loginHref} className="btn-primary inline-flex text-sm">
            Accedi con Menuary
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="btn-ghost inline-flex items-center gap-1 text-sm text-pork-cream/85"
          >
            Continua come ospite
            <X size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
