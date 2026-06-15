import type { Metadata } from "next";
import { BizeryContattiPage } from "@/components/bizery/pages/contatti";
import {
  BIZERY_MARKETING_DESCRIPTION,
  BIZERY_ORIGIN,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contatti per siti web aziende",
    description: `Raccontaci il tuo studio, salone o azienda di servizi e scopri come Bizery può trasformarlo in un sito su misura. ${BIZERY_MARKETING_DESCRIPTION}`,
    alternates: marketingAlternates(BIZERY_ORIGIN, "/contatti", await getLocale()),
  };
}

export default function BizeryContatti() {
  return <BizeryContattiPage />;
}
