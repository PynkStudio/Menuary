import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAiGovernanceBlogPage } from "@/components/tenants/pynkstudio/pages/ai-governance-blog";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "Blog AI Governance | PYNK STUDIO",
  description:
    "Articoli tecnici su LLM, token, contesto, RAG, fine tuning, AI Act, AI Literacy, agenti, MCP, tool calling, logging, auditing e workflow AI.",
  path: "/blog/ai-governance",
});

export default async function AiGovernanceBlogRoute() {
  await requirePynkstudioTenant();
  return <PynkAiGovernanceBlogPage />;
}
