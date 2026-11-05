import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkBetaPrivacyPage } from "@/components/tenants/pynkstudio/pages/beta-privacy";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "Informativa privacy del Beta program | PYNK STUDIO",
  description: "Quali dati tratta il beta program di PYNK STUDIO, perché, con chi li condivide e come cancellarli.",
  path: "/beta/privacy",
});

export default async function BetaPrivacyRoute() {
  await requirePynkstudioTenant();
  return <PynkBetaPrivacyPage lang="it" />;
}
