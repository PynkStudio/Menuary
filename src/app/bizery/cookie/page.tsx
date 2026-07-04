import type { Metadata } from "next";
import { BizeryCookiePage } from "@/components/bizery/pages/legal";
import { BIZERY_ORIGIN } from "@/lib/marketing-seo";

export const metadata: Metadata = {
  title: "Cookie policy",
  description:
    "Quali cookie usa il sito bizery.it, a cosa servono e come gestirli: solo cookie tecnici di lingua e mercato, statistiche senza cookie.",
  alternates: { canonical: `${BIZERY_ORIGIN}/cookie` },
};

export default function BizeryCookieRoute() {
  return <BizeryCookiePage />;
}
