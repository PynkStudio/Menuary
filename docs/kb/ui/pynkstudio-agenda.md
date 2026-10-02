---
title: "PynkStudio — Agenda e videocall"
module: "pynkstudio-agenda"
roles: ["siteadmin"]
tags: ["ui", "admin-pynkstudio", "agenda", "videocall"]
route: "/admin-pynkstudio/agenda"
source: "src/components/admin-pynkstudio/pynk-agenda.tsx, src/components/admin-pynkstudio/pynk-agenda-call.tsx, src/lib/agenda-runtime.ts"
last_updated: "2026-10-02"
owner: ""
---

# A cosa serve la schermata

L'**Agenda** mostra, settimana per settimana, le call prenotate dai siti PynkStudio (pagina «Prenota una call», landing «IA in azienda»). Durata, giorni e orari si decidono in **«Impostazioni»** (all'inizio: 20 minuti, lun-ven 10:00-18:00, ora italiana). Quando la videocall è attiva, da qui si entra nella stanza video con il cliente.

# Come arrivarci

1. Apri `admin.pynkstudio.eu` con una sessione siteadmin.
2. Nel menu laterale premi **«Agenda»**.

# Elementi della schermata

- **Frecce ‹ ›** in alto: settimana precedente / successiva.
- **Griglia**: colonne lun-ven, righe ogni 20 minuti. Ogni call è un riquadro con nome e argomento; l'icona videocamera indica una videocall. I riquadri grigi sono call già concluse o con cliente non presentato.
- **Interruttore notifiche**: attiva le notifiche push per nuove prenotazioni e promemoria 20 minuti prima.
- **«Impostazioni»** (in alto a destra): apre la pagina delle impostazioni dell'agenda (vedi sotto).
- Le righe e i giorni della griglia seguono gli orari impostati. Se nello stesso orario ci sono più call, compaiono una sotto l'altra; sotto il nome del cliente c'è «con …» quando la call è assegnata a una persona dello staff.
- **Scheda call** (clic su un riquadro): data e ora, nome, argomento, telefono ed email cliccabili.

# Pulsanti e azioni

- **«Entra in videocall»** (solo videocall confermate): apre la schermata **«Pronto a partecipare?»** con l'anteprima della videocamera, i pulsanti microfono/videocamera e la scelta di microfono, altoparlante e videocamera. Entri con **nome e cognome della tua utenza** (non modificabile). Premi **«Partecipa»**: la call si apre a schermo intero. Puoi entrare quando vuoi, anche prima del cliente; la stanza si chiude 30 minuti dopo la fine prevista.

# Dentro la call

- In due: il cliente a tutto schermo, tu nel riquadro in basso a destra. Con più persone: griglia. Se qualcuno presenta lo schermo, la presentazione va in grande.
- Barra in basso, da sinistra: ora e titolo; **microfono** e **videocamera** (la freccia accanto apre la scelta del dispositivo); **«Presenta lo schermo»**; **«Abbandona la chiamata»** (rosso); a destra **«Persone»** e **«Chat»** (con il numero di messaggi non letti).
- Scorciatoie: Ctrl/⌘+D microfono, Ctrl/⌘+E videocamera.
- Il cliente compare con nome e cognome del modulo e, se l'ha indicata (landing «IA in azienda»), l'azienda: «Mario Rossi · Rossi Srl».
- **«Segna conclusa»** / **«Non presentato»**: registrano l'esito. Una videocall a cui il cliente è entrato viene segnata «conclusa» da sola quando la stanza si chiude.
- **«Annulla prenotazione»**: libera l'orario e aggiorna il CRM. Il cliente **non** riceve un avviso automatico: avvisalo tu.

# Impostazioni dell'agenda

Percorso: **Agenda → «Impostazioni»** (`/admin-pynkstudio/agenda/impostazioni`).

- **Appuntamento**: nome, durata, intervallo tra gli orari proposti, pausa dopo ogni appuntamento, preavviso minimo (ore), giorni prenotabili in anticipo, modalità (Videocall / Telefono / Di persona).
- **Chi riceve le prenotazioni**:
  - **«Posti manuali»**: decidi tu quanti appuntamenti contemporanei accettare in ogni fascia (campo **«Posti»** accanto agli orari). Non serve collegare calendari.
  - **«Persone dello staff»**: spunta chi riceve le call. Un orario si può prenotare se almeno una persona è libera, e accetta tante call quante persone libere (es. tra le 9 e le 10 libera una sola persona → una sola call). La call va alla persona meno occupata.
- **Orari settimanali**: per ogni giorno le fasce prenotabili; **«+ Aggiungi fascia»**, **×** per toglierla. Un giorno senza fasce è chiuso.
- **Festività e chiusure**: **«Italia — festività nazionali»** esclude le feste nazionali (Pasquetta compresa); **«Aggiungi giorno»** chiude una data singola (ferie, ponti).
- **«Salva impostazioni»** applica le modifiche (entro pochi secondi sul sito); **«Ripristina i valori predefiniti»** torna alla configurazione iniziale.
- **Staff e calendari**, per ogni persona:
  - **«Riceve prenotazioni»** acceso/spento;
  - **«Calendari collegati»** con stato (**Attivo** / **Errore di lettura**) e **«Scollega»**;
  - pulsanti **«Google Calendar»**, **«Outlook / Microsoft 365»** (disattivati finché non sono configurati sul server), **«Apple iCloud»** (ID Apple + **password specifica per app**, da creare su account.apple.com), **«Link ICS»** (indirizzo del calendario in formato iCal);
  - **«Inserisci le call nel calendario»**: scegli uno dei tuoi calendari collegati (Google, Outlook o iCloud; i link ICS sono solo in lettura) e il calendario dentro l'account, poi **«Salva destinazione»**. Le call assegnate a te compaiono lì con nome del cliente, argomento, contatti e link alla videocall, e spariscono se annullate. «Non inserire» per smettere.
  - **«Orari personali»**: «Come l'appuntamento» oppure «Orari miei» + **«Salva orari»**.
- Gli orari in cui una persona è occupata nei calendari collegati non vengono proposti ai clienti. Se un calendario va in errore viene ignorato (la persona risulta libera) finché non torna leggibile: controlla lo stato.

# Cosa vede il cliente

Nell'email di conferma e nel promemoria c'è **«Salva sul calendario»** con tre pulsanti: **Google Calendar**, **Outlook**, **Apple / altro calendario** (scarica il file .ics); la conferma ha anche il file .ics allegato. C'è poi il bottone **«Entra nella videocall»**: il link è personale e si attiva 10 minuti prima dell'inizio. Funziona dal browser, senza installare nulla. Il cliente vede la stessa schermata «Pronto a partecipare?» (con il proprio nome già impostato) e la stessa call.

# Note

- Se la videocall non è configurata (server LiveKit spento o variabili mancanti) le nuove call sono telefoniche, come prima: il pulsante «Entra in videocall» non compare.
- Da verificare al primo collaudo: comportamento su reti aziendali molto restrittive.

# Riferimenti nel codice

- Schermata agenda ed etichette: `src/components/admin-pynkstudio/pynk-agenda.tsx`
- Stanza videocall staff: `src/app/admin-pynkstudio/agenda/call/[bookingId]/page.tsx`, `src/components/admin-pynkstudio/pynk-agenda-call.tsx`
- Pagina videocall cliente e copy: `src/components/tenants/pynkstudio/pages/videocall.tsx`, `videocallPage` in `src/lib/pynkstudio-i18n.ts` (etichette della call in `videocallPage.labels`, adattate da `src/lib/pynkstudio/video-labels.ts`)
- Interfaccia della call: pacchetto `@pynkstudio/agendaapp/video/react` (v0.2.0); colori in `.agv.pynk-agv` in fondo a `src/styles/tenants/pynkstudio.css`
- Regole orari e hook: `src/lib/agenda-runtime.ts` — progetto e stato in [[agenda-videocall]]
- Pagina impostazioni: `src/app/admin-pynkstudio/agenda/impostazioni/page.tsx`, `src/components/admin-pynkstudio/pynk-agenda-settings.tsx`; etichette nel pacchetto (`@pynkstudio/agendaapp/settings/react`, `SETTINGS_LABELS.it`)
