---
title: "Pannello Gestione — mappa di navigazione"
module: "website"
roles: ["tenant_admin", "staff"]
tags: ["ui", "gestione", "navigazione"]
route: "/gestione/[tenantSlug]"
source: "src/lib/gestione-sections.ts, src/components/gestione/gestione-shell.tsx, src/i18n/gestione.ts"
last_updated: "2026-10-03"
owner: ""
---

# A cosa serve

Il pannello **Gestione** è il back-office con cui il titolare (`tenant_admin`) e lo staff abilitato governano l'attività. Questa scheda è la **mappa del menu**: serve all'assistente per indicare in quale voce entrare.

# Come arrivarci

- Sito pubblico del tenant: `https://gestione.<dominio-tenant>`.
- In anteprima/demo: `https://demo.<verticale>/<slug>/gestione` (es. `demo.menuary.it/<slug>/gestione`).
- Dal sito pubblico del tenant è presente un link **Staff** nel footer che porta al pannello.

# Com'è fatto il menu

- **Computer (da 1024 px):** menu fisso sulla sinistra, diviso in gruppi. In fondo al menu c'è il **nome dell'utente**: cliccandolo si apre il menu account.
- **Telefono e tablet:** barra in alto con il pulsante **☰ (Apri menu)**. Il menu si apre da sinistra; si chiude con la **X**, toccando fuori o con il tasto Esc.
- Con più sedi, sotto il nome dell'attività c'è il **selettore della sede attiva**: tutte le pagine lavorano sulla sede scelta.
- Sulla demo con backend reale attivo compare l'etichetta **Backend live · N min**: la demo è collegata ai dati veri e si spegne da sola allo scadere.

# Voci del menu

Etichette in italiano. Una voce compare solo se **il modulo è attivo** per il tenant **e** il ruolo dell'utente ha il permesso. Le stesse regole valgono anche aprendo l'indirizzo a mano: se la voce non c'è, la pagina risponde "non trovata".

| Gruppo | Voce | Percorso | Chi la vede |
|---|---|---|---|
| **Oggi** | **Panoramica** | `/gestione/[slug]` | Tutto lo staff |
| Oggi | **Ordini** (coda ordini) | `/ordini` | Tutti, se ordini attivi |
| Oggi | **Cucina** | `/cucina` | Tutti, se schermo cucina attivo |
| Oggi | **Prenotazioni** *(food)* / **Appuntamenti** *(services)* / **Booking** *(creative)* | `/prenotazioni` | Permesso prenotazioni |
| Oggi | **Gestione sala** *(food)* | `/tavoli` | Permesso prenotazioni + modulo sala |
| Oggi | **Agenda call** | `/agenda` | Titolare (PynkStudio) |
| **Offerta** | **Menu online** *(food)* / **Listino prezzi** *(services)* / **Catalogo opere** *(creative)* | `/listino` | Permesso menu |
| **Clienti e crescita** | **Fedeltà** *(food)* / **Clienti** *(services)* / **Fanbase e community** *(creative)* | `/fidelity` | Titolare |
| Clienti e crescita | **Google Business** | `/google` | Titolare |
| Clienti e crescita | **Mail** | `/mail` | Titolare |
| Clienti e crescita | **Blog** | `/blog` | Titolare |
| Clienti e crescita | **Linktree** | `/linktree` | Titolare |
| Clienti e crescita | **Analytics** | `/analytics` | Permesso analytics |
| **Canali** | **Assistente AI** | `/assistente-ai` | Titolare |
| Canali | **Kiosk** | `/kiosk` | Titolare |
| Canali | **Rider** | `/rider` | Titolare |
| **Impostazioni** | **Dati attività e orari** | `/attivita` | Titolare (non creative) |
| Impostazioni | **Regole ordini** | `/ordini/impostazioni` | Titolare, se ordini attivi |
| Impostazioni | **Cassa e stampanti** / **Stampanti** | `/cassa` | Permesso cassa |
| Impostazioni | **Staff** | `/staff` | Permesso staff |
| Impostazioni | **Turni** | `/turni` | Permesso turni |
| Impostazioni | **Patrimoniale** | `/patrimoniale` | Titolare (PynkStudio) |

Tutti i percorsi sono relativi a `/gestione/[slug]`. Su dominio dedicato (`gestione.<dominio>`) il prefisso non c'è.

# Menu account (in fondo al menu, sul nome utente)

| Voce | Percorso | Chi la vede |
|---|---|---|
| **Profilo** | `/profilo` | Tutti |
| **Account e preferenze** (abbonamento, valuta, lingue, password, passkey) | `/impostazioni` | Tutti; l'abbonamento solo con permesso dati economici |
| **Abbonamento e fatture** | `/fatturazione` | Permesso dati economici (titolare) |
| **Problemi tecnici? support@…** | email al supporto | Tutti |
| **Esci** | — | Tutti |

# Sottosezioni

- **Fedeltà** ha quattro schede in alto: **Programma**, **Regole punti**, **Premi**, **Iscritti**.
- **Google Business** porta a **Recensioni**, **Orari**, **Insights**; ogni sottopagina ha il link **‹ Google Business** per tornare indietro.
- **Ordini** ha il pulsante **Impostazioni** (solo titolare) che apre **Regole ordini**.

# Stati possibili

- Sulle voci **Ordini**, **Cucina** e **Prenotazioni** può comparire un contatore di nuovi arrivi (badge). Dettaglio nella scheda [[gestione-ordini]].
- Un account **dispositivo** (kiosk, display cucina) non vede la Panoramica: usa il portale operativo.

# Procedure correlate

- [[gestione-ordini]]
- [[gestione-stampanti-comande]]
- [[posta-admin-gestione]]

# Riferimenti nel codice (manutenzione)

- Tabella unica di sezioni, gruppi e permessi: `src/lib/gestione-sections.ts`
- Menu: `src/components/gestione/gestione-shell.tsx`
- Guard delle pagine: `src/lib/gestione-page.ts` (`requireGestioneSection`)
- Etichette (it/en/fr/es/de/pt): `src/i18n/gestione.ts` (blocco `navigation`)
- Etichette per verticale: `src/lib/vertical.ts` (`getModuleLabel`)
