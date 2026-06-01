import { getTenantLocaleConfig, matchTenantLocale } from "@/lib/tenant-locales";

function splitPathSuffix(href: string) {
  const index = href.search(/[?#]/);
  return index === -1
    ? { pathname: href, suffix: "" }
    : { pathname: href.slice(0, index), suffix: href.slice(index) };
}

function pathParts(pathname: string) {
  return pathname.split("/").filter(Boolean);
}

export function tenantLocaleFromPath(
  pathname: string,
  tenantId: string,
  previewSlug?: string,
) {
  const config = getTenantLocaleConfig(tenantId);
  if (!config) return null;
  const parts = pathParts(pathname);
  const candidate = previewSlug && parts[0] === previewSlug ? parts[1] : parts[0];
  return matchTenantLocale(candidate, config.locales);
}

export function localizeTenantHref({
  href,
  locale,
  previewSlug,
}: {
  href: string;
  locale: string;
  previewSlug?: string;
}) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const { pathname, suffix } = splitPathSuffix(href);
  const parts = pathParts(pathname);
  if (previewSlug && parts[0] === previewSlug) parts.shift();
  if (parts[0] && /^[a-z]{2}$/i.test(parts[0])) parts.shift();
  const rest = parts.length ? `/${parts.join("/")}` : "";
  return `${previewSlug ? `/${previewSlug}` : ""}/${locale}${rest}${suffix}`;
}

export function replaceTenantLocaleInPath({
  locale,
  pathname,
  previewSlug,
}: {
  locale: string;
  pathname: string;
  previewSlug?: string;
}) {
  return localizeTenantHref({ href: pathname, locale, previewSlug });
}

export function tenantLanguageAlternates({
  origin,
  pathname,
  previewSlug,
  locales,
  defaultLocale,
}: {
  origin: string;
  pathname: string;
  previewSlug?: string;
  locales: readonly string[];
  defaultLocale: string;
}) {
  const languages = Object.fromEntries(
    locales.map((locale) => [
      locale,
      `${origin}${localizeTenantHref({ href: pathname, locale, previewSlug })}`,
    ]),
  );
  return {
    ...languages,
    "x-default": `${origin}${localizeTenantHref({ href: pathname, locale: defaultLocale, previewSlug })}`,
  };
}
