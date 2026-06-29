import type { Metadata } from "next";
import { BizeryHomePage } from "@/components/bizery/pages/home";
import {
  BIZERY_ORIGIN,
  BIZERY_KEYWORDS,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale, getTranslations } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getTranslations("bizery")).seo.home;
  return {
    title: seo.title,
    description: seo.description,
    keywords: BIZERY_KEYWORDS,
    alternates: marketingAlternates(BIZERY_ORIGIN, "", await getLocale()),
  };
}

export default function BizeryHome() {
  return <BizeryHomePage />;
}
