---
title: "Serve un'app desktop per stampare le comande? Posso usare la stampante USB della cassa?"
module: "printStations"
roles: ["tenant_admin"]
tags: ["stampa", "comande", "usb", "windows", "faq"]
last_updated: "2026-06-25"
owner: ""
---

# Domanda

Ho una cassa che è un computer Windows con la stampante già collegata via USB. Posso usarla dal gestionale tramite il browser (Google Chrome) o mi serve un'app desktop?

# Risposta

Serve un **piccolo programma gratuito** sul PC cassa: **QZ Tray**. Non è un gestionale né una vera "app desktop" da usare: è un servizio che gira in background e rende la stampante USB già installata su Windows disponibile al browser. Una volta installato, tutta la configurazione e la stampa avvengono dal gestionale in Chrome.

Perché non basta solo Chrome: una web app da sola **non può** comandare in modo affidabile una stampante USB già installata con i driver Windows (il driver di sistema "occupa" la porta USB). QZ Tray fa da ponte e risolve esattamente questo caso.

Setup: installa QZ Tray sul PC cassa (link dalla schermata), poi Gestione → **Cassa** → **Stampanti comande** → **«Connetti QZ Tray»** → scegli la stampante → **«Stampa di prova»** → **«Salva stampante»**. Vedi [[gestione-stampanti-comande]].

# Note

- Alternativa senza alcun programma sul PC: una **stampante cloud SUNMI** (o una stampante di rete/Wi-Fi ePOS). In quel caso la stampa è **automatica e server-side**, senza PC né pagina aperta: basta inserire il SN della stampante in Gestione → Cassa → Stampanti comande. Richiede una stampante compatibile.
- Per la stampa **silenziosa** (senza il popup di conferma di QZ) in produzione serve una licenza di firma QZ — vedi [[integrazioni-attive]].

# Documentazione correlata

- [[stampanti-comande]]
- [[gestione-stampanti-comande]]
