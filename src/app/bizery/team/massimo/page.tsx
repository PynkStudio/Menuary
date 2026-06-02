import type { Metadata } from "next";
import { BizeryMassimoCard } from "@/components/bizery/pages/business-card-massimo";

export const metadata: Metadata = {
  title: "Massimo Pernozzoli — Bizery",
  description: "Direttore Tecnico · Bizery",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Massimo Pernozzoli",
    description: "Direttore Tecnico · Bizery",
    url: "https://bizery.it/team/massimo",
  },
};

export default function BizeryMassimoCardPage() {
  return <BizeryMassimoCard />;
}
