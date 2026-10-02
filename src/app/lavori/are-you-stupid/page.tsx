import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAreYouStupidPage } from "@/components/tenants/pynkstudio/pages/are-you-stupid";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";
import { PYNK_ORIGIN } from "@/components/tenants/pynkstudio/ai-governance-data";

const base = pynkMetadata({
  title: "Are You Stupid? — il party game per Apple TV, Mac e telefono | PYNK STUDIO",
  description:
    "Are You Stupid? è il party game da 2 a 8 giocatori firmato PYNK STUDIO: la stessa istruzione stupidissima per tutti, sulla TV chi sbaglia, il telefono come controller. Apple TV, Mac, iPhone e Android, anche in singolo.",
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
