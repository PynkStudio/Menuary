import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAreYouStupidPrivacyPage } from "@/components/tenants/pynkstudio/pages/are-you-stupid-privacy";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

export const metadata = pynkMetadata({
  title: "Are You Stupid?! — Privacy Policy | PYNK STUDIO",
  description:
    "Privacy policy for the party game Are You Stupid?! by PYNK STUDIO (iPhone, iPad, Android, Apple TV, Mac): Google AdMob advertising, the online voice host, party mode data and your choices.",
  path: "/lavori/are-you-stupid/privacy",
});

export default async function AreYouStupidPrivacyRoute() {
  await requirePynkstudioTenant();
  return <PynkAreYouStupidPrivacyPage />;
}
