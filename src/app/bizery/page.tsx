import type { Metadata } from "next";
import { BizeryHomePage } from "@/components/bizery/pages/home";
import {
  BIZERY_MARKETING_DESCRIPTION,
  BIZERY_ORIGIN,
  BIZERY_KEYWORDS,
  marketingLanguageAlternates,
} from "@/lib/marketing-seo";

export const metadata: Metadata = {
  title: "Bizery - siti web per studi, saloni e aziende di servizi",
  description: BIZERY_MARKETING_DESCRIPTION,
  keywords: BIZERY_KEYWORDS,
  alternates: {
    canonical: BIZERY_ORIGIN,
    languages: {
      ...marketingLanguageAlternates(BIZERY_ORIGIN),
      "x-default": BIZERY_ORIGIN,
    },
  },
};

export default function BizeryHome() {
  return <BizeryHomePage />;
}
