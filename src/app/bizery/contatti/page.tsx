import type { Metadata } from "next";
import { BizeryContattiPage } from "@/components/bizery/pages/contatti";
import {
  BIZERY_MARKETING_DESCRIPTION,
  BIZERY_ORIGIN,
  marketingLanguageAlternates,
} from "@/lib/marketing-seo";

export const metadata: Metadata = {
  title: "Contatti per siti web aziende",
  description: `Raccontaci il tuo studio, salone o azienda di servizi e scopri come Bizery può trasformarlo in un sito su misura. ${BIZERY_MARKETING_DESCRIPTION}`,
  alternates: {
    canonical: `${BIZERY_ORIGIN}/contatti`,
    languages: {
      ...marketingLanguageAlternates(BIZERY_ORIGIN, "/contatti"),
      "x-default": `${BIZERY_ORIGIN}/contatti`,
    },
  },
};

export default function BizeryContatti() {
  return <BizeryContattiPage />;
}
