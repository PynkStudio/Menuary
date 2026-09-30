---
title: "PynkStudio — Agenda e videocall"
module: "pynkstudio-agenda"
roles: ["siteadmin"]
tags: ["ui", "admin-pynkstudio", "agenda", "videocall"]
route: "/admin-pynkstudio/agenda"
source: "src/components/admin-pynkstudio/pynk-agenda.tsx, src/components/admin-pynkstudio/pynk-agenda-call.tsx, src/lib/agenda-runtime.ts"
last_updated: "2026-09-30"
owner: ""
---

# A cosa serve la schermata

L'**Agenda** mostra, settimana per settimana, le call prenotate dai siti PynkStudio (pagina «Prenota una call», landing «IA in azienda»). Le call sono da 20 minuti, dal lunedì al venerdì tra le 10:00 e le 18:00 (ora italiana). Quando la videocall è attiva, da qui si entra nella stanza video con il cliente.

# Come arrivarci

1. Apri `admin.pynkstudio.eu` con una sessione siteadmin.
2. Nel menu laterale premi **«Agenda»**.

# Elementi della schermata

- **Frecce ‹ ›** in alto: settimana precedente / successiva.
- **Griglia**: colonne lun-ven, righe ogni 20 minuti. Ogni call è un riquadro con nome e argomento; l'icona videocamera indica una videocall. I riquadri grigi sono call già concluse o con cliente non presentato.
- **Interruttore notifiche**: attiva le notifiche push per nuove prenotazioni e promemoria 20 minuti prima.
- **Scheda call** (clic su un riquadro): data e ora, nome, argomento, telefono ed email cliccabili.

# Pulsanti e azioni

- **«Entra in videocall»** (solo videocall confermate): apre la stanza. Premi **«Apri la stanza»**, consenti microfono e videocamera. Puoi entrare quando vuoi, anche prima del cliente; la stanza si chiude 30 minuti dopo la fine prevista.
- **«Segna conclusa»** / **«Non presentato»**: registrano l'esito. Una videocall a cui il cliente è entrato viene segnata «conclusa» da sola quando la stanza si chiude.
- **«Annulla prenotazione»**: libera l'orario e aggiorna il CRM. Il cliente **non** riceve un avviso automatico: avvisalo tu.

# Cosa vede il cliente

Nell'email di conferma e nel promemoria c'è il bottone **«Entra nella videocall»**: il link è personale e si attiva 10 minuti prima dell'inizio. Funziona dal browser, senza installare nulla.

# Note

- Se la videocall non è configurata (server LiveKit spento o variabili mancanti) le nuove call sono telefoniche, come prima: il pulsante «Entra in videocall» non compare.
- Da verificare al primo collaudo: comportamento su reti aziendali molto restrittive.

# Riferimenti nel codice

- Schermata agenda ed etichette: `src/components/admin-pynkstudio/pynk-agenda.tsx`
- Stanza videocall staff: `src/app/admin-pynkstudio/agenda/call/[bookingId]/page.tsx`, `src/components/admin-pynkstudio/pynk-agenda-call.tsx`
- Pagina videocall cliente e copy: `src/components/tenants/pynkstudio/pages/videocall.tsx`, `videocallPage` in `src/lib/pynkstudio-i18n.ts`
- Regole orari e hook: `src/lib/agenda-runtime.ts` — progetto e stato in [[agenda-videocall]]
