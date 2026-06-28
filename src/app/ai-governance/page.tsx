import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAiGovernancePage } from "@/components/tenants/pynkstudio/pages/ai-governance";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "AI Governance e AI Act per aziende | PYNK STUDIO",
  description:
    "AI Engineering Company: progettiamo, sviluppiamo e governiamo sistemi AI conformi all'AI Act. Assessment, architettura, AI Literacy, policy, integrazioni e operations per aziende e decision maker.",
  path: "/ai-governance",
  keywords: [
    "AI governance",
    "AI Act",
    "AI Act aziende",
    "obblighi AI Act",
    "intelligenza artificiale aziende",
    "consulenza AI",
    "AI Literacy",
    "AI risk assessment",
    "architetture AI",
    "agenti AI",
    "RAG",
    "governance intelligenza artificiale",
  ],
});

export default async function AiGovernanceRoute() {
  await requirePynkstudioTenant();
  return <PynkAiGovernancePage />;
}
