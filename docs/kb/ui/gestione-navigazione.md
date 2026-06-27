---
title: "Pannello Gestione — mappa di navigazione"
module: "website"
roles: ["tenant_admin"]
tags: ["ui", "gestione", "navigazione"]
route: "/gestione/[tenantSlug]"
source: "src/components/gestione/gestione-shell.tsx, src/i18n/gestione.ts"
last_updated: "2026-06-23"
owner: ""
---

# A cosa serve

Il pannello **Gestione** è il back-office con cui il `tenant_admin` (e lo staff abilitato) governa l'attività. Questa scheda è la **mappa del menu laterale**: serve all'assistente per indicare in quale voce entrare.

# Come arrivarci

- Sito pubblico del tenant: `https://gestione.<dominio-tenant>`.
- In anteprima/demo: `https://demo.<verticale>/<slug>/gestione` (es. `demo.menuary.it/<slug>/gestione`).
- Dal sito pubblico del tenant è presente un link **Staff** nel footer che porta al pannello.

# Voci del menu laterale

Etichette e percorsi reali (lingua predefinita: italiano). La **visibilità** di ogni voce dipende dai permessi del ruolo e dai moduli attivi del tenant: una voce non visibile significa quasi sempre modulo disattivo o permesso mancante.

| Voce di menu | Percorso | Visibile quando |
|---|---|---|
| **Dashboard** | `/gestione/[slug]` | Sempre |
| **Ordini** | `/gestione/[slug]/ordini` | Modulo ordini attivo |
| **Cucina** | `/gestione/[slug]/cucina` | Feature `kitchenDisplay` attiva |
| **Menu** *(food)* / **Listino** *(services/creative)* | `/gestione/[slug]/listino` | Permesso gestione menu |
| **Gestione sala** *(food)* | `/gestione/[slug]/tavoli` | Permesso gestione tavoli |
| **Prenotazioni** *(food)* / **Appuntamenti** *(services)* | `/gestione/[slug]/prenotazioni` | Permesso gestione prenotazioni |
| **Cassa** | `/gestione/[slug]/cassa` | Permesso cassa |
| **Turni** | `/gestione/[slug]/turni` | Permesso turni (non per verticale `creative`) |
| **Staff** | `/gestione/[slug]/staff` | Permesso gestione staff |
| **Mail** | `/gestione/[slug]/mail` | Admin + modulo mail |
| **Kiosk** | `/gestione/[slug]/kiosk` | Admin + feature `orderKiosk` |
| **Assistente AI** | `/gestione/[slug]/assistente-ai` | Admin + feature `aiPhone` o `aiWhatsapp` |
| **Google** | `/gestione/[slug]/google` | Admin + Google Business collegato |
| **Analytics** | `/gestione/[slug]/analytics` | Permesso analytics |
| **Fedeltà** | `/gestione/[slug]/fidelity` | Admin + modulo fidelity |
| **Blog** | `/gestione/[slug]/blog` | Admin + modulo blog |
| **Linktree** | `/gestione/[slug]/linktree` | Admin + modulo linktree |
| **Fatturazione** | `/gestione/[slug]/fatturazione` | Admin |
| **Agenda call** | `/gestione/[slug]/agenda` | Admin + permesso agenda (PynkStudio) |
| **Patrimoniale** | `/gestione/[slug]/patrimoniale` | Admin + permesso patrimoniale |
| **Rider** | `/gestione/[slug]/rider` | Admin + permesso rider |

> Alcune etichette sono **dinamiche per verticale** (Menu/Listino, Prenotazioni/Appuntamenti, Gestione sala). La fonte autorevole delle etichette è `src/i18n/gestione.ts` e `getModuleLabel()` in `src/lib/vertical.ts`.

# Altre aree (non nel menu laterale)

Raggiungibili da scorciatoie in **Dashboard** o dal menu profilo in alto:

| Area | Percorso | Note |
|---|---|---|
| **Dati attività** | `/gestione/[slug]/attivita` (e `/info`) | Sito, contatti, orari |
| **Sedi** | `/gestione/[slug]/sedi` | Multi-location |
| **Impostazioni** | `/gestione/[slug]/impostazioni` | Configurazioni del tenant |
| **Profilo** | `/gestione/[slug]/profilo` | Profilo utente |

# Stati possibili

Sulla voce **Ordini** può comparire un contatore di nuovi arrivi / ordini pronti (badge). Dettaglio nella scheda [[gestione-ordini]].

# Procedure correlate

- [[gestione-ordini]]
- [[posta-admin-gestione]]

# Riferimenti nel codice (manutenzione)

- Menu e visibilità: `src/components/gestione/gestione-shell.tsx`
- Etichette (it/en/fr/…): `src/i18n/gestione.ts`
- Etichette per-verticale: `src/lib/vertical.ts` (`getModuleLabel`)
- Pagine sezione: `src/app/gestione/[tenantSlug]/*/page.tsx`
