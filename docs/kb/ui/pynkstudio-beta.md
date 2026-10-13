---
title: "PynkStudio — Beta program"
module: "pynkstudio-beta"
roles: ["siteadmin"]
tags: ["ui", "admin-pynkstudio", "beta", "testflight", "google-play"]
route: "/admin-pynkstudio/beta"
source: "src/components/admin-pynkstudio/pynk-beta-manager.tsx, src/components/tenants/pynkstudio/pages/beta.tsx, src/lib/pynkstudio/beta*.ts, src/app/api/admin/pynkstudio/beta, src/app/api/pynkstudio/beta"
last_updated: "2026-10-13"
owner: ""
---

# A cosa serve la schermata

Il **Beta program** gestisce le beta delle app PynkStudio pubblicate su `pynkstudio.eu/beta`: quali app sono in beta, su quali dispositivi e con quale canale (TestFlight, Google Play, Firebase App Distribution, download diretto, web), chi si è iscritto come tester e chi ha chiesto l'accesso ai canali su invito.

Lato pubblico il tester si iscrive con **nome, cognome, telefono, email e dispositivi posseduti** (più, facoltativi, l'Apple ID e l'account Google se diversi dall'email). Non c'è password: entra con un link via email, che conferma anche l'indirizzo. Nell'area personale vede solo le beta compatibili con i suoi dispositivi, con filtri per categoria, lingua e tipo (app nuova / aggiornamento), e sceglie quali avvisi email ricevere.

# Come arrivarci

1. Apri `admin.pynkstudio.eu` con una sessione siteadmin.
2. Nel menu laterale premi **«Beta program»**.

# Elementi della schermata

- **Riquadri in alto**: Beta aperte, Tester iscritti (con quanti hanno confermato l'email), Richieste in attesa (cliccabile: apre le richieste), Avvisi attivi.
- **Schede**: **Beta**, **Feedback** (con il numero da gestire), **Partecipanti e richieste** (con il numero in attesa), **Tester**.
- **Beta**: tabella con app, stato, tipo, dispositivi, richieste approvate, tester avvisati, data di pubblicazione. Clic su una riga apre l'editor.
- **Editor beta**: nome, slug, frase breve, descrizione, stato (Bozza / Aperta / Posti esauriti / Chiusa), tipo, categoria, versione, lingue dell'app, icona, data di fine, feedback (link o email), **Canali per dispositivo** (dispositivo, metodo, link del gruppo facoltativo, link, link per installare facoltativo, nota per il tester) e la sezione **Avvisi email**.
- **Feedback**: filtri per beta, tipo e stato (predefinito «Da gestire» = Ricevuto + In lavorazione), tabella con tipo, testo, beta e dispositivo, tester, data e stato modificabile. Clic su una riga: testo completo, note interne, «Salva note», «Rispondi via email».
- **Partecipanti e richieste**: filtri per beta e stato, tabella con tester, beta, dispositivo, account da aggiungere, data, stato. Le partecipazioni alle beta senza approvazione compaiono qui già «Approvate»: vengono registrate quando il tester apre i link per unirsi o preme «Inviaci i tuoi feedback qui».
- **Tester**: ricerca, tabella con contatti, dispositivi, account Apple/Google, preferenze avvisi, data di iscrizione.

# Pulsanti e azioni

| Etichetta | Dove | Cosa fa |
|---|---|---|
| «Nuova beta» | In alto a destra | Apre l'editor vuoto |
| «Aggiungi canale» | Editor → Canali per dispositivo | Aggiunge un dispositivo con il metodo predefinito (TestFlight per Apple, Google Play test aperto per Android) |
| «Salva» | Editor, in basso | Salva. Passando da Bozza a un altro stato la beta viene pubblicata |
| «Elimina» | Editor, in basso | Chiede conferma; cancella anche richieste e storico avvisi |
| «Conta destinatari» | Editor → Avvisi email | Conta i tester che riceverebbero l'avviso (solo per beta «Aperta», senza modifiche non salvate) |
| «Invia a N tester» | Editor → Avvisi email | Invia l'email «nuova beta disponibile». Chi è già stato avvisato per questa beta non la riceve di nuovo |
| «Copia email account» | Richieste | Copia gli account (Apple ID / Google) delle richieste filtrate, da incollare nel Google Group o in TestFlight |
| «Approva» / «Rifiuta» | Richieste, su ogni riga | L'approvazione invia al tester l'email con il link e sblocca il link nella sua area |
| Menu stato | Feedback, su ogni riga | Ricevuto / In lavorazione / Risolto / Chiuso. Il tester vede lo stato nella sua area |
| «Salva note» | Feedback, riga aperta | Salva le note interne (non visibili al tester) |
| «Rispondi via email» | Feedback, riga aperta | Apre una mail al tester |
| «Copia email» | Tester | Copia le email dei tester filtrati |
| Cestino | Tester, su ogni riga | Elimina il tester (chiede conferma) |

# Metodi di accesso

- **TestFlight · link pubblico**: link `testflight.apple.com/join/…`, visibile subito agli iscritti con quel dispositivo Apple.
- **TestFlight · invito via email**: su richiesta; lo staff aggiunge l'Apple ID in App Store Connect, poi approva.
- **Google Play · test aperto**: link di opt-in `play.google.com/apps/testing/<package>`, visibile subito.
- **Google Play · test chiuso**: su richiesta; lo staff aggiunge l'account Google alla lista tester o al Google Group, poi approva.

Il **link per installare** è un secondo passo facoltativo: per Google Play è la scheda dello store (`play.google.com/store/apps/details?id=…`), da cui il tester installa dopo aver toccato «Diventa un tester». Nell'area tester compare come secondo bottone «Installa l'app» e nell'email di approvazione come «2 · Installa l'app».
- **Google Play · test chiuso con gruppo aperto**: nessuna approvazione. Il tester entra da solo nel Google Group (che deve consentire l'iscrizione libera), poi fa l'opt-in e installa. L'area mostra l'account Google da usare e tre bottoni numerati: «Entra nel gruppo tester», «Diventa tester su Google Play», «Installa l'app». È il metodo usato per Are You Stupid?! Android.
- **Firebase App Distribution**, **Download diretto**, **Versione web**, **Altro**: link visibile subito.

Il canale **Browser (web)** vale per tutti i tester, qualunque dispositivo abbiano.

# Feedback dei tester

Nell'area tester la scheda **«Feedback»** permette di scegliere la beta (solo quelle a cui il tester partecipa), il dispositivo (solo se ne ha più di uno collegato a quella beta), il tipo — Bug, Crash, Suggerimento, Usabilità, Prestazioni, Testi e traduzioni, Altro — e di scrivere il testo; la versione dell'app è precompilata. Sotto c'è l'elenco dei feedback inviati con lo stato. Ogni nuovo feedback manda una notifica push al pannello. Nei canali delle beta, accanto alla nota, c'è il link **«Inviaci i tuoi feedback qui»** che apre direttamente questa scheda.

# Chi riceve gli avvisi

Un tester riceve l'email di una beta se: ha confermato l'email, ha gli avvisi attivi, possiede almeno un dispositivo con un canale della beta, e la beta rientra nei suoi filtri (categorie, lingue, tipo — un filtro vuoto vale «tutto»). Ogni email contiene il link «Non voglio più avvisi sulle nuove beta».

# Note

- Le beta in **Bozza** non sono visibili sul sito; **Posti esauriti** resta visibile ma senza bottoni per unirsi; **Chiusa** sparisce dal sito.
- Senza profilo il visitatore vede le beta aperte ma non i link d'invito.
- Per Google Play la produzione richiede almeno 12 tester iscritti per 14 giorni di fila: usa la nota del canale per chiedere ai tester di restare iscritti e tenere l'app installata.

# Riferimenti nel codice

- Pagina admin: `src/app/admin-pynkstudio/beta/page.tsx`, `src/components/admin-pynkstudio/pynk-beta-manager.tsx`
- Pagina pubblica: `src/app/beta/page.tsx`, `src/components/tenants/pynkstudio/pages/beta.tsx`, copy in `src/lib/pynkstudio-i18n.ts` (`betaPage`)
- Tassonomia (dispositivi, metodi, categorie, lingue): `src/lib/pynkstudio/beta-shared.ts`
- Email e notifiche: `src/lib/pynkstudio/beta.ts`, `src/lib/pynkstudio/email-templates.ts`
- Tabelle: `pynkstudio_beta_testers`, `pynkstudio_betas`, `pynkstudio_beta_requests`, `pynkstudio_beta_notifications` (migration `20261011090000_pynkstudio_beta_manager.sql`), `pynkstudio_beta_feedback` (migration `20261013090000_pynkstudio_beta_feedback.sql`)
- API feedback e partecipazione: `src/app/api/pynkstudio/beta/feedback`, `src/app/api/pynkstudio/beta/join`, `src/app/api/admin/pynkstudio/beta/feedback/[id]`
