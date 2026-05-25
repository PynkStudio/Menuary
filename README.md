# Menuary

Piattaforma multi-tenant e multi-verticale per attività locali.
Costruita con Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Supabase, Zustand.

## Verticali

- **Menuary** (`food`) — HORECA: ristoranti, bar, pizzerie, trattorie.
- **Bizery** (`services`) — non-HORECA: officine, studi, saloni, centri benessere.

Ogni **tenant** è un'attività reale ospitata su uno dei verticali, con identità visiva e moduli propri. **BePork** è uno dei tenant (demo/produzione principale del verticale food), non la piattaforma.

## Avvio

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm run start
npm run seed:menu    # seed Supabase del menu (richiede .env.local)
```

## Variabili d'ambiente

Configura `.env.local` con le chiavi Supabase del progetto (URL, anon key, service role per gli script di seed). Il deploy è su Vercel — replica le stesse env nel dashboard.

## Struttura

```
src/
  app/
    [previewSlug]/        # preview universale tenant
    bizery/               # pagine marketing verticale services
    (route food)          # home, menu, prenotazioni del verticale food
    api/                  # route handlers (menu, prenotazioni, sedi, ecc.)
  components/
    tenants/
      _shared/            # solo elementi UI esplicitamente condivisi
      bepork/             # UI esclusiva tenant BePork
      (slug)/             # UI esclusiva di altri tenant
    modules/              # moduli logici riusabili (menu, prenotazioni, gallery…)
    bizery/               # UI del verticale Bizery
  lib/
    tenant-registry.ts    # profili + feature-flag per tenant
    tenant-content.ts     # testi, immagini, social per tenant
    tenant-modules.ts     # definizione moduli disponibili
    vertical.ts           # registry verticali
    tenant.ts             # tipi core
    site-config.ts        # contatti/orari/social (tenant default)
  styles/
    tenants/
      bepork.css          # token CSS BePork
      bizery.css          # token CSS Bizery
      (slug).css          # token CSS altri tenant
public/
  (slug)/                 # asset per tenant (logo, photos, og)
```

Dettagli architetturali estesi: vedi [ARCHITECTURE.md](ARCHITECTURE.md).
Regole per le IA che lavorano sulla repo: vedi [CLAUDE.md](CLAUDE.md).

## Regole d'oro

1. **Isolamento visivo**: niente CSS, token, classi o componenti UI condivisi tra tenant. Ogni tenant nasce da zero in `components/tenants/(slug)/` + `styles/tenants/(slug).css`.
2. **Moduli logici condivisi**: l'unico riuso ammesso è in `components/modules/` e `lib/`. Modifiche ai moduli richiedono autorizzazione esplicita e devono restare retrocompatibili per tutti i tenant.
3. **Isolamento dati**: i dati di un tenant (listino, prodotti, prenotazioni) non compaiono mai in un altro. Nessun fallback cross-tenant.

## Aggiungere un nuovo tenant

1. Registra profilo + feature-flag in `src/lib/tenant-registry.ts`.
2. Aggiungi i contenuti in `src/lib/tenant-content.ts`.
3. Verifica/aggiorna il verticale in `src/lib/vertical.ts` (e `platform.ts` se serve).
4. Crea i componenti UI in `src/components/tenants/(slug)/` con prefisso univoco (`<BizeryHero />`, non `<Hero />`).
5. Crea i token CSS in `src/styles/tenants/(slug).css`.
6. Asset in `public/(slug)/`.
7. Eventuali route dedicate in `src/app/(slug)/`.

Checklist completa in [CLAUDE.md](CLAUDE.md).

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript
- Tailwind CSS + token CSS per tenant
- Framer Motion
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Zustand (state client)
- @react-pdf/renderer, qrcode.react
- Vercel Analytics

## Deploy

Hosting su Vercel (zero config Next.js). Ogni verticale e ogni tenant può avere il proprio dominio mappato alla stessa app: il routing avviene per host e/o per `previewSlug`.
