import type { Metadata } from "next";
import { BizeryAboutPage } from "@/components/bizery/pages/chi-siamo";
import {
  BIZERY_ORIGIN,
  marketingLanguageAlternates,
} from "@/lib/marketing-seo";

export const metadata: Metadata = {
  title: "Studio per siti web aziende di servizi",
  description:
    "Bizery è la piattaforma digitale per studi medici, saloni, barbieri, studi legali, commercialisti e aziende di servizi. Siti su misura, appuntamenti e presenza locale in un posto solo.",
  alternates: {
    canonical: `${BIZERY_ORIGIN}/chi-siamo`,
    languages: {
      ...marketingLanguageAlternates(BIZERY_ORIGIN, "/chi-siamo"),
      "x-default": `${BIZERY_ORIGIN}/chi-siamo`,
    },
  },
};

export default function BizeryChiSiamoPage() {
  return <BizeryAboutPage />;
}

