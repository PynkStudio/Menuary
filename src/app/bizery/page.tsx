import type { Metadata } from "next";
import { BizeryHomePage } from "@/components/bizery/pages/home";
import {
  BIZERY_MARKETING_DESCRIPTION,
  BIZERY_ORIGIN,
  BIZERY_KEYWORDS,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Bizery - siti web per studi, saloni e aziende di servizi",
    description: BIZERY_MARKETING_DESCRIPTION,
    keywords: BIZERY_KEYWORDS,
    alternates: marketingAlternates(BIZERY_ORIGIN, "", await getLocale()),
  };
}

export default function BizeryHome() {
  return <BizeryHomePage />;
}
