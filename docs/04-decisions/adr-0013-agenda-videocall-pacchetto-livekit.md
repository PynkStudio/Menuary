# ADR-0013: Agenda e videocall in un pacchetto esterno, video su LiveKit self-hosted

- **Stato:** accettata
- **Data:** 2026-09-30
- **Autore:** sessione IA + utente (chat)

## Contesto

La prenotazione delle call PynkStudio era codice interno al sito (`src/lib/pynkstudio/booking.ts`, rotte `bookings`, tabella `consultation_bookings`), con orari e fuso cablati e call solo telefoniche. L'utente ha chiesto un modulo agenda + videocall **separato, come `mailapp`**, usato dal sito come dipendenza e riusabile in altri progetti, con videocall su un sistema interno basato su **LiveKit**.

## Decisione

1. Nuovo pacchetto `@pynkstudio/agendaapp` in una repo propria (`PynkStudio/pynkstudio-agendaapp`), distribuito come tarball di un tag GitHub con `dist/` committato: stesso modello di `mailapp` e `newsletterapp`.
2. **Configurazione esplicita, niente globali**: `createAgendaServer(config)` riceve client DB, tipi di evento, segreto, LiveKit e hook. È il modello del "mailbox runtime" di `mailapp`, non quello a `configure…Runtime()` globale.
3. Il pacchetto possiede slot, prenotazioni, token, stanze; l'host possiede scope/tenant, autenticazione staff, notifiche, CRM, copy e stile. La UI del sito resta propria: il pacchetto offre un hook headless (`useAgendaBooking`) e un widget neutro solo per chi non ha una UI.
4. **LiveKit senza SDK server**: token e verifica webhook sono JWT HS256 firmati con `node:crypto`. La UI video usa `@livekit/components-react` come peer dependency opzionale.
5. Integrità in database: vincolo di esclusione `btree_gist` contro le sovrapposizioni, invece di controlli applicativi.
6. Link ospite derivato (HMAC), non salvato, così i promemoria lo possono ricostruire.
7. LiveKit **self-hosted** su un host con IP pubblico (compose in `deploy/livekit/` del pacchetto).

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Lasciare il codice nel sito | Nessun lavoro | Non riusabile; l'utente lo ha escluso |
| Cal.com / Calendly + Zoom/Meet | Pronto | Dati e UX fuori controllo, costi per utente, non "sistema interno" |
| LiveKit Cloud | Nessuna infrastruttura | Costo a minuto e dati su terzi; il pacchetto lo supporta comunque (basta cambiare `LIVEKIT_URL`/chiavi) |
| `livekit-server-sdk` | API ufficiale | Dipendenza pesante per due funzioni (firma e verifica JWT) |
| Runtime globale come `mailapp` Next | Coerenza con la parte vecchia di mailapp | Stato globale, difficile da usare in più host/scope; mailapp stesso è passato al modello esplicito |

## Conseguenze

- Ogni modifica al comportamento dell'agenda va fatta nella repo del pacchetto, con release taggata e aggiornamento della dipendenza qui.
- Il deploy richiede `AGENDA_SIGNING_SECRET`; la videocall richiede anche il server LiveKit e le env `LIVEKIT_*`. Senza LiveKit la call resta telefonica.
- `consultation_bookings` è deprecata: i dati sono copiati in `agenda_bookings` con gli stessi id.

## Riferimenti

- [[agenda-videocall]] — stato e bacheca
- [[integrazioni-attive]]
- `../pynkstudio-agendaapp/README.md`, `AGENTS.md`
