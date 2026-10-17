---
title: "Posta — inbox admin e tenant"
module: "mail"
roles: ["siteadmin", "tenant_admin"]
tags: ["ui", "mail", "inbox", "gestione", "admin"]
route: "/admin/inbox, /gestione/[tenantSlug]/mail"
source: "src/app/admin/inbox/page.tsx, src/app/gestione/[tenantSlug]/mail/page.tsx, src/components/admin/inbox/mail-app.tsx, src/components/admin/inbox/email-list.tsx, src/components/admin/inbox/email-detail.tsx, src/components/admin/inbox/mail-sidebar.tsx, src/components/admin/inbox/tenant-mail-device-settings.tsx, src/lib/email/mail-device-filters.ts"
last_updated: "2026-10-17"
owner: ""
---

# A cosa serve la schermata

La schermata **Posta** permette di leggere, filtrare, rispondere, assegnare e organizzare le email ricevute dalla piattaforma o dal tenant.

# Come arrivarci

## Admin piattaforma

1. Apri `admin.menuary.it`.
2. Nel menu laterale premi **Posta in arrivo**.
3. La route e' `/admin/inbox`.

## Gestione tenant

1. Apri il pannello **Gestione** del tenant.
2. Nel menu laterale premi **Mail**.
3. La route e' `/gestione/[tenantSlug]/mail`.

La voce **Mail** nel pannello Gestione e' visibile solo quando il tenant ha accesso al modulo mail e l'utente ha i permessi necessari.

# Elementi della schermata

- Sidebar con le viste **Arrivo**, **Non lette**, **Le mie**, **Inviata**, **Stellate**, **Spam**, **Archivio**. In modalita' tenant **Le mie** compare solo se sul dispositivo corrente e' stato configurato un filtro (vedi "Filtro per dispositivo" piu' sotto); di default e' nascosta.
- Filtri brand nella inbox globale: **Tutte**, **PynkStudio**, **Menuary**, **Bizery**, **Orpheo**, **Supporto**.
- Lista conversazioni: le email inbound sono raggruppate in thread. Ogni riga mostra mittente, oggetto, anteprima, data, eventuale badge con numero messaggi e badge allegati.
- Dettaglio thread: mostra tutti i messaggi della conversazione in ordine cronologico, **sia ricevuti sia inviati** (dal pacchetto 0.5.2). I messaggi inviati sono spostati a destra, con icona di invio e lo stato di consegna (**Inviata**, **Consegnata**, **Rimbalzata**…); quelli ricevuti a sinistra. Il contatore nell'header indica quanti messaggi del thread sono inviati. La pagina non ha titolo/sottotitolo sopra la mail app, cosi' il reader usa quasi tutta l'altezza disponibile.
- Anche aprendo una mail dalla vista **Inviata** si vede l'intera conversazione, risposte ricevute comprese.
- Immagini nel corpo (loghi in firma, screenshot incollati): restano dove le ha messe il mittente e **non** compaiono tra gli allegati.
- Allegati: in fondo a ogni messaggio, griglia di schede con miniatura (immagini) o icona e estensione, nome, peso, pulsanti apri/scarica. Cliccando una scheda si apre sotto l'anteprima completa (immagini, PDF, testo/JSON); ricliccando si chiude.
- Controlli extra in admin piattaforma: assegnazione e lead sono pulsanti compatti nell'header del messaggio, non pannelli permanenti. L'assegnazione mostra il nome della persona; nel dropdown usa l'indirizzo aziendale derivato dal brand della mail, non l'email privata di login.

# Pulsanti e azioni

| Etichetta UI | Cosa fa | Dove si trova |
|---|---|---|
| **Scrivi** | Apre il drawer di composizione email. | Sidebar desktop o pulsante mobile in basso a destra. |
| **Arrivo** | Mostra la posta in arrivo non archiviata e non spam. | Sidebar / filtri mobile. |
| **Non lette** | Mostra solo le email in arrivo non ancora lette. | Sidebar / filtri mobile. |
| **Le mie** | Admin piattaforma: mostra le email assegnate all'utente siteadmin corrente. Tenant: mostra solo le email per le local-part assegnate a questo dispositivo (visibile solo se configurato, vedi "Questo dispositivo"). | Sidebar. |
| **Questo dispositivo** | Apre il pannello di impostazioni del dispositivo corrente: attivazione notifiche push e filtro local-part. | Fondo sidebar desktop (tenant) o icona ingranaggio nella toolbar mobile. |
| **Inviata** | Mostra le email inviate. | Sidebar / filtri mobile. |
| **Stellate** | Mostra le email contrassegnate con stella. | Sidebar / filtri mobile. |
| **Spam** | Mostra le email segnate come spam. | Sidebar / filtri mobile. |
| **Archivio** | Mostra le email archiviate. | Sidebar / filtri mobile. |
| **Aggiorna** | Ricarica la lista corrente. | Toolbar sopra la lista. |
| **Indietro** | Chiude il dettaglio email e torna alla lista. | Toolbar dettaglio. |
| **Non letta** | Segna il messaggio selezionato come non letto. | Toolbar dettaglio. |
| Icona stella | Aggiunge o rimuove la stella. | Toolbar dettaglio. |
| Icona risposta | Apre la composizione precompilata per rispondere. | Toolbar dettaglio. |
| Icona scudo (arancione) | Segna l'email come spam e blocca il mittente: le prossime email di quel mittente finiscono automaticamente nello spam. Chiede conferma. | Toolbar dettaglio. |
| Icona scudo con spunta (verde) | Toglie lo stato spam e sblocca il mittente. Visibile solo su email gia' spam. | Toolbar dettaglio. |
| Icona archivio | Archivia l'email selezionata. | Toolbar dettaglio. |
| Icona cestino | Elimina definitivamente l'email selezionata dopo conferma. | Toolbar dettaglio. |
| **Assegna** / nome persona | Assegna la mail a un siteadmin o cambia assegnazione. | Pulsante compatto nell'header del dettaglio, solo admin piattaforma. |
| **Lead** / nome lead | Collega la mail a un lead o cambia lead collegato. | Pulsante compatto nell'header del dettaglio, solo admin piattaforma. |
| **Rimuovi** | Rimuove l'assegnazione corrente. | Dropdown del pulsante assegnazione. |
| **Scollega** | Rimuove il lead collegato. | Dropdown del pulsante lead. |
| Scheda allegato (miniatura) | Mostra/nasconde l'anteprima completa sotto la griglia. | Griglia allegati in fondo al messaggio. |
| Icona apri allegato | Apre l'allegato in una nuova scheda/finestra. | Scheda allegato. |
| Icona scarica allegato | Scarica l'allegato quando il contenuto e' disponibile. | Scheda allegato. |

# Campi e filtri

| Campo/filtro | Valori | Note |
|---|---|---|
| Vista cassetta | **Arrivo**, **Non lette**, **Le mie**, **Inviata**, **Stellate**, **Spam**, **Archivio** | **Le mie** lato tenant compare solo con un filtro dispositivo configurato. |
| Brand | **Tutte**, **PynkStudio**, **Menuary**, **Bizery**, **Orpheo**, **Supporto** | Solo admin piattaforma. |
| Cerca per nome o email | Testo libero | Presente nei pannelli di collegamento lead. |

# Notifiche push

## Admin piattaforma

- Quando una mail viene assegnata (automaticamente dal webhook o manualmente dal pulsante **Assegna**) al siteadmin destinatario arriva una notifica push, se ha attivato le notifiche dal pulsante in fondo alla sidebar admin ("Attiva notifiche admin").

## Gestione tenant

- Nessun sistema di account: per default **ogni dispositivo del tenant che ha attivato le notifiche riceve la push per ogni mail in arrivo** (broadcast a tutto il tenant).
- Dal pannello **Questo dispositivo** (icona ingranaggio, fondo sidebar desktop o toolbar mobile) si attivano le notifiche push per il dispositivo corrente.
- Nello stesso pannello, un **filtro avanzato opzionale** permette di assegnare al dispositivo una o piu' local-part (es. "fatturazione, prenotazioni"): da quel momento il dispositivo riceve la push solo per le mail dirette a quelle local-part, e nella sidebar compare la vista **Le mie** filtrata allo stesso modo. Rimuovendo il filtro il dispositivo torna a ricevere tutto.
- E' un'identita' per dispositivo (browser), non un account: se si cancellano i dati del browser o si cambia dispositivo, il filtro va riconfigurato. Un sistema con account/profili veri (come quello dell'admin piattaforma) e' un TODO futuro.

## Comune

- Su iPhone la notifica arriva anche ad app chiusa solo se il portale e' stato aggiunto alla schermata Home (iOS 16.4+) e il permesso e' stato concesso dall'interno della web app installata.
- Infrastruttura riusabile per altre notifiche (admin e tenant): vedi [[integrazioni-attive]] sezione "Web Push (VAPID)".

# Gestione spam

- Segnando spam da admin piattaforma il blocco del mittente e' globale; segnando spam dal pannello Gestione di un tenant il blocco vale solo per le email di quel tenant (tabella `email_spam_senders`).
- Il webhook inbound controlla la blocklist: le email di mittenti bloccati arrivano gia' con flag spam, senza auto-assegnazione e senza creare ticket di supporto.
- Le email spam non compaiono in **Arrivo** e non contano nei badge non lette; restano visibili nella vista **Spam**.
- "Non e' spam" ripristina l'email in Arrivo e rimuove il mittente dalla blocklist (nello stesso scope).

# Stati possibili

- Thread non letto: la riga mostra indicatore laterale e data in evidenza.
- Thread con piu' messaggi: la riga mostra il badge con il numero messaggi.
- Thread con allegati: la riga mostra il badge allegati, che conta solo gli allegati veri (non i loghi in firma).
- Allegato con anteprima: immagini, PDF e testo/JSON si aprono cliccando la scheda.
- Allegato senza anteprima: la scheda mostra icona ed estensione; si apre o si scarica con i pulsanti.
- Vista **Inviata** vuota: fino al pacchetto 0.5.1 la rotta di invio non registrava le email inviate (insert mai eseguita), quindi le email partite prima dell'aggiornamento non compaiono. Le email venivano comunque consegnate: lo stato reale si vede nei log di Resend.

# Procedure correlate

- [[gestione-navigazione]]
- [[integrazioni-attive]]

# Riferimenti nel codice (manutenzione)

La UI e le query sono nel pacchetto esterno `@pynkstudio/mailapp` (repo `PynkStudio/pynkstudio-mailapp`), non in questa repo.

- Route admin piattaforma: `src/app/admin/inbox/page.tsx`, `src/app/admin-pynkstudio/mailapp/page.tsx`
- Route tenant: `src/app/gestione/[tenantSlug]/mail/page.tsx`
- Rotta invio: `src/app/api/email/send/route.ts` (riesporta `@pynkstudio/mailapp/next/routes/send`)
- Nel pacchetto: `src/components/mail-app.tsx` (shell e caricamento conversazione), `email-detail.tsx` (thread e allegati), `sent-detail.tsx`, `src/email/conversation.ts` e `conversation-queries.ts` (thread misto), `src/email/inline-attachments.ts` (immagini nel corpo)
- Filtri mail per dispositivo, push: vedi [[integrazioni-attive]]
