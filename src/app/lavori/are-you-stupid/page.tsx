import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAreYouStupidPage } from "@/components/tenants/pynkstudio/pages/are-you-stupid";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";
import { PYNK_ORIGIN } from "@/components/tenants/pynkstudio/ai-governance-data";

const base = pynkMetadata({
  title: "Are You Stupid? — party game, iMessage e AI | PYNK STUDIO",
  description:
    "Are You Stupid? è il party game da 2 a 16 giocatori di PYNK STUDIO: Apple TV o Mac come tabellone, telefoni come controller, sfide AI e Stupid Streak 1v1 in iMessage.",
  path: "/lavori/are-you-stupid",
});

// Stessa pagina, due lingue: qui l'italiana. L'inglese vive su /en (sibling
// route), l'unica scelta praticabile finché pynkstudio non ha un vero /en
// per l'intero sito — vedi are-you-stupid-en.tsx.
export const metadata = {
  ...base,
  alternates: {
    ...base.alternates,
    languages: {
      ...base.alternates?.languages,
      en: `${PYNK_ORIGIN}/it/lavori/are-you-stupid/en`,
    },
  },
};

export default async function AreYouStupidRoute() {
  await requirePynkstudioTenant();
  return <PynkAreYouStupidPage />;
}
