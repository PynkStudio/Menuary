# Servizio clienti tenant via WhatsApp

Modulo operativo per consentire agli admin del tenant di scrivere a Menuary via WhatsApp e modificare solo cio che e' gia gestibile dal pannello `gestione.[tenant]`.

## Endpoint

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

La response contiene `replies`, array di messaggi che il bridge WhatsApp deve inviare al numero scrivente.

## Bridge open-wa su Render

Il processo WhatsApp Web e' in `scripts/whatsapp-openwa-worker.mjs` e gira separato dalla app Next.

Comando locale:

```bash
WHATSAPP_API_BASE_URL=http://localhost:3000 \
WHATSAPP_WEB_BRIDGE_SECRET=dev-secret \
npm run whatsapp:worker
```

Su Render usa il Blueprint `render.yaml`, che crea un Background Worker Docker con disco persistente montato in `/var/data/openwa`. Il disco conserva la sessione open-wa, quindi dopo il primo QR scan non serve riautenticare ad ogni deploy.

Env Render richieste:

- `WHATSAPP_API_BASE_URL`: URL pubblico della app Next, es. `https://admin.menuary.it`.
- `WHATSAPP_WEB_BRIDGE_SECRET`: stesso valore configurato nella app Next.
- `TENANT_SUPPORT_WHATSAPP_SECRET`: opzionale, se il canale supporto usa un secret dedicato.
- `TENANT_SUPPORT_WEBHOOK_PATH`: default `/api/webhooks/whatsapp/tenant-support`.
- `WA_SESSION_ID`: default `menuary-tenant-support`.

Al primo avvio il worker stampa il QR nei log Render, salvo `OPENWA_QR_LOG_SKIP=true`.

Per un numero WhatsApp pubblico di un tenant, crea un worker open-wa dedicato con:

- `WHATSAPP_TENANT_ID`: id tenant, es. `bepork`.
- `WA_SESSION_ID`: id sessione stabile, es. `tenant-bepork`.
- `WHATSAPP_API_BASE_URL`: URL pubblico della app.
- `WHATSAPP_WEB_BRIDGE_SECRET`: stesso secret della app.

Quando `WHATSAPP_TENANT_ID` e' presente, il worker pubblica QR, heartbeat e stato su `/api/webhooks/whatsapp/session-status`. Il pannello `gestione/[tenant]/assistente-ai` mostra il QR da inquadrare e lo stato operativo della sessione. Il cron `/api/cron/whatsapp-session-health` invia alert automatici se la sessione non manda heartbeat.

Destinatari alert:

- `support@menuary.it` per vertical `food`.
- `support@bizery.it` per vertical `services`.
- email dei `tenantadmin` abilitati del tenant.

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
