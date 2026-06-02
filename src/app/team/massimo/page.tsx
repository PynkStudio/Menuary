import type { Metadata } from "next";
import { MassimoCard } from "@/components/marketing/pages/business-card-massimo";

export const metadata: Metadata = {
  title: "Massimo Pernozzoli — Menuary",
  description: "Direttore Tecnico · Menuary",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Massimo Pernozzoli",
    description: "Direttore Tecnico · Menuary",
    url: "https://menuary.it/team/massimo",
  },
};

export default function MassimoCardPage() {
  return <MassimoCard />;
}
