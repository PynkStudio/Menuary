import type { Metadata } from "next";
import { BizeryAboutPage } from "@/components/bizery/pages/chi-siamo";
import {
  BIZERY_ORIGIN,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Studio per siti web aziende di servizi",
    description:
      "Bizery è la piattaforma digitale per studi medici, saloni, barbieri, studi legali, commercialisti e aziende di servizi. Siti su misura, appuntamenti e presenza locale in un posto solo.",
    alternates: marketingAlternates(BIZERY_ORIGIN, "/chi-siamo", await getLocale()),
  };
}

export default function BizeryChiSiamoPage() {
  return <BizeryAboutPage />;
}

