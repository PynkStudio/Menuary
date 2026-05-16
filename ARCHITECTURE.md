# Architettura del progetto

Un'unica codebase Next.js 15 (App Router) che serve due **verticali di prodotto**,
ciascuno con un sito marketing, i suoi tenant e un back-office condiviso.

| Verticale | Tipo di attività | Sito marketing | Stato |
|-----------|-----------------|----------------|-------|
| `food` | Ristoranti, pizzerie, bar | `menuary.it` | Attivo |
| `services` | Studi, saloni, centri benessere, ecc. | TODO (dominio da definire) | Scaffold pronto |

I due verticali condividono la stessa infrastruttura di moduli, admin, preview e tenant
registry. Differiscono nel copy (es. "prenota un tavolo" vs "prenota un appuntamento")
e nelle pagine marketing.

---

## 1. Routing per host

Il punto di ingresso è `src/lib/platform.ts`. Ad ogni request, l'header `Host`
viene letto nel `layout.tsx` radice e classificato in uno di cinque **PlatformMode**:

| Host | Mode | Cosa mostra |
|------|------|-------------|
| `menuary.it` / `menuary.localhost` | `marketing` | Landing verticale food |
| `vertical-b.localhost` *(TODO: dominio reale)* | `marketing-b` | Landing verticale services |
| `bepork.it` / `localhost` | `tenant` | Sito BePork |
| `faak.menuary.local` | `tenant` | Sito Faak |
| `admin.menuary.it` | `platform-admin` | Back-office piattaforma |
| `demo.menuary.it` | `preview` | Anteprima tenant via slug |

```ts
// src/lib/platform.ts
getPlatformModeFromHost(host) → PlatformMode
isMarketingMode(mode)         → boolean  // true per "marketing" e "marketing-b"
```

Il `layout.tsx` radice applica `data-platform={mode}` e `data-tenant={tenant.id}` sull'`<html>`,
usati da Tailwind e dal CSS per temi e override visivi per tenant.

---

## 2. Verticali e copy per-vertical

```
src/lib/
  tenant.ts       → TenantVertical = "food" | "services"
                    TenantProfile.vertical: TenantVertical
  vertical.ts     → VERTICAL_REGISTRY: metadati per vertical (nome prodotto, dominio,
                    businessNoun, reservationCTA, menuLabel)
                    getModuleCopy(key, vertical)  → { label, description }
                    getModuleLabel(key, vertical) → string
  tenant-modules.ts → ogni TenantModuleDefinition ha verticalCopy?: Record<TenantVertical, ...>
                      con label/description alternativi per i moduli che cambiano semantica
```

I moduli hanno lo **stesso codice** per entrambi i verticali. Cambia solo il copy
nell'interfaccia admin e nelle pagine marketing. Esempio:

| Modulo | food | services |
|--------|------|----------|
| `reservations` | "Prenotazioni" | "Appuntamenti" |
| `onlineMenu` | "Menu online" | "Listino servizi" |
| `tablePlanner` | "Gestione sala" | "Agenda e postazioni" |
| `kitchenDisplay` | "Schermo cucina" | "Bacheca operatori" |
| `takeaway` | "Ordini da asporto" | "Richieste a domicilio" |

---

## 3. Registro tenant

```
src/lib/
  tenant.ts          → tipi: TenantProfile, TenantFeatureFlags, TenantTheme, TenantVertical
  tenant-registry.ts → array TENANTS[], lookup by domain / id / previewSlug / vertical
  tenant-runtime.ts  → resolveTenantFromHost(), resolveTenantFromPreviewSlug()
  tenant-theme.ts    → converte TenantTheme in CSS vars inline
  tenant-modules.ts  → definizioni di tutti i moduli con dipendenze e verticalCopy
```

Per aggiungere un tenant: aggiungere un oggetto in `TENANTS[]` dentro `tenant-registry.ts`
con `id`, `name`, `vertical`, `domains[]`, `previewSlug` e `theme`.

---

## 3. Moduli e feature flags

Ogni tenant ha un oggetto `features: TenantFeatureFlags` che abilita o disabilita
i 22 moduli della piattaforma (sito, menu, ordini, prenotazioni, sala, CRM, ecc.).

```
src/lib/tenant-modules.ts   → TENANT_MODULES[] con label, categoria, dipendenze
src/lib/use-effective-features.ts → hook client che combina feature flags del
                                    tenant + override runtime dallo store (es. cucina
                                    che sospende temporaneamente l'asporto)
src/store/settings-store.ts → stato runtime: allowTakeaway, moduleOverrides,
                               moduleSuspensions, kitchenDisplayEnabled, ecc.
```

I moduli hanno dipendenze dichiarate (`requires`, `requiresAny`): un modulo è
effettivo solo se anche le sue dipendenze sono abilitate.

---

## 4. Struttura `src/app/` — thin dispatchers

I file in `app/` contengono **solo** routing logic, `metadata` / `generateMetadata`
e il dispatch verso il component corretto. Nessun JSX di contenuto.

```
src/app/
  layout.tsx                → layout radice: legge host, imposta TenantProvider,
                               PlatformModeProvider, SiteChrome, metadata globali
  page.tsx                  → dispatch marketing | tenant home
  pricing/page.tsx          → solo marketing (notFound() per tenant)
  contatti/page.tsx         → dispatch marketing | bepork
  chi-siamo/page.tsx        → dispatch marketing | bepork
  menu/page.tsx             → tenant: menu digitale
  ordina/page.tsx           → tenant: checkout asporto
  tavolo/page.tsx           → tenant: ordine al tavolo
  recensioni/page.tsx       → tenant: modulo recensioni
  galleria/page.tsx         → tenant: modulo galleria
  preferiti/page.tsx        → tenant: wishlist piatti
  admin/                    → back-office (vedi §6)
  [previewSlug]/            → preview tenant (vedi §7)
  api/                      → Route Handlers (marketing-leads, upload, ecc.)
```

---

## 5. Struttura `src/components/` — tutto il contenuto

```
src/components/
  core/                     ← provider e shell globali
    platform-mode-provider.tsx  ← contesto PlatformMode
    tenant-provider.tsx         ← contesto TenantProfile
    site-chrome.tsx             ← shell visiva (navbar + footer + drawers)
    providers.tsx               ← tutti i provider React annidati

  tenant-shell/             ← elementi UI di cornice tenant
    navbar.tsx
    footer.tsx

  modules/                  ← moduli funzionali (tutti tenant-aware)
    menu/                   ← menu digitale
      interactive-menu.tsx
      menu-card.tsx
      menu-card-interactive.tsx
      menu-category-nav.tsx
      menu-page-shell.tsx
      menu-intro-paragraph.tsx
      menu-disclaimer.tsx
      section-header.tsx
      allergen-badges.tsx
      allergen-icon.tsx
      allergen-modal-collapsible.tsx
      spicy-level-badge.tsx
      price-sticker.tsx
    shop/                   ← carrello e ordini
      cart-drawer.tsx
      cart-fly-overlay.tsx
      cart-line-note-modal.tsx
      delivery-strip.tsx
      formato-choice-modal.tsx
      item-customizer.tsx
      line-mods.tsx
      menu-bundle-customizer.tsx
      shop-fabs.tsx
    table-orders/           ← ordine al tavolo
      menu-active-table-bar.tsx
      nickname-gate.tsx
      table-order-entry-modal.tsx
      table-order-join-flow.tsx
    reservations/           ← prenotazioni e contatti
      contatti-reserve-cards.tsx
      reservation-request-form.tsx
      venue-display.tsx
      find-us.tsx
      whatsapp-float.tsx
    reviews/                ← recensioni
      review-card.tsx
      reviews-section.tsx
    gallery/                ← galleria foto
      gallery.tsx
    favorites/              ← wishlist piatti
      favorites-drawer.tsx

  tenants/                  ← un folder per tenant + _shared per il template
    _shared/                ← componenti condivisi usati dalla TenantHomePage
      hero.tsx
      three-souls.tsx
      signature-dishes.tsx
      fixed-menus.tsx
      pages/
        home.tsx            ← TenantHomePage (template generico, tenant-aware via context)
    bepork/
      pages/
        chi-siamo.tsx       ← BeporkAboutPage
        contatti.tsx        ← BeporkContactsPage
    faak/                   ← (da creare quando serve)
      pages/
        chi-siamo.tsx
        contatti.tsx

  marketing/                ← menuary.it
    pages/
      home.tsx              ← MarketingHomePage
      pricing.tsx           ← MarketingPricingPage
      contatti.tsx          ← MarketingContactsPage
      chi-siamo.tsx         ← MarketingAboutPage
    marketing-shell.tsx     ← header + footer condivisi marketing
    marketing-sections.tsx  ← sezioni riusabili (Features, FAQ, CTA, Demos, ecc.)
    lead-form.tsx           ← form richiesta proposta

  admin/                    ← componenti back-office
    admin-shell.tsx
    admin-layout-switch.tsx
    auth-gate.tsx
    item-editor.tsx
    price-editor.tsx
    floor-plan-editor.tsx
    hours-week-editor.tsx
    image-upload.tsx
    extra-lists-manager.tsx

  legal/                    ← documenti legali
    dynamic-policy-document.tsx
    policy-sections-view.tsx

  vertical-b/               ← placeholder secondo verticale
    pages/
      home.tsx
```

Requisito footer tenant: `tenant-shell/footer.tsx` deve mostrare sempre un link
`Staff` verso il gestionale del tenant. Sui siti pubblici la destinazione primaria è
`https://gestione.[dominio-tenant]`; nelle preview/demo deve restare sul dominio demo
e puntare a `/[tenant]/gestione`. Se il tenant non ha un dominio pubblico registrato,
il fallback è il corrispondente host demo (`demo.menuary.it` o `demo.bizery.it`) con
path `/[tenant]/gestione`.

---

## 5b. Struttura `src/styles/` — CSS per tenant

I CSS sono suddivisi per evitare che stili specifici di un tenant o della piattaforma
marketing inquinino il bundle di tutti gli altri contesti.

```
src/styles/
  marketing.css         ← classi .menuary-container, .menuary-pricing-row,
                           .menuary-feature-card, .menuary-testimonial,
                           .menuary-faq-*, .menuary-marquee*, .menuary-price-tag,
                           .menuary-mockup-*, keyframes menuary-*,
                           .menuary-fade-up e varianti
  tenants/
    bepork.css          ← .headline, .impact-title, .btn-primary, .btn-mustard,
                           .btn-ghost, .btn-ghost-light, .container-wide,
                           .chip*, .price-sticker, .paper-card
    faak.css            ← override html[data-tenant="faak"] e .tenant-preview-surface
                           su headline, btn-*, chip*, paper-card, rounded-*, shadow-*
                           + section.bg-pork-ink → tenant-brick
    vertical-b.css      ← TODO: stili secondo verticale (file vuoto)
```

Tutti e tre i file vengono importati in `src/app/layout.tsx` dopo `globals.css`.
Il `globals.css` mantiene: `@tailwind`, `@font-face` Faak Avenir, `@layer base`
(variabili CSS, reset html/body, variabili Menuary su `data-platform="marketing"`),
`@layer utilities` (`.text-balance`, `.mask-fade-bottom`, ecc.),
keyframes `bepork-cart-fly` e `.cart-fly-particle`, e i blocchi `.menuary-shell`,
`.menuary-display`, `.menuary-button` variants, product frames, audience/demo/step cards
(usati trasversalmente nell'app).

---

## 6. Admin — `admin.menuary.it`

Pannello operativo per gestire il locale in tempo reale.
Protetto da `src/lib/admin-auth.ts` + `AuthGate` client.

```
src/app/admin/
  layout.tsx          → AdminShell, controllo mode === "platform-admin" | "tenant"
  page.tsx            → dashboard ordini / riepilogo
  menu/page.tsx       → editor piatti, categorie, allergeni, prezzi, foto
  ordini/page.tsx     → lista ordini in tempo reale (asporto + tavolo)
  prenotazioni/page.tsx → gestione prenotazioni
  tavoli/page.tsx     → floor plan interattivo + stati tavolo
  servizi/page.tsx    → switch moduli (takeaway on/off, slot, sospensioni)
  impostazioni/page.tsx → orari, info locale, integrazioni
  tenant/page.tsx     → vista piattaforma: lista tenant, feature flags (solo platform-admin)
```

Il pannello **servizi** (`admin/servizi`) corrisponde direttamente ai moduli
definiti in `tenant-modules.ts`: ogni toggle nel pannello scrive nello `settings-store`
e viene letto da `useEffectiveFeatures()` in tutti i componenti.

---

## 7. Preview / Demo — `demo.menuary.it`

Anteprima pubblica di qualsiasi tenant tramite `previewSlug`.

```
src/app/[previewSlug]/
  page.tsx       → risolve tenant da slug, wrappa in TenantProvider + tenant-preview-surface
  menu/page.tsx  → stessa logica per la vista menu

src/lib/tenant-runtime.ts
  resolveTenantFromPreviewSlug(slug) → TenantProfile
```

Le preview usano lo stesso stack visivo del tenant reale ma con
`data-tenant-surface={tenant.id}` invece di `data-tenant` sull'`<html>`,
così i CSS override per tenant funzionano anche nel contesto embedded.

URL di esempio: `https://demo.menuary.it/bepork-demo`

---

## 8. Aggiungere un nuovo verticale

Quando il secondo verticale avrà un nome:

1. **`src/lib/tenant.ts`** — `TenantVertical` già predisposto, eventualmente aggiungere un terzo valore
2. **`src/lib/vertical.ts`** — aggiornare `VERTICAL_REGISTRY["services"]` con `productName` e `marketingDomain` reali
3. **`src/lib/platform.ts`** — aggiornare `PLATFORM_HOSTS["marketing-b"]` con il dominio reale
4. **Rinominare** `src/components/vertical-b/` → `src/components/[nome-verticale]/`
5. **Aggiornare l'import** in `src/app/page.tsx` (e nelle altre pagine se hanno branch `marketing-b`)
6. **Sviluppare le pagine marketing** in `src/components/[nome-verticale]/pages/` seguendo il pattern di `src/components/marketing/pages/`

---

## 9. Aggiungere un nuovo tenant

1. **Registra il tenant** in `src/lib/tenant-registry.ts`:
   ```ts
   {
     id: "nomelocale",
     name: "Nome Locale",
     domains: ["nomelocale.it", "www.nomelocale.it"],
     previewSlug: "nomelocale-demo",
     enabled: true,
     theme: { red: "...", ... },
     features: allTenantFeatures(true),
   }
   ```

2. **Crea le pagine specifiche** in `src/components/tenants/nomelocale/pages/`:
   - Solo le pagine che differiscono dal template condiviso
   - Le pagine che funzionano già con `_shared/pages/home.tsx` non richiedono nulla

3. **Aggiungi i branch** nei dispatcher `app/` dove necessario:
   ```ts
   if (tenant.id === "nomelocale") return <NomeLocaleAboutPage />;
   ```

4. **Aggiungi asset** in `public/` se necessario (logo, foto, font custom)
   e configura il font in `src/app/layout.tsx` se il locale usa un typeface dedicato
   (come Faak usa Avenir).

---

## 10. Monolite Supabase e moduli dati

Un unico progetto Supabase serve **Menuary** e tutti i **tenant**; la separazione è per **RLS** e `tenant_id`.

| Area | File / cartella |
|------|-----------------|
| Migrazione schema | `supabase/migrations/20260214120000_platform_modules.sql` (profili, CRM, prenotazioni, sedi, staff, push, delivery, magazzino, webhook, traduzioni menu) |
| Client service_role | `src/lib/supabase/service.ts` — richiede `SUPABASE_SERVICE_ROLE_KEY` in env server |
| Prenotazioni + engine | `src/app/api/tenant/[tenantId]/reservations/`, `src/lib/reservations/engine.ts`, `src/lib/reservations/map-row.ts` |
| Menuary / CRM | `src/app/api/personalization/establish`, `.../menu`, `src/app/api/admin/crm-analytics` |
| IA (stub) | `src/app/api/ai/menu-suggest`, `src/app/api/ai/assistant` — pagina `/assistant-menu` |
| Canali esterni | `src/app/api/webhooks/retell`, `.../whatsapp` |
| Push | `src/app/api/push/subscribe`, `.../vapid-public-key` |
| Delivery / magazzino | `src/app/api/admin/delivery-inventory` |
| i18n cookie | `src/middleware.ts` (`NEXT_LOCALE`), `src/lib/locale.ts` |
| Multi-sede (slug in query) | `resolveLocationSlugFromSearchParams` in `src/lib/tenant-runtime.ts` (`?loc=` o `?location=`) |

---

## 11. File di configurazione chiave

| File | Ruolo |
|------|-------|
| `src/lib/platform.ts` | Classifica l'host in PlatformMode (5 mode, 2 marketing) |
| `src/lib/vertical.ts` | Registry verticali, copy per-vertical, `getModuleLabel()` |
| `src/lib/tenant-registry.ts` | Lista tenant registrati con `vertical` |
| `src/lib/tenant.ts` | Tipi TypeScript: TenantProfile, TenantVertical, features |
| `src/lib/tenant-modules.ts` | Catalogo moduli + dipendenze + `verticalCopy` |
| `src/lib/site-config.ts` | Configurazione statica BePork (indirizzo, social, mappe) |
| `src/store/settings-store.ts` | Stato runtime admin (override moduli, sospensioni) |
| `tailwind.config.ts` | Token colore tenant (`pork-*`) + utility custom |
| `src/app/globals.css` | CSS variables base, `@font-face` Faak Avenir, reset html/body, keyframes cart-fly |
| `src/styles/marketing.css` | Classi `.menuary-*` editoriali e animazioni (solo piattaforma marketing) |
| `src/styles/tenants/bepork.css` | Classi `.headline`, `.btn-*`, `.chip-*`, `.paper-card` per BePork |
| `src/styles/tenants/faak.css` | Override `html[data-tenant="faak"]` per font, bordi, shadow |
| `next.config.ts` | Domini immagini remoti (Unsplash), ottimizzazione formati |
