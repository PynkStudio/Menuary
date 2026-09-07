import { siteConfig } from "@/lib/site-config";
import type { TenantFeatureKey } from "@/lib/tenant";
import type { SiteSettingsState } from "@/store/settings-store";

export type PolicyModuleFlags = Pick<
  SiteSettingsState,
  "allowTakeaway" | "allowTableOrders" | "dinerSeparationAtTables" | "kitchenDisplayEnabled"
> & {
  /** Assistente telefonico AI attivo (Retell). */
  aiPhoneEnabled?: boolean;
  /** Assistente WhatsApp AI attivo. */
  aiWhatsappEnabled?: boolean;
  /** IA di suggerimento/upselling attiva. */
  upsellingEnabled?: boolean;
  /**
   * I moduli davvero accesi sul sito del tenant.
   *
   * L'informativa nasceva HORECA: parlava di menu, preferiti e carrello a
   * chiunque, anche a un sito d'autrice che non ha nessuna delle tre cose — e
   * un'informativa che descrive trattamenti inesistenti è sbagliata quanto una
   * che ne omette. Quando questa mappa c'è, ogni sezione compare solo se il
   * modulo che la genera è attivo. Quando manca, il documento si comporta come
   * prima: serve ai chiamanti che non conoscono i moduli del tenant.
   */
  modules?: Partial<Record<TenantFeatureKey, boolean>>;
  /** Il sito pubblica più lingue e ricorda quella scelta sul dispositivo. */
  localeCookie?: boolean;
};

/**
 * Un modulo è attivo se la mappa lo dice. Senza mappa vale il comportamento
 * storico, che è quello di un sito HORECA completo.
 */
function hasModule(f: PolicyModuleFlags, key: TenantFeatureKey, fallback: boolean) {
  return f.modules ? Boolean(f.modules[key]) : fallback;
}

const hasMenu = (f: PolicyModuleFlags) => hasModule(f, "onlineMenu", true);
const hasFavorites = (f: PolicyModuleFlags) => hasModule(f, "favorites", true);
const hasShop = (f: PolicyModuleFlags) => hasModule(f, "shop", false);
const hasBookings = (f: PolicyModuleFlags) =>
  hasModule(f, "reservations", false) || hasModule(f, "creativeBooking", false);
const hasNewsletter = (f: PolicyModuleFlags) =>
  hasModule(f, "fanbaseCommunity", false) || hasModule(f, "crm", false);
const hasBlog = (f: PolicyModuleFlags) => hasModule(f, "blog", false);
const hasAnalytics = (f: PolicyModuleFlags) => hasModule(f, "analytics", false);

/** "a, b e c" — l'elenco in riga di una informativa, non un elenco puntato. */
function inline(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

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
  piva?: string;
  pec?: string;
};

const hasAnyOrdering = (f: PolicyModuleFlags) =>
  f.allowTakeaway || f.allowTableOrders;

const hasConversationalAi = (f: PolicyModuleFlags) =>
  Boolean(f.aiPhoneEnabled || f.aiWhatsappEnabled);

/** Sezione privacy sull'assistente conversazionale AI (telefono/WhatsApp). */
function conversationalAiBlock(f: PolicyModuleFlags): PolicySection {
  const channels: string[] = [];
  if (f.aiPhoneEnabled) channels.push("le chiamate telefoniche");
  if (f.aiWhatsappEnabled) channels.push("i messaggi su WhatsApp");
  const channelLabel =
    channels.length === 2 ? `${channels[0]} e ${channels[1]}` : channels[0];

  const recipients: string[] = [];
  if (f.aiPhoneEnabled) {
    recipients.push(
      "il fornitore della tecnologia di assistente vocale e l’operatore di telefonia che gestisce numerazioni, chiamate ed eventuali SMS",
    );
  }
  if (f.aiWhatsappEnabled) {
    recipients.push("WhatsApp / Meta per la messaggistica");
  }
  recipients.push(
    "il fornitore del modello di linguaggio che interpreta la conversazione",
  );

  return {
    id: "assistente-ai",
    title: "Assistente automatico (telefono/WhatsApp)",
    body: [
      `Quando contatti il locale tramite ${channelLabel}, la conversazione può essere gestita da un assistente automatico basato su intelligenza artificiale, allo scopo di fornirti informazioni e raccogliere ordini o prenotazioni. Puoi in qualsiasi momento chiedere di parlare con una persona.`,
      f.aiPhoneEnabled
        ? "Per tutelare la tua riservatezza non conserviamo la registrazione audio delle telefonate; può essere conservata una trascrizione testuale della conversazione, al solo fine di erogare il servizio richiesto e migliorarne la qualità."
        : "Il contenuto dei messaggi scambiati può essere conservato al solo fine di erogare il servizio richiesto e migliorarne la qualità.",
      "Il trattamento ha come base giuridica l’esecuzione della tua richiesta (ordine/prenotazione) e il legittimo interesse a gestire il servizio in modo efficiente. I fornitori tecnologici che rendono possibile l’assistente operano come responsabili del trattamento, anche con server fuori dall’Unione Europea ma con adeguate garanzie (es. clausole contrattuali standard).",
    ],
    bullets: [
      "dati che fornisci durante la conversazione: nome, recapito, eventuale indirizzo di consegna, contenuto dell’ordine o della prenotazione, eventuali indicazioni su allergeni;",
      `soggetti che trattano questi dati per nostro conto: ${recipients.join("; ")}.`,
    ],
  };
}

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
      `${owner.name} — ${owner.address}${owner.piva ? `. P.IVA ${owner.piva}` : ""}. Contatti: telefono ${owner.phone}${
        owner.email
          ? `, e-mail ${owner.email}.`
          : " (per richieste inerenti la privacy preferire contatto telefonico o canale che indicheremo su richiesta)."
      }${owner.pec ? ` PEC: ${owner.pec}.` : ""}`,
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
        ...(f.localeCookie
          ? ["la lingua scelta per il sito, ricordata sul dispositivo per le visite successive;"]
          : []),
        "dati che ci invii spontaneamente tramite il modulo di contatto o gli indirizzi pubblicati: nome, recapito e contenuto del messaggio, trattati per rispondere alla tua richiesta;",
        ...(hasFavorites(f)
          ? [
              hasMenu(f)
                ? "preferiti salvati sul dispositivo per agevolare la consultazione del menu;"
                : "preferiti salvati sul dispositivo per ritrovare i contenuti che hai messo da parte;",
            ]
          : []),
        ...(hasBookings(f)
          ? ["dati della richiesta di prenotazione o di appuntamento: nome, recapito, data e ora richieste ed eventuali note;"]
          : []),
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

  // Ogni modulo che raccoglie qualcosa porta la sua sezione, prima dei diritti.
  if (hasNewsletter(f)) {
    sections.splice(sections.length - 1, 0, {
      id: "newsletter",
      title: "Newsletter",
      body: [
        "Se lasci il tuo indirizzo e-mail per ricevere la newsletter, il trattamento si basa sul tuo consenso, che presti spuntando la casella dedicata prima dell’invio.",
        "L’iscrizione si perfeziona solo dopo che hai confermato l’indirizzo dal link che ti inviamo: fino ad allora l’e-mail resta in attesa e non riceve comunicazioni.",
        "Puoi revocare il consenso in qualsiasi momento, dal link di disiscrizione presente in ogni messaggio o scrivendo ai recapiti del titolare. La revoca non pregiudica la liceità del trattamento svolto prima.",
      ],
    });
  }
  if (hasBlog(f)) {
    sections.splice(sections.length - 1, 0, {
      id: "commenti",
      title: "Commenti agli articoli",
      body: [
        "Se lasci un commento sotto un articolo trattiamo il nome che scegli di indicare e il testo del commento, per pubblicarlo e moderarlo.",
        "I commenti sono soggetti a moderazione prima della pubblicazione e restano visibili finché l’articolo resta online. Puoi chiederne la rimozione ai recapiti del titolare.",
      ],
    });
  }
  if (hasAnalytics(f)) {
    sections.splice(sections.length - 1, 0, {
      id: "statistiche",
      title: "Statistiche di visita",
      body: [
        "Raccogliamo statistiche aggregate sulle pagine visitate per capire quali contenuti risultano utili. La misurazione non usa cookie di profilazione e non ricostruisce l’identità dei singoli visitatori.",
        "La base giuridica è il legittimo interesse a mantenere e migliorare il sito.",
      ],
    });
  }

  // Le sezioni IA precedono sempre i "Diritti degli interessati" (ultimo blocco).
  if (hasConversationalAi(f)) {
    sections.splice(sections.length - 1, 0, conversationalAiBlock(f));
  }
  if (f.upsellingEnabled) {
    sections.splice(sections.length - 1, 0, {
      id: "suggerimenti-ai",
      title: "Suggerimenti automatici",
      body: [
        "Durante la consultazione del menu o la composizione dell’ordine, un sistema di intelligenza artificiale può proporti prodotti o abbinamenti suggeriti, sulla base delle voci che stai consultando o aggiungendo al carrello.",
        "Si tratta di suggerimenti automatici di tipo commerciale che non producono decisioni con effetti giuridici sulla tua persona; non vengono utilizzati per profilazione invasiva. Puoi semplicemente ignorarli.",
      ],
    });
  }

  return sections;
}

export function buildCookieSections(f: PolicyModuleFlags): PolicySection[] {
  const techLines: string[] = [
    hasMenu(f)
      ? "stato tecnico delle impostazioni pubbliche del sito (orari personalizzati dal titolare, quando applicabile);"
      : "stato tecnico delle impostazioni pubbliche del sito;",
  ];

  if (hasFavorites(f)) {
    techLines.unshift(
      hasMenu(f)
        ? "preferiti e contenuti parziali del menu memorizzati localmente sul dispositivo;"
        : "preferiti memorizzati localmente sul dispositivo;",
    );
  }
  if (f.localeCookie) {
    techLines.push("la lingua scelta per il sito;");
  }
  if (hasShop(f) && !hasAnyOrdering(f)) {
    techLines.push("carrello e contenuti in attesa di acquisto;");
  }

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

  /** Che cosa si perde davvero svuotando i dati del sito. */
  const removable: string[] = [];
  if (hasAnyOrdering(f) || hasShop(f)) removable.push("il carrello e le sessioni di ordine");
  if (hasFavorites(f)) removable.push("i preferiti");
  if (f.localeCookie) removable.push("la lingua scelta");

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
        hasAnyOrdering(f) || hasShop(f)
          ? "Senza queste tecnologie non è possibile completare il flusso di acquisto sul dispositivo (carrello, invio dell’ordine)."
          : "Queste tecnologie consentono di ricordare le preferenze essenziali e le impostazioni necessarie alla corretta visualizzazione del sito.",
      ],
    },
    {
      id: "third",
      title: "Servizi di terze parti collegati",
      body: [
        "Il sito può contenere link o contenuti incorporati di terze parti — social network, store esterni, mappe, video: aprendoli potresti essere soggetto ai cookie e alle policy dei rispettivi fornitori.",
        ...(hasConversationalAi(f)
          ? [
              `Se interagisci con l’assistente automatico ${
                f.aiPhoneEnabled && f.aiWhatsappEnabled
                  ? "telefonico o su WhatsApp"
                  : f.aiWhatsappEnabled
                    ? "su WhatsApp"
                    : "telefonico"
              }, la conversazione è gestita tramite servizi di terzi (telefonia, messaggistica WhatsApp/Meta e fornitori di intelligenza artificiale) secondo le rispettive policy; il dettaglio del trattamento è descritto nell’informativa privacy.`,
            ]
          : []),
        hasAnalytics(f)
          ? "Le statistiche di visita sono raccolte in forma aggregata e senza cookie di profilazione. Non utilizziamo pixel di remarketing."
          : "Non utilizziamo pixel di remarketing né strumenti di analytics di terze parti.",
      ],
    },
    {
      id: "manage",
      title: "Come gestire preferenze e revoche",
      body: [
        "Dal browser puoi cancellare cookie e dati dei siti in qualsiasi momento (Impostazioni → Privacy → Cookie / Dati siti).",
        removable.length > 0
          ? `La cancellazione può rimuovere ${inline(removable)} che il sito ha salvato sul dispositivo.`
          : "La cancellazione riporta il sito allo stato di una prima visita: non c’è nulla di personale salvato sul dispositivo che vada perso.",
      ],
    },
  ];

  return sections;
}
