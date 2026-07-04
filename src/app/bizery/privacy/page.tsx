import type { Metadata } from "next";
import { BizeryPrivacyPage } from "@/components/bizery/pages/legal";
import { BIZERY_ORIGIN } from "@/lib/marketing-seo";

export const metadata: Metadata = {
  title: "Informativa sulla privacy",
  description:
    "Come Bizery tratta i dati personali raccolti attraverso il sito bizery.it: dati, finalità, conservazione e diritti degli interessati.",
  alternates: { canonical: `${BIZERY_ORIGIN}/privacy` },
};

export default function BizeryPrivacyRoute() {
  return <BizeryPrivacyPage />;
}
