import {
  FORNITORE,
  BRAND_INFO,
  formatEUR,
  computeYearlyTotal,
  isIndividualClient,
  paymentMethodLabel,
  type ContractData,
} from "./menuary-contract";

export type ClauseBlock = {
  id: string;
  title: string;
  body: string;
};

const ITALIAN_NUMBERS = ["zero", "una", "due", "tre", "quattro", "cinque", "sei"];
function numberToItalian(n: number): string {
  return ITALIAN_NUMBERS[n] ?? String(n);
}

export function buildClauses(data: ContractData): ClauseBlock[] {
  const { cliente, servizio, economiche } = data;
  const brandInfo = BRAND_INFO[data.brand];
  const individualClient = isIndividualClient(data);
  const clienteEpigrafe = individualClient
    ? `${cliente.ragioneSociale || "_______________"}, C.F. ${cliente.cf || "_______________"}, residente in ${cliente.sedeLegale || "_______________"}, email/PEC ${cliente.pec || cliente.email || "_______________"}`
    : `${cliente.ragioneSociale || "_______________"}, P.IVA ${cliente.piva || "_______________"}, C.F. ${cliente.cf || "_______________"}, con sede in ${cliente.sedeLegale || "_______________"}, PEC ${cliente.pec || "_______________"}, in persona del legale rappresentante ${cliente.legaleRappresentante || "_______________"}`;
  const annuale = economiche.cicloFatturazione === "yearly";
  const totaleAnnuale = computeYearlyTotal(
    economiche.canoneMensile,
    economiche.scontoAnnuale,
  );

  return [
    {
      id: "premesse",
      title: "Premesse",
      body: `Il presente contratto (di seguito "Contratto") è stipulato tra ${FORNITORE.ragioneSociale}, P.IVA ${FORNITORE.piva}, con sede in ${FORNITORE.indirizzo}, PEC ${FORNITORE.pec}, in persona del legale rappresentante ${FORNITORE.legaleRappresentante} (di seguito "Fornitore" o "${brandInfo.platformName}"), e ${clienteEpigrafe} (di seguito "Cliente").

Premesso che il Fornitore eroga "${brandInfo.platformName}", ${brandInfo.verticalDescription}, e che il Cliente intende acquistare il servizio nei termini di seguito indicati.`,
    },
    {
      id: "oggetto",
      title: "1. Oggetto del Contratto",
      body: `Il Fornitore concede al Cliente, in modalità SaaS (Software as a Service), il diritto non esclusivo, non trasferibile e revocabile di accedere e utilizzare la piattaforma ${brandInfo.platformName} nella configurazione corrispondente al piano "${servizio.pianoNome}".

Il servizio include in particolare:
${servizio.moduliInclusi.map((m) => `  • ${m}`).join("\n")}

Il sito del Cliente sarà raggiungibile sull'istanza tenant "${servizio.tenantSlug || "_______________"}"${servizio.dominio ? ` e sul dominio personalizzato "${servizio.dominio}"` : ""}. Per le nuove attivazioni, qualora il Cliente richieda la registrazione di un nuovo dominio, il primo anno di registrazione del dominio è incluso nel piano sottoscritto. Dal secondo anno, e per ogni successivo rinnovo, il costo del dominio sarà addebitato separatamente al Cliente al prezzo effettivamente applicato dal provider/registrar, senza alcun rincaro o margine da parte del Fornitore. La titolarità del dominio resta in capo al Cliente, salvo diversa indicazione tecnica richiesta dal registrar o diverso accordo scritto tra le Parti.`,
    },
    {
      id: "durata",
      title: "2. Durata, rinnovo e recesso",
      body: `Il Contratto ha durata di 12 (dodici) mesi a decorrere dalla data di attivazione del servizio.

Alla scadenza, il Contratto si rinnova tacitamente per ulteriori periodi di 12 (dodici) mesi, salvo disdetta inviata da una delle Parti a mezzo PEC con almeno 30 (trenta) giorni di preavviso rispetto alla data di scadenza naturale o di rinnovo.

Il recesso non dà diritto ad alcun rimborso, totale o parziale, dei canoni e dei corrispettivi già versati, fatto salvo quanto eventualmente previsto da norme inderogabili di legge.`,
    },
    {
      id: "corrispettivi",
      title: "3. Corrispettivi e modalità di pagamento",
      body: `Il Cliente si obbliga a corrispondere al Fornitore:
  a) Una quota una tantum di attivazione (setup) pari a ${formatEUR(economiche.setup)} oltre IVA di legge${
    economiche.setupRateale && economiche.setupRate.length > 1
      ? `, suddivisa in ${economiche.setupRate.length} (${numberToItalian(economiche.setupRate.length)}) rate mensili consecutive secondo il piano riportato di seguito:\n${economiche.setupRate
          .map(
            (r, i) =>
              `     • Rata ${i + 1} di ${economiche.setupRate.length}: ${formatEUR(r)} oltre IVA — dovuta entro il ${i === 0 ? "5° giorno successivo alla sottoscrizione del Contratto" : `${i * 30 + 5}° giorno successivo alla sottoscrizione`}`,
          )
          .join("\n")}\n     Il mancato pagamento anche di una sola rata comporta la decadenza dal beneficio del termine ai sensi dell'art. 1186 c.c. ed il diritto del Fornitore di esigere immediatamente l'intero importo residuo del setup, oltre agli effetti previsti al successivo art. 4.`
      : ", dovuta alla sottoscrizione del Contratto"
  };
  b) Un canone${annuale ? " annuale anticipato" : " mensile"} pari a ${annuale ? `${formatEUR(totaleAnnuale)} oltre IVA (sconto del ${economiche.scontoAnnuale}% sul totale annuo)` : `${formatEUR(economiche.canoneMensile)} oltre IVA`}, dovuto a fronte dell'erogazione continuativa del servizio.

In caso di configurazione multi-sede, la sede principale è inclusa nel canone del piano sottoscritto. Per ciascuna sede aggiuntiva collegata allo stesso Cliente e allo stesso piano, il Cliente corrisponderà un canone pari al 50% (cinquanta per cento) del canone del piano selezionato, con la medesima periodicità di fatturazione. Eventuali sedi aggiuntive attivate in corso di annualità saranno fatturate pro-rata per il periodo residuo, salvo diverso accordo scritto.

Modalità di pagamento: ${paymentMethodLabel(economiche.metodoPagamento)}.

In caso di canone annuale, l'importo è interamente dovuto in via anticipata e non è soggetto a rimborso in caso di cessazione anticipata del Contratto per causa imputabile al Cliente.

Il Fornitore si riserva la facoltà di adeguare annualmente i canoni in misura pari alla variazione dell'indice ISTAT FOI, dandone comunicazione scritta al Cliente con almeno 30 giorni di preavviso.

In caso di ritardato pagamento, decorreranno automaticamente, ai sensi del D.Lgs. 231/2002, gli interessi di mora nella misura legale, oltre al diritto del Fornitore di sospendere il servizio come da art. 4.`,
    },
    {
      id: "sospensione",
      title: "4. Sospensione del servizio per morosità",
      body: `In caso di mancato pagamento di una qualsiasi somma dovuta entro 15 (quindici) giorni dalla relativa scadenza, il Fornitore avrà la facoltà — previa diffida inviata anche solo a mezzo email — di sospendere immediatamente l'erogazione del servizio, inclusa la visibilità pubblica del sito tenant, senza che ciò costituisca inadempimento contrattuale.

La ripresa del servizio avverrà entro 48 ore lavorative dalla regolarizzazione integrale del pagamento e dei relativi interessi. Il periodo di sospensione non sospende né proroga la durata contrattuale e non dà diritto ad alcun rimborso.

Il perdurare della morosità oltre 30 (trenta) giorni costituisce grave inadempimento e legittima il Fornitore a risolvere il Contratto ai sensi dell'art. 1456 c.c., fermo il diritto al risarcimento del danno.`,
    },
    {
      id: "upgrade",
      title: "5. Upgrade e downgrade di piano",
      body: `Il Cliente può richiedere in qualsiasi momento il passaggio ad un piano superiore (upgrade). In tal caso:
  • se il Contratto è a fatturazione mensile, il nuovo canone si applica a partire dal primo giorno del mese successivo alla richiesta;
  • se il Contratto è a fatturazione annuale anticipata, il Cliente corrisponderà — contestualmente alla richiesta — la differenza tra il canone del nuovo piano e quello del piano in essere, calcolata pro-rata sui mesi residui dell'annualità in corso.

Non è ammesso il passaggio ad un piano inferiore (downgrade) in corso di Contratto. Il Cliente potrà richiedere il downgrade esclusivamente in occasione del rinnovo annuale, dandone comunicazione scritta con almeno 30 giorni di preavviso rispetto alla scadenza.`,
    },
    {
      id: "supporto",
      title: "6. Supporto tecnico e consulenza operativa",
      body: `Il Contratto include:
  a) Supporto tecnico illimitato, da intendersi quale assistenza per la normale gestione del sito e per l'intervento in caso di malfunzionamento totale o parziale dello stesso. Il supporto tecnico è erogato via email/ticket nei giorni lavorativi dal lunedì al venerdì, dalle ore 9:00 alle ore 18:00.
  b) Fino a 2 (due) consulenze operative annue. Per "consulenza operativa" si intende l'attività di affiancamento, formazione, configurazione personalizzata o restyling di contenuti svolta su richiesta del Cliente ed eccedente la normale gestione tecnica.

Eventuali ulteriori consulenze operative oltre le due incluse saranno fatturate separatamente, secondo tariffe orarie/forfettarie concordate per iscritto di volta in volta tra le Parti, e non rientrano nell'oggetto del presente Contratto.

Livelli di Servizio (SLA):
  • Problemi bloccanti (sito non raggiungibile o impossibilità di gestione): presa in carico immediata e risoluzione entro 24 ore dalla segnalazione.
  • Problemi non bloccanti (malfunzionamenti parziali, errori grafici, anomalie su singoli moduli): risoluzione entro 72 ore dalla segnalazione.

Gli SLA si intendono calcolati su giorni lavorativi e non si applicano in caso di forza maggiore, fault di provider terzi (es. registrar, Google, provider cloud), interventi pianificati di manutenzione o cause non imputabili al Fornitore.`,
    },
    {
      id: "obblighi-cliente",
      title: "7. Obblighi e dichiarazioni del Cliente",
      body: `Il Cliente si obbliga a:
  a) fornire dati completi, veritieri ed aggiornati ai fini della corretta erogazione del servizio e della fatturazione;
  b) custodire con la massima diligenza le credenziali di accesso, restando responsabile di ogni attività compiuta tramite le stesse;
  c) utilizzare il servizio nel rispetto della normativa vigente, in particolare in materia di tutela della proprietà intellettuale, concorrenza, pubblicità e protezione dei dati personali;
  d) non caricare sulla piattaforma contenuti illeciti, offensivi, diffamatori, lesivi di diritti di terzi o in violazione di obblighi di legge;
  e) manlevare e tenere indenne il Fornitore da qualsiasi pretesa di terzi derivante dall'utilizzo del servizio o dai contenuti caricati dal Cliente.`,
    },
    {
      id: "proprieta",
      title: "8. Proprietà intellettuale",
      body: `La piattaforma ${brandInfo.platformName}, il relativo codice sorgente, l'architettura tecnica, le interfacce, i marchi, i loghi e ogni elemento distintivo sono e restano di esclusiva proprietà del Fornitore. Il Contratto attribuisce al Cliente unicamente un diritto d'uso del servizio nei termini sopra indicati, senza alcun trasferimento di titolarità.

I contenuti caricati dal Cliente (testi, immagini, menu, listini, dati di prenotazione, dati commerciali) restano di proprietà esclusiva del Cliente, il quale concede al Fornitore una licenza non esclusiva, gratuita e limitata al periodo contrattuale, al solo fine di erogare il servizio.`,
    },
    {
      id: "cessione",
      title: "9. Divieto di cessione",
      body: `Il presente Contratto non è cedibile a terzi, in tutto o in parte, da parte del Cliente, salvo espressa autorizzazione scritta del Fornitore. Qualsiasi cessione effettuata in violazione del presente articolo sarà priva di effetto e legittimerà il Fornitore alla risoluzione del Contratto ai sensi dell'art. 1456 c.c.

Il Fornitore può cedere il Contratto a società del proprio gruppo, controllate, controllanti o aventi causa, dandone comunicazione scritta al Cliente.`,
    },
    {
      id: "limitazione",
      title: "10. Limitazione di responsabilità",
      body: `Il Fornitore eroga il servizio secondo principi di diligenza professionale e di best practice di settore, in modalità "as a service" e con architettura cloud. Non è prevista, né può essere prevista, alcuna garanzia assoluta di continuità del servizio, essendo lo stesso dipendente anche da fornitori terzi (hosting, CDN, DNS, registrar).

Salvo i casi di dolo o colpa grave, la responsabilità complessiva del Fornitore — per qualsiasi titolo, anche cumulativamente — è limitata all'importo dei canoni corrisposti dal Cliente nei 12 mesi precedenti l'evento dannoso.

In nessun caso il Fornitore risponderà di danni indiretti, mancato guadagno, perdita di opportunità commerciali, danno reputazionale o perdita di dati non imputabili a sua colpa esclusiva.`,
    },
    {
      id: "privacy",
      title: "11. Trattamento dei dati personali (GDPR)",
      body: `Le Parti si danno atto che, nell'erogazione del servizio, il Fornitore tratta dati personali di cui il Cliente è Titolare del trattamento ai sensi del Reg. UE 679/2016 ("GDPR"). Con la sottoscrizione del Contratto, il Cliente nomina il Fornitore Responsabile del trattamento ex art. 28 GDPR, secondo l'atto di nomina che costituisce Allegato A al presente Contratto.

Il Fornitore tratta i dati personali del Cliente (${individualClient ? "dati identificativi e di contatto" : "legale rappresentante, referenti e dati di contatto"}) in qualità di autonomo Titolare per le finalità di esecuzione contrattuale, fatturazione e adempimenti di legge, secondo l'informativa privacy disponibile su ${brandInfo.privacyUrl}.

Cessazione e portabilità dei dati: alla cessazione del Contratto, per qualsiasi causa, il Fornitore conserverà i dati e i contenuti del Cliente per un periodo di 12 (dodici) mesi, durante il quale il Cliente potrà richiederne l'export in formato strutturato (CSV/JSON). Decorso tale termine, il Fornitore procederà alla cancellazione definitiva dei dati, salvo obblighi di conservazione previsti dalla legge (es. dati fiscali e contabili).

Misure di sicurezza: il Fornitore adotta misure tecniche e organizzative adeguate, conformi all'art. 32 GDPR, includenti crittografia dei dati in transito, backup periodici, controllo degli accessi e log di sistema.`,
    },
    {
      id: "riservatezza",
      title: "12. Riservatezza",
      body: `Ciascuna Parte si impegna a mantenere strettamente riservate tutte le informazioni di carattere tecnico, commerciale, economico e personale di cui venga a conoscenza in occasione del Contratto, ad utilizzarle esclusivamente per le finalità contrattuali ed a non divulgarle a terzi senza il preventivo consenso scritto dell'altra Parte. L'obbligo di riservatezza permane per 5 (cinque) anni successivi alla cessazione del Contratto.`,
    },
    {
      id: "risoluzione",
      title: "13. Risoluzione espressa",
      body: `Ai sensi e per gli effetti dell'art. 1456 c.c., il Fornitore avrà diritto di risolvere il Contratto, mediante comunicazione scritta inviata anche a mezzo PEC, in caso di:
  a) mancato pagamento di canoni o corrispettivi protratto oltre 30 giorni dalla scadenza;
  b) violazione del divieto di cessione di cui all'art. 9;
  c) caricamento di contenuti illeciti o lesivi di diritti di terzi;
  d) utilizzo del servizio in violazione di legge o tale da arrecare danno al Fornitore o ad altri tenant della piattaforma;
  e) procedure concorsuali a carico del Cliente.`,
    },
    {
      id: "modifiche",
      title: "14. Modifiche ed evoluzione del servizio",
      body: `Il Fornitore ha facoltà di aggiornare, migliorare ed evolvere il servizio, anche introducendo nuovi moduli o funzionalità. Le modifiche che incidano sostanzialmente sui termini economici o sulle caratteristiche essenziali del servizio saranno comunicate al Cliente con almeno 30 giorni di preavviso scritto; in tal caso il Cliente avrà diritto di recedere senza penalità entro 30 giorni dal ricevimento della comunicazione.

Le modifiche meramente tecniche, evolutive o di sicurezza non costituiscono modifica contrattuale e non danno diritto di recesso.`,
    },
    {
      id: "forza-maggiore",
      title: "15. Forza maggiore",
      body: `Nessuna delle Parti sarà ritenuta responsabile per inadempimenti dovuti a cause di forza maggiore o caso fortuito, ivi inclusi a titolo esemplificativo: attacchi informatici diffusi, blackout dei provider cloud, eventi naturali, pandemie, provvedimenti dell'autorità, scioperi generali.`,
    },
    {
      id: "comunicazioni",
      title: "16. Comunicazioni",
      body: `Tutte le comunicazioni relative al Contratto, ivi incluse disdette e contestazioni, dovranno essere inviate per iscritto agli indirizzi PEC indicati in epigrafe. Le comunicazioni operative (ticket di supporto, richieste di consulenza, comunicazioni di servizio) potranno essere validamente scambiate via email.`,
    },
    {
      id: "legge-foro",
      title: "17. Legge applicabile e foro competente",
      body: individualClient
        ? `Il Contratto è regolato dalla legge italiana. Qualora il Cliente rivesta la qualità di consumatore, per ogni controversia derivante dal Contratto o ad esso connessa sarà competente il foro inderogabile previsto dalla normativa a tutela del consumatore. Negli altri casi sarà competente in via esclusiva il Foro di ${FORNITORE.foro}.`
        : `Il Contratto è regolato dalla legge italiana. Per ogni controversia derivante dal Contratto o ad esso connessa, sarà competente in via esclusiva il Foro di ${FORNITORE.foro}, con espressa esclusione di ogni altro foro eventualmente concorrente.`,
    },
    {
      id: "finali",
      title: "18. Disposizioni finali",
      body: `Il Contratto, unitamente ai suoi Allegati, costituisce la manifestazione integrale degli accordi intercorsi tra le Parti e annulla e sostituisce ogni precedente intesa, scritta o verbale, sul medesimo oggetto. Eventuali modifiche dovranno risultare da atto scritto sottoscritto da entrambe le Parti.

L'eventuale invalidità o inefficacia di una singola clausola non comporterà l'invalidità o l'inefficacia delle restanti clausole, che continueranno a produrre pieni effetti.`,
    },
  ];
}

export const VESSATORIE_RIF = [
  "2 (durata e rinnovo tacito)",
  "3 (adeguamento ISTAT)",
  "4 (sospensione per morosità)",
  "5 (divieto di downgrade in corso di contratto)",
  "9 (divieto di cessione)",
  "10 (limitazione di responsabilità)",
  "13 (clausola risolutiva espressa)",
  "14 (modifiche al servizio)",
  "17 (foro competente esclusivo)",
];
