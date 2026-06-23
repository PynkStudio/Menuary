# Endpoint e funzioni IA

> Fonte: route in `src/app/api/`, env `OPENAI_*` / `RETELL_*`, memoria di progetto. **Dedotto dal codice.** I prompt testuali effettivi non sono stati copiati qui: vanno letti dai file sorgente / dalla configurazione dell'agente.

## Assistente telefonica — Retell

- Endpoint inbound: `src/app/api/retell/inbound/route.ts`
- Webhook: `src/app/api/webhooks/retell/route.ts`
- Lib: `src/lib/retell/`
- Env: `RETELL_API_KEY`, `RETELL_WEBHOOK_SECRET`
- Migration correlate: `20260531_retell_ai_phone_module.sql`, `20260601_tenant_ai_phone_settings.sql`

> Nota da memoria di progetto: i flow Retell pubblicati **non sono editabili via API**. Il webhook risolve il tenant e inietta `retell_webhook_secret` nelle dynamic variables. **Da verificare** lo stato attuale rispetto a `handoff.md` (sessione tenant Kimos).

## Funzioni IA — OpenAI

Route sotto `src/app/api/ai/`:

- `ai/assistant` — assistente
- `ai/menu-suggest` — suggerimenti menu
- `ai/menu-item` — generazione/arricchimento voce menu
- `ai/menu-photo-import` — import menu da foto

Env: `OPENAI_API_KEY`, `OPENAI_MENU_ITEM_AI_MODEL`, `OPENAI_WHATSAPP_MODEL`, `OPENAI_WHATSAPP_LEAD_MODEL`.

> In `ARCHITECTURE.md` alcune di queste sono indicate come stub. **Da verificare** quali siano pienamente operative.

## Qualificazione lead WhatsApp IA

- `src/lib/platform-whatsapp-lead-service.ts`
- Migration: `20260614025550_platform_whatsapp_lead_qualification.sql`
- Env: `OPENAI_WHATSAPP_LEAD_MODEL`

## Dove inserire i prompt

Quando documenti un prompt concreto (system prompt, begin message, tool definitions), incollalo qui in un file dedicato indicando: agente/endpoint di riferimento, modello, e data. Non duplicare segreti.

## Da confermare

- Testo effettivo dei prompt di sistema (Retell e OpenAI): leggere dai sorgenti / dashboard.
- Modelli realmente configurati negli ambienti.

## Collegamenti

- [[integrazioni-attive]]
