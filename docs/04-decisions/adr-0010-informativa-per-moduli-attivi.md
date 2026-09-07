# ADR-0010: L'informativa segue i moduli attivi del tenant

- **Stato:** accettata
- **Data:** 2026-09-07
- **Autore:** Massimo Pernozzoli (con Claude)

## Contesto

`src/lib/legal/policies.ts` genera privacy e cookie policy per **tutti** i tenant della
piattaforma. Il modulo è nato quando i tenant erano solo HORECA, e quel contesto era
cablato nel testo: menu, preferiti, carrello e sessioni di ordine comparivano nel documento
di chiunque, a prescindere dai moduli accesi.

Su `valentina-orciuoli` — sito d'autrice senza menu, senza carrello e senza ordini — la
cookie policy arrivava a dire testualmente:

> «La cancellazione può rimuovere carrello, preferiti e sessioni di ordine salvate sul
> dispositivo.»

Nessuna delle tre cose esiste su quel sito. Un'informativa che descrive trattamenti
inesistenti è sbagliata esattamente quanto una che ne omette: entrambe smettono di
descrivere il sito che accompagnano.

Nella direzione opposta mancavano le sezioni dei moduli che quel tenant **ha davvero**:
newsletter (con doppio opt-in), commenti agli articoli, statistiche di visita.

## Decisione

`PolicyModuleFlags` accetta due campi opzionali in più:

- `modules` — la mappa dei moduli davvero accesi per il tenant (`useEffectiveFeatures()`);
- `localeCookie` — vero quando il sito pubblica più di una lingua e ricorda quella scelta.

`hasModule()` legge la mappa quando c'è; quando manca vale il comportamento storico (sito
HORECA completo), così un eventuale chiamante che non conosce i moduli non regredisce.

Da lì derivano, in entrambi i documenti:

| Riga / sezione | Compare quando |
|---|---|
| preferiti e contenuti del menu salvati sul dispositivo | `favorites` (formula col menu solo se `onlineMenu`) |
| carrello e sessioni d'ordine | `takeaway` / `tableOrders` / `shop` |
| lingua scelta ricordata sul dispositivo | il tenant pubblica più lingue |
| dati di prenotazione o appuntamento | `reservations` / `creativeBooking` |
| sezione «Newsletter» (consenso, doppio opt-in, revoca) | `fanbaseCommunity` / `crm` |
| sezione «Commenti agli articoli» (moderazione) | `blog` |
| sezione «Statistiche di visita» (aggregate, senza cookie) | `analytics` |
| «orari personalizzati dal titolare» fra le impostazioni pubbliche | `onlineMenu` |

L'ultima riga della cookie policy («cosa si perde svuotando i dati del sito») è ora
composta dall'elenco reale di ciò che è stato salvato. Quando non c'è nulla di personale sul
dispositivo, lo dice invece di elencare oggetti inesistenti.

Il modulo di contatto è sempre citato fra le finalità: ogni sito della piattaforma ne
pubblica uno o espone un recapito.

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Un testo legale per verticale | più leggibile da scrivere | tre copie che divergono; i moduli non seguono il verticale |
| Informativa scritta a mano per tenant | massima aderenza | esce dal codice, invecchia al primo modulo acceso |
| Passare singoli flag booleani nominati | firma esplicita | ogni modulo nuovo cambia la firma pubblica del modulo condiviso |

## Conseguenze

- Retrocompatibile: senza `modules` il documento è identico a prima. L'unico chiamante,
  `DynamicPolicyDocument`, ora la passa sempre — quindi **tutti** i tenant vedono
  l'informativa filtrata sui propri moduli. Per i tenant food completi il testo non cambia.
- Accendere o spegnere un modulo dal pannello cambia l'informativa senza toccare il codice.
- **Da verificare con il legale**: i testi delle tre sezioni nuove (newsletter, commenti,
  statistiche) descrivono il comportamento del codice, non sono stati rivisti da un legale.

## Riferimenti

- `src/lib/legal/policies.ts`, `src/components/legal/dynamic-policy-document.tsx`
- [[adr-0009-valentina-opere-per-collana]] — il tenant da cui è emerso il difetto
- [[moduli-piattaforma]]
