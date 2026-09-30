import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioIaInAziendaPage } from "@/components/tenants/pynkstudio/pages/ia-in-azienda";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "Formazione IA in Azienda | AI Compliance e AI Literacy | PynkStudio",
  description:
    "Formazione pratica sull'Intelligenza Artificiale per aziende. AI Literacy, governance interna, policy, attestati e consulenza personalizzata con PynkStudio.",
  path: "/ia-in-azienda",
  keywords: [
    "formazione IA aziende",
    "corso intelligenza artificiale aziende",
    "AI literacy",
    "AI compliance",
    "policy IA aziendale",
    "formazione ChatGPT aziende",
    "AI Act formazione dipendenti",
  ],
});

export default async function IaInAziendaRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioIaInAziendaPage />;
}
