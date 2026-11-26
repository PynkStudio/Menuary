# Integrazione PerX — Guida bridge platform-admin

## Stato attuale

Il portale `admin.pynkstudio.eu/perx` ha il client server-only pronto in `src/lib/perx/client.ts`
e le pagine in `/admin-pynkstudio/perx/*`.

Le env vars restano server-only (non `NEXT_PUBLIC_`). Nessun CORS da configurare: le chiamate
partono dal server Next.js di BePork verso il backend PerX, mai dal browser.

## Target di piattaforma deciso il 2026-11-25

`admin.pynkstudio.eu` diventa il control plane unico di tutti i prodotti PynkStudio. PerX resta
un backend indipendente e deve essere amministrato da questo portale integralmente tramite API
server-to-server: nessun accesso diretto al suo database, nessun segreto nel browser e nessun
pannello admin PerX parallelo da mantenere come fonte autorevole.

Anche i domini prodotto confluiranno sotto `pynkstudio.eu`: `perx.pynkstudio.eu`,
`catdispatcher.pynkstudio.eu`, `bignamionline.pynkstudio.eu`; per compatibilità con il pannello
DNS Register.it i servizi PerX useranno i nomi piatti `app-perx.pynkstudio.eu`,
`api-perx.pynkstudio.eu`, `login-perx.pynkstudio.eu`. I domini custom dei tenant (Studio Randa e
gli altri) e i loro sottodomini operativi restano indipendenti.

Il bridge documentato qui è la prima integrazione, non ancora il control plane completo. Prima
dell'estensione alle azioni mutative servono inventario delle capability, audit trail, operazioni
idempotenti e credenziali per prodotto/azione ruotabili; la chiave platform-admin globale rimane
una soluzione transitoria. La migrazione host deve essere dual-host con redirect dei domini
storici solo dopo la verifica di callback, webhook e client.

Prima fase domini completata il 2026-11-25: i tre portali PerX pubblico, CAT Dispatcher e
Bignami Online hanno origin Vercel production separati dietro al gateway `perx`; i nuovi host
PynkStudio sono associati a Vercel ma attendono i record DNS presso Register.it. Questa fase non
estende le capability mutative del pannello amministrativo descritte nelle sezioni successive.
Nello stesso giorno è stato aggiunto lo snapshot `GET /overview`: la dashboard mostra ora KPI,
stato connessione, modalità tenant e capability CRUD dichiarate dal backend con una sola chiamata
aggregata. La gestione utenti resta intenzionalmente indicata come read-only.

---

## 1. Perché PerX e non un verticale Menuary

Menuary/Bizery/Orpheo condividono lo stesso database multi-tenant e sono esposti in PynkStudio
tramite `src/lib/platform/product-portals.ts` (filtro per `vertical`). **PerX è un prodotto
completamente separato**: backend FastAPI/Postgres proprio, deploy su Render, nessun verticale in
comune con Menuary. Segue quindi lo stesso pattern del portale **Security** (vedi
`docs/security-integration.md`): un client dedicato che chiama l'API admin di un altro backend con
una chiave condivisa, dietro il ruolo `siteadmin` di PynkStudio.

**Studio Randa** è un tenant reale già esistente su PerX (non un verticale, non un prodotto a sé):
compare automaticamente nella lista tenant di `/admin-pynkstudio/perx/tenant`, esattamente come
ogni altro tenant PerX — non è cablato a mano da nessuna parte in questo repo.

## 2. Differenza deliberata rispetto al client Security

Il client Security (`src/lib/security/client.ts`) usa `NEXT_PUBLIC_SECURITY_API_URL`/
`NEXT_PUBLIC_SECURITY_API_KEY`: essendo `NEXT_PUBLIC_`, la chiave finisce nel bundle JS spedito al
browser (mitigato solo dal fatto che la pagina è dietro l'auth `siteadmin`).

Il client PerX (`src/lib/perx/client.ts`) usa **`PERX_ADMIN_API_URL`/`PERX_ADMIN_API_KEY` senza
prefisso `NEXT_PUBLIC_`**: sono leggibili solo lato server. Le pagine `/admin-pynkstudio/perx/*`
sono React Server Component che chiamano il client direttamente nel render server-side — la
chiave non raggiunge mai il browser e non serve alcuna configurazione CORS sul backend PerX.
**Non importare mai `src/lib/perx/client.ts` da un componente `"use client"`.**

## 3. Variabili d'ambiente da aggiungere

Nel progetto Vercel di BePork (Production + Preview), **non** in `.env.local` con prefisso
pubblico:

```bash
# PerX — bridge platform-admin (server-only, MAI NEXT_PUBLIC_)
PERX_ADMIN_API_URL=https://<perx-api-render-host>/api/v1/admin
PERX_ADMIN_API_KEY=<stesso valore di PLATFORM_ADMIN_API_KEY su Render, servizio perx-api>
```

Lato PerX (repo separata, `xcode/PerX FS APP`), la env corrispondente è `PLATFORM_ADMIN_API_KEY`
su Render (dashboard, non tracciata in `render.yaml`). Se assente/vuota sul backend, il bridge è
disabilitato e `/api/v1/admin/*` resta accessibile solo con un JWT umano `is_platform_admin=True`.

## 4. Endpoint disponibili

Base URL: `PERX_ADMIN_API_URL` (backend FastAPI PerX, prefix `/api/v1/admin`).

Autenticazione: header `X-PerX-Admin-Key`.

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/overview` | Snapshot KPI, modalità tenant e capability CRUD supportate |
| GET | `/tenants` | Lista tenant |
| POST | `/tenants` | Crea tenant (403 se `SINGLE_TENANT_MODE=True` sul backend) |
| PUT | `/tenants/{id}` | Aggiorna tenant |
| GET | `/tenants/{id}/settings` | Settings completi, incluse le secret provider/AI |
| PUT | `/tenants/{id}/settings` | Aggiorna settings (domini, branding, provider/AI, garanzie) |
| GET | `/users` | Lista utenti (filtro `?tenant_id=`) |
| GET | `/domain-routes` | Regole di instradamento dominio → app |
| POST/PUT/DELETE | `/domain-routes[/{id}]` | CRUD regole di instradamento |
| GET | `/errors` | Log errori (filtri `tenant_id`/`severity`/`resolved`/`since`) — **solo backend FastAPI**, vedi § 6 |
| GET | `/errors/{id}` | Dettaglio errore con stack trace |
| PATCH | `/errors/{id}` | Segna risolto/riaperto |

Non esiste (ancora) un endpoint di sospensione/archiviazione tenant lato PerX — a differenza di
SecurityApp, il modello `Tenant` di PerX non ha un campo stato.

## 5. Struttura del client

```typescript
import { perxApi } from "@/lib/perx/client";

const overview = await perxApi.getOverview();
const tenants = await perxApi.listTenants();
const settings = await perxApi.getTenantSettings(tenantId);
const errors = await perxApi.listErrors({ resolved: false });
await perxApi.resolveError(errorId);
```

Tipi esportati: `PerxAdminOverview`, `PerxAdminCapability`, `PerxTenant`,
`PerxTenantSettings`, `PerxUser`, `PerxDomainRoute`, `PerxErrorLog`.

## 6. Nota di sicurezza e limiti

- La chiave `PERX_ADMIN_API_KEY`/`PLATFORM_ADMIN_API_KEY` dà accesso **platform-admin completo**
  su PerX (tutti i tenant, incluse le secret provider/AI nei settings): è di proposito un
  bridge "solo noi", per questo il portale `/admin-pynkstudio/perx/*` è gated a
  `superadmin`/`admin` in `src/middleware.ts`, non a tutti i ruoli `siteadmin` come Security.
- Il tracciamento errori copre **solo il backend FastAPI** (eccezioni non gestite in
  `app/main.py`). Web app satellite, app iOS/macOS/iPad e PerXHub **non** scrivono ancora in
  `platform_error_log` — è un'intenzione dichiarata dall'utente, non implementata (vedi
  `Documentation/06-Decisioni-e-Intenzioni-Future.md` nel repo PerX, voce 2026-09-06).
- Ogni scrittura verso `/api/v1/admin/*` avviene con lo stesso livello di privilegio, non essendoci
  oggi un audit trail delle chiamate fatte tramite la API key (a differenza di SecurityApp, che
  scrive `writeAudit()` a ogni scrittura). Da valutare se serve prima di esporre azioni di scrittura
  (oggi il portale PerX è di sola lettura più il solo "segna risolto" sugli errori).
