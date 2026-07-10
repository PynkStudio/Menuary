import {
  FORNITORE,
  BRAND_INFO,
  formatEUR,
  computeYearlyTotal,
  isIndividualClient,
  paymentMethodLabel,
  taxClauseSuffix,
  DEFAULT_ORDER_COMMISSION_PCT,
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

export type IaModules = { telefono: boolean; whatsapp: boolean; upselling: boolean };

export function getIaModules(data: ContractData): IaModules {
  return (
    data.servizio?.moduliIa ?? { telefono: false, whatsapp: false, upselling: false }
  );
}

export function hasConversationalIa(data: ContractData): boolean {
  const m = getIaModules(data);
  return m.telefono || m.whatsapp;
}

export function hasUpsellingIa(data: ContractData): boolean {
  return getIaModules(data).upselling;
}

export function hasTrialPeriod(data: ContractData): boolean {
  return Boolean(data.economiche.periodoProva);
}

/**
 * Ordine degli articoli numerati. Le clausole IA compaiono solo quando il
 * relativo modulo è attivo; di conseguenza la numerazione è dinamica e ogni
 * rinvio interno va risolto tramite clauseNumber().
 */
function numberedClauseOrder(data: ContractData): string[] {
  const ids = [
    "oggetto",
    "durata",
  ];
  if (hasTrialPeriod(data)) ids.push("periodo-prova");
  ids.push("corrispettivi", "sospensione", "upgrade", "supporto");
  if (hasConversationalIa(data)) ids.push("moduli-ia");
  if (hasUpsellingIa(data)) ids.push("moduli-ia-upselling");
  ids.push(
    "obblighi-cliente",
    "proprieta",
    "cessione",
    "limitazione",
    "privacy",
    "riservatezza",
    "risoluzione",
    "modifiche",
    "forza-maggiore",
    "comunicazioni",
    "legge-foro",
    "finali",
  );
  return ids;
}

/** Numero dell'articolo con l'id indicato nella configurazione corrente (1-based). */
export function clauseNumber(data: ContractData, id: string): number {
  return numberedClauseOrder(data).indexOf(id) + 1;
}

function iaChannelsLabel(ia: IaModules): string {
  if (ia.telefono && ia.whatsapp) return "Assistente telefonico e Assistente WhatsApp";
  if (ia.telefono) return "Assistente telefonico";
  return "Assistente WhatsApp";
}

export function buildClauses(data: ContractData): ClauseBlock[] {
  const { cliente, servizio, economiche } = data;
  const brandInfo = BRAND_INFO[data.brand];
  const individualClient = isIndividualClient(data);
  const ia = getIaModules(data);
  const commissionePct = economiche.commissioneOrdiniPct ?? DEFAULT_ORDER_COMMISSION_PCT;
  const clienteEpigrafe = individualClient
    ? `${cliente.ragioneSociale || "_______________"}, C.F. ${cliente.cf || "_______________"}, residente in ${cliente.sedeLegale || "_______________"}, email/PEC ${cliente.pec || cliente.email || "_______________"}`
    : `${cliente.ragioneSociale || "_______________"}, P.IVA ${cliente.piva || "_______________"}, C.F. ${cliente.cf || "_______________"}, con sede in ${cliente.sedeLegale || "_______________"}, PEC ${cliente.pec || "_______________"}, in persona del legale rappresentante ${cliente.legaleRappresentante || "_______________"}`;
  const annuale = economiche.cicloFatturazione === "yearly";
  const totaleAnnuale = computeYearlyTotal(
    economiche.canoneMensile,
    economiche.scontoAnnuale,
  );
  const ordinaryFirstPayment = economiche.setup + (annuale ? totaleAnnuale : economiche.canoneMensile);
  const ordinaryFirstPaymentTotal = economiche.esenzioneIva
    ? (ordinaryFirstPayment + 2) * 1.04
    : ordinaryFirstPayment * 1.22;
  const trialConfirmationBalance = Math.max(
    0,
    ordinaryFirstPaymentTotal - economiche.depositoCauzionale,
  );

  const order = numberedClauseOrder(data);
  const n = (id: string) => order.indexOf(id) + 1;

  const iaConversationalChannels = [
    ia.telefono
      ? `l'«Assistente telefonico AI», che risponde in automatico alle chiamate in entrata, fornisce informazioni e raccoglie ordini e prenotazioni, con possibilità di trasferimento a un operatore umano`
      : "",
    ia.whatsapp
      ? `l'«Assistente WhatsApp AI», che gestisce in automatico le conversazioni con i clienti su WhatsApp, raccoglie ordini e invia link di pagamento o di riepilogo`
      : "",
  ].filter(Boolean);

  const iaThirdParties = [
    ia.telefono
      ? "il provider di voice-AI per l'assistente telefonico e l'operatore di telefonia/messaggistica per numerazioni, chiamate e SMS"
      : "",
    ia.whatsapp ? "la WhatsApp Business Platform di Meta per la messaggistica" : "",
    "i provider di modelli di linguaggio per l'interpretazione delle conversazioni",
  ].filter(Boolean);

  const numbered: Record<string, { title: string; body: string }> = {
    oggetto: {
      title: "Oggetto del Contratto",
      body: `Il Fornitore concede al Cliente, in modalità SaaS (Software as a Service), il diritto non esclusivo, non trasferibile e revocabile di accedere e utilizzare la piattaforma ${brandInfo.platformName} nella configurazione corrispondente al piano "${servizio.pianoNome}".

Il servizio include in particolare:
${servizio.moduliInclusi.map((m) => `  • ${m}`).join("\n")}

Il sito del Cliente sarà raggiungibile sull'istanza tenant "${servizio.tenantSlug || "_______________"}"${servizio.dominio ? ` e sul dominio personalizzato "${servizio.dominio}"` : ""}. Per le nuove attivazioni, qualora il Cliente richieda la registrazione di un nuovo dominio, il primo anno di registrazione del dominio è incluso nel piano sottoscritto. Dal secondo anno, e per ogni successivo rinnovo, il costo del dominio sarà addebitato separatamente al Cliente al prezzo effettivamente applicato dal provider/registrar, senza alcun rincaro o margine da parte del Fornitore. La titolarità del dominio resta in capo al Cliente, salvo diversa indicazione tecnica richiesta dal registrar o diverso accordo scritto tra le Parti.`,
    },
    durata: {
      title: "Durata, rinnovo e recesso",
      body: `Il Contratto ha durata di 12 (dodici) mesi a decorrere dalla data di attivazione del servizio.

Alla scadenza, il Contratto si rinnova tacitamente per ulteriori periodi di 12 (dodici) mesi, salvo disdetta inviata da una delle Parti a mezzo PEC con almeno 30 (trenta) giorni di preavviso rispetto alla data di scadenza naturale o di rinnovo.

Il recesso non dà diritto ad alcun rimborso, totale o parziale, dei canoni e dei corrispettivi già versati, fatto salvo quanto eventualmente previsto da norme inderogabili di legge.`,
    },
    "periodo-prova": {
      title: "Periodo di prova e deposito cauzionale",
      body: `Le Parti convengono che l'attivazione iniziale del servizio avvenga con un periodo di prova della durata di 1 (un) mese a decorrere dalla data di attivazione tecnica del servizio. Per accedere al periodo di prova, il Cliente versa al Fornitore un deposito cauzionale pari a ${formatEUR(economiche.depositoCauzionale)}, infruttifero e non produttivo di interessi.

Durante il periodo di prova restano applicabili le condizioni tecniche, gli obblighi del Cliente, le limitazioni di responsabilità e, se presenti, le condizioni relative ai Moduli IA. Eventuali funzioni a consumo o costi variabili maturati durante la prova, inclusi a titolo esemplificativo chiamate telefoniche, messaggi, utilizzo di provider IA, trascrizioni, traffico o altri costi vivi imputabili all'utilizzo del servizio, restano a carico del Cliente.

Alla scadenza del periodo di prova, qualora il Cliente confermi la prosecuzione del servizio, il Contratto prosegue secondo la durata e il rinnovo di cui all'art. ${n("durata")}. Il deposito cauzionale già versato viene imputato al primo pagamento dovuto e il Cliente salda la differenza residua rispetto all'importo ordinario di attivazione e primo canone, pari a ${formatEUR(ordinaryFirstPaymentTotal)}. Alla data di sottoscrizione, tale differenza è pari a ${formatEUR(trialConfirmationBalance)}, oltre agli eventuali costi a consumo maturati e non ancora fatturati.

Qualora il Cliente comunichi per iscritto di non voler procedere oltre il periodo di prova, il Contratto cessa alla fine del mese di prova senza rinnovo. In tal caso il Fornitore restituisce il deposito cauzionale detraendo: (i) il canone mensile del mese di prova, pari a ${formatEUR(economiche.canoneMensile)} ${taxClauseSuffix(economiche)}; (ii) gli eventuali costi a consumo o costi vivi maturati durante la prova, incluse le funzioni IA a consumo e le chiamate, se presenti; (iii) eventuali importi rimasti insoluti. Se le somme dovute superano il deposito versato, il Cliente resta obbligato a corrispondere la differenza.`,
    },
    corrispettivi: {
      title: "Corrispettivi e modalità di pagamento",
      body: `${economiche.periodoProva ? `Per il periodo di prova si applica il deposito cauzionale disciplinato all'art. ${n("periodo-prova")}. In caso di conferma del servizio, il deposito sarà imputato al primo pagamento e il Cliente salderà la differenza residua secondo le modalità indicate nel medesimo articolo.\n\n` : ""}Il Cliente si obbliga a corrispondere al Fornitore:
  a) Una quota una tantum di attivazione (setup) pari a ${formatEUR(economiche.setup)} ${taxClauseSuffix(economiche)}${
    economiche.setupRateale && economiche.setupRate.length > 1
      ? `, suddivisa in ${economiche.setupRate.length} (${numberToItalian(economiche.setupRate.length)}) rate mensili consecutive secondo il piano riportato di seguito:\n${economiche.setupRate
          .map(
            (r, i) =>
              `     • Rata ${i + 1} di ${economiche.setupRate.length}: ${formatEUR(r)} ${taxClauseSuffix(economiche)} — dovuta entro il ${i === 0 ? "5° giorno successivo alla sottoscrizione del Contratto" : `${i * 30 + 5}° giorno successivo alla sottoscrizione`}`,
          )
          .join("\n")}\n     Il mancato pagamento anche di una sola rata comporta la decadenza dal beneficio del termine ai sensi dell'art. 1186 c.c. ed il diritto del Fornitore di esigere immediatamente l'intero importo residuo del setup, oltre agli effetti previsti al successivo art. ${n("sospensione")}.`
      : ", dovuta alla sottoscrizione del Contratto"
  };
  b) Un canone${annuale ? " annuale anticipato" : " mensile"} pari a ${annuale ? (economiche.scontoAnnuale > 0 ? `${formatEUR(totaleAnnuale)} ${taxClauseSuffix(economiche)} (sconto del ${economiche.scontoAnnuale}% sul totale annuo)` : `${formatEUR(totaleAnnuale)} ${taxClauseSuffix(economiche)}`) : `${formatEUR(economiche.canoneMensile)} ${taxClauseSuffix(economiche)}`}, dovuto a fronte dell'erogazione continuativa del servizio.

In caso di configurazione multi-sede, la sede principale è inclusa nel canone del piano sottoscritto. Per ciascuna sede aggiuntiva collegata allo stesso Cliente e allo stesso piano, il Cliente corrisponderà un canone pari al 50% (cinquanta per cento) del canone del piano selezionato, con la medesima periodicità di fatturazione. Eventuali sedi aggiuntive attivate in corso di annualità saranno fatturate pro-rata per il periodo residuo, salvo diverso accordo scritto.${
        hasConversationalIa(data)
          ? `\n\nÈ inoltre dovuta la commissione sugli ordini confermati gestiti dai moduli IA conversazionali, disciplinata all'art. ${n("moduli-ia")}.`
          : ""
      }

Modalità di pagamento: ${paymentMethodLabel(economiche.metodoPagamento)}.

In caso di canone annuale, l'importo è interamente dovuto in via anticipata e non è soggetto a rimborso in caso di cessazione anticipata del Contratto per causa imputabile al Cliente.

Il Fornitore si riserva la facoltà di adeguare annualmente i canoni in misura pari alla variazione dell'indice ISTAT FOI, dandone comunicazione scritta al Cliente con almeno 30 giorni di preavviso.

In caso di ritardato pagamento, decorreranno automaticamente, ai sensi del D.Lgs. 231/2002, gli interessi di mora nella misura legale, oltre al diritto del Fornitore di sospendere il servizio come da art. ${n("sospensione")}.`,
    },
    sospensione: {
      title: "Sospensione del servizio per morosità",
      body: `In caso di mancato pagamento di una qualsiasi somma dovuta entro 15 (quindici) giorni dalla relativa scadenza, il Fornitore avrà la facoltà — previa diffida inviata anche solo a mezzo email — di sospendere immediatamente l'erogazione del servizio, inclusa la visibilità pubblica del sito tenant, senza che ciò costituisca inadempimento contrattuale.

La ripresa del servizio avverrà entro 48 ore lavorative dalla regolarizzazione integrale del pagamento e dei relativi interessi. Il periodo di sospensione non sospende né proroga la durata contrattuale e non dà diritto ad alcun rimborso.

Il perdurare della morosità oltre 30 (trenta) giorni costituisce grave inadempimento e legittima il Fornitore a risolvere il Contratto ai sensi dell'art. 1456 c.c., fermo il diritto al risarcimento del danno.`,
    },
    upgrade: {
      title: "Upgrade e downgrade di piano",
      body: `Il Cliente può richiedere in qualsiasi momento il passaggio ad un piano superiore (upgrade). In tal caso:
  • se il Contratto è a fatturazione mensile, il nuovo canone si applica a partire dal primo giorno del mese successivo alla richiesta;
  • se il Contratto è a fatturazione annuale anticipata, il Cliente corrisponderà — contestualmente alla richiesta — la differenza tra il canone del nuovo piano e quello del piano in essere, calcolata pro-rata sui mesi residui dell'annualità in corso.

Non è ammesso il passaggio ad un piano inferiore (downgrade) in corso di Contratto. Il Cliente potrà richiedere il downgrade esclusivamente in occasione del rinnovo annuale, dandone comunicazione scritta con almeno 30 giorni di preavviso rispetto alla scadenza.`,
    },
    supporto: {
      title: "Supporto tecnico e consulenza operativa",
      body: `Il Contratto include:
  a) Supporto tecnico illimitato, da intendersi quale assistenza per la normale gestione del sito e per l'intervento in caso di malfunzionamento totale o parziale dello stesso. Il supporto tecnico è erogato via email/ticket nei giorni lavorativi dal lunedì al venerdì, dalle ore 9:00 alle ore 18:00.
  b) Fino a 2 (due) consulenze operative annue. Per "consulenza operativa" si intende l'attività di affiancamento, formazione, configurazione personalizzata o restyling di contenuti svolta su richiesta del Cliente ed eccedente la normale gestione tecnica.

Eventuali ulteriori consulenze operative oltre le due incluse saranno fatturate separatamente, secondo tariffe orarie/forfettarie concordate per iscritto di volta in volta tra le Parti, e non rientrano nell'oggetto del presente Contratto.

Livelli di Servizio (SLA):
  • Problemi bloccanti (sito non raggiungibile o impossibilità di gestione): presa in carico immediata e risoluzione entro 24 ore dalla segnalazione.
  • Problemi non bloccanti (malfunzionamenti parziali, errori grafici, anomalie su singoli moduli): risoluzione entro 72 ore dalla segnalazione.

Gli SLA si intendono calcolati su giorni lavorativi e non si applicano in caso di forza maggiore, fault di provider terzi (es. registrar, Google, provider cloud), interventi pianificati di manutenzione o cause non imputabili al Fornitore.`,
    },
    "moduli-ia": {
      title: `Moduli di intelligenza artificiale conversazionali (${iaChannelsLabel(ia)})`,
      body: `Il piano sottoscritto include i seguenti moduli di intelligenza artificiale conversazionali (i "Moduli IA conversazionali"): ${iaConversationalChannels.join("; ")}. Il presente articolo ne disciplina funzionamento, corrispettivi e responsabilità.

  a) Natura del servizio e assenza di garanzia di accuratezza. I Moduli IA conversazionali si basano su modelli di linguaggio e tecnologie di riconoscimento/sintesi vocale forniti da soggetti terzi, di natura probabilistica, che possono produrre risposte, trascrizioni o interpretazioni inesatte, incomplete o non pertinenti. Costituiscono strumenti di assistenza e non sostituiscono la verifica e il controllo umano: il Cliente resta l'unico responsabile della verifica della correttezza di ordini, prenotazioni, importi e dati di contatto raccolti tramite i Moduli IA prima di darvi seguito.

  b) Dipendenza da fornitori terzi. L'erogazione dei Moduli IA conversazionali dipende da piattaforme di terzi (in particolare ${iaThirdParties.join("; ")}), soggette ai termini, alle policy e alla disponibilità dei rispettivi fornitori, che possono modificarli, sospenderli o interromperli. L'attivazione e la permanenza di numerazioni telefoniche e di account WhatsApp Business sono subordinate all'approvazione e al rispetto delle policy di tali terzi; il Fornitore non garantisce l'attivazione né la continuità in caso di rigetto o di violazione delle policy di terzi imputabile al Cliente.

  c) Commissione sugli ordini confermati. A fronte dei Moduli IA conversazionali, il Cliente riconosce al Fornitore una commissione forfettaria pari al ${commissionePct}% del valore degli ordini confermati raccolti tramite tali moduli, ${taxClauseSuffix(economiche)}. Si considera "ordine confermato" l'ordine per il quale, dopo la generazione del link di checkout, sia decorsa la finestra temporale di modifica/annullamento, divenendo definitivo. Nessuna commissione è dovuta per chiamate o messaggi a carattere informativo, per richieste che non si traducono in un ordine confermato, né per ordini annullati entro la predetta finestra.
  Modalità di applicazione:
     • per gli ordini pagati online tramite Stripe, la commissione è trattenuta direttamente tramite Stripe all'atto dell'incasso;
     • per gli ordini con pagamento in contanti alla consegna/ritiro o con altri metodi di pagamento, la commissione è fatturata separatamente con cadenza mensile posticipata, con pagamento a 15 (quindici) giorni data fattura.
  Il mancato pagamento della commissione produce gli effetti di cui all'art. ${n("sospensione")}.

  d) Registrazione e trascrizione. Per ragioni di tutela della riservatezza, il Fornitore non conserva le registrazioni audio delle chiamate. Potrà essere conservata una trascrizione testuale della conversazione al solo fine di erogare e migliorare il servizio. I relativi trattamenti sono svolti dal Fornitore in qualità di Responsabile del trattamento per conto del Cliente, secondo l'Allegato A; i fornitori delle tecnologie IA operano quali sub-responsabili autorizzati ai sensi del medesimo Allegato.

  e) Obblighi e dichiarazioni del Cliente. Il Cliente, in qualità di Titolare del trattamento dei dati degli utenti finali, si obbliga a: (i) informare in modo chiaro gli utenti che interagiscono con un sistema automatizzato e non con un operatore umano; (ii) informare gli utenti dell'eventuale conservazione della trascrizione della conversazione; (iii) acquisire e gestire i consensi necessari per le comunicazioni di marketing e per l'uso dei canali telefonico e WhatsApp; (iv) rispettare le policy della WhatsApp Business Platform e la normativa in materia di comunicazioni elettroniche e tutela dei consumatori. Il Cliente manleva e tiene indenne il Fornitore da qualsiasi pretesa di terzi o sanzione derivante dalla violazione dei presenti obblighi.

  f) Limitazione di responsabilità specifica. I Moduli IA conversazionali sono erogati secondo criteri di diligenza professionale e in modalità "best effort", senza garanzia di disponibilità continuativa, di risposta a tutte le chiamate o i messaggi, né di accuratezza degli output. Fermo quanto previsto all'art. ${n("limitazione")}, il Fornitore non risponde di ordini o prenotazioni errati, mancati, duplicati o persi, di errori di interpretazione o trascrizione, né di decisioni assunte dal Cliente o da terzi sulla base degli output dei Moduli IA. Il Fornitore può sospendere o limitare i Moduli IA, anche senza preavviso, in caso di uso abusivo, violazione delle policy dei fornitori terzi, rischi per la sicurezza o mancato pagamento dei corrispettivi.`,
    },
    "moduli-ia-upselling": {
      title: "Modulo di intelligenza artificiale di suggerimento (upselling)",
      body: `Il piano sottoscritto (disponibile dal tier 2 in su) include un modulo di intelligenza artificiale di suggerimento (upselling) che propone agli utenti prodotti, abbinamenti o integrazioni nel corso dell'ordine.

  a) Natura e limiti. Anche tale modulo si basa su tecnologie probabilistiche e può generare suggerimenti errati, non pertinenti o relativi a prodotti non disponibili; il Cliente è tenuto a verificarne l'adeguatezza e resta l'unico responsabile dell'offerta commerciale presentata ai propri clienti.

  b) Corrispettivi. Il costo del modulo è interamente compreso nel canone mensile del piano e non comporta alcun corrispettivo aggiuntivo né commissioni sugli ordini.

  c) Responsabilità. Si applica la limitazione di responsabilità di cui all'art. ${n("limitazione")}. Il Fornitore non risponde di mancati guadagni, di reclami della clientela del Cliente, né di scelte commerciali assunte sulla base dei suggerimenti generati.`,
    },
    "obblighi-cliente": {
      title: "Obblighi e dichiarazioni del Cliente",
      body: `Il Cliente si obbliga a:
  a) fornire dati completi, veritieri ed aggiornati ai fini della corretta erogazione del servizio e della fatturazione;
  b) custodire con la massima diligenza le credenziali di accesso, restando responsabile di ogni attività compiuta tramite le stesse;
  c) utilizzare il servizio nel rispetto della normativa vigente, in particolare in materia di tutela della proprietà intellettuale, concorrenza, pubblicità e protezione dei dati personali;
  d) non caricare sulla piattaforma contenuti illeciti, offensivi, diffamatori, lesivi di diritti di terzi o in violazione di obblighi di legge;
  e) manlevare e tenere indenne il Fornitore da qualsiasi pretesa di terzi derivante dall'utilizzo del servizio o dai contenuti caricati dal Cliente.`,
    },
    proprieta: {
      title: "Proprietà intellettuale",
      body: `La piattaforma ${brandInfo.platformName}, il relativo codice sorgente, l'architettura tecnica, le interfacce, i marchi, i loghi e ogni elemento distintivo sono e restano di esclusiva proprietà del Fornitore. Il Contratto attribuisce al Cliente unicamente un diritto d'uso del servizio nei termini sopra indicati, senza alcun trasferimento di titolarità.

I contenuti caricati dal Cliente (testi, immagini, menu, listini, dati di prenotazione, dati commerciali) restano di proprietà esclusiva del Cliente, il quale concede al Fornitore una licenza non esclusiva, gratuita e limitata al periodo contrattuale, al solo fine di erogare il servizio.`,
    },
    cessione: {
      title: "Divieto di cessione",
      body: `Il presente Contratto non è cedibile a terzi, in tutto o in parte, da parte del Cliente, salvo espressa autorizzazione scritta del Fornitore. Qualsiasi cessione effettuata in violazione del presente articolo sarà priva di effetto e legittimerà il Fornitore alla risoluzione del Contratto ai sensi dell'art. 1456 c.c.

Il Fornitore può cedere il Contratto a società del proprio gruppo, controllate, controllanti o aventi causa, dandone comunicazione scritta al Cliente.`,
    },
    limitazione: {
      title: "Limitazione di responsabilità",
      body: `Il Fornitore eroga il servizio secondo principi di diligenza professionale e di best practice di settore, in modalità "as a service" e con architettura cloud. Non è prevista, né può essere prevista, alcuna garanzia assoluta di continuità del servizio, essendo lo stesso dipendente anche da fornitori terzi (hosting, CDN, DNS, registrar).

Salvo i casi di dolo o colpa grave, la responsabilità complessiva del Fornitore — per qualsiasi titolo, anche cumulativamente — è limitata all'importo dei canoni corrisposti dal Cliente nei 12 mesi precedenti l'evento dannoso.

In nessun caso il Fornitore risponderà di danni indiretti, mancato guadagno, perdita di opportunità commerciali, danno reputazionale o perdita di dati non imputabili a sua colpa esclusiva.`,
    },
    privacy: {
      title: "Trattamento dei dati personali (GDPR)",
      body: `Le Parti si danno atto che, nell'erogazione del servizio, il Fornitore tratta dati personali di cui il Cliente è Titolare del trattamento ai sensi del Reg. UE 679/2016 ("GDPR"). Con la sottoscrizione del Contratto, il Cliente nomina il Fornitore Responsabile del trattamento ex art. 28 GDPR, secondo l'atto di nomina che costituisce Allegato A al presente Contratto.

Il Fornitore tratta i dati personali del Cliente (${individualClient ? "dati identificativi e di contatto" : "legale rappresentante, referenti e dati di contatto"}) in qualità di autonomo Titolare per le finalità di esecuzione contrattuale, fatturazione e adempimenti di legge, secondo l'informativa privacy disponibile su ${brandInfo.privacyUrl}.

Cessazione e portabilità dei dati: alla cessazione del Contratto, per qualsiasi causa, il Fornitore conserverà i dati e i contenuti del Cliente per un periodo di 12 (dodici) mesi, durante il quale il Cliente potrà richiederne l'export in formato strutturato (CSV/JSON). Decorso tale termine, il Fornitore procederà alla cancellazione definitiva dei dati, salvo obblighi di conservazione previsti dalla legge (es. dati fiscali e contabili).

Misure di sicurezza: il Fornitore adotta misure tecniche e organizzative adeguate, conformi all'art. 32 GDPR, includenti crittografia dei dati in transito, backup periodici, controllo degli accessi e log di sistema.`,
    },
    riservatezza: {
      title: "Riservatezza",
      body: `Ciascuna Parte si impegna a mantenere strettamente riservate tutte le informazioni di carattere tecnico, commerciale, economico e personale di cui venga a conoscenza in occasione del Contratto, ad utilizzarle esclusivamente per le finalità contrattuali ed a non divulgarle a terzi senza il preventivo consenso scritto dell'altra Parte. L'obbligo di riservatezza permane per 5 (cinque) anni successivi alla cessazione del Contratto.`,
    },
    risoluzione: {
      title: "Risoluzione espressa",
      body: `Ai sensi e per gli effetti dell'art. 1456 c.c., il Fornitore avrà diritto di risolvere il Contratto, mediante comunicazione scritta inviata anche a mezzo PEC, in caso di:
  a) mancato pagamento di canoni o corrispettivi protratto oltre 30 giorni dalla scadenza;
  b) violazione del divieto di cessione di cui all'art. ${n("cessione")};
  c) caricamento di contenuti illeciti o lesivi di diritti di terzi;
  d) utilizzo del servizio in violazione di legge o tale da arrecare danno al Fornitore o ad altri tenant della piattaforma;
  e) procedure concorsuali a carico del Cliente.`,
    },
    modifiche: {
      title: "Modifiche ed evoluzione del servizio",
      body: `Il Fornitore ha facoltà di aggiornare, migliorare ed evolvere il servizio, anche introducendo nuovi moduli o funzionalità. Le modifiche che incidano sostanzialmente sui termini economici o sulle caratteristiche essenziali del servizio saranno comunicate al Cliente con almeno 30 giorni di preavviso scritto; in tal caso il Cliente avrà diritto di recedere senza penalità entro 30 giorni dal ricevimento della comunicazione.

Le modifiche meramente tecniche, evolutive o di sicurezza non costituiscono modifica contrattuale e non danno diritto di recesso.`,
    },
    "forza-maggiore": {
      title: "Forza maggiore",
      body: `Nessuna delle Parti sarà ritenuta responsabile per inadempimenti dovuti a cause di forza maggiore o caso fortuito, ivi inclusi a titolo esemplificativo: attacchi informatici diffusi, blackout dei provider cloud, eventi naturali, pandemie, provvedimenti dell'autorità, scioperi generali.`,
    },
    comunicazioni: {
      title: "Comunicazioni",
      body: `Tutte le comunicazioni relative al Contratto, ivi incluse disdette e contestazioni, dovranno essere inviate per iscritto agli indirizzi PEC indicati in epigrafe. Le comunicazioni operative (ticket di supporto, richieste di consulenza, comunicazioni di servizio) potranno essere validamente scambiate via email.`,
    },
    "legge-foro": {
      title: "Legge applicabile e foro competente",
      body: individualClient
        ? `Il Contratto è regolato dalla legge italiana. Qualora il Cliente rivesta la qualità di consumatore, per ogni controversia derivante dal Contratto o ad esso connessa sarà competente il foro inderogabile previsto dalla normativa a tutela del consumatore. Negli altri casi sarà competente in via esclusiva il Foro di ${FORNITORE.foro}.`
        : `Il Contratto è regolato dalla legge italiana. Per ogni controversia derivante dal Contratto o ad esso connessa, sarà competente in via esclusiva il Foro di ${FORNITORE.foro}, con espressa esclusione di ogni altro foro eventualmente concorrente.`,
    },
    finali: {
      title: "Disposizioni finali",
      body: `Il Contratto, unitamente ai suoi Allegati, costituisce la manifestazione integrale degli accordi intercorsi tra le Parti e annulla e sostituisce ogni precedente intesa, scritta o verbale, sul medesimo oggetto. Eventuali modifiche dovranno risultare da atto scritto sottoscritto da entrambe le Parti.

L'eventuale invalidità o inefficacia di una singola clausola non comporterà l'invalidità o l'inefficacia delle restanti clausole, che continueranno a produrre pieni effetti.`,
    },
  };

  const blocks: ClauseBlock[] = [
    {
      id: "premesse",
      title: "Premesse",
      body: `Il presente contratto (di seguito "Contratto") è stipulato tra ${FORNITORE.ragioneSociale}, P.IVA ${FORNITORE.piva}, con sede in ${FORNITORE.indirizzo}, PEC ${FORNITORE.pec}, in persona del legale rappresentante ${FORNITORE.legaleRappresentante} (di seguito "Fornitore" o "${brandInfo.platformName}"), e ${clienteEpigrafe} (di seguito "Cliente").

Premesso che il Fornitore eroga "${brandInfo.platformName}", ${brandInfo.verticalDescription}, e che il Cliente intende acquistare il servizio nei termini di seguito indicati.`,
    },
  ];

  for (const id of order) {
    const c = numbered[id];
    if (!c) continue;
    blocks.push({ id, title: `${n(id)}. ${c.title}`, body: c.body });
  }

  return blocks;
}

/**
 * Riferimenti alle clausole vessatorie (artt. 1341-1342 c.c.) con la numerazione
 * effettiva della configurazione corrente. Le voci IA compaiono solo quando il
 * relativo modulo è attivo.
 */
export function buildVessatorieRif(data: ContractData): string[] {
  const n = (id: string) => clauseNumber(data, id);
  const rif: string[] = [
    `${n("durata")} (durata e rinnovo tacito)`,
    `${n("corrispettivi")} (adeguamento ISTAT)`,
    `${n("sospensione")} (sospensione per morosità)`,
    `${n("upgrade")} (divieto di downgrade in corso di contratto)`,
  ];
  if (hasTrialPeriod(data)) {
    rif.push(
      `${n("periodo-prova")} (periodo di prova: deposito cauzionale, imputazione, trattenute e costi a consumo)`,
    );
  }
  if (hasConversationalIa(data)) {
    rif.push(
      `${n("moduli-ia")} (moduli IA: commissione sugli ordini, esclusioni di responsabilità e facoltà di sospensione)`,
    );
  }
  rif.push(
    `${n("cessione")} (divieto di cessione)`,
    `${n("limitazione")} (limitazione di responsabilità)`,
    `${n("risoluzione")} (clausola risolutiva espressa)`,
    `${n("modifiche")} (modifiche al servizio)`,
    `${n("legge-foro")} (foro competente esclusivo)`,
  );
  return rif;
}
