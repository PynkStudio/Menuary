import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAreYouStupidEnPage } from "@/components/tenants/pynkstudio/pages/are-you-stupid-en";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";
import { PYNK_ORIGIN } from "@/components/tenants/pynkstudio/ai-governance-data";

const base = pynkMetadata({
  title: "Are You Stupid? — the party game for Apple TV, Mac and your phone | PYNK STUDIO",
  description:
    "Are You Stupid? is the 2-to-8-player party game by PYNK STUDIO: the same stupidly simple instruction for everyone, the TV shows who failed, your phone is the controller. Apple TV, Mac, iPhone and Android, single-player too.",
  path: "/lavori/are-you-stupid/en",
});

export const metadata = {
  ...base,
  alternates: {
    ...base.alternates,
    languages: {
      ...base.alternates?.languages,
      "it-IT": `${PYNK_ORIGIN}/it/lavori/are-you-stupid`,
      "x-default": `${PYNK_ORIGIN}/it/lavori/are-you-stupid`,
      en: `${PYNK_ORIGIN}/it/lavori/are-you-stupid/en`,
    },
  },
};

export default async function AreYouStupidEnRoute() {
  await requirePynkstudioTenant();
  return <PynkAreYouStupidEnPage />;
}
