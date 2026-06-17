# Handoff — Integrazione Retell + Checkout WhatsApp per Pizzeria Kimos

> Stato al passaggio di consegna. Obiettivo: demo per il cliente **Kimos** — chiamata al numero Retell → l'assistente prende l'ordine → messaggio WhatsApp con link checkout brandizzato → ordine visibile in gestione → (upsell, mancia, recensione).

Tenant: **kimos** (vertical `food`, status `trattativa`, nessun dominio custom → "demo").
Numero Retell: **+39 02 8127 9366** (`+390281279366`).
Supabase progetto attivo: **manuary.it** = `tagymkqywjlrqwduxvcw`.
Progetto Vercel: **menunary** (team `massimo-pernozzolis-projects`).

---

## 1. Stato richieste

| Richiesta | Stato |
|---|---|
| Webhook Retell + risoluzione tenant + firma | ✅ fatto + deployato (dall'utente) |
| Template WhatsApp a bottone (paga-online / paga-on-site) | ✅ creati + sottomessi a Meta — **in attesa approvazione** |
| Codice: invio link via template + URL tenant-aware + short-link | ✅ scritto, **non ancora deployato** |
| Invio messaggio sempre (qualsiasi metodo pagamento) | ✅ fatto |
| Checkout 100% tenant-aware (no classi BePork) | ✅ fatto, **non deployato** |
| Riepilogo esaustivo (aggiunte + rimozioni + note) | ✅ fatto, **non deployato** |
| **C** — Upsell che aggiorna l'ordine (anche se già pagato → 2ª transazione) | ⛔ DA FARE |
| **D** — Splash "ordine completato" con CTA mancia + recensione Google | ⛔ DA FARE |

---

## 2. File toccati in questa sessione (tutti NON committati salvo dove indicato)

**Retell / webhook**
- `src/app/api/webhooks/retell/route.ts` — risoluzione tenant interna per **tutti** gli eventi (call_inbound + call_ended/analyzed); iniezione `retell_webhook_secret` nelle dynamic variables (autentica i custom tool). *(la parte secret è già committata+deployata dall'utente; verificare che il resto sia incluso al prossimo deploy)*

**Link checkout / short-link / routing**
- `src/lib/orders/checkout-url.ts` — **NUOVO**: `tenantCheckoutUrl(tenantId, code, token)` vertical-aware (dominio custom → `<dominio>/checkout/...`; demo → `demo.menuary.it|demo.bizery.it|demo.weuseorpheo.com /<slug>/checkout/...`).
- `src/app/c/[token]/route.ts` — **NUOVO**: short-link `menuary.it/c/<token>` → risolve ordine da `public_token` → 302 al checkout tenant-aware. È il target dei bottoni CTA dei template.
- `src/app/[previewSlug]/checkout/[code]/page.tsx` — **NUOVO**: route checkout ordine in preview (es. `demo.menuary.it/kimos/checkout/<code>?t=<token>`). Gemella della root, tenant da slug. Avvolta nel tema tenant.
- `src/lib/orders/public-checkout.ts` — aggiunto `getOrderByPublicToken(token)`; la query ora legge anche `added_extras` + `removed_ingredients`; `PublicCheckoutOrder.lines` ha `addedExtras[]` e `removedIngredients[]`.

**Invio messaggi (moduli condivisi — modifiche ADDITIVE, retrocompatibili)**
- `src/lib/twilio/messages.ts` — aggiunto `sendTwilioTemplateMessage()` (Content API, `contentSid` + `contentVariables`, auth via API key).
- `src/lib/outbound/messages.ts` — `EnqueueOutboundMessageInput` ora accetta `contentSid?`, `contentVariables?`, `fromOverride?`. Se `contentSid` + canale whatsapp → invio template, altrimenti freeform (back-compat PynkStudio ecc.).
- `src/lib/payments/channel-payment-links.ts` — `createCheckoutPageLink` usa `tenantCheckoutUrl`; enqueue passa il template giusto (`TWILIO_WA_ORDER_ONSITE_SID` se on-site, `TWILIO_WA_ORDER_PAYMENT_SID` se online) + variabili `{1:nomeLocale, 2:codice, 3:token}`. *(NB: questo file è stato anche modificato dall'utente per la sandbox Stripe demo — non rovesciare quelle modifiche.)*

**Retell order**
- `src/lib/retell/inbound-orchestrator.ts` — `createRetellOrder`: rimosso il gate `paymentControls.enabled`; ora `canSendLink = Boolean(customerPhone)` → invio SEMPRE.

**Checkout UI (branding + riepilogo)**
- `src/app/checkout/[code]/checkout-client.tsx` — **riscritto**: palette `--tenant-*` via inline style, zero classi BePork; render di `addedExtras` (+ prezzo), `removedIngredients` ("Senza …"), note.
- `src/app/checkout/[code]/page.tsx` — avvolge `CheckoutClient` in `tenantThemeCssVars(tenant.theme)` + `data-tenant-surface`.

**Modifiche dell'utente (NON toccare, sono il supporto sandbox Stripe)**
- `src/lib/payments/stripe/config.ts` — `getStripeSecretKey`, `getDemoSandboxStripeAccount`, `isLikelyDemoTenant` (Kimos = demo perché status `trattativa`).
- `getTenantPaymentAccount(tenantId, {demoSandbox})` e `createCheckoutSession({demoSandbox})` supportano la sandbox.
- `src/app/api/checkout/[code]/session/route.ts` — usa `isDemoHostname(host)` → sandbox sui domini demo. **Il bottone "Paga" funziona già per Kimos sul dominio demo.**

---

## 3. Stato esterno (già applicato)

**Retell (via API)**
- Numero `+390281279366`: `inbound_webhook_url = https://menuary.it/api/webhooks/retell` (generico, nessun `?tenant_id`).
- Agente `agent_29fe02fd86f1c81e2f08ec1a9d` ("Pizzeria Kimos - Nora v2 flow"): `webhook_url = https://menuary.it/api/webhooks/retell` impostato sul **draft v1** → **da PUBBLICARE** per attivarlo in prod (serve solo per persistere call_ended/analyzed; la chiamata funziona comunque).
- Conversation flow `conversation_flow_9cd580c349bd` (v0 pubblicata = `prod`): tool `search_menu`/`create_order` → `https://demo.menuary.it/api/retell/inbound`, header `x-retell-secret: {{retell_webhook_secret}}`. OK.

**Twilio Content templates (account via API key)** — entrambi `received` (in approvazione Meta):
- `menuary_order_onsite_it_v1` = **HX96313027fbcad1b4bf601540ca195400** (bottone "Vedi riepilogo")
- `menuary_order_payment_it_v1` = **HX7215f475e717bd09fe48ac1501b55624** (bottone "Paga ora")
- Bottone URL: `https://menuary.it/c/{{3}}`; variabili `{1}`=nome locale, `{2}`=codice, `{3}`=token.
- Numero WA mittente: `whatsapp:+393483782051` (condiviso piattaforma). Verifica stato: `GET https://content.twilio.com/v1/Content/<SID>/ApprovalRequests`.

**Supabase (`tenant_ai_phone_settings` per kimos)**
- `phone_number = +390281279366`, `handoff_phone = 02 513404`, `enabled = true`
- `payment_controls = {enabled:true, defaultChannel:'whatsapp', fallbackChannel:null, ...}`

---

## 4. DA FARE prima della demo (azioni utente)

1. **Env Vercel** (Production + Preview), poi redeploy:
   - `TWILIO_WA_ORDER_ONSITE_SID=HX96313027fbcad1b4bf601540ca195400`
   - `TWILIO_WA_ORDER_PAYMENT_SID=HX7215f475e717bd09fe48ac1501b55624`
   - `STRIPE_DEMO_SANDBOX_SECRET_KEY=...` (chiave sandbox — confermare che sia impostata; serve a mancia/paga/2ª transazione)
   - Già presenti: `RETELL_API_KEY`, `RETELL_WEBHOOK_SECRET`, `TWILIO_*`, `OPENAI_API_KEY`.
2. **Commit + deploy** di tutti i file in §2. ⚠️ Deploya la route `/c/[token]` prima che Meta finisca la review (l'URL campione del bottone deve risolvere).
3. **Attendere approvazione** dei 2 template Meta (finché non `approved`, l'invio WA fallisce — è il vincolo Meta).
4. *(Opzionale)* **Pubblicare l'agente Retell** per persistere le trascrizioni.

---

## 5. DA COSTRUIRE — C e D (dettaglio per continuare)

### C — Upsell che aggiunge all'ordine
- L'upsell IA esiste (`src/lib/upselling-engine.ts`, OpenAI `gpt-5-mini`); `suggestUpsellsForOrder` ritorna oggetti con **`code` + `name` + `text`**. Attualmente `page.tsx` passa solo `string[]` (i `.text`) a `CheckoutClient`.
- **Da fare:**
  1. In entrambe le `page.tsx` checkout: passare i suggerimenti **strutturati** (`{code,name,text,price?}`) invece di soli `.text`.
  2. In `checkout-client.tsx`: bottone "Aggiungi" per ogni suggerimento → chiama l'API append.
  3. **Ordine non pagato**: usare `POST /api/checkout/[code]/append` (ESISTE: aggiunge righe, ricalcola totale, notifica; rifiuta se `paid`/`consegnato`/finestra 5min scaduta). Serve `CartLine[]` (vedi `cartLinesToDbRows` in `src/lib/api/orders.ts`).
  4. **Ordine già pagato**: NUOVA route `POST /api/checkout/[code]/append-paid` → inserisce le righe, aggiorna `orders.total`, e crea una **nuova Stripe Checkout Session** per il **solo delta** (sandbox demo: `createCheckoutSession({demoSandbox: isDemoHostname(host)})`), restituendo l'URL. L'ordine resta `paid` ma con una 2ª transazione registrata. Aggiornare il riepilogo dopo.
- Nota: l'append attuale rigenera il totale ma il `payment_status` per ordini pagati va gestito (transazioni separate).

### D — Splash "ordine completato" + mancia + recensione
- **Polling stato**: il client deve sapere quando l'ordine diventa `consegnato`/`completato`. Aggiungere `GET /api/checkout/[code]/status?t=<token>` (ritorna status/paymentStatus) e fare polling in `checkout-client.tsx` (es. ogni 15s), oppure riusare un endpoint esistente. Stato target: `order.status === "consegnato"` (enum esistente).
- **Splash**: quando completato, mostrare overlay "Ordine completato 🎉" con 2 CTA:
  1. **Lascia una mancia** → NUOVA route `POST /api/checkout/[code]/tip` con `{amount}` → `createCheckoutSession` standalone (sandbox demo) a importo volontario; UI con importi suggeriti (es. €1 / €2 / €5 + custom). È una transazione indipendente dall'ordine.
  2. **Recensisci su Google** → link già disponibile: `getTenantContent(tenantId).map.searchUrl` (Maps) oppure costruire write-review da `placeId` (vedi `src/lib/google/places.ts`, `src/lib/google/my-business-types.ts` → `placeId`). Per food usare il link recensione del tenant.
- Tutto tenant-aware (palette `--tenant-*`, già impostata nel wrapper).

---

## 6. Gotchas / note
- **Risoluzione tenant Retell**: per `to_number` serve `tenant_ai_phone_settings.phone_number` = numero Retell (fatto per kimos); fallback su `retell_agent_id`. Webhook generico per design (un solo URL per tutti i tenant).
- **Verifica firma Retell**: `checkSecret` in `inbound-orchestrator.ts` è CORRETTA (formato `v=ts,d=hex`, HMAC di `body+timestamp`). In prod richiede `RETELL_API_KEY`/`RETELL_WEBHOOK_SECRET` (set), altrimenti 401.
- **Hook linter "headers() async"**: falso positivo sulle route checkout — `headers()` è già awaited dentro `Promise.all`. Non modificare.
- **Moduli condivisi** (`outbound/messages`, `twilio/messages`, `channel-payment-links`): le modifiche sono additive; NON rompere PynkStudio/altri tenant (regola repo).
- **Sandbox Stripe**: attiva per host demo (`isDemoHostname`) e tenant demo (`isLikelyDemoTenant`: status trattativa/trial o senza dominio). Kimos rientra.
- Demo URL checkout: `https://demo.menuary.it/kimos/checkout/<codice>?t=<token>`.

---

## 7. Comandi utili
```bash
# Stato approvazione template (da repo, con .env.local):
set -a; source .env.local; set +a
curl -s -u "$TWILIO_API_KEY:$TWILIO_API_SECRET" \
  "https://content.twilio.com/v1/Content/HX96313027fbcad1b4bf601540ca195400/ApprovalRequests" | jq '.whatsapp.status'

# Retell: stato numero/agente (via MCP retell o SDK)
# Supabase MCP: progetto tagymkqywjlrqwduxvcw
```
