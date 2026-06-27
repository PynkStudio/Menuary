import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAiGovernancePage } from "@/components/tenants/pynkstudio/pages/ai-governance";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "AI Governance per aziende | PYNK STUDIO",
  description:
    "Progettiamo, implementiamo e governiamo sistemi AI conformi alle normative europee: assessment, policy, AI Literacy, architetture, integrazioni e operations.",
  path: "/ai-governance",
});

export default async function AiGovernanceRoute() {
  await requirePynkstudioTenant();
  return <PynkAiGovernancePage />;
}
