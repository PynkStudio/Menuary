import type { Metadata } from "next";
import { headers } from "next/headers";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import {
  BIZERY_MARKETING_DESCRIPTION,
  BIZERY_ORIGIN,
  MENUARY_MARKETING_DESCRIPTION,
  MENUARY_ORIGIN,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale } from "@/i18n";
import { MarketingContactsPage } from "@/components/marketing/pages/contatti";
import { BizeryContattiPage } from "@/components/bizery/pages/contatti";
import { BeporkContactsPage } from "@/components/tenants/bepork/pages/contatti";
import { CascinaErranteContactsPage } from "@/components/tenants/cascina-errante/pages/contatti";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  return mode === "marketing"
    ? {
        title: "Contatti per siti web ristoranti",
        description: `Raccontaci il tuo ristorante, bar o pizzeria e scopri come Menuary può trasformarlo in un sito su misura. ${MENUARY_MARKETING_DESCRIPTION}`,
        alternates: marketingAlternates(MENUARY_ORIGIN, "/contatti", await getLocale()),
      }
    : mode === "marketing-bizery"
      ? {
        title: "Contatti per siti web aziende",
        description: `Raccontaci il tuo studio, salone o azienda di servizi e scopri come Bizery può trasformarlo in un sito su misura. ${BIZERY_MARKETING_DESCRIPTION}`,
        alternates: marketingAlternates(BIZERY_ORIGIN, "/contatti", await getLocale()),
      }
    : {
        title: "Contatti & Prenotazioni",
        description:
          "Prenota da Be Pork su WhatsApp o chiamaci. Via Quintino Sella 128, 70123 Bari. Orari, mappa, social.",
      };
}

export default async function ContattiPage() {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));
  if (mode === "marketing") return <MarketingContactsPage />;
  if (mode === "marketing-bizery") return <BizeryContattiPage />;
  const tenant = resolveTenantFromHost(h.get("host"));
  if (tenant.id === "cascina-errante") return <CascinaErranteContactsPage />;
  return <BeporkContactsPage />;
}
