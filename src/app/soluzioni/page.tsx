import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkSolutionsIndexPage } from "@/components/tenants/pynkstudio/pages/ai-solutions-index";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "Soluzioni AI per le aziende: casi d'uso concreti | PYNK STUDIO",
  description:
    "Soluzioni AI per problemi concreti: come usare ChatGPT in azienda, assistente AI per i clienti, automazione documenti, AI per studio legale e ufficio tecnico, come rispettare l'AI Act e formazione AI dei dipendenti.",
  path: "/soluzioni",
  keywords: [
    "soluzioni AI",
    "AI per aziende",
    "ChatGPT in azienda",
    "assistente AI clienti",
    "automazione documenti",
    "AI studio legale",
    "AI ufficio tecnico",
    "come rispettare AI Act",
    "formazione AI dipendenti",
  ],
});

export default async function SolutionsIndexRoute() {
  await requirePynkstudioTenant();
  return <PynkSolutionsIndexPage />;
}
