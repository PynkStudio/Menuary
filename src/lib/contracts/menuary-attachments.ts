import { FORNITORE, type ContractData } from "./menuary-contract";

export type AttachmentBlock = {
  id: string;
  code: "A" | "B" | "C" | "D";
  title: string;
  subtitle: string;
  sections: { heading: string; body: string }[];
};

export function buildAttachments(data: ContractData): AttachmentBlock[] {
  const cliente = data.cliente;
  const ragioneSocialeCliente = cliente.ragioneSociale || "_______________";

  return [
    {
      id: "dpa",
      code: "A",
      title: "Allegato A — Nomina a Responsabile del trattamento ex art. 28 GDPR",
      subtitle: `Tra ${FORNITORE.ragioneSociale} ("Responsabile") e ${ragioneSocialeCliente} ("Titolare")`,
      sections: [
        {
          heading: "1. Oggetto e finalità del trattamento",
          body: `Il Titolare nomina il Responsabile per il trattamento dei dati personali necessari all'erogazione del servizio Menuary descritto nel Contratto principale. Il Responsabile tratterà esclusivamente i dati personali per conto del Titolare, nei limiti delle istruzioni qui contenute e di quelle ulteriori impartite per iscritto.`,
        },
        {
          heading: "2. Categorie di interessati e dati trattati",
          body: `Interessati: clienti, prospect, dipendenti e collaboratori del Titolare, utenti del sito web del Titolare.
Categorie di dati: dati identificativi e di contatto, dati di prenotazione/ordine, dati di pagamento (token, non i numeri di carta), dati di navigazione e log tecnici, contenuti generati dall'utente (testi, immagini, recensioni).
Non sono trattate categorie particolari di dati ex art. 9 GDPR, salvo diverso accordo scritto.`,
        },
        {
          heading: "3. Durata",
          body: `Il presente atto di nomina ha durata pari a quella del Contratto principale e cessa automaticamente con esso, salvo gli obblighi di restituzione/cancellazione previsti all'art. 9.`,
        },
        {
          heading: "4. Obblighi del Responsabile",
          body: `Il Responsabile si impegna a:
  a) trattare i dati personali secondo istruzioni documentate del Titolare;
  b) garantire che le persone autorizzate al trattamento si siano impegnate alla riservatezza;
  c) adottare tutte le misure di sicurezza tecniche e organizzative previste dall'art. 32 GDPR;
  d) assistere il Titolare nel garantire il rispetto degli obblighi di cui agli artt. 32-36 GDPR;
  e) assistere il Titolare con misure tecniche e organizzative adeguate ai fini del riscontro alle richieste degli interessati (artt. 12-22 GDPR);
  f) mettere a disposizione del Titolare tutte le informazioni necessarie a dimostrare il rispetto degli obblighi di cui all'art. 28 GDPR;
  g) informare immediatamente il Titolare qualora, a suo parere, un'istruzione violi il GDPR o altre disposizioni in materia di protezione dei dati;
  h) notificare al Titolare ogni violazione dei dati personali (data breach) senza ingiustificato ritardo, e comunque entro 24 ore dalla scoperta, fornendo tutte le informazioni utili.`,
        },
        {
          heading: "5. Misure di sicurezza (art. 32 GDPR)",
          body: `Il Responsabile dichiara di adottare, in particolare:
  • cifratura TLS 1.2+ dei dati in transito;
  • cifratura at-rest dei dati sensibili;
  • backup giornalieri con conservazione di almeno 30 giorni e test periodici di ripristino;
  • controllo degli accessi con ruoli minimi e MFA per gli amministratori;
  • log degli accessi e delle operazioni rilevanti;
  • segregazione logica dei dati tra tenant;
  • processi di vulnerability assessment periodici e gestione delle patch.`,
        },
        {
          heading: "6. Sub-Responsabili autorizzati",
          body: `Il Titolare autorizza in via generale il Responsabile ad avvalersi dei seguenti sub-responsabili per l'erogazione del servizio:
  • Vercel Inc. — hosting applicativo e CDN (UE/USA, garanzie SCC + DPF);
  • Supabase Inc. — database PostgreSQL gestito (UE, EU region);
  • Provider email transazionale (Resend / Postmark) per invio comunicazioni di servizio;
  • Stripe Payments Europe Ltd. — gestione pagamenti (UE/USA, garanzie SCC + DPF);
  • Google Ireland Ltd. — solo per le funzioni espressamente attivate dal Titolare (es. Google Business Profile).

Il Responsabile informerà il Titolare di ogni modifica all'elenco dei sub-responsabili con almeno 30 giorni di preavviso, dando facoltà al Titolare di opporsi per giustificati motivi.`,
        },
        {
          heading: "7. Trasferimenti extra-UE",
          body: `Qualora siano necessari trasferimenti di dati al di fuori dello Spazio Economico Europeo, il Responsabile garantirà l'adozione di adeguate garanzie ai sensi del Capo V del GDPR, in particolare Clausole Contrattuali Standard adottate dalla Commissione UE e, ove applicabile, l'EU-US Data Privacy Framework.`,
        },
        {
          heading: "8. Audit e ispezioni",
          body: `Il Titolare ha diritto di verificare il rispetto degli obblighi del Responsabile, anche tramite audit di terzi indipendenti, con preavviso scritto di almeno 30 giorni, una volta l'anno, durante l'orario di ufficio e senza interferenze con la normale operatività. Costi a carico del Titolare salvo evidenza di non conformità rilevanti.`,
        },
        {
          heading: "9. Cessazione del trattamento",
          body: `Alla cessazione del Contratto principale, per qualsiasi causa, il Responsabile — a scelta del Titolare comunicata entro 30 giorni dalla cessazione — restituirà tutti i dati personali al Titolare in formato strutturato (CSV/JSON) o li cancellerà. In assenza di indicazioni, il Responsabile conserverà i dati per 12 mesi (per finalità di portabilità ed eventuale riattivazione) trascorsi i quali procederà alla cancellazione definitiva, salvo obblighi di conservazione per legge.`,
        },
      ],
    },
    {
      id: "privacy",
      code: "B",
      title: "Allegato B — Informativa privacy (art. 13 GDPR)",
      subtitle: `Informativa resa da ${FORNITORE.ragioneSociale} ai sensi degli artt. 13-14 del Reg. UE 679/2016`,
      sections: [
        {
          heading: "1. Titolare del trattamento",
          body: `${FORNITORE.ragioneSociale}, P.IVA ${FORNITORE.piva}, ${FORNITORE.indirizzo}. PEC: ${FORNITORE.pec}. Email: ${FORNITORE.email}.`,
        },
        {
          heading: "2. Tipologia di dati raccolti",
          body: `In relazione al Contratto vengono raccolti: dati identificativi del Cliente e del suo legale rappresentante, dati fiscali (P.IVA, C.F., SDI, PEC), dati di contatto, dati di pagamento (token e riferimenti, non i numeri completi di carta), dati di accesso e log di utilizzo della piattaforma.`,
        },
        {
          heading: "3. Finalità e basi giuridiche",
          body: `I dati sono trattati per:
  a) esecuzione del Contratto e gestione del rapporto (art. 6.1.b GDPR);
  b) adempimenti fiscali, contabili e di legge (art. 6.1.c GDPR);
  c) gestione di reclami, contenziosi e tutela dei diritti del Titolare (art. 6.1.f GDPR);
  d) marketing diretto su servizi analoghi del Titolare (art. 6.1.f GDPR — soft spam ex art. 130 c. 4 Codice Privacy), con possibilità di opposizione in qualsiasi momento;
  e) eventuali ulteriori finalità di marketing o profilazione solo previo consenso esplicito (art. 6.1.a GDPR).`,
        },
        {
          heading: "4. Comunicazione e destinatari",
          body: `I dati possono essere comunicati a: consulenti fiscali/legali, banche e provider di pagamento, autorità pubbliche quando richiesto da norme di legge, fornitori IT (vedi Allegato A — sub-responsabili). I dati non sono oggetto di diffusione.`,
        },
        {
          heading: "5. Conservazione",
          body: `Dati contrattuali e di fatturazione: 10 anni dalla cessazione del Contratto, per obblighi fiscali. Dati di marketing: fino a opposizione o, in assenza, 24 mesi. Log tecnici: 12 mesi.`,
        },
        {
          heading: "6. Diritti dell'interessato",
          body: `L'interessato ha diritto di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione (artt. 15-22 GDPR), nonché di proporre reclamo al Garante (www.garanteprivacy.it). Per esercitare i propri diritti: ${FORNITORE.email} o PEC ${FORNITORE.pec}.`,
        },
        {
          heading: "7. Conferimento dei dati",
          body: `Il conferimento dei dati indicati come obbligatori in sede di stipula è necessario per l'esecuzione del Contratto; l'eventuale rifiuto comporta l'impossibilità di erogare il servizio.`,
        },
      ],
    },
    {
      id: "sla",
      code: "C",
      title: "Allegato C — Service Level Agreement (SLA)",
      subtitle: "Livelli di servizio garantiti e procedure di assistenza",
      sections: [
        {
          heading: "1. Disponibilità del servizio",
          body: `Il Fornitore si impegna a garantire un livello di disponibilità mensile del servizio non inferiore al 99,5%, calcolato su base mensile escludendo le finestre di manutenzione programmata e le cause non imputabili al Fornitore (forza maggiore, attacchi DDoS, fault di provider terzi).`,
        },
        {
          heading: "2. Manutenzione programmata",
          body: `Le finestre di manutenzione programmata sono comunicate con almeno 48 ore di preavviso via email e si svolgono di norma in orari a basso traffico (notturni o weekend). Le manutenzioni programmate non rilevano ai fini del calcolo della disponibilità.`,
        },
        {
          heading: "3. Tempi di risposta",
          body: `Categorie di intervento:
  • SEVERITY 1 — Blocco totale (sito offline / impossibilità totale di gestione): presa in carico entro 2 ore lavorative, risoluzione entro 24 ore.
  • SEVERITY 2 — Malfunzionamento parziale (modulo o funzione non disponibile): presa in carico entro 8 ore lavorative, risoluzione entro 72 ore.
  • SEVERITY 3 — Anomalia minore (errori grafici, comportamenti non bloccanti): risoluzione nel ciclo di sviluppo ordinario.

Orario di lavoro standard: lun-ven 09:00-18:00. Interventi su Severity 1 sono garantiti anche oltre tali orari, in modalità best-effort.`,
        },
        {
          heading: "4. Canali di assistenza",
          body: `Apertura ticket: support@menuary.it o tramite il pannello admin. Per emergenze di Severity 1, contatto telefonico o WhatsApp al numero comunicato in fase di onboarding.`,
        },
        {
          heading: "5. Penali per inadempimento SLA",
          body: `Qualora il Fornitore non rispetti il tempo di risoluzione di Severity 1, il Cliente avrà diritto a un credito sul canone successivo pari al 5% del canone mensile per ogni ora di ritardo oltre le 24 ore, fino a un massimo del 50% di un canone mensile per evento. La penale costituisce ristoro forfettario ed esaustivo per il disservizio, fatti salvi i diritti di legge inderogabili.`,
        },
        {
          heading: "6. Backup e ripristino",
          body: `Il Fornitore esegue backup automatici giornalieri dei dati, conservati per almeno 30 giorni. In caso di necessità di ripristino, il Fornitore si impegna a completare l'operazione entro 24 ore dalla richiesta. Punto di recupero massimo (RPO): 24 ore. Tempo di recupero massimo (RTO): 24 ore.`,
        },
      ],
    },
    {
      id: "tos",
      code: "D",
      title: "Allegato D — Condizioni d'uso della piattaforma",
      subtitle: "Regole di utilizzo dei servizi Menuary / Bizery",
      sections: [
        {
          heading: "1. Uso conforme",
          body: `Il Cliente si impegna a utilizzare la piattaforma esclusivamente per le finalità connesse alla propria attività imprenditoriale, nel rispetto della legge, dei diritti di terzi e delle presenti condizioni.`,
        },
        {
          heading: "2. Contenuti vietati",
          body: `È espressamente vietato caricare o veicolare tramite la piattaforma contenuti:
  • illeciti, diffamatori, osceni, discriminatori o contrari all'ordine pubblico;
  • lesivi di diritti di proprietà intellettuale, marchi, brevetti o segreti commerciali altrui;
  • contenenti dati personali di terzi privi di valida base giuridica;
  • virus, malware o codice eseguibile dannoso;
  • finalizzati a spam, phishing o frodi.

Il Fornitore si riserva di rimuovere immediatamente i contenuti vietati e di sospendere l'accesso del Cliente in caso di violazioni gravi o reiterate.`,
        },
        {
          heading: "3. Account e credenziali",
          body: `Il Cliente è tenuto a custodire con la massima diligenza le credenziali di accesso ed è responsabile di ogni attività compiuta tramite il proprio account. In caso di sospetta compromissione, il Cliente deve avvisare immediatamente il Fornitore.`,
        },
        {
          heading: "4. Quote di utilizzo",
          body: `Il piano sottoscritto può prevedere limiti di utilizzo (numero di prodotti, prenotazioni mensili, traffico mensile, spazio di archiviazione). In caso di superamento sistematico delle quote, il Fornitore proporrà un upgrade di piano o applicherà i costi di overage previsti dal listino vigente.`,
        },
        {
          heading: "5. Marchi e proprietà intellettuale",
          body: `Il Cliente concede al Fornitore il diritto, gratuito e non esclusivo, di utilizzare la denominazione e il logo del Cliente esclusivamente al fine di indicarlo nel proprio portfolio clienti e in materiali commerciali, salvo diversa richiesta scritta del Cliente.`,
        },
        {
          heading: "6. Modifiche delle condizioni",
          body: `Il Fornitore si riserva di aggiornare le presenti condizioni d'uso per ragioni tecniche, normative o di sicurezza. Le modifiche sostanziali saranno comunicate al Cliente con almeno 30 giorni di preavviso e daranno facoltà di recesso ai sensi dell'art. 14 del Contratto principale.`,
        },
      ],
    },
  ];
}
