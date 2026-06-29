import type { Metadata } from "next";
import { BizeryContattiPage } from "@/components/bizery/pages/contatti";
import {
  BIZERY_ORIGIN,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale, getTranslations } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getTranslations("bizery")).seo.contact;
  return {
    title: seo.title,
    description: seo.description,
    alternates: marketingAlternates(BIZERY_ORIGIN, "/contatti", await getLocale()),
  };
}

export default function BizeryContatti() {
  return <BizeryContattiPage />;
}
