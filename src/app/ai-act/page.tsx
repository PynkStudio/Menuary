import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAiActPage } from "@/components/tenants/pynkstudio/pages/ai-act";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "AI Act: obblighi, ruoli e rischio | PYNK STUDIO",
  description:
    "Sezione tecnica sull'AI Act: provider, deployer, importatori, distributori, sistemi vietati, alto rischio, AI Literacy, governance e documentazione.",
  path: "/ai-act",
});

export default async function AiActRoute() {
  await requirePynkstudioTenant();
  return <PynkAiActPage />;
}
