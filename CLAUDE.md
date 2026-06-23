# Menuary — Regole per IA

Questo file governa il comportamento delle IA (Claude e simili) che lavorano su questa repo. Leggilo per intero prima di toccare qualsiasi file.

---

## Cos'è questa piattaforma

**Menuary** è la piattaforma multi-tenant e multi-verticale. Si divide in due rami:

- **Menuary** (verticale `food`) — serve esclusivamente attività HORECA: ristoranti, bar, pizzerie, trattorie, ecc.
- **Bizery** (verticale `services`) — serve attività non-HORECA: officine, studi, saloni, centri benessere, ecc. È un sotto-brand di Menuary con dominio e identità propri.

**BePork** è uno dei tenant sulla piattaforma (il tenant demo/produzione principale), non è la piattaforma stessa.

Ogni **tenant** è un'attività reale ospitata su Menuary o Bizery, con la propria identità visiva e i propri moduli attivi.

```
src/
  app/
    [previewSlug]/      ← preview universale tenant
    bizery/             ← pagine marketing verticale Bizery (services)
    (route Menuary/food ← homepage, menu, prenotazioni del verticale food)
  components/
    tenants/
      _shared/          ← componenti UI condivisi TRA tenant (solo se esplicitamente autorizzati)
      bepork/           ← componenti UI esclusivi del tenant BePork
      (nuovo-tenant)/   ← componenti UI esclusivi del nuovo tenant
    modules/            ← moduli logici riutilizzabili (menu, prenotazioni, galleria…)
    bizery/             ← componenti UI del verticale Bizery (marketing/sito)
    vertical-b/         ← alias legacy verticale services
  lib/
    tenant-registry.ts  ← profili e feature-flag per ogni tenant
    tenant-content.ts   ← contenuti (testi, immagini, social) per ogni tenant
    vertical.ts         ← registry dei verticali e loro metadati
    tenant-modules.ts   ← definizione dei moduli disponibili
    tenant.ts           ← tipi core (TenantProfile, TenantFeatureFlags, …)
  styles/
    tenants/
      bepork.css        ← token/variabili CSS del tenant BePork
      bizery.css        ← token/variabili CSS di bizery
      faak.css          ← token/variabili CSS di faak
      (nuovo-tenant).css
```

---

## Regola fondamentale: isolamento visivo dei tenant

**Ogni tenant ha una propria identità visiva completamente indipendente.**

- Non copiare mai colori, font, classi CSS, token o componenti UI da un tenant all'altro.
- Quando aggiungi un nuovo tenant, crei da zero i suoi componenti in `src/components/tenants/(slug)/` e il suo foglio di stile in `src/styles/tenants/(slug).css`.
- Il foglio `src/styles/tenants/(slug).css` deve includere sempre anche il tema del pannello `gestione` del tenant (`.gestione-admin[data-gestione-tenant="(slug)"]`): colori, font, superfici, bordi, form, bottoni, tabelle, card, tab, stati vuoti/errore/successo e ogni altro campo UI.
- Il CSS gestione va scritto per **tutti** i moduli della piattaforma, non solo per quelli attivi nel feature set iniziale del tenant. Moduli oggi disattivi devono avere gia' uno stile coerente, cosi' possono essere abilitati in qualsiasi momento senza toccare il CSS del tenant.
- Non importare mai da `src/components/tenants/bepork/` o da qualsiasi altra cartella tenant per usarla in un tenant diverso. BePork è un tenant come gli altri, non è un "base template".
- La cartella `_shared/` in `src/components/tenants/_shared/` contiene solo elementi che il proprietario ha esplicitamente autorizzato a condividere tra più tenant. Non aggiungere nulla lì senza autorizzazione esplicita.

---

## Regola fondamentale: siti tenant predisposti per il multilingua

**Ogni nuovo sito tenant va predisposto fin dall'inizio per essere multilingua**, anche quando al primo rilascio viene pubblicata una sola lingua.

Usa l'impostazione tecnica di **Doca** come riferimento per massimizzare la SEO, senza copiarne UI, contenuti o stile:

- registra le lingue del tenant e la lingua predefinita in `src/lib/tenant-locales.ts`;
- crea i copy tenant-specifici in `src/lib/(slug)-i18n.ts` usando `createTenantI18n()` da `src/lib/tenant-i18n.tsx`;
- usa URL indicizzabili con prefisso lingua (`/it`, `/en`, ecc.) anche sul dominio custom e nelle preview;
- preserva la lingua nei link interni con `useTenantLocalizedHref()`;
- esponi un selettore lingua tenant-specifico quando sono pubblicate almeno due lingue;
- verifica redirect/rewrite del middleware, cookie lingua per tenant e aggiornamento dell'attributo `lang` del documento;
- genera per ogni pagina pubblica canonical self-referencing, alternates `hreflang` completi con `x-default` e URL localizzati nella sitemap;
- localizza anche metadata SEO e contenuti della pagina: non pubblicare URL tradotti con contenuti placeholder o rimasti nella lingua predefinita;
- mantieni le preview `noindex`: devono servire per validare il sito, non competere con il dominio pubblico.

Il pattern Doca è un riferimento per l'infrastruttura i18n e SEO condivisa. Restano valide tutte le regole di isolamento visivo: componenti, selettore, copy e stile del nuovo tenant devono essere propri.

---

## Regola sui moduli logici

I **moduli** in `src/components/modules/` e `src/lib/` sono l'unica cosa che va riusata tra tenant.

- Includono: menu/listino, prenotazioni/appuntamenti, galleria, recensioni, ordini, preferiti, ecc.
- Vanno collegati al tenant tramite i feature-flag in `tenant-registry.ts` — non vanno copiati.
- **Non modificare mai un modulo senza autorizzazione esplicita dell'utente.**
- Qualsiasi modifica a un modulo deve continuare a funzionare correttamente per *tutti* i tenant che lo usano. Non è accettabile una modifica che funziona per un tenant e rompe un altro.
- Non stravolgere logiche o firme pubbliche di un modulo: aggiunte opzionali e retrocompatibili sono benvenute; refactor strutturali richiedono approvazione.

---

## Come aggiungere un nuovo tenant — checklist

### 1. Registra il tenant

In `src/lib/tenant-registry.ts`:
- Aggiungi una costante `NUOVOTENANT_MODULE_FLAGS` con i feature-flag appropriati.
- Aggiungi il profilo `TenantProfile` all'export principale con `vertical: "food"` o `vertical: "services"`.
- I fallback di default sono `DEFAULT_FOOD_TENANT_ID = "bepork"` per il verticale food e `DEFAULT_SERVICES_TENANT_ID = "officinakam"` per il verticale services. Non toccarli; aggiorna `getDefaultTenantForVertical()` solo se aggiungi un nuovo verticale.

In `src/lib/tenant-content.ts`:
- Aggiungi il blocco `TenantContent` con tutti i testi, immagini e dati del tenant.

### 2. Predisponi il multilingua e la SEO

- Registra il tenant in `src/lib/tenant-locales.ts` con lingua predefinita e lingue previste.
- Crea `src/lib/(slug)-i18n.ts` sul pattern di `src/lib/doca-i18n.ts`.
- Collega URL localizzati, link interni, selettore lingua e copy tradotti.
- Verifica canonical self-referencing, `hreflang` con `x-default`, sitemap localizzata e preview `noindex`.
- Se una traduzione non è ancora pronta, non pubblicare la relativa variante URL.

### 3. Verticale

Verifica in `src/lib/vertical.ts` se il verticale di appartenenza esiste già. Se non esiste:
1. Aggiungi il valore a `TenantVertical` in `tenant.ts`.
2. Aggiungi la entry in `VERTICAL_REGISTRY` in `vertical.ts`.
3. Aggiorna `PLATFORM_HOSTS` in `platform.ts`.
4. Crea le pagine marketing del verticale in `src/components/(vertical-slug)/pages/`.
5. Aggiorna il dispatcher in `src/app/page.tsx` e nelle pagine interessate.

### 4. Componenti UI (esclusivi del tenant)

Crea `src/components/tenants/(slug)/pages/` con i componenti propri del tenant.

- Stile completamente originale: nessun riuso di variabili CSS, classi o token di altri tenant.
- Font, palette, spaziatura, motion: definiti da zero in `src/styles/tenants/(slug).css`.
- Gestione: nello stesso CSS crea il blocco `.gestione-admin[data-gestione-tenant="(slug)"]` e copri tutti i campi/stati/moduli del pannello, inclusi quelli disattivi nei feature-flag iniziali.
- Naming: usa il prefisso del tenant per evitare collisioni (`<BizeryHero />`, non `<Hero />`).

### 5. Route Next.js

Se il tenant ha un dominio separato o route proprie, crea le pagine in `src/app/(slug)/`.

### 6. Asset pubblici

Metti loghi, immagini e font in `public/(slug)/`.

---

## Cosa NON fare

| Vietato | Alternativa corretta |
|---|---|
| Importare componenti UI da un altro tenant | Creare un componente originale per il nuovo tenant |
| Copiare classi CSS o variabili da qualsiasi altro tenant (incluso `bepork.css`) | Definire le variabili in `(slug).css` da zero |
| Modificare un modulo per adattarlo a un solo tenant | Parametrizzare il modulo in modo retrocompatibile, solo con autorizzazione |
| Aggiungere logica tenant-specifica dentro un modulo condiviso | Usare i feature-flag o prop opzionali |
| Mettere componenti UI generici in `_shared/` senza autorizzazione | Chiedere prima all'utente |

---

## Comunicazione inter-tenant

I tenant **non comunicano tra loro direttamente**. L'unico canale di comunicazione è attraverso i moduli riutilizzabili e i layer di dati condivisi (Supabase, lib/). Un tenant non deve mai importare da un altro tenant.

---

## Regola fondamentale: documentazione Obsidian sempre allineata

La root della repo è una **vault Obsidian**. La documentazione vive in `docs/` (struttura `00-vision` … `09-meetings`, `templates`, più `docs/START-HERE.md`) e nei file di root (`README.md`, `ARCHITECTURE.md`, `PRODUCT.md`).

**Ogni nuova feature o modifica strutturale alla repo deve generare, nello stesso intervento, l'aggiornamento della documentazione Obsidian corrispondente.** Non è accettabile mergiare codice che rende la documentazione obsoleta.

Quando una modifica tocca uno di questi ambiti, aggiorna anche i doc nello stesso cambio:

| Modifica al codice | Documento da aggiornare |
|---|---|
| Nuovo tenant / cambio status / verticale | `docs/01-business/tenant-e-verticali.md` + `ARCHITECTURE.md` |
| Nuovo verticale o nuovi `PlatformMode`/host | `ARCHITECTURE.md` + `docs/00-vision/` + `docs/02-architecture/` |
| Nuovo modulo o cambio in `tenant-modules.ts` | `docs/03-features/moduli-piattaforma.md` |
| Nuova integrazione / env / webhook | `docs/06-integrations/integrazioni-attive.md` |
| Nuovo endpoint/prompt IA | `docs/07-prompts/endpoint-ia.md` |
| Nuovo cron o processo operativo | `docs/08-processes/cron-e-processi.md` |
| Decisione architetturale rilevante | nuovo ADR in `docs/04-decisions/` (usa `docs/templates/adr-template.md`) |
| Nuovo modulo, procedura o problema noto rilevante per gli utenti | scheda KB in `docs/kb/` (`modules/`, `procedures/`, `troubleshooting/`, `faq/`) con i template `docs/kb/templates/` — è la fonte dell'assistente AI di supporto |
| Modifica a una schermata, a una route `gestione`, o a un'etichetta UI (es. `src/i18n/gestione.ts`, pagine `src/app/gestione/...`, nav in `gestione-shell.tsx`) | scheda UI in `docs/kb/ui/` (etichette pulsanti, percorso di navigazione) — serve all'assistente per indicare i tasti da premere |

Regole di scrittura dei doc:

- Markdown semplice, link Obsidian `[[nome file]]` dove utile.
- **Mai inventare**: separa sempre ciò che è *dedotto dal codice* da ciò che è *da confermare*. Se un dato non è certo, scrivilo come "Da verificare".
- Niente segreti o valori reali di env nei doc (solo i nomi delle variabili).
- Aggiorna `docs/START-HERE.md` quando aggiungi un documento importante o cambi la mappa delle sezioni.
- Questa è l'unica eccezione esplicita alla regola "nessun doc aggiuntivo senza richiesta" nello stile del codice: i doc Obsidian vanno mantenuti per definizione.

---

## Stile del codice

- Nessun commento ovvio: solo WHY non-ovvi (vincoli nascosti, workaround, invarianti sottili).
- Nessun file README o doc aggiuntivo a meno che l'utente lo chieda esplicitamente.
- Nessuna astrazione preventiva: tre righe simili sono meglio di un'astrazione prematura.
- Preferire editing di file esistenti alla creazione di nuovi.
