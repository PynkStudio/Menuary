"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useTenant } from "@/components/core/tenant-provider";
import { mergeTenantOverrides, useTenantAdminStore } from "@/store/tenant-admin-store";
import { usePlatformMode } from "@/components/core/platform-mode-provider";
import { useHydrated } from "@/components/core/providers";

/**
 * Carica il widget Slabbby solo se il modulo è attivo per il tenant corrente,
 * rispettando le override del tenant-admin-store.
 *
 * skipInPreview: usare nel layout per cedere il controllo alla pagina di preview,
 * che conosce il tenant esatto dallo slug (non dall'host).
 */
export function SlabbbyScriptGate({ skipInPreview = false }: { skipInPreview?: boolean }) {
  const tenant = useTenant();
  const overrides = useTenantAdminStore((state) => state.overrides[tenant.id]);
  const hydrated = useHydrated();
  const mode = usePlatformMode();
  const pathname = usePathname();

  if (mode === "gestione-bizery" || mode === "marketing-bizery") return null;

  // In preview mode il layout ha risolto il tenant dall'host (default del verticale),
  // non dallo slug. Lasciamo che la pagina di preview gestisca il proprio gate.
  const isPathPreview =
    !!tenant.previewSlug &&
    (pathname === `/${tenant.previewSlug}` || pathname?.startsWith(`/${tenant.previewSlug}/`));
  if (skipInPreview && (mode === "preview" || mode === "preview-bizery" || isPathPreview)) return null;

  // Prima della reidratazione usiamo il valore statico del registry per coerenza con l'SSR.
  // Dopo la reidratazione applichiamo le override dell'admin.
  const slabbbyEnabled = hydrated
    ? mergeTenantOverrides(tenant, overrides).features.slabbby
    : tenant.features.slabbby;

  if (!slabbbyEnabled) return null;

  return (
    <Script
      id="slabbby-widget"
      src="https://slabbby.com/widget.js"
      strategy="afterInteractive"
    />
  );
}
