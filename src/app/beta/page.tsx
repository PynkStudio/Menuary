import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioBetaPage } from "@/components/tenants/pynkstudio/pages/beta";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "Beta program — prova le app di PYNK STUDIO in anteprima",
  description:
    "Iscriviti al beta program di PYNK STUDIO: scegli i tuoi dispositivi (iPhone, iPad, Mac, Apple TV, Android e altri) e unisciti alle beta su TestFlight, Google Play e web. Avvisi via email sulle nuove beta.",
  path: "/beta",
});

export default async function BetaRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioBetaPage />;
}
