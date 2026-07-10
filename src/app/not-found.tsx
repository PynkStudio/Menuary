import Link from "next/link";
import { headers } from "next/headers";
import type React from "react";
import { getPlatformModeFromHost } from "@/lib/platform";
import { findTenantById, findTenantByPreviewSlug } from "@/lib/tenant-registry";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import type { TenantProfile, TenantVertical } from "@/lib/tenant";

const tenantSurfaceClassById: Partial<Record<TenantProfile["id"], string>> = {
  "junior-food": "jf-site",
  kimos: "km-site",
  officinakam: "kam-site",
  libritech: "lt-site",
  studioaranzulla: "ara-site",
  "valentina-orciuoli": "vo-site",
};

const tenantNotFoundCopyByVertical: Record<TenantVertical, {
  title: React.ReactNode;
  description: string;
}> = {
  food: {
    title: (
      <>
        Qui non c&apos;è nulla
        <br />
        <span>da mangiare.</span>
      </>
    ),
    description: "La pagina che cerchi non esiste. Forse è il caso di tornare al menu.",
  },
  services: {
    title: (
      <>
        Qui non c&apos;è il servizio
        <br />
        <span>che cercavi.</span>
      </>
    ),
    description: "La pagina che cerchi non esiste, è stata spostata o non è più disponibile.",
  },
  creative: {
    title: (
      <>
        Qui non c&apos;è nessun progetto
        <br />
        <span>in scena.</span>
      </>
    ),
    description: "La pagina che cerchi non esiste. Puoi tornare al profilo principale.",
  },
};

function tenantHomeHref(tenant: TenantProfile, mode: string, isPreviewRequest: boolean): string {
  if (
    (isPreviewRequest || mode === "preview" || mode === "preview-bizery" || mode === "preview-orpheo") &&
    tenant.previewSlug
  ) {
    return `/${tenant.previewSlug}`;
  }
  return "/";
}

export default async function NotFound() {
  const h = await headers();
  const host = h.get("host");
  const mode = getPlatformModeFromHost(host);

  // ── Stile per portali Menuary (admin, login, clienti, studio, gestione, marketing) ──
  if (mode !== "tenant" && mode !== "preview" && mode !== "preview-bizery" && mode !== "preview-orpheo") {
    const labelByMode: Record<string, string> = {
      marketing: "Menuary",
      "marketing-bizery": "Bizery",
      "marketing-orpheo": "Orpheo",
      "platform-admin": "Menuary · Back-office",
      clients: "Menuary · Area personale",
      studio: "Menuary · Studio",
      login: "Menuary · Accesso",
      gestione: "Menuary · Gestione",
      "gestione-bizery": "Bizery · Gestione",
      "gestione-custom": "Gestione",
    };
    const label = labelByMode[mode] ?? "Menuary";

    return (
      <section className="flex min-h-screen flex-col items-center justify-center bg-[#F5F0EA] px-5 py-32 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-black/40">
          {label}
        </p>
        <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl">
          Pagina non trovata
        </h1>
        <p className="mt-5 max-w-md text-black/60">
          La pagina che cerchi non esiste, è stata spostata o non è più accessibile.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80"
        >
          Torna alla home
        </Link>
      </section>
    );
  }

  // ── Tenant / preview: applica il tema del tenant corrente ──
  const previewTenantId = h.get("x-preview-tenant-id");
  const tenantPublicPath = h.get("x-tenant-public-path") ?? "";
  const previewSlug = tenantPublicPath.split("/").filter(Boolean)[0];
  const tenant =
    findTenantById(previewTenantId ?? "") ??
    findTenantByPreviewSlug(previewSlug) ??
    resolveTenantFromHost(host);
  if (!tenant) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center bg-[#F5F0EA] px-5 py-32 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-black/40">
          Menuary
        </p>
        <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl">
          Pagina non trovata
        </h1>
        <p className="mt-5 max-w-md text-black/60">
          Questo dominio non è associato a nessun tenant attivo.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80"
        >
          Torna alla home
        </Link>
      </section>
    );
  }
  const cssVars = tenantThemeCssVars(tenant.theme);
  const copy = tenantNotFoundCopyByVertical[tenant.vertical];
  const tenantSurfaceClass = tenantSurfaceClassById[tenant.id];
  const homeHref = tenantHomeHref(tenant, mode, Boolean(previewTenantId || previewSlug));
  const accentColor = tenant.vertical === "services" ? tenant.theme.mustard : tenant.theme.red;

  return (
    <section
      className={[
        "tenant-preview-surface flex min-h-[70vh] flex-col items-center justify-center px-5 py-32 text-center",
        tenantSurfaceClass,
      ].filter(Boolean).join(" ")}
      data-tenant-surface={tenant.id}
      style={{
        ...cssVars,
        ...(tenantSurfaceClass
          ? {}
          : {
              backgroundColor: tenant.theme.cream,
              color: tenant.theme.ink,
            }),
      } as React.CSSProperties}
    >
      <span
        className="impact-title text-xl"
        style={{ color: accentColor }}
      >
        Errore 404
      </span>
      <h1 className="headline mt-3 text-6xl sm:text-7xl lg:text-8xl text-balance">
        {copy.title}
      </h1>
      <p className="mt-6 max-w-md opacity-70">
        {copy.description}
      </p>
      <Link
        href={homeHref}
        className="mt-8 inline-flex items-center rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80"
        style={{ backgroundColor: accentColor }}
      >
        Torna alla home
      </Link>
    </section>
  );
}
