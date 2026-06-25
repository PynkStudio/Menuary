---
title: "Gestione — Stampanti comande"
module: "printStations"
roles: ["tenant_admin"]
tags: ["ui", "stampa", "comande", "cassa"]
route: "/gestione/[tenantSlug]/cassa"
source: "src/app/gestione/[tenantSlug]/cassa/page.tsx, src/components/gestione/printers-panel.tsx"
last_updated: "2026-06-25"
owner: ""
---

# A cosa serve la schermata

Collegare e configurare la stampante delle comande del locale tramite QZ Tray, e fare una stampa di prova.

# Come arrivarci

1. **Dal computer collegato alla stampante** (PC cassa), apri il pannello **Gestione** (`gestione.<dominio-tenant>` o, in demo, `demo.<verticale>/<slug>/gestione`).
2. Nel menu premi **«Cassa»**.
3. Scorri fino alla sezione **«Stampanti comande»** (visibile solo con il modulo `printStations` attivo).

> La pagina Cassa è raggiungibile con il modulo cassa o con il modulo stampanti. La sezione stampanti compare solo se `printStations` è attivo.

# Elementi della schermata

- **Ponte di stampa (QZ Tray)**: stato connessione e pulsante di connessione.
- **Stampante del locale**: nome/reparto, dispositivo, larghezza carta, copie, opzioni di stampa.

# Pulsanti e azioni

| Etichetta UI | Cosa fa | Dove si trova |
|---|---|---|
| «Connetti QZ Tray» | Avvia la connessione al servizio QZ Tray locale e carica le stampanti | Sezione *Ponte di stampa* |
| «Riconnetti» | Riapre la connessione se già connesso | Sezione *Ponte di stampa* |
| «Scaricalo qui» | Link al download di QZ Tray | Sotto il pulsante di connessione |
| «Stampa di prova» | Invia una comanda di test alla stampante selezionata | Sezione *Stampante del locale* |
| «Salva stampante» | Salva la configurazione | In fondo alla pagina |

# Campi e filtri

- **Nome / reparto**: etichetta della stampante (es. "Cucina").
- **Dispositivo (da QZ Tray)**: elenco delle stampanti viste dal PC (attivo solo dopo la connessione).
- **Larghezza carta**: `80 mm (48 caratteri)` o `58 mm (32 caratteri)`.
- **Copie**: 1–5.
- **Stampa automatica** (casella): stampa la comanda all'arrivo dell'ordine (richiede pagina cassa/cucina aperte).
- **Stampante attiva** (casella): attiva/sospende la stampa.

# Stati possibili

- **Non connesso** / **Connesso** / **Errore** (badge nella sezione *Ponte di stampa*).

# Procedure correlate

- [[stampanti-comande]]

# Riferimenti nel codice (manutenzione)

- Route: `src/app/gestione/[tenantSlug]/cassa/page.tsx`
- Componente: `src/components/gestione/printers-panel.tsx`
- API: `src/app/api/gestione/printers/route.ts`
- Ponte/stampa: `src/lib/printing/`
