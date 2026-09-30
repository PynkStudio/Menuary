# Feature: Pannello di controllo PynkStudio (admin.pynkstudio.eu)

- **Stato:** in sviluppo — bonifica e separazione prodotti completate, redesign da fare (bacheca in § 6)
- **Route:** `src/app/admin-pynkstudio/`
- **Componenti hub:** `src/components/admin-pynkstudio/`
- **Registry portali:** `src/lib/platform/product-portals.ts`
- **Data:** 2026-08-26

> **Come leggere questo documento.** "Stato attuale" è **dedotto dal codice**. Il resto è **progetto**. Dove una scelta non è presa è scritto **Da decidere**. L'avanzamento reale vive nella bacheca di § 6.

---

## 0. Istruzioni per l'IA che lavora su questo progetto

**Prima di toccare `src/app/admin-pynkstudio/` o `src/components/admin/platform/`:** leggi la bacheca di § 6 e riparti dal primo lavoro non completato.

**Stati ammessi:** ⬜ da iniziare · 🟡 in lavorazione · 🔵 in test · ✅ completata.

`tsc` e `lint` puliti portano una voce a 🔵, mai a ✅: per ✅ serve una verifica sul campo (pagina aperta sul dominio reale, dato filtrato controllato, redirect seguito).

**Vincolo non negoziabile:** i componenti in `src/components/admin/platform/` sono condivisi fra il vecchio pannello `admin.menuary.it` (`/admin/*`) e i portali prodotto. Ogni modifica deve restare **retrocompatibile**: le prop nuove sono opzionali e, se omesse, il comportamento è quello aggregato di prima.

---

## 1. Cos'è

`admin.pynkstudio.eu` è il pannello di controllo dell'azienda **PynkStudio**, non di un singolo prodotto.

Ha due livelli:

1. **Hub aziendale** (`/admin-pynkstudio`) — strumenti trasversali e **vista aggregata** su tutti i prodotti: posta, agenda, CRM PynkStudio (clienti dell'agenzia), patrimoniale, utenti interni.
2. **Portali prodotto** (`/admin-pynkstudio/{menuary,bizery,orpheo}`) — ognuno vede **solo i dati del proprio prodotto**.

Oltre ai due livelli sopra (entrambi sul database di questa repo), lo stesso host ospita anche
**portali-bridge** verso piattaforme esterne con un proprio backend: **Security**
(`/admin-pynkstudio/security`, aziende di sicurezza) e **PerX** (`/admin-pynkstudio/perx`, accesso
platform-admin sul backend FastAPI di PerX — Studio Randa vi compare come uno dei tenant). Non
sono "prodotti" nel senso di `product-portals.ts`: sono un client + gate d'accesso verso l'API
admin di un altro sistema. Dettagli → `docs/security-integration.md`, `docs/perx-integration.md`.

Sullo stesso host convivono anche i pannelli `gestione` dei tenant: `admin.pynkstudio.eu/[slug]` viene riscritto su `/gestione/[slug]` dal middleware (migrazione da `gestione.menuary.it`).

---

## 2. Come un portale sa quali sono "i suoi" dati

Il collegamento fra prodotto e dati è il **verticale**, più il **brand** per contratti e posta.

| Portale | Verticale | Brand | Sorgente principale |
|---|---|---|---|
| Menuary | `food` | `menuary` | `platform_leads.business_vertical`, `TenantProfile.vertical` |
| Bizery | `services` | `bizery` | idem |
| Orpheo | `creative` | `orpheo` | idem |

La mappa vive in `src/lib/platform/product-portals.ts` (`PRODUCT_PORTALS`), che riusa `VERTICAL_REGISTRY` per nome prodotto e dominio.

Filtri applicati per sezione:

| Sezione | Come filtra |
|---|---|
| CRM Lead | `platform_leads.business_vertical` |
| Tenant & Moduli | `TenantProfile.vertical` |
| Pacchetti | `PlatformPackage.vertical` (i pacchetti `both` restano visibili ovunque) |
| Abbonamenti | `subscription.lead.business_vertical` — i pagamenti seguono gli abbonamenti filtrati |
| Contratti | `platform_contracts.brand` (fallback su `contract_data.brand`) |
| Provvigioni | derivate dagli abbonamenti già filtrati |
| Supporto / Errori | `tenant_id` appartenente ai tenant del verticale |
| Posta in arrivo | `brand` (vista sola lettura) |

**Regola sui dati non attribuibili:** un ticket o un errore **senza `tenant_id`** non appartiene a nessun prodotto e resta visibile solo sull'hub. Lo stesso vale per il seed `PLATFORM_COMMISSIONS`, che non porta il verticale: nei portali si parte da lista vuota invece di mostrare dati di altri prodotti.

---

## 3. Stato attuale (dedotto dal codice)

### Hub `/admin-pynkstudio`

| Voce | Route | Note |
|---|---|---|
| Dashboard | `/` | KPI aggregati + card prodotto con lead totali/attivi per verticale |
| Posta | `/mailapp` | `@pynkstudio/mailapp` — **aggregata**, con filtro brand nella sidebar del pacchetto |
| Agenda | `/agenda` | |
| CRM PynkStudio | `/crm` | tabelle `pynkstudio_crm` + `pynkstudio_crm_activities` — clienti dell'agenzia, **non** i lead di piattaforma. Si alimenta da form contatti, landing IA, prenotazioni e disiscrizioni (dimensione azienda, settore, tempistica, interessi e attribuzione campagna come campi strutturati). KPI, filtri per stato/sorgente/vista, priorità caldo/tiepido/freddo, follow-up con scadenza, valore stimato, timeline attività, export CSV, inserimento manuale. Logica in `src/lib/pynkstudio/crm*.ts`, API `/api/admin/pynkstudio/crm*` |
| Patrimoniale | `/patrimoniale` | |
| Utenti interni | `/utenti` | `siteadmin` — dato aziendale, spostato qui dal portale Menuary |
| Profilo | `/profilo` | firma email con anteprima per tutti e quattro i brand |
| Impostazioni | `/impostazioni` | connessioni a livello di piattaforma (oggi: Google per Search Console/verifica dominio). Dettagli in [[openseo-search-console]] |
| Security | `/security/*` | portale a sé (aziende di sicurezza) |
| PerX | `/perx/*` | portale a sé, bridge platform-admin su PerX (backend FastAPI separato) — tenant (incl. Studio Randa), utenti, errori operativi (solo backend, vedi limiti in `docs/perx-integration.md`), domain routes. Gated a `superadmin`/`admin`, non a tutti i ruoli siteadmin |

### Portali prodotto

Sezioni comuni a Menuary, Bizery e Orpheo:

`inbox` · `crm` (+ `crm/[id]`, `crm/nuovo`) · `tenant` · `pacchetti` · `abbonamenti` · `contratti` (+ `contratti/[id]`, `contratti/nuovo`) · `provvigioni` · `supporto` · `errori`

Solo Menuary, perché oggi esistono solo per il food:

`messaggi-wa` · `assistente-ai` · `template-design`

### Componenti condivisi parametrizzati

Tutti in `src/components/admin/platform/`, tutti con prop **opzionali**:

| Componente | Prop aggiunte |
|---|---|
| `platform-crm-page` | `vertical`, `basePath`, `productLabel` |
| `platform-tenants-page` | `vertical`, `productLabel`, `crmBasePath` |
| `platform-packages-page` | `vertical`, `productLabel` |
| `platform-subscriptions-page` | `vertical`, `productLabel` |
| `platform-commissions-page` | `vertical`, `productLabel`, `crmBasePath`, `usersHref` |
| `contracts-list` | `vertical`, `basePath` |
| `contract-editor` | `basePath` |
| `platform-lead-detail` | `basePath`, `contractsBasePath` |
| `platform-lead-create-page` | `vertical`, `basePath` |

I `basePath` esistono perché ogni portale deve restare nel proprio spazio: senza,
un click su un lead o su un contratto rimandava a `admin.menuary.it`.

Estratti da pagina a componente in questo intervento: `platform-tenants-page` (era `src/app/admin/tenant/page.tsx`), `template-designer-page` (era `src/app/admin/template-design/page.tsx`).

---

## 4. Vecchio pannello `admin.menuary.it`

**Resta vivo in parallelo.** Le route `/admin/*` continuano a mostrare la vista aggregata su tutti i verticali, perché i componenti condivisi senza prop `vertical` si comportano come prima.

Il suo pensionamento è una voce a sé della bacheca, non ancora affrontata.

---

## 5. Limiti noti

**Posta per prodotto — sola lettura.** `@pynkstudio/mailapp` è una dipendenza esterna (tarball GitHub, `v0.5.0`). Dalla 0.5.0 l'elenco dei brand arriva dall'app (`brands={MAIL_BRANDS}`, vedi [[integrazioni-attive]]), ma il **filtro** brand resta in stato interno (`useState("all")`) e **non è accettato come prop**: non è forzabile su un prodotto dall'esterno. Le sezioni `*/inbox` dei portali mostrano quindi un elenco già ristretto al brand tramite `getInboundEmails({ brand })`, e rimandano alla casella aggregata per leggere, rispondere e archiviare. Per una posta di prodotto pienamente operativa serve una prop `initialBrand` nel pacchetto a monte.

**Palette BePork nel pannello Pynk.** I componenti condivisi usano ancora le classi `pork-ink` / `pork-cream` / `pork-red`, cioè i token del tenant BePork, anche quando sono renderizzati dentro `admin.pynkstudio.eu`, che ha i propri token `--pa-*`. È una violazione della regola di isolamento visivo del `CLAUDE.md` ed è il grosso del redesign ancora da fare.

**Classi CSS orfane.** `src/styles/tenants/pynkstudio.css` definisce `.pynk-admin-portal-*` e `.pynk-admin-section-heading` che nessun componente usa: la dashboard costruisce le card con Tailwind ad hoc. Da riconciliare nel redesign.

---

## 6. Bacheca di avanzamento

### F1 — Bonifica tracce del vecchio pannello

| # | Lavoro | Stato | Note |
|---|---|---|---|
| 1.1 | Dominio `pynstudio.eu` → `pynkstudio.eu` | 🔵 in test | Typo introdotto in `66fadccc`. 30 occorrenze in middleware, `layout.tsx`, `login-url.ts`, `llms.txt`, `store-roles.ts`, `tenant.ts`, `platform.ts`, `gestione-sw.js`, doc. Rompeva anche il cookie Supabase della mailapp (`.pynstudio.eu`), che girava sempre in modalità degradata. **Verifica sul campo: aprire `admin.pynkstudio.eu/mailapp` e controllare che compose e contatore "Le mie" siano attivi.** |
| 1.2 | Pagina `/admin-pynkstudio/profilo` | 🔵 in test | Era linkata dalla sidebar ma non esisteva → 404 |
| 1.3 | Pagina `/admin-pynkstudio/set-password` | 🔵 in test | Era in `PUBLIC_PYNK` e in `AUTH_PATHS` ma non esisteva |
| 1.4 | `ADMIN_PYNKSTUDIO_PATHS` allineato | 🔵 in test | Aggiunti `/profilo` e `/utenti`; rimosso `/company` (cartella vuota, ora eliminata). Senza `/profilo` il middleware riscriveva su `/gestione/profilo` |
| 1.5 | Rimozione dei 18 placeholder | ✅ completata | Puntavano a `admin.bizery.it` e `admin.orpheo.com`, domini inesistenti. Nessun link residuo (verificato con grep) |
| 1.6 | Normalizzazione dei path nello switch di layout | ✅ completata | `usePathname()` restituisce il path della barra del browser, non quello riscritto dal middleware. Chi apriva `admin.pynkstudio.eu/login` vedeva la sidebar autenticata, e chi apriva `admin.pynkstudio.eu/menuary/crm` avrebbe visto la sidebar dell'hub invece di quella del portale. Risolto con `canonicalPynkPath()` in `src/components/admin-pynkstudio/pynk-path.ts`, usato anche per lo stato attivo delle voci. **Verificato**: `/login` e `/admin-pynkstudio/login` ora rendono identici (screenshot), e la normalizzazione passa i casi limite (`/menuary/crmaltro` non attiva `/menuary/crm`) |

### F2 — Separazione dati per prodotto

| # | Lavoro | Stato | Note |
|---|---|---|---|
| 2.1 | Registry portali prodotto | 🔵 in test | `src/lib/platform/product-portals.ts` |
| 2.2 | Prop `vertical` sui componenti condivisi | 🔵 in test | 9 componenti, tutte prop opzionali e retrocompatibili |
| 2.3 | `business_vertical` nell'API abbonamenti | 🔵 in test | `/api/admin/subscriptions` non lo restituiva: senza, abbonamenti e provvigioni non erano filtrabili |
| 2.4 | Sezioni comuni ai tre portali | 🔵 in test | 9 sezioni × 3 portali |
| 2.5 | Sezioni solo-Menuary | 🔵 in test | `messaggi-wa`, `assistente-ai`, `template-design` |
| 2.6 | "Utenti interni" spostato sull'hub | 🔵 in test | Era sotto Menuary ma è un dato aziendale |
| 2.7 | Navigazione portali riscritta | 🔵 in test | `productNav()` in `pynk-admin-layout-switch.tsx` |
| 2.8 | Vista aggregata sull'hub | 🔵 in test | Card prodotto con lead totali/attivi per verticale |

> **Cosa manca per portare F1 e F2 a ✅:** aprire `admin.pynkstudio.eu` **con una sessione valida**, entrare in ciascun portale e verificare che CRM, abbonamenti, contratti e supporto mostrino solo i dati del prodotto; controllare che `/admin/*` su `admin.menuary.it` continui a mostrare tutto. Tocca all'utente: serve accesso autenticato al dominio di produzione.
>
> Già verificato in locale su `admin.pynkstudio.localhost`: le route dei portali sono riconosciute come path admin (redirect al login PynkStudio con `next` corretto, **non** riscritte su `/gestione/`), `/login` e `/set-password` rendono 200, e uno slug tenant come `/bepork` continua a passare dal ramo gestione.

### F3 — Redesign

| # | Lavoro | Stato | Note |
|---|---|---|---|
| 3.1 | Togliere la palette BePork dai componenti condivisi | ⬜ da iniziare | `pork-ink`/`pork-cream`/`pork-red` → token neutri o `--pa-*` a seconda dell'host. È la voce più grossa: tocca tutti i file di `admin/platform/` |
| 3.2 | Riconciliare le classi `.pynk-admin-portal-*` orfane | ⬜ da iniziare | O le usa la dashboard, o si eliminano dal CSS |
| 3.3 | Identità visiva per portale | ⬜ da iniziare | **Da decidere:** ogni portale prodotto ha un accento suo (rosa/blu/viola, già nelle card) o restano tutti sui token PynkStudio? |
| 3.4 | Coerenza `PynkPortalShell` con i token | ⬜ da iniziare | Usa `border-white/10` hardcoded invece di `--pa-line` |

### F4 — Pensionamento `admin.menuary.it`

| # | Lavoro | Stato | Note |
|---|---|---|---|
| 4.1 | Decidere se e quando pensionarlo | ⬜ da iniziare | **Da decidere.** Oggi resta vivo in parallelo per scelta esplicita |
| 4.2 | Redirect `admin.menuary.it/admin/*` → portale prodotto | ⬜ da iniziare | Dipende da 4.1 |

### F5 — Posta di prodotto operativa

| # | Lavoro | Stato | Note |
|---|---|---|---|
| 5.1 | Prop `initialBrand` in `@pynkstudio/mailapp` | ⬜ da iniziare | Richiede una release del pacchetto esterno (repo `PynkStudio/pynkstudio-mailapp`), fuori da questa repo. La 0.5.0 ha aggiunto `brands` (l'elenco), **non** un brand iniziale del filtro |
| 5.2 | Sostituire la vista sola lettura con il client completo | ⬜ da iniziare | Dipende da 5.1 |

### F6 — Portale PerX (piattaforma esterna, bridge platform-admin)

Dettagli su decisione e motivazione → `Documentation/06-Decisioni-e-Intenzioni-Future.md` nel repo
PerX (voce 2026-09-06). Guida env/endpoint → `docs/perx-integration.md`.

| # | Lavoro | Stato | Note |
|---|---|---|---|
| 6.1 | Client server-only `src/lib/perx/client.ts` | 🔵 in test | Mai `NEXT_PUBLIC_`, mai importato da `"use client"` — a differenza del client Security |
| 6.2 | Pagine `/admin-pynkstudio/perx/*` | 🔵 in test | Dashboard, tenant (lista+dettaglio), utenti, errori operativi (con azione "segna risolto"), domain-routes — tutte Server Component |
| 6.3 | Nav + shell portale | 🔵 in test | `PERX_NAV`/`PORTAL_SHELLS.perx` in `pynk-admin-layout-switch.tsx` |
| 6.4 | Gate ristretto superadmin/admin | 🔵 in test | `src/middleware.ts`, sezione `perx` — non tutti i ruoli siteadmin come Security |
| 6.5 | Bridge lato backend PerX (`X-PerX-Admin-Key`) | 🔵 in test | Repo separata (`xcode/PerX FS APP`): `require_platform_admin_or_api_key` in `backend/app/core/security.py`, applicata a `routes_admin.py`/`routes_admin_errors.py` |
| 6.6 | Error log backend-only (`platform_error_log`) | 🔵 in test | Repo PerX: migrazione `038_platform_error_log`, `app/main.py` exception handler, `routes_admin_errors.py`. Copertura solo backend cloud, non web app/app native/Hub — intenzione futura dichiarata, non pianificata |

> **Cosa manca per portare F6 a ✅:** impostare `PLATFORM_ADMIN_API_KEY` su Render (servizio
> `perx-api`) e `PERX_ADMIN_API_URL`/`PERX_ADMIN_API_KEY` sul progetto Vercel di BePork, applicare
> la migration `038_platform_error_log` in produzione, poi aprire `admin.pynkstudio.eu/perx` con
> una sessione `superadmin` e verificare che tenant (incluso Studio Randa), utenti ed errori si
> vedano — e che un ruolo diverso da `superadmin`/`admin` non veda la sezione. Tocca all'utente:
> serve accesso ai due dashboard di deploy e una sessione autenticata di produzione.

---

## 7. Collegamenti

- [[moduli-piattaforma]] — moduli e feature flag
- [[tenant-e-verticali]] — anagrafica tenant e verticali
- [[openseo-search-console]] — pagina Impostazioni e task verifica dominio Google, montati in questo pannello
- `GESTIONE_IMPLEMENTATION_PLAN.md` — migrazione del pannello gestione tenant sullo stesso host
- `docs/security-integration.md` — portale Security
- `docs/perx-integration.md` — portale PerX (bridge platform-admin, tenant Studio Randa incluso)
