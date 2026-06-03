# WhatsApp tenant via Twilio

Modulo operativo WhatsApp basato solo su Twilio. Lo stesso sender WhatsApp Twilio riceve messaggi per Menuary/Bizery, demo tenant e assistenti pubblici tenant, e invia outbound con contesto tenant nel testo.

## Endpoint supporto tenant

`POST /api/webhooks/whatsapp/tenant-support`

Header accettati:

- `x-tenant-support-whatsapp-secret: <secret>`
- fallback: `x-whatsapp-web-secret: <secret>`

Env:

- `TENANT_SUPPORT_WHATSAPP_SECRET`, dedicato al canale operativo.
- In assenza, viene riusato `WHATSAPP_WEB_BRIDGE_SECRET`.
- `SUPABASE_SERVICE_ROLE_KEY`, necessario per leggere/scrivere le tabelle operative.

Payload minimo:

```json
{
  "from": "+393331234567",
  "text": "sospendi nuovi ordini per oggi",
  "messageId": "wamid..."
}
```

La response contiene `replies`, array di messaggi. Nel flusso supportato la chiamata arriva dal webhook Twilio `mode=tenant-support`, che trasforma le replies in TwiML.

## Twilio WhatsApp

Endpoint Twilio ufficiale:

`POST /api/webhooks/twilio/whatsapp`

Modalita supportate:

- `mode=platform`: router centrale per i canali commerciali Menuary/Bizery e demo tenant.
- `mode=customer`: inoltra il messaggio all'assistente WhatsApp pubblico del tenant tramite `/api/whatsapp/inbound`.
- `mode=tenant-support`: inoltra il messaggio al supporto operativo tenant tramite `handleTenantSupportWhatsappMessage`.

Env richieste per inviare messaggi e media:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_API_KEY`
- `TWILIO_API_SECRET`
- `TWILIO_WHATSAPP_FROM`, nel formato `whatsapp:+393513768607`

Protezione webhook:

- consigliato: `TWILIO_WEBHOOK_AUTH_TOKEN` per validare `X-Twilio-Signature`.
- alternativa senza Auth Token: `TWILIO_WEBHOOK_SECRET`, da aggiungere al callback URL come query param `secret`.
- opzionale: `TWILIO_WEBHOOK_URL` se il proxy/deploy cambia host o protocollo rispetto all'URL configurato in Twilio.

Callback URL centrale consigliato per il numero condiviso:

```text
https://<app-domain>/api/webhooks/twilio/whatsapp?mode=platform&secret=<TWILIO_WEBHOOK_SECRET>
```

Per produzione:

```text
https://menuary.it/api/webhooks/twilio/whatsapp?mode=platform&secret=<TWILIO_WEBHOOK_SECRET>
```

Il router centrale:

- tratta messaggi con `[menuary]` o senza tag come canale commerciale Menuary.
- tratta messaggi con `[bizery]` o parole chiave services come canale commerciale Bizery.
- inoltra alle demo tenant quando il messaggio inizia con `demo <tenant-id>` o `tenant <tenant-id>`, per esempio `demo kimos, buonasera vorrei ordinare una margherita`.
- Restano compatibili anche `demo:<tenant-id>` e `tenant:<tenant-id>`.
- Il prefisso di routing viene rimosso prima di inoltrare il testo all'assistente tenant.

Callback URL per forzare un assistente tenant specifico:

```text
https://<app-domain>/api/webhooks/twilio/whatsapp?mode=customer&tenant_id=<tenant-id>&secret=<TWILIO_WEBHOOK_SECRET>
```

Webhook centralizzato Menuary/Bizery su produzione:

```text
https://menuary.it/api/webhooks/twilio/whatsapp?mode=platform&secret=<TWILIO_WEBHOOK_SECRET>
```

Callback URL per supporto operativo tenant:

```text
https://<app-domain>/api/webhooks/twilio/whatsapp?mode=tenant-support&secret=<TWILIO_WEBHOOK_SECRET>
```

I messaggi outbound WhatsApp passano sempre dal sender Twilio condiviso Menuary/Bizery. `outbound_text_messages` resta la tabella di audit/correlazione, ma non esiste piu un worker OpenWA che polla la coda. Il sender Twilio condiviso aggiunge sempre contesto tenant nel body inviato:

```text
Da <tenant_name> tramite <Menuary|Bizery>:
```

Nel record `outbound_text_messages.metadata`:

- `delivery_route: "twilio_whatsapp_shared"` indica invio WhatsApp dal sender Twilio condiviso.
- `sender: "menuary_twilio_whatsapp"` identifica il sender condiviso.
- `twilio` contiene SID/status restituiti da Twilio o l'errore di invio.

## Numeri autorizzati

I numeri autorizzati sono:

- `tenantadmin`, abilitati di default quando li registriamo noi da `admin.menuary.it`.
- `employee`, mai abilitati automaticamente: possono usare il canale solo se un superadmin li autorizza uno per uno.

Di default, quando creiamo un tenant da `admin.menuary.it`, salviamo il numero WhatsApp admin operativo in `tenant_customer_service_contacts` con `contact_kind = 'tenantadmin'`.

Il numero pubblico della sede non abilita automaticamente l'accesso operativo: serve il campo admin/owner dedicato.

Gli employee autorizzati hanno permessi granulari in `tenant_customer_service_contacts.permissions`:

- `manageMenu`: puo modificare menu/piatti quando l'action handler sara disponibile.
- `manageSettings`: puo gestire impostazioni operative, inclusa sospensione/riattivazione ordini.
- `manageHours`: puo gestire orari quando l'action handler sara disponibile.
- `createSupportTickets`: puo aprire ticket via WhatsApp.

Se un employee non ha il permesso richiesto, il webhook registra l'azione come `rejected` e non esegue nulla.

## Riconoscimento tenant

Se un numero admin e' associato a un solo tenant, la conversazione parte direttamente su quel tenant.

Se un numero admin e' associato a piu tenant, il webhook risponde con una richiesta di scelta:

```text
Questo numero e associato a piu locali. Per quale locale vuoi parlare?
1. BePork (bepork)
2. Altro Locale (altro-locale)
```

L'utente puo rispondere con numero, slug o nome.

## Azioni automatiche gia abilitate

- `sospendi nuovi ordini per oggi`: aggiorna `tenant_ai_phone_settings.quick_settings.acceptNewOrders` fino a fine giornata. La stessa impostazione viene usata da WhatsApp AI e chiamate IA, quindi blocca entrambi i canali.
- `riattiva ordini`: riapre nuovi ordini su WhatsApp AI e chiamate IA.
- `apri ticket ...`: crea un record in `support_tickets`.

Le richieste non capite o non ancora automatizzate propongono l'apertura di un ticket. Se l'utente risponde `si`, `ok`, `confermo` o simili, il ticket viene creato.

## Guardrail

Il webhook non esegue azioni distruttive o non presenti nel gestionale. Richieste come cancellare tenant, ristorante o menu intero vengono respinte e possono solo diventare ticket di assistenza manuale.

Ogni richiesta viene tracciata in:

- `tenant_customer_service_messages`
- `tenant_customer_service_actions`
- `support_tickets`, quando serve intervento umano

## Estensioni prossime

- Collegare un parser IA via secret server-side per tradurre richieste libere in azioni strutturate.
- Aggiungere action handler per modifica menu, disponibilita piatti, orari e impostazioni gia esposte dal pannello gestione.
- Creare la vista `admin.menuary.it` per `support_tickets`.
