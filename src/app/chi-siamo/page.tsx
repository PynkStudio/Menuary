import type { Metadata } from "next";
import { headers } from "next/headers";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import {
  BIZERY_ORIGIN,
  MENUARY_ORIGIN,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale, getTranslations } from "@/i18n";
import { MarketingAboutPage } from "@/components/marketing/pages/chi-siamo";
import { BizeryAboutPage } from "@/components/bizery/pages/chi-siamo";
import { BeporkAboutPage } from "@/components/tenants/bepork/pages/chi-siamo";
import { CascinaErranteAboutPage } from "@/components/tenants/cascina-errante/pages/chi-siamo";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  if (mode === "marketing") {
    const seo = (await getTranslations("marketing")).seo.about;
    return {
      title: seo.title,
      description: seo.description,
      alternates: marketingAlternates(MENUARY_ORIGIN, "/chi-siamo", await getLocale()),
    };
  }
  if (mode === "marketing-bizery") {
    return {
      title: "Studio per siti web aziende di servizi",
      description:
        "Bizery è la piattaforma digitale per studi medici, saloni, barbieri, studi legali, commercialisti e aziende di servizi. Siti su misura, appuntamenti e presenza locale in un posto solo.",
      alternates: marketingAlternates(BIZERY_ORIGIN, "/chi-siamo", await getLocale()),
    };
  }
  const tenant = resolveTenantFromHost(h.get("host"));
  if (tenant.id === "cascina-errante") {
    return {
      title: "Chi siamo",
      description:
        "Il manifesto di Cascina Errante: agricoltura innovativa, ospitalità, rispetto per la natura ed eccellenza senza compromessi.",
    };
  }
  return {
    title: "Chi siamo",
    description: "Scopri il tenant ristorante attivo su Menuary.",
  };
}

export default async function ChiSiamoPage() {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  if (mode === "marketing") return <MarketingAboutPage />;
  if (mode === "marketing-bizery") return <BizeryAboutPage />;
  const tenant = resolveTenantFromHost(h.get("host"));
  if (tenant.id === "cascina-errante") return <CascinaErranteAboutPage />;
  return <BeporkAboutPage />;
}
