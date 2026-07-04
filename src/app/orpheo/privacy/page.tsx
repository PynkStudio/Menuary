import type { Metadata } from "next";
import { OrpheoPrivacyPage } from "@/components/orpheo/pages/legal";
import { ORPHEO_ORIGIN } from "@/lib/marketing-seo";

export const metadata: Metadata = {
  title: "Informativa sulla privacy",
  description:
    "Come Orpheo tratta i dati personali raccolti attraverso il sito weuseorpheo.com: dati, finalità, conservazione e diritti degli interessati.",
  alternates: { canonical: `${ORPHEO_ORIGIN}/privacy` },
};

export default function OrpheoPrivacyRoute() {
  return <OrpheoPrivacyPage />;
}
