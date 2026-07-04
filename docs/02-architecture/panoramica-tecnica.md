# Panoramica tecnica

> Fonte primaria: `ARCHITECTURE.md` (root), `README.md`, `package.json`. **Dedotto dai file esistenti.**
> Per il dettaglio completo fai riferimento a `ARCHITECTURE.md` nella root — questa è una sintesi navigabile.

## Stack

Da `package.json`:

- **Next.js 15.1** (App Router) + **React 19**
- **TypeScript 5.7**
- **Tailwind CSS 3.4** + token CSS per tenant
- **Framer Motion 11**
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`)
- **Zustand** (state client)
- **Twilio** (`twilio`), **web-push**, **maplibre-gl**, **@react-pdf/renderer**, **qrcode.react**, **sharp**
- **Vercel Analytics**
- Deploy su **Vercel** (config `vercel.json`, `next.config.ts`)

## Modello multi-tenant / multi-verticale

Una sola codebase Next.js serve tre verticali (`food`, `services`, `creative`) e tutti i loro tenant. Il routing avviene **per host** e/o per `previewSlug`.

File chiave (da `ARCHITECTURE.md` §11):

| File | Ruolo |
|---|---|
| `src/lib/platform.ts` | Classifica l'host in `PlatformMode` |
| `src/lib/vertical.ts` | Registry verticali + copy per-vertical |
| `src/lib/tenant-registry.ts` | Lista tenant registrati |
| `src/lib/tenant.ts` | Tipi core (`TenantProfile`, `TenantVertical`, feature flags) |
| `src/lib/tenant-modules.ts` | Catalogo moduli + dipendenze |
| `src/store/settings-store.ts` | Stato runtime admin (override/sospensioni moduli) |

## Isolamento (regole strutturali)

Da `CLAUDE.md` / `README.md`:

1. **Isolamento visivo**: nessun CSS/token/classe/componente UI condiviso tra tenant.
2. **Moduli logici condivisi**: unico riuso ammesso in `src/components/modules/` e `src/lib/`; modifiche retrocompatibili e autorizzate.
3. **Isolamento dati**: i dati di un tenant non compaiono mai in un altro; nessun fallback cross-tenant.
4. **Multilingua/SEO**: ogni tenant predisposto per URL localizzati, canonical, `hreflang` con `x-default`, sitemap localizzata (pattern di riferimento: Doca).
5. **Route dei moduli globali gated dal middleware**: `src/lib/tenant-route-modules.ts` mappa il primo segmento URL delle route pubbliche condivise (`/menu`, `/prenota`, `/galleria`, `/recensioni`, `/preferiti`, `/tavolo`, `/ordina`, `/staff`, `/cucina`, `/assistant-menu`) alla feature flag del tenant che la abilita. `src/middleware.ts` verifica questa mappa sia per dominio custom (mode `tenant`) sia per preview (`/[previewSlug]/...`): se il modulo non è attivo per quel tenant, redirect alla home del tenant invece di renderizzare la pagina col tema di un altro verticale (es. `pynkstudio.it/menu`, che non ha `onlineMenu`).

## SEO siti marketing (menuary.it / bizery.it / weuseorpheo.com)

- **404 reali dal middleware**: sui domini marketing i path fuori dall'allowlist (route marketing + passthrough `payment`, `configurazione`, `privacy`, `cookie`, `team`, …) rispondono 404 direttamente da `src/middleware.ts` (`marketingNotFoundResponse`). Motivo: il root layout renderizza le pagine dentro `<Suspense>`, quindi un `notFound()` di pagina esce con status 200 (soft-404); prima del fix le route del tenant demo (es. `/menu`) erano indicizzabili su menuary.it.
- **Open Graph image**: generata a runtime da `src/app/api/og/route.tsx` (`/api/og?brand=menuary|bizery|orpheo`), referenziata nei metadata del layout per i tre brand marketing.
- **Sitemap senza `lastModified`**: valorizzarlo con `new Date()` a ogni fetch rende il segnale inutile per Google; si omette finché non c'è una data di modifica reale dei contenuti.
- **www.menuary.it**: dominio aggiunto al progetto Vercel `menunary` con redirect 308 all'apex. **Da verificare**: record CNAME `www → cname.vercel-dns.com` su Cloudflare (nameserver del dominio).
- **Pagine privacy/cookie dei tre siti marketing**: `menuary.it/privacy` e `/cookie` sono un branch di mode (`getPlatformModeFromHost === "marketing"`) dentro le route root `src/app/privacy` e `src/app/cookie` (altrimenti mostrerebbero il tenant demo di default). Bizery e Orpheo hanno route dedicate sotto prefisso (`src/app/bizery/privacy`, `src/app/orpheo/privacy`, ecc., coerenti col rewrite del middleware). I tre condividono i testi GDPR da `src/lib/legal/marketing-legal-content.ts` e il layout da `src/components/marketing/legal-page-layout.tsx`; cambiano solo brand/dominio/contatto.
- **Titolare del trattamento delle property di piattaforma**: `src/lib/legal/platform-operator.ts` è la fonte unica (ragione sociale, indirizzo, P.IVA, PEC) usata dalle pagine legali di Menuary, Bizery, Orpheo e dal tenant PynkStudio (stesso operatore). Oggi ditta individuale (Pernozzoli Massimo); da aggiornare in un solo punto al passaggio a SRL. **Non** usata come fallback per i tenant clienti, che restano titolari con i propri dati (`tenant-content.ts`).
- **Titolare per-tenant**: il modulo condiviso `src/lib/legal/policies.ts` (usato da tutti i siti tenant food/services) supporta opzionalmente `piva`/`pec` in `PolicyController`, retrocompatibile. `TenantContent.legal` (opzionale, in `tenant-content.ts`) può sovrascrivere nome/indirizzo/contatti del titolare quando diverso dal nome commerciale del tenant — usato oggi solo da PynkStudio.

## Persistenza — Supabase

Un unico progetto Supabase per piattaforma e tenant; separazione via **RLS** e `tenant_id`. Le migration sono in `supabase/migrations/` (numerose, a partire da `20260214120000_platform_modules.sql`).

> Lo storico migration è la fonte autorevole sullo schema. **Da verificare** se esiste un ERD/diagramma aggiornato (non trovato nella repo).

## Documenti correlati nella root

- `ARCHITECTURE.md` — architettura estesa (routing per host, CSS per tenant, admin, preview)
- `GESTIONE_IMPLEMENTATION_PLAN.md` — piano implementazione gestionale (**da verificare** quanto sia attuale)
- `handoff.md` — handoff integrazione Retell + checkout WhatsApp (tenant Kimos)
- `TENANT_CUSTOMER_SERVICE_WHATSAPP.md` — modulo WhatsApp via Twilio

## Collegamenti

- [[moduli-piattaforma]]
- [[integrazioni-attive]]
