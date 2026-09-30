# ADR-0012: I claim delle landing sono legati a funzioni pronte

- **Stato:** accettata
- **Data:** 2026-09-30
- **Autore:** sessione IA + utente (chat)

## Contesto

Le sei landing verticali `menuary.it/ristoranti/*` ([[landing-verticali-ristoranti]]) sono destinazioni di campagne a pagamento. Il brief chiedeva di raccontare, tra le altre cose, funzioni che al 2026-09-30 non esistono nel codice: l'assistente WhatsApp del titolare (coperti, incasso, disponibilità), la chat IA sul menu al tavolo, le priorità di vendita, la bozza IA delle risposte alle recensioni e la modifica delle prenotazioni al telefono.

Il titolare ha chiesto di scrivere comunque tutte le pagine con tutti i claim, perché sono funzioni che vogliamo costruire. Pubblicarle come disponibili su pagine che ricevono traffico a pagamento da ristoratori sarebbe però pubblicità ingannevole verso clienti B2B.

Diverso il caso di HubRise e Google Business Profile: il codice esiste ma non è mai stato collegato in produzione. Su scelta del titolare sono dichiarati e verranno configurati e collaudati al primo cliente.

## Decisione

1. I testi di tutte e sei le landing sono scritti per intero in `landing-content.ts`.
2. Ogni frase che dipende da una funzione non ancora esistente porta `requires: <chiave>`. Le landing il cui problema centrale dipende da una funzione mancante (`self-order-ai`, `whatsapp`) dichiarano la chiave in `MENUARY_LANDINGS[].requires`.
3. `MENUARY_FEATURE_READY` in `src/lib/menuary-landings.ts` è l'unico interruttore. Una chiave passa a `true` solo quando la voce corrispondente della bacheca è ✅.
4. Finché una chiave è `false`: frasi, FAQ, JSON-LD, nodi dell'ecosistema e link collegati non vengono renderizzati; una landing dipendente risponde 404 in produzione e resta visibile (noindex) in locale e nelle preview Vercel.
5. Funzioni con codice ma senza uso in produzione (HubRise, Google, multilingua Retell) si dichiarano. Il loro collaudo è tracciato come voce della bacheca (C1–C3).

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Pubblicare tutto subito | Tutte e sei le campagne partono oggi | Promesse false a clienti paganti; rischio legale e reputazionale |
| Non scrivere le pagine delle funzioni mancanti | Nessun rischio | Lavoro da rifare quando le funzioni arrivano; nessuna anteprima da validare |
| **Testi completi dietro interruttore per funzione** | Pagine pronte e revisionabili in preview; si accendono con una riga; una sola fonte di verità legata alla bacheca | Serve disciplina: il flag va acceso solo con la funzione verificata |

## Conseguenze

- Quattro landing sono online da subito; `self-order-ai` e `whatsapp` si accendono con F2 e F1.
- Chi aggiunge un claim a una landing deve verificare la funzione nel codice, e se non esiste marcarlo con `requires`.
- Hub, footer, sitemap e sezione ecosistema leggono lo stesso registro: accendere un flag aggiorna tutti i link interni.

## Riferimenti

- [[landing-verticali-ristoranti]] — verifica funzioni (§ 3) e bacheca (§ 6)
- `src/lib/menuary-landings.ts`, `src/components/marketing/landings/landing-content.ts`
