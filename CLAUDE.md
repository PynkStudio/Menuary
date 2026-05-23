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
- Non importare mai da `src/components/tenants/bepork/` o da qualsiasi altra cartella tenant per usarla in un tenant diverso. BePork è un tenant come gli altri, non è un "base template".
- La cartella `_shared/` in `src/components/tenants/_shared/` contiene solo elementi che il proprietario ha esplicitamente autorizzato a condividere tra più tenant. Non aggiungere nulla lì senza autorizzazione esplicita.

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

### 2. Verticale

Verifica in `src/lib/vertical.ts` se il verticale di appartenenza esiste già. Se non esiste:
1. Aggiungi il valore a `TenantVertical` in `tenant.ts`.
2. Aggiungi la entry in `VERTICAL_REGISTRY` in `vertical.ts`.
3. Aggiorna `PLATFORM_HOSTS` in `platform.ts`.
4. Crea le pagine marketing del verticale in `src/components/(vertical-slug)/pages/`.
5. Aggiorna il dispatcher in `src/app/page.tsx` e nelle pagine interessate.

### 3. Componenti UI (esclusivi del tenant)

Crea `src/components/tenants/(slug)/pages/` con i componenti propri del tenant.

- Stile completamente originale: nessun riuso di variabili CSS, classi o token di altri tenant.
- Font, palette, spaziatura, motion: definiti da zero in `src/styles/tenants/(slug).css`.
- Naming: usa il prefisso del tenant per evitare collisioni (`<BizeryHero />`, non `<Hero />`).

### 4. Route Next.js

Se il tenant ha un dominio separato o route proprie, crea le pagine in `src/app/(slug)/`.

### 5. Asset pubblici

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

## Stile del codice

- Nessun commento ovvio: solo WHY non-ovvi (vincoli nascosti, workaround, invarianti sottili).
- Nessun file README o doc aggiuntivo a meno che l'utente lo chieda esplicitamente.
- Nessuna astrazione preventiva: tre righe simili sono meglio di un'astrazione prematura.
- Preferire editing di file esistenti alla creazione di nuovi.
