# Cron e processi automatici

> Fonte: `vercel.json`, route in `src/app/api/cron/`, migration `*pgcron*`. **Dedotto dal codice.**

## Cron configurati su Vercel

Da `vercel.json`:

| Path | Schedule | Scopo (dedotto) |
|---|---|---|
| `/api/cron/sync-reviews` | `0 4 * * *` (ogni giorno 04:00) | Sincronizzazione recensioni |

## Altri endpoint cron presenti nel codice

Route sotto `src/app/api/cron/` non (tutte) elencate in `vercel.json`:

- `cron/expire-pending-orders`
- `cron/pynkstudio-call-reminders` — pg_cron ogni minuto (`20260627_pynkstudio_call_bookings.sql`). Dal 2026-09-30 legge `agenda_bookings` tramite `claimDueReminders` di `@pynkstudio/agendaapp` (marca e restituisce nella stessa UPDATE) e, per le videocall, rimanda il link personale. Vedi [[agenda-videocall]]. La route accetta GET e POST: pg_cron usa `net.http_post`, e fino al 2026-09-30 la sola GET faceva rispondere 405 a ogni giro (promemoria mai inviati)
- `cron/subscription-renewals`
- `cron/sync-reviews`
- `cron/whatsapp-session-health`

> **Da verificare** come vengono schedulati quelli non presenti in `vercel.json`: alcune migration suggeriscono **pg_cron** lato Supabase (`20260605_expire_pending_orders_pgcron.sql`, `20260615_subscription_renewals_pgcron.sql`, `20260615_cron_expire_novita_tags.sql`). Env correlata: `CRON_SECRET`.

## Processo: aggiungere un nuovo tenant

Procedura documentata in `README.md` e `CLAUDE.md` (checklist completa). In sintesi:

1. Registra profilo + feature-flag in `src/lib/tenant-registry.ts`.
2. Aggiungi contenuti in `src/lib/tenant-content.ts`.
3. Predisponi multilingua/SEO (`tenant-locales.ts`, `(slug)-i18n.ts`, URL e sitemap localizzati).
4. Verifica/aggiorna il verticale in `src/lib/vertical.ts` (e `platform.ts` se serve).
5. Crea i componenti UI in `src/components/tenants/(slug)/` (prefisso univoco).
6. Crea i token CSS in `src/styles/tenants/(slug).css`, incluso il blocco gestione.
7. Asset in `public/(slug)/`.
8. Eventuali route in `src/app/(slug)/`.

> La fonte autorevole resta `CLAUDE.md` / `README.md`: non duplicare qui i dettagli, fai riferimento ad essi.

## Da confermare

- Schedulazione effettiva dei cron non in `vercel.json`.
- Processi di deploy, release e incident response (non documentati nella repo). Usa [[process-template]] quando verranno definiti.

## Collegamenti

- [[integrazioni-attive]]
- [[panoramica-tecnica]]
