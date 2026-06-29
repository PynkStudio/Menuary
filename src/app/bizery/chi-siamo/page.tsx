import type { Metadata } from "next";
import { BizeryAboutPage } from "@/components/bizery/pages/chi-siamo";
import {
  BIZERY_ORIGIN,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale, getTranslations } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getTranslations("bizery")).seo.about;
  return {
    title: seo.title,
    description: seo.description,
    alternates: marketingAlternates(BIZERY_ORIGIN, "/chi-siamo", await getLocale()),
  };
}

export default function BizeryChiSiamoPage() {
  return <BizeryAboutPage />;
}

