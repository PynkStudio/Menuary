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
