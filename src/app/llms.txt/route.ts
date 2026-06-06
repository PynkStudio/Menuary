import { headers } from "next/headers";
import { getPlatformModeFromHost } from "@/lib/platform";

const MENUARY = `# Menuary

> Piattaforma SaaS multi-tenant per attività HORECA (ristoranti, bar, pizzerie, trattorie). Ogni cliente ha un sito proprio con menu digitale, prenotazioni, ordini al tavolo, galleria e recensioni.

Menuary è il verticale food della piattaforma Menuary. Il verticale gemello per attività non-HORECA (officine, studi, saloni, centri benessere) è Bizery (https://bizery.it).

## Sito marketing

- [Home](https://menuary.it/): cos'è Menuary, moduli disponibili, demo
- [Chi siamo](https://menuary.it/chi-siamo): mission e team
- [Pricing](https://menuary.it/pricing): piani e abbonamenti
- [Contatti](https://menuary.it/contatti): form di contatto e demo

## Prodotto

- [Demo tenant food](https://demo.menuary.it): anteprima di un sito-tenant configurabile
- [Login](https://login.menuary.it): autenticazione centralizzata clienti e staff
- [Area clienti](https://clienti.menuary.it): area personale dei clienti finali (preferiti, prenotazioni, ordini)
- [Studio](https://studio.menuary.it): fatturazione e abbonamenti B2B
- [Gestione tenant](https://gestione.menuary.it): pannello backoffice per il singolo locale

## Moduli

Menu digitale, prenotazioni tavoli, ordini al tavolo, galleria, recensioni, preferiti, multi-sede.

## Optional

- [Bizery (verticale services)](https://bizery.it)
`;

const BIZERY = `# Bizery

> Piattaforma SaaS multi-tenant per attività non-HORECA: officine, studi professionali, saloni, centri benessere, centri estetici e simili. Ogni cliente ha un sito proprio con listino servizi, prenotazione appuntamenti, galleria e recensioni.

Bizery è il verticale services della piattaforma Menuary. Il verticale gemello per attività HORECA è Menuary (https://menuary.it).

## Sito marketing

- [Home](https://bizery.it/): cos'è Bizery, moduli disponibili, demo
- [Pricing](https://bizery.it/pricing): piani e abbonamenti
- [Contatti](https://bizery.it/contatti): form di contatto e demo

## Prodotto

- [Demo tenant services](https://demo.bizery.it): anteprima di un sito-tenant configurabile
- [Gestione tenant](https://gestione.bizery.it): pannello backoffice per il singolo locale (auth cross-domain via popup)

## Moduli

Listino servizi, prenotazione appuntamenti, galleria, recensioni, multi-sede.

## Optional

- [Menuary (verticale food)](https://menuary.it)
`;

const ORPHEO = `# Orpheo

> Piattaforma SaaS multi-tenant per artisti, autori, musicisti, cantanti, attori, registi, collettivi e professionisti creativi. Ogni cliente può avere sito ufficiale, press kit, catalogo opere, booking, diritti, recensioni provider e fanbase.

Orpheo è il verticale creative della piattaforma Menuary. I verticali gemelli sono Menuary per HORECA (https://menuary.it) e Bizery per servizi (https://bizery.it).

## Sito marketing

- [Home](https://weuseorpheo.com/): cos'è Orpheo, moduli disponibili, demo
- [Pricing](https://weuseorpheo.com/pricing): piani e abbonamenti
- [Contatti](https://weuseorpheo.com/contatti): contatti e demo

## Prodotto

- [Admin piattaforma](https://admin.menuary.it): controllo tenant, lead, pacchetti e pricing
- [Demo tenant creative](https://demo.weuseorpheo.com/orpheo-demo): anteprima tecnica del vertical creativo

## Moduli

Press kit, catalogo opere, booking eventi, diritti e royalty, reputation & reviews, fanbase e community.

## Optional

- [Menuary (verticale food)](https://menuary.it)
- [Bizery (verticale services)](https://bizery.it)
`;

export async function GET() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const mode = getPlatformModeFromHost(host);
  const body = mode === "marketing-orpheo" ? ORPHEO : mode === "marketing-bizery" ? BIZERY : MENUARY;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
