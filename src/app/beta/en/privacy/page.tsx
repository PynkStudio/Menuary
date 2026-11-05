import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkBetaPrivacyPage } from "@/components/tenants/pynkstudio/pages/beta-privacy";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "Beta program privacy notice | PYNK STUDIO",
  description: "What data the PYNK STUDIO beta program processes, why, who receives it and how to delete it.",
  path: "/beta/en/privacy",
});

export default async function BetaPrivacyEnRoute() {
  await requirePynkstudioTenant();
  return <PynkBetaPrivacyPage lang="en" />;
}
