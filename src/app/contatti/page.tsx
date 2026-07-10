import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import {
  BIZERY_MARKETING_DESCRIPTION,
  BIZERY_ORIGIN,
  MENUARY_ORIGIN,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale, getTranslations } from "@/i18n";
import { MarketingContactsPage } from "@/components/marketing/pages/contatti";
import { BizeryContattiPage } from "@/components/bizery/pages/contatti";
import { BeporkContactsPage } from "@/components/tenants/bepork/pages/contatti";
import { CascinaErranteContactsPage } from "@/components/tenants/cascina-errante/pages/contatti";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  const tenant = resolveTenantFromHost(h.get("host"));
  if (!tenant && mode !== "marketing" && mode !== "marketing-bizery") {
    return { title: "Pagina non trovata", robots: { index: false, follow: false } };
  }
  if (mode !== "marketing" && mode !== "marketing-bizery" && tenant?.id === "cascina-errante") {
    return {
      title: "Contatti & Prenotazioni",
      description:
        "Contatta Cascina Errante per visite, tavoli, eventi, catering e prodotti della bottega.",
    };
  }
  if (mode === "marketing") {
    const seo = (await getTranslations("marketing")).seo.contact;
    return {
      title: seo.title,
      description: seo.description,
      alternates: marketingAlternates(MENUARY_ORIGIN, "/contatti", await getLocale()),
    };
  }
  return mode === "marketing-bizery"
      ? {
        title: "Contatti per siti web aziende",
        description: `Raccontaci il tuo studio, salone o azienda di servizi e scopri come Bizery può trasformarlo in un sito su misura. ${BIZERY_MARKETING_DESCRIPTION}`,
        alternates: marketingAlternates(BIZERY_ORIGIN, "/contatti", await getLocale()),
      }
    : {
        title: "Contatti & Prenotazioni",
        description:
          "Prenota da ThePork su WhatsApp o chiamaci. Contatti, orari, mappa demo e social.",
      };
}

export default async function ContattiPage() {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  if (mode === "marketing") return <MarketingContactsPage />;
  if (mode === "marketing-bizery") return <BizeryContattiPage />;
  const tenant = resolveTenantFromHost(h.get("host"));
  if (!tenant) notFound();
  if (tenant.id === "cascina-errante") return <CascinaErranteContactsPage />;
  if (tenant.id !== "bepork") notFound();
  return <BeporkContactsPage />;
}
