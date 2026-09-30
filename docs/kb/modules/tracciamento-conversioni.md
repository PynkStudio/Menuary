---
title: "Tracciamento conversioni e consenso cookie"
module: "tracking"
roles: ["tenant_admin"]
tags: ["google-ads", "meta", "analytics", "cookie", "privacy", "campagne"]
last_updated: "2026-09-29"
owner: "PynkStudio"
---

# Descrizione

Permette di misurare quante richieste, prenotazioni e ordini arrivano dalle campagne pubblicitarie (annunci in ChatGPT con OpenAI Ads, Google Ads, Meta) e da Google Analytics. Funziona allo stesso modo su tutti i siti della piattaforma. Nessun servizio di misurazione si attiva finché il visitatore non accetta i cookie nel banner.

# Funzionalità

- Banner cookie con "Accetta" e "Rifiuta" di pari peso, nello stile del sito.
- Link "Preferenze cookie" in fondo al sito per cambiare scelta.
- Registrazione automatica delle conversioni: richiesta di contatto, prenotazione inviata, ordine confermato, click su telefono/WhatsApp/email.
- Per i siti Menuary, Bizery e Orpheo: ogni richiesta commerciale salva da quale campagna o link è arrivato il visitatore.
- Informativa privacy e cookie aggiornate da sole in base ai servizi attivi.

# Permessi richiesti

- Oggi l'attivazione **non si fa dal pannello**: gli ID (GA4, Google Ads, Meta Pixel) li configura il team PynkStudio nel profilo del sito.
- Se il sito non ha ID configurati, il banner non compare e non viene caricato nessuno script di terze parti.

# Flussi operativi

1. Il cliente comunica al supporto gli ID dei suoi account (es. `G-…` per GA4, `AW-…` e le etichette di conversione per Google Ads, l'ID del pixel Meta, il Pixel ID di OpenAI Ads da Ads Manager › Conversions).
2. Il team li aggiunge al profilo del sito e pubblica.
3. Dal primo visitatore che accetta i cookie, le conversioni compaiono negli account del cliente.

# Limitazioni

- Chi rifiuta i cookie non viene misurato su OpenAI, Google e Meta: i numeri nei loro pannelli saranno più bassi delle richieste reali. Il conteggio completo resta nel pannello Menuary/Bizery.
- Le anteprime `demo.*` non tracciano mai nulla.
- Il cliente non può ancora inserire gli ID da solo nel pannello di gestione: serve una richiesta al supporto (vedi [[escalation-policy]]).

# FAQ correlate

- Perché Google Ads mostra meno conversioni delle richieste ricevute? Perché conta solo i visitatori che hanno accettato i cookie.

# Schermate UI correlate

- Nessuna schermata nel pannello di gestione per ora.
