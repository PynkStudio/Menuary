import { siteConfig } from "@/lib/site-config";
import type { SiteSettingsState } from "@/store/settings-store";

export type PolicyModuleFlags = Pick<
  SiteSettingsState,
  "allowTakeaway" | "allowTableOrders" | "dinerSeparationAtTables" | "kitchenDisplayEnabled"
>;

export type PolicySection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
};

export type PolicyController = {
  name: string;
  address: string;
  phone: string;
  email?: string;
};

const hasAnyOrdering = (f: PolicyModuleFlags) =>
  f.allowTakeaway || f.allowTableOrders;

function dataControllerBlock(controller?: PolicyController): PolicySection {
  const owner = controller ?? {
    name: siteConfig.name,
    address: siteConfig.address.full,
    phone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
  };
  return {
    id: "titolare",
    title: "Titolare del trattamento",
    body: [
      "Il titolare del trattamento dei dati personali raccolti attraverso il sito e le funzionalità connesse è, ai sensi dell’art. 4 n. 7 GDPR:",
      `${owner.name} — ${owner.address}. Contatti: telefono ${owner.phone}${
        owner.email
          ? `, e-mail ${owner.email}.`
          : " (per richieste inerenti la privacy preferire contatto telefonico o canale che indicheremo su richiesta)."
      }`,
    ],
  };
}

export function buildPrivacySections(
  f: PolicyModuleFlags,
  controller?: PolicyController,
): PolicySection[] {
  const orderBullets: string[] = [];
  if (f.allowTakeaway) {
    orderBullets.push(
      "ordine da asporto: composizione del carrello, eventuali note al piatto, istruzioni per il ritiro se richieste nel flusso, stato dell’ordine sul dispositivo;",
    );
  }
  if (f.allowTableOrders) {
    orderBullets.push(
      `ordine al tavolo (QR o codice sala): associazione del dispositivo al tavolo o alla sessione, contenuto dell’ordine, eventuali coperti dichiarati${
        f.dinerSeparationAtTables
          ? "; nominativo o nickname per distinguere i commensali nella stessa sessione"
          : ""
      };`,
    );
  }

  const sections: PolicySection[] = [
    dataControllerBlock(controller),
    {
      id: "finalita",
      title: "Quali dati trattiamo e perché",
      body: [
        hasAnyOrdering(f)
          ? "Trattiamo dati personali solo nella misura necessaria al funzionamento del sito, alla gestione delle richieste di contatto e ai servizi digitali di consultazione e ordinazione offerti dal locale."
          : "Trattiamo dati personali solo nella misura necessaria al funzionamento del sito informativo e alla gestione delle richieste inviate attraverso i canali di contatto pubblicati.",
        hasAnyOrdering(f)
          ? "Le basi giuridiche prevalenti sono l’esecuzione di misure precontrattuali o contrattuali su richiesta dell’interessato (ordinazione), il legittimo interesse a gestire il locale in modo ordinato e sicuro, e il consenso ove richiesto per comunicazioni commerciali facoltative."
          : "Le basi giuridiche prevalenti sono il legittimo interesse alla gestione del rapporto con la clientela, l’eventuale consenso per comunicazioni promozionali e gli obblighi di legge applicabili.",
      ],
      bullets: [
        "dati tecnici minimi della navigazione sul sito e identificatori di sessione tramite tecnologie sul dispositivo (cookie o spazio locale del browser), necessari al funzionamento delle pagine;",
        "preferiti salvati sul dispositivo per agevolare la consultazione del menu;",
        ...orderBullets,
      ],
    },
    {
      id: "modalita",
      title: "Modalità del trattamento",
      body: [
        hasAnyOrdering(f)
          ? "Alcune informazioni degli ordini e delle sessioni sono memorizzate sul browser (storage locale) e nei dati gestiti dall’applicazione per consentire l’invio dell’ordine e il coordinamento operativo del servizio."
          : "I dati vengono trattati attraverso il sito e i canali di contatto indicati dal locale, con strumenti tecnici proporzionati alle richieste ricevute.",
        "Non vendiamo i tuoi dati personali. Eventuali fornitori tecnici (es. hosting del sito) operano come responsabili o incaricati secondo accordi conformi alla normativa.",
      ],
    },
    {
      id: "tempi",
      title: "Conservazione",
      body: [
        hasAnyOrdering(f)
          ? "I dati legati agli ordini sono conservati per il tempo necessario a gestire il servizio in sala o al banco e per gli adempimenti civilistici e fiscali applicabili al caso."
          : "Le richieste di contatto sono conservate per il tempo necessario a evadere la pratica e gestire gli eventuali adempimenti collegati.",
        "I dati tecnici delle visite sul sito non sono conservati per profilazione invasiva al di fuori degli strumenti eventualmente richiesti dal gestore tecnico dell’hosting.",
      ],
    },
    {
      id: "diritti",
      title: "Diritti degli interessati",
      body: [
        "Ai sensi degli artt. 15–22 GDPR hai diritto di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione nei limiti previsti dalla legge.",
        "Per esercitare i diritti puoi contattare il titolare ai recapiti sopra indicati.",
        "Hai il diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).",
      ],
    },
  ];

  if (f.kitchenDisplayEnabled && hasAnyOrdering(f)) {
    sections.splice(3, 0, {
      id: "cucina",
      title: "Monitor di cucina",
      body: [
        "Gli ordini confermati possono essere visualizzati sullo schermo cucina dedicato allo staff per preparare i piatti e coordinare il servizio. Tale trattamento è finalizzato alla gestione operativa del rapporto contrattuale con il cliente che ordina.",
      ],
    });
  }

  return sections;
}

export function buildCookieSections(f: PolicyModuleFlags): PolicySection[] {
  const techLines: string[] = [
    "preferiti e contenuti parziali del menu memorizzati localmente sul dispositivo;",
    "stato tecnico delle impostazioni pubbliche del sito (orari personalizzati dal titolare, quando applicabile);",
  ];

  if (hasAnyOrdering(f)) {
    techLines.push(
      "carrello e dati degli ordini in elaborazione;",
      "identificativo tecnico anonimo associato al dispositivo per collegare sessioni di ordine;",
    );
    if (f.allowTableOrders) {
      techLines.push(
        f.dinerSeparationAtTables
          ? "informazioni sulla sessione al tavolo (codice sala e nickname dei commensali);"
          : "informazioni sulla sessione al tavolo (codice sala);",
      );
    }
  }

  const sections: PolicySection[] = [
    {
      id: "intro",
      title: "Informazioni sulle tecnologie sul dispositivo",
      body: [
        "Questo sito utilizza, oltre ai cookie classici ove il browser li imposti automaticamente per la sessione, anche lo «spazio locale» del browser (local/session storage) per funzionare senza server dedicato alla gestione account.",
        "Le tecnologie utilizzate servono a rendere disponibili le funzioni richieste dall’utente e a mantenere stabile l’esperienza di navigazione. Puoi sempre cancellare i dati tramite le impostazioni del browser.",
      ],
    },
    {
      id: "necessary",
      title: "Strettamente necessarie / operative",
      body: [
        "Consentono il caricamento sicuro delle pagine, il ricordo delle preferenze essenziali e il funzionamento delle parti del sito che hai scelto di usare.",
      ],
      bullets: techLines,
    },
    {
      id: "functional",
      title: "Funzionalità e misure di sicurezza locali",
      body: [
        hasAnyOrdering(f)
          ? "Senza queste tecnologie non è possibile completare il flusso di ordinazione sul dispositivo (carrello, invio ordine al locale)."
          : "Queste tecnologie consentono di ricordare preferenze essenziali, preferiti e impostazioni necessarie alla corretta visualizzazione del sito.",
      ],
    },
    {
      id: "third",
      title: "Servizi di terze parti collegati",
      body: [
        "Il sito può contenere link a WhatsApp, Instagram, Facebook e mappe esterne: aprendo tali link o incorporamenti potresti essere soggetto ai cookie e alle policy dei rispettivi fornitori.",
        "Non utilizziamo pixel di remarketing né strumenti di analytics di terze parti di default nel codice pubblicato di questo progetto.",
      ],
    },
    {
      id: "manage",
      title: "Come gestire preferenze e revoche",
      body: [
        "Dal browser puoi cancellare cookie e dati dei siti in qualsiasi momento (Impostazioni → Privacy → Cookie / Dati siti).",
        "La cancellazione può rimuovere carrello, preferiti e sessioni di ordine salvate sul dispositivo.",
      ],
    },
  ];

  return sections;
}
