---
title: "Stampanti comande"
module: "printStations"
roles: ["tenant_admin"]
tags: ["stampa", "comande", "cucina", "cassa"]
last_updated: "2026-06-25"
owner: ""
---

# Descrizione

Il modulo **Stampanti e reparti** stampa le comande degli ordini su una stampante termica del locale. Due modalità di collegamento:

- **USB via QZ Tray** — un programma gratuito sul PC cassa rende disponibili le stampanti dell'OS (anche USB già collegate). Risolve il caso "cassa Windows con stampante USB", senza app desktop dedicata.
- **Stampante cloud SUNMI** — la stampante si collega da sola a internet; la stampa è **automatica e server-side**, senza PC né pagina aperta. Consigliata per la stampa comande sempre attiva.

# Funzionalità

- Collegamento alla stampante del locale via QZ Tray (USB o di rete installata su Windows/Mac/Linux).
- Scelta del dispositivo tra le stampanti viste dal PC cassa.
- Larghezza carta 80 mm (48 caratteri) o 58 mm (32 caratteri) e numero di copie.
- **Stampa di prova** per validare il collegamento.
- Comanda in ESC/POS con intestazione (tavolo/asporto/delivery), righe, varianti, extra e note.
- **Stampa automatica** delle comande degli ordini accettati, da **qualsiasi canale** (sito, WhatsApp, Retell): la postazione di stampa sta nella pagina **Operativo → Ordini** aperta sul PC cassa e stampa appena un ordine entra in cucina. Dedup lato server: nessuna ristampa al refresh o alla riapertura.
- *In arrivo (TODO):* più stampanti per reparto (cucina/bar/pizzeria/banco) con instradamento per categoria.

# Permessi richiesti

- Ruolo `tenant_admin`.
- Feature-flag **`printStations`** attivo sul tenant.
- Dipendenza modulo: richiede almeno uno tra `takeaway`, `tableOrders`, `orderKiosk` (servono ordini da stampare).
- **QZ Tray** installato e in esecuzione sul PC collegato alla stampante.

# Flussi operativi

1. **Configurazione (USB/QZ)** — dal PC cassa, Gestione → **Cassa** → *Stampanti comande*, scegli «USB sul PC cassa (QZ Tray)», **«Connetti QZ Tray»**, seleziona il dispositivo, larghezza/copie, **«Stampa di prova»**, **«Salva stampante»**. Uso quotidiano: tieni aperta la pagina **Operativo → Ordini** (barra **«Stampa comande · Attiva»**).
2. **Configurazione (SUNMI cloud)** — Gestione → **Cassa** → *Stampanti comande*, scegli «Stampante cloud SUNMI», inserisci il **SN** del device (collegato dal portale SUNMI), **«Salva stampante»**. Uso quotidiano: nessuna azione — le comande degli ordini accettati si stampano da sole, anche senza PC acceso.

# Limitazioni

- Richiede QZ Tray installato sul PC cassa: senza, nessuna stampa (la web app da sola non accede alla stampante USB già installata su Windows).
- La **stampa silenziosa** in produzione (senza popup) richiede un certificato di firma QZ commerciale — vedi [[integrazioni-attive]].
- F1: una sola stampante per locale; nessun instradamento per reparto/categoria ancora.
- Gli accenti vengono stampati in ASCII (è→e) finché non si configura la code-page della stampante.

# FAQ correlate

- [[serve-app-desktop-per-stampare]]

# Schermate UI correlate

- [[gestione-stampanti-comande]] — dove trovare il modulo e quali pulsanti usare
