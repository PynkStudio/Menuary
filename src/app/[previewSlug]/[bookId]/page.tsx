import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { LibritechBookDetailPage } from "@/components/tenants/libritech/pages/book-detail";
import { ValentinaOrciuoliStaticPage } from "@/components/tenants/valentina-orciuoli/pages/static-page";
import { ValentinaOrciuoliBookSite } from "@/components/tenants/valentina-orciuoli/book/book-site";
import { voAppendix, voSpreads } from "@/components/tenants/valentina-orciuoli/book/book-map";
import {
  valentinaCreativeWorks,
  valentinaOwnedSegments,
  valentinaWorkSection,
  type ValentinaPageKind,
} from "@/components/tenants/valentina-orciuoli/content";
import { resolvePreviewSurface, resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { tenantLanguageAlternates } from "@/lib/tenant-localized-path";
import { LOCALE_HEADER } from "@/i18n/locales";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { buildTenantIconSet } from "@/lib/favicon";
import { libritechCatalog } from "@/lib/libritech-catalog";
import { CasaBramantiPiecePage } from "@/components/tenants/casabramanti/pages/piece";
import { findCasabramantiPiece } from "@/lib/casabramanti-catalog";

const valentinaPages = new Set<string>(valentinaOwnedSegments);

/**
 * Le opere avevano una pagina a testa; ora il volume le raccoglie per collana.
 * I vecchi indirizzi restano validi e portano alla sezione giusta, perché sono
 * già stati condivisi — e un link a un libro non deve finire su un 404.
 */
const valentinaWorkPaths = new Set(valentinaCreativeWorks.map((work) => work.slug));

/**
 * Le pagine del libro sono route pubbliche vere sul dominio del tenant: ognuna
 * deve dichiarare il proprio titolo e il proprio canonical, altrimenti l'intero
 * volume si presenta ai crawler come una pagina sola.
 */
const VALENTINA_PAGE_SEO: Record<string, { title: string; description: string }> = {
  libri: {
    title: "Libri — Valentina Orciuoli",
    description:
      "Le opere di Valentina Orciuoli: The Emotion Dragons Trilogy e il thriller psicologico Tra fumo e ombre.",
  },
  trilogia: {
    title: "The Emotion Dragons Trilogy — Valentina Orciuoli",
    description:
      "Anxiety, Fury e Il Terzo Canto: la trilogia in cui le emozioni diventano dragoni.",
  },
  thriller: {
    title: "Thriller psicologico — Valentina Orciuoli",
    description:
      "Tra fumo e ombre: il thriller psicologico di Valentina Orciuoli, in arrivo.",
  },
  autrice: {
    title: "Chi sono — Valentina Orciuoli",
    description: "Valentina Orciuoli, autrice di fantasy orientale e thriller psicologico.",
  },
  eventi: {
    title: "Eventi — Valentina Orciuoli",
    description: "Presentazioni, firmacopie e nuove date con Valentina Orciuoli.",
  },
  contatti: {
    title: "Contatti — Valentina Orciuoli",
    description: "Scrivi a Valentina Orciuoli: form, email e canali ufficiali.",
  },
  blog: {
    title: "Taccuino — Valentina Orciuoli",
    description:
      "Appunti a margine della scrittura, riflessioni sui simboli e sul mestiere di raccontare.",
  },
  link: {
    title: "Link — Valentina Orciuoli",
    description: "Tutti i canali ufficiali di Valentina Orciuoli in un posto solo.",
  },
  privacy: { title: "Privacy Policy — Valentina Orciuoli", description: "Note legali del sito." },
  cookie: { title: "Cookie Policy — Valentina Orciuoli", description: "Note legali del sito." },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ previewSlug: string; bookId: string }>;
}): Promise<Metadata> {
  const requestHeaders = await headers();
  const { previewSlug, bookId } = await params;
  const surface = resolvePreviewSurface(requestHeaders.get("host"), previewSlug);
  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (surface.kind === "denied" || !tenant || tenant.previewSlug !== previewSlug) {
    return { robots: { index: false, follow: false } };
  }
  if (tenant.id !== "valentina-orciuoli" || !valentinaPages.has(bookId)) {
    return surface.kind === "tenant-domain" ? {} : { robots: { index: false, follow: false } };
  }

  const isPublicSite = surface.kind === "tenant-domain";
  const origin = isPublicSite ? surface.origin : "https://demo.weuseorpheo.com";
  const canonicalSlug = isPublicSite ? undefined : previewSlug;
  const localeConfig = getTenantLocaleConfig(tenant.id);
  const locale = requestHeaders.get(LOCALE_HEADER) ?? localeConfig?.defaultLocale;
  // Le schede delle opere non stanno nella tabella sopra: titolo e descrizione
  // sono quelli del catalogo, che è anche il posto da cui si aggiornano.
  const work = valentinaCreativeWorks.find((entry) => entry.slug === bookId);
  const seo = VALENTINA_PAGE_SEO[bookId] ?? {
    title: work ? `${work.title} — Valentina Orciuoli` : `${bookId} — Valentina Orciuoli`,
    description:
      work?.description ?? "The Emotion Dragons Trilogy e i romanzi di Valentina Orciuoli.",
  };
  const path = `/${bookId}`;
  const localizedPath = `${canonicalSlug ? `/${canonicalSlug}` : ""}${locale ? `/${locale}` : ""}${path}`;

  return {
    metadataBase: new URL(origin),
    title: { absolute: seo.title },
    description: seo.description,
    // Ogni pagina del volume è una route a sé: senza questo prende l'icona della
    // piattaforma e la scheda del browser cambia faccia sfogliando.
    icons: buildTenantIconSet(tenant),
    robots: isPublicSite
      ? { index: bookId !== "link", follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `${origin}${localizedPath}`,
      siteName: tenant.name,
      locale: "it_IT",
      type: "website",
    },
    ...(localeConfig
      ? {
          alternates: {
            canonical: `${origin}${localizedPath}`,
            languages: tenantLanguageAlternates({
              origin,
              pathname: path,
              previewSlug: canonicalSlug,
              locales: localeConfig.locales,
              defaultLocale: localeConfig.defaultLocale,
            }),
          },
        }
      : {}),
  };
}

export default async function BookDetailRoute({
  params,
}: {
  params: Promise<{ previewSlug: string; bookId: string }>;
}) {
  const host = (await headers()).get("host");
  const { previewSlug, bookId } = await params;
  if (resolvePreviewSurface(host, previewSlug).kind === "denied") notFound();

  const tenant = resolveTenantFromPreviewSlug(previewSlug);

  if (!tenant || tenant.previewSlug !== previewSlug) notFound();

  const themeVars = tenantThemeCssVars(tenant.theme);

  if (tenant.id === "valentina-orciuoli" && valentinaWorkPaths.has(bookId)) {
    const surface = resolvePreviewSurface(host, previewSlug);
    const locale =
      (await headers()).get(LOCALE_HEADER) ?? getTenantLocaleConfig(tenant.id)?.defaultLocale;
    const prefix = surface.kind === "tenant-domain" ? "" : `/${previewSlug}`;
    redirect(`${prefix}${locale ? `/${locale}` : ""}/${valentinaWorkSection(bookId)}`);
  }

  if (tenant.id === "valentina-orciuoli" && valentinaPages.has(bookId)) {
    // Le sezioni che sono pagine del libro entrano nella shell già aperte al
    // punto giusto; "autrice" è la quarta di copertina, quindi entra a volume
    // chiuso e rigirato; privacy e cookie sono l'appendice in fondo al volume.
    // Il linktree resta una landing a sé, fuori dal libro.
    const spreadIndex = voSpreads.findIndex((entry) => entry.id === bookId);
    const isAppendix = voAppendix.some((entry) => entry.id === bookId);
    const isBookRoute = spreadIndex >= 0 || bookId === "autrice" || isAppendix;

    return (
      <TenantProvider tenant={tenant}>
        <div
          className="min-h-screen"
          data-tenant-surface={tenant.id}
          style={themeVars as React.CSSProperties}
        >
          {isBookRoute ? (
            <ValentinaOrciuoliBookSite initialSpread={Math.max(spreadIndex, 0)} />
          ) : (
            <ValentinaOrciuoliStaticPage page={bookId as ValentinaPageKind} />
          )}
        </div>
      </TenantProvider>
    );
  }

  if (tenant.id === "casabramanti") {
    if (!tenant.features.shop || !findCasabramantiPiece(bookId)) notFound();
    return (
      <TenantProvider tenant={tenant}>
        <div
          className="min-h-screen"
          data-tenant-surface={tenant.id}
          style={themeVars as React.CSSProperties}
        >
          <CasaBramantiPiecePage pieceId={bookId} />
        </div>
      </TenantProvider>
    );
  }

  if (tenant.id !== "libritech" || !tenant.features.shop) notFound();
  if (!libritechCatalog.find((b) => b.id === bookId)) notFound();

  return (
    <TenantProvider tenant={tenant}>
      <div
        className="min-h-screen"
        data-tenant-surface={tenant.id}
        style={themeVars as React.CSSProperties}
      >
        <LibritechBookDetailPage bookId={bookId} />
      </div>
    </TenantProvider>
  );
}
