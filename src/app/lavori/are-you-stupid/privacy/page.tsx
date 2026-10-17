import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAreYouStupidPrivacyPage } from "@/components/tenants/pynkstudio/pages/are-you-stupid-privacy";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "Are You Stupid?! — Privacy Policy | PYNK STUDIO",
  description:
    "Privacy policy for the mobile game Are You Stupid?! (iOS & Android) by PYNK STUDIO: what data is collected, Google AdMob advertising, and your choices.",
  path: "/lavori/are-you-stupid/privacy",
});

export default async function AreYouStupidPrivacyRoute() {
  await requirePynkstudioTenant();
  return <PynkAreYouStupidPrivacyPage />;
}
