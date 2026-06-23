# Tenant e verticali

> Fonte: `src/lib/tenant-registry.ts`, `src/lib/vertical.ts`. **Dedotto dal codice** allo stato attuale della repo.

## Tenant registrati

Estratti da `TENANTS[]` in `src/lib/tenant-registry.ts` (campi `id`, `name`, `vertical`, `status`):

| ID | Nome | Verticale | Status |
|---|---|---|---|
| `bepork` | ThePork | food | active |
| `faak` | FAAK | food | trial |
| `cascina-errante` | Cascina Errante | food | active |
| `doca` | Doca | food | trattativa |
| `nom-sushi` | Nøm sushi | food | trattativa |
| `junior-food` | Junior Food | food | trattativa |
| `kimos` | Pizzeria Kimos | food | trattativa |
| `libritech` | LibriTech | services | trial |
| `valentina-orciuoli` | Valentina Orciuoli | creative | trattativa |
| `studioaranzulla` | Studio Legale Aranzulla | services | trattativa |
| `officinakam` | Officina KAM | services | trattativa |
| `pynkstudio` | PynkStudio | services | active |
| `orpheo-demo` | Orpheo Demo | creative | trial |

> Nota: il tenant `bepork` ha `name: "ThePork"` nel codice; il `package.json` si chiama `thepork-website`. è stato anonimizzato per poterlo usare come esempio per altri senza fare rirefimento diretto al ristorante BePork di Bari che non ha acquistato il servizio.

## Stati tenant osservati

Valori di `status` presenti nel registro: `active`, `trial`, `trattativa`. Il significato di business preciso di ciascuno è **da confermare** (vedi `20260518_tenant_vertical_status.sql`).

## Default per verticale

Da `CLAUDE.md` / codice:
- `DEFAULT_FOOD_TENANT_ID = "bepork"`
- `DEFAULT_SERVICES_TENANT_ID = "officinakam"`

## Da confermare

- **Pricing e piani commerciali**: esiste `src/app/pricing/page.tsx` e migration su packages/pricing (`20260514_platform_packages_marketing.sql`, `20260525_multi_country_pricing.sql`). I valori concreti **non sono documentati qui** per evitare di riportare numeri non confermati — vanno letti dalla fonte e validati.
- Modello di revenue, commissioni (`20260606_platform_commission_split.sql`, `20260630120000_ai_addon_commission_menuary_only.sql`): logica presente nel DB, significato di business **da confermare**.
- Flusso contratti/abbonamenti/dunning: presenti API (`/api/admin/contracts`, `/api/admin/subscriptions`) e migration (`20260621_platform_contracts.sql`). Dettagli di processo **da confermare**.

## Collegamenti

- [[panoramica-prodotto]]
- [[integrazioni-attive]]
