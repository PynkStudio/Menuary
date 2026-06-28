import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAiGovernanceBlogPage } from "@/components/tenants/pynkstudio/pages/ai-governance-blog";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "Blog AI: guide tecniche su AI Act, LLM, RAG e governance | PYNK STUDIO",
  description:
    "Guide tecniche di riferimento per aziende e decision maker: AI Act, AI governance, LLM, RAG, agenti AI, tool calling, MCP, vector database, guardrail, logging e auditing. Scritte da chi i sistemi AI li costruisce.",
  path: "/blog/ai-governance",
  keywords: [
    "blog AI",
    "AI Act",
    "AI governance",
    "LLM",
    "RAG",
    "agenti AI",
    "tool calling",
    "MCP",
    "vector database",
    "intelligenza artificiale aziende",
    "AI Literacy",
  ],
});

export default async function AiGovernanceBlogRoute() {
  await requirePynkstudioTenant();
  return <PynkAiGovernanceBlogPage />;
}
