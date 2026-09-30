# ADR-0011: Tracciamento conversioni condiviso, attivo solo con consenso

- **Stato:** accettata
- **Data:** 2026-09-29
- **Autore:** sessione IA + utente (chat)

## Contesto

Prima di avviare le campagne a pagamento per menuary.it la vetrina non misurava nulla: nessun GA4, nessun tag Google Ads, nessun pixel Meta, nessun parametro UTM salvato sui lead (`platform_leads.source` era sempre `menuary-marketing-site`). L'unico caso di tracciamento esistente era PynkStudio, con uno script GA4 incollato su tre pagine (`pynk-ga.tsx`) e caricato **senza consenso**.

L'utente ha chiesto che la soluzione valga per tutti i siti: i tre siti marketing (Menuary, Bizery, Orpheo) e i siti dei tenant.

## Decisione

Canali supportati: GA4, Google Ads, Meta Pixel e **OpenAI Ads** (Measurement Pixel `oaiq`, annunci in ChatGPT), quest'ultimo aggiunto il 2026-09-30 perché è il canale su cui partono le prime campagne Menuary.

Un unico **modulo tracking** montato nel root layout (`src/app/layout.tsx`) per ogni sito pubblico:

- `src/lib/tracking/types.ts` — tipi (`TrackingConfig`, conversioni standard `lead` / `booking` / `order` / `contact`, chiavi di attribuzione).
- `src/lib/tracking/config.ts` — `resolveTrackingConfig(mode, tenant)`: i siti marketing leggono gli ID dalle env `TRACKING_<BRAND>_*`, i tenant dal campo opzionale `TenantProfile.tracking` in `tenant-registry.ts`. Superfici non pubbliche (gestione, admin, cassa, preview) → `null`, nessun tracciamento.
- `src/lib/tracking/client.ts` — consenso (localStorage per sito), attribuzione (sessionStorage), `trackConversion()`.
- `src/components/modules/tracking/` — `TrackingProvider`, `ConsentBanner`, `ConsentPreferencesLink`.

Regole:

1. **Nessuno script di terze parti prima del consenso.** GA4, Google Ads e Meta Pixel vengono caricati solo dopo "Accetta". Se il sito non ha ID configurati il banner non compare.
2. **Attribuzione sempre raccolta, ma solo di prima parte.** UTM, `oppref` (ChatGPT), `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, referrer e pagina di atterraggio restano in sessionStorage e vengono inviati solo con una richiesta che il visitatore sceglie di mandare. Il lead li salva in `platform_leads.attribution` (jsonb).
3. **Nomi di conversione uguali ovunque**, così i report sono confrontabili tra siti. `trackConversion()` si chiama senza condizioni: senza config o senza consenso invia solo l'evento anonimo di Vercel Analytics.
4. **Identità visiva isolata.** Il banner ha struttura neutra; i colori vengono dai token `--consent-*` definiti nel CSS di ogni brand/tenant, con fallback sui token tema `--tenant-*`.
5. **Informative coerenti con la configurazione.** `marketing-legal-content.ts` e `policies.ts` descrivono i servizi di terze parti solo se configurati per quel sito.

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Google Tag Manager unico | Tag gestiti senza deploy | Un contenitore per sito da mantenere fuori dal codice; consenso e attribuzione vanno comunque scritti; più difficile garantire "nulla prima del consenso" |
| Consent Mode avanzato (tag sempre caricati, ping senza cookie) | Più conversioni modellate | Posizione del Garante incerta sui ping pre-consenso; scelto il caricamento solo dopo consenso |
| CMP esterna (Iubenda, Cookiebot) | Testi legali gestiti | Costo per dominio moltiplicato per ogni tenant; stile non allineabile all'identità di ciascun tenant |
| Script per singolo sito (come il vecchio `pynk-ga.tsx`) | Semplice | Duplicato per ogni sito, nessun consenso, nessuna attribuzione sui lead |

## Conseguenze

- Il pixel OpenAI riceve `oaiq("consent", true)` solo dopo "Accetta"; con la revoca riceve `oaiq("consent", false)`, che cancella i suoi cookie `__oppref` e `__obref`. Le navigazioni client-side inviano `page_viewed` a mano.
- Per attivare il tracciamento di un sito marketing basta valorizzare le env su Vercel (vedi [[integrazioni-attive]]). Per un tenant si aggiunge `tracking: { ga4Id, googleAdsId, googleAdsLabels, metaPixelId }` al suo profilo.
- I moduli che producono conversioni chiamano `trackConversion()`: form lead Menuary e Bizery (`lead`), link telefono/WhatsApp/email della vetrina (`contact`), `reservation-request-form` (`booking`), `/ordina/conferma` (`order`, una volta per ordine), form contatti e prenota-call di PynkStudio.
- `pynk-ga.tsx` è stato rimosso: GA4 di PynkStudio ora passa dal modulo, quindi **solo con consenso**. I dati GA4 di PynkStudio calano rispetto a prima (prima erano raccolti anche senza consenso, in modo non conforme).
- Il consenso è per sito (`mn_consent_v1:<siteKey>`): cambiare la struttura del consenso richiede di incrementare `CONSENT_VERSION` in `client.ts`, così il banner viene riproposto.
- **Da verificare con un consulente privacy**: la qualificazione dell'attribuzione in sessionStorage come trattamento di prima parte senza consenso preventivo (base giuridica indicata: legittimo interesse).

## Riferimenti

- [[moduli-piattaforma]] — sezione "Modulo tracking"
- [[integrazioni-attive]] — env `TRACKING_*`
- [[tracciamento-conversioni]] — scheda KB
- [[adr-0010-informativa-per-moduli-attivi]]
- Migration `supabase/migrations/20260929120000_lead_attribution_and_ai_per_call.sql`
