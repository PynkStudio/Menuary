import Link from "next/link";
import { headers } from "next/headers";
import { getPlatformModeFromHost } from "@/lib/platform";
import { findTenantById, findTenantByPreviewSlug } from "@/lib/tenant-registry";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";

export default async function NotFound() {
  const h = await headers();
  const host = h.get("host");
  const mode = getPlatformModeFromHost(host);

  // ── Stile per portali Menuary (admin, login, clienti, studio, gestione, marketing) ──
  if (mode !== "tenant" && mode !== "preview" && mode !== "preview-bizery") {
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
  const cssVars = tenantThemeCssVars(tenant.theme);

  return (
    <section
      className="tenant-preview-surface flex min-h-[70vh] flex-col items-center justify-center px-5 py-32 text-center"
      data-tenant-surface={tenant.id}
      style={{
        ...cssVars,
        backgroundColor: tenant.theme.cream,
        color: tenant.theme.ink,
      } as React.CSSProperties}
    >
      <span
        className="impact-title text-xl"
        style={{ color: tenant.theme.red }}
      >
        Errore 404
      </span>
      <h1 className="headline mt-3 text-6xl sm:text-7xl lg:text-8xl text-balance">
        Qui non c&apos;è nulla
        <br />
        <span style={{ color: tenant.theme.red }}>da mangiare.</span>
      </h1>
      <p className="mt-6 max-w-md opacity-70">
        La pagina che cerchi non esiste. Forse è il caso di tornare al menu.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80"
        style={{ backgroundColor: tenant.theme.red }}
      >
        Torna alla home
      </Link>
    </section>
  );
}
