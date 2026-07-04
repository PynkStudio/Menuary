# ADR-0001: Redirect alla home per le route di modulo non attivo

- **Stato:** accettata
- **Data:** 2026-07-04
- **Autore:** Massimo Pernozzoli

## Contesto

Le route "globali" servite dagli stessi file sotto `src/app/` (`/menu`, `/prenota`, `/galleria`, `/recensioni`, `/preferiti`, `/tavolo`, `/ordina`, `/staff`, `/cucina`, `/assistant-menu`) non verificavano mai i feature flag del tenant risolto da host/preview slug. Un tenant services come PynkStudio (che ha `onlineMenu: false`, `reservations: false`, `gallery: false`, ecc.) mostrava comunque queste pagine — con il proprio tema/CSS — se qualcuno visitava direttamente `pynkstudio.it/menu`, anche se il modulo menu non ha senso per quel tenant.

## Decisione

Aggiunto `src/lib/tenant-route-modules.ts`: una mappa `segmento URL → feature flag richiesta`. `src/middleware.ts` la consulta in due punti:

1. Nel branch dominio custom (`mode === "tenant"`), dopo `resolveTenantFromHost`.
2. Nel branch preview (`/[previewSlug]/...`), usando il tenant risolto da `findTenantByPreviewSlug`.

Se il segmento richiede un flag e il tenant non ce l'ha, il middleware fa redirect alla home del tenant (`/` per dominio custom, `/{previewSlug}` per preview) invece di lasciar renderizzare la pagina.

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Guard per-pagina (pattern `requirePynkstudioTenant`) | Coerente con precedente esistente per le route PynkStudio-only | Molte di queste pagine (`ordina`, `tavolo`, `staff`, `preferiti`, `assistant-menu`) sono `"use client"` senza wrapper server: richiederebbe riscriverle come server component solo per il controllo |
| Gate nel middleware (scelta) | Singolo punto di applicazione, nessuna modifica alle pagine esistenti, funziona anche sui componenti client | Richiede tenere la mappa segmento→flag aggiornata quando si aggiungono nuove route globali |

## Conseguenze

- Nuove route pubbliche "globali" (condivise tra tenant tramite gli stessi file `src/app/...`) devono aggiungere una entry in `ROUTE_MODULE_REQUIREMENTS` se dipendono da un feature flag, altrimenti restano sempre accessibili indipendentemente dal tenant.
- Le route tenant-specifiche già gestite via helper dedicato (es. `requirePynkstudioTenant`) non sono toccate da questa modifica.
- Nessun impatto sui moduli in `src/components/modules/` o `src/lib/`: la mappa vive fuori dal registry dei moduli (`tenant-modules.ts`) perché riguarda solo il routing, non le definizioni dei moduli stessi.

## Riferimenti

- `src/lib/tenant-route-modules.ts`
- `src/middleware.ts` (branch `mode === "tenant"` e branch preview)
