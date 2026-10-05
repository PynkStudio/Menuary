import { headers } from "next/headers";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";

/**
 * Apple App Site Association per i link universali di "Are You Stupid?!":
 * il QR mostrato da Apple TV / Mac porta a https://pynkstudio.eu/ays/join?room=XXXX,
 * che con l'app installata apre direttamente la stanza. Servito solo sull'host
 * pynkstudio, senza redirect (Apple lo rifiuta altrimenti) — il middleware lo
 * lascia passare in `allowStaticAssets`.
 */
const AASA = {
  applinks: {
    details: [
      {
        appIDs: ["G48384PHQK.com.ays.areYouStupid"],
        components: [{ "/": "/ays/join*", comment: "Party room join links from the TV/Mac QR" }],
      },
    ],
  },
};

export async function GET() {
  const tenant = resolveTenantFromHost((await headers()).get("host"));
  if (tenant?.id !== "pynkstudio") return new Response("Not found", { status: 404 });
  return Response.json(AASA, { headers: { "cache-control": "public, max-age=3600" } });
}
