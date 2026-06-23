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
