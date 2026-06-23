# Panoramica prodotto

> Fonte: `PRODUCT.md`, `README.md`, `CLAUDE.md`. Contenuto **dedotto dai file esistenti** nella repo.

## Cos'è Menuary

**Menuary** è una piattaforma multi-tenant e multi-verticale per attività locali. Dà a ogni attività un sito su misura più un gestionale modulare e un'assistente IA.

## Verticali

Dedotto da `src/lib/vertical.ts` (`VERTICAL_REGISTRY`):

| Verticale | Prodotto | Dominio marketing | Tipo di attività |
|---|---|---|---|
| `food` | Menuary | `menuary.it` | Ristoranti, bar, pizzerie, trattorie |
| `services` | Bizery | `bizery.it` | Studi, saloni, centri benessere |
| `creative` | Orpheo | `weuseorpheo.com` | Artisti, autori, musicisti, attori, registi |

> Il verticale `creative` (Orpheo) è stato aggiunto di recente (migration `20260617_orpheo_creative_vertical.sql` e seguenti). `ARCHITECTURE.md` è stato aggiornato per includerlo.

## Pubblico (verticale food)

Da `PRODUCT.md`: titolari e gestori di attività HORECA in Italia, in prospettiva multi-mercato europea. Persone operative (sala/cucina), poco tempo, attente al margine.

## Scopo del prodotto

Far percepire a ogni titolare che il sito/gestionale è "fatto per il MIO locale" e togliere lavoro operativo. La pagina marketing comunica artigianato e profondità operativa, non un template.

## Brand & accessibilità (food)

- Tono: caldo, concreto, artigianale. Serif Fraunces + DM Sans, palette rame/oro/salvia.
- Target accessibilità: **WCAG 2.1 AA**, supporto `prefers-reduced-motion`, contenuto server-rendered visibile senza JS.

## Da confermare

- Vision e obiettivi per i verticali `services` (Bizery) e `creative` (Orpheo): nei file la vision dettagliata è documentata solo per `food`.
- Posizionamento e differenziazione strategica a lungo termine.

## Collegamenti

- [[panoramica-tecnica]]
- [[tenant-e-verticali]]
