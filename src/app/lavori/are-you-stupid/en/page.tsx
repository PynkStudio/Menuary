import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAreYouStupidEnPage } from "@/components/tenants/pynkstudio/pages/are-you-stupid-en";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";
import { PYNK_ORIGIN } from "@/components/tenants/pynkstudio/ai-governance-data";

const base = pynkMetadata({
  title: "Are You Stupid? — party game, iMessage and AI | PYNK STUDIO",
  description:
    "Are You Stupid? is PYNK STUDIO's 2-to-16-player party game: Apple TV or Mac as the board, phones as controllers, AI challenges and Stupid Streak one-on-one in iMessage.",
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
