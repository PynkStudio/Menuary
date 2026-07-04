import type { Metadata } from "next";
import { OrpheoCookiePage } from "@/components/orpheo/pages/legal";
import { ORPHEO_ORIGIN } from "@/lib/marketing-seo";

export const metadata: Metadata = {
  title: "Cookie policy",
  description:
    "Quali cookie usa il sito weuseorpheo.com, a cosa servono e come gestirli: solo cookie tecnici di lingua e mercato, statistiche senza cookie.",
  alternates: { canonical: `${ORPHEO_ORIGIN}/cookie` },
};

export default function OrpheoCookieRoute() {
  return <OrpheoCookiePage />;
}
