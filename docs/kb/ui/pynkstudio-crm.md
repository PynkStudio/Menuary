---
title: "PynkStudio — CRM"
module: "pynkstudio-crm"
roles: ["siteadmin"]
tags: ["ui", "admin-pynkstudio", "crm"]
route: "/admin-pynkstudio/crm"
source: "src/components/admin-pynkstudio/pynk-crm.tsx, src/lib/pynkstudio/crm.ts, src/app/api/admin/pynkstudio/crm"
last_updated: "2026-09-30"
owner: ""
---

# A cosa serve la schermata

Il **CRM** raccoglie chi scrive o prenota una call dai siti PynkStudio (form contatti, landing «IA in azienda», prenota-call). Ogni richiesta aggiorna la scheda con ciò che il contatto ha dichiarato: persone in azienda, settore, tempistica, interessi, percorso scelto e la campagna di provenienza.

# Come arrivarci

1. Apri `admin.pynkstudio.eu` con una sessione siteadmin.
2. Nel menu laterale premi **«CRM PynkStudio»**.

# Elementi della schermata

- **Riquadri in alto**: Contatti, Nuovi in 7 giorni, Follow-up da fare (cliccabile: filtra i scaduti), Valore in pipeline.
- **Barra filtri**: ricerca, menu sorgente, menu vista (Tutti / Follow-up scaduti / Solo raggiungibili / Disiscritti), ordinamento; sotto, le schede di stato con conteggio.
- **Tabella**: contatto, azienda, persone, priorità (Caldo/Tiepido/Freddo), stato, origine, ultima attività, follow-up.
- **Scheda contatto** (clic su una riga), con tre tab: **Scheda** (dati modificabili, follow-up, valore stimato, interesse, tag, note), **Attività** (cronologia e registrazione di note/telefonate/email/WhatsApp), **Origine** (canale, campagna, parametri UTM, pagina di atterraggio).

# Pulsanti e azioni

- **«Nuovo contatto»**: inserisce a mano un contatto (serve nome ed email).
- **«Esporta CSV»**: scarica i contatti con i filtri attivi.
- **«Salva modifiche»** (tab Scheda): salva; il cambio stato viene registrato in cronologia.
- **«Aggiungi alla cronologia»** (tab Attività): registra un'interazione.
- **«Elimina contatto»**: chiede conferma, poi cancella contatto e storico.

# Note

La priorità è calcolata da call prenotate, tempistica, numero di persone, telefono e richieste ripetute; non si imposta a mano. Una nuova richiesta riapre un contatto «Perso»; una call promuove un «Lead» a «Prospect».
