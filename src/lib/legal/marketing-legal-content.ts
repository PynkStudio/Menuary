import { PLATFORM_OPERATOR } from "@/lib/legal/platform-operator";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type MarketingBrandLegalInfo = {
  /** Nome del brand mostrato nei testi (es. "Bizery"). */
  brandName: string;
  /** Dominio pubblico senza protocollo (es. "bizery.it"). */
  domain: string;
  /** Indirizzo di contatto pubblicato nel footer del sito. */
  contactEmail: string;
};

/**
 * Testi privacy/cookie condivisi tra i siti di piattaforma (Menuary, Bizery,
 * Orpheo): stesso titolare (PLATFORM_OPERATOR), stessi cookie tecnici
 * (NEXT_LOCALE, MENUARY_MARKET impostati dal middleware) e stessa assenza di
 * profilazione. Cambiano solo nome brand, dominio e contatto.
 */
export function buildMarketingPrivacySections(brand: MarketingBrandLegalInfo): LegalSection[] {
  return [
    {
      title: "Titolare del trattamento",
      paragraphs: [
        `Il titolare del trattamento dei dati personali raccolti attraverso il sito ${brand.domain} è, ai sensi dell'art. 4 n. 7 GDPR:`,
        `${PLATFORM_OPERATOR.legalName} — ${PLATFORM_OPERATOR.address}. P.IVA ${PLATFORM_OPERATOR.piva}. PEC: ${PLATFORM_OPERATOR.pec}.`,
        `Per ogni richiesta relativa alla privacy puoi scrivere a ${brand.contactEmail}.`,
      ],
    },
    {
      title: "Dati trattati",
      paragraphs: [`Attraverso il sito ${brand.domain} trattiamo le seguenti categorie di dati:`],
      bullets: [
        "Dati forniti volontariamente tramite il modulo di contatto o la richiesta di demo: nome, e-mail, telefono, nome dell'attività e contenuto del messaggio.",
        "Dati tecnici di navigazione (indirizzo IP, log delle richieste) trattati dai fornitori di hosting per erogare il sito e garantirne la sicurezza.",
        "Preferenze tecniche di lingua e mercato, salvate in cookie sul tuo dispositivo (vedi la cookie policy).",
      ],
    },
    {
      title: "Finalità e base giuridica",
      paragraphs: ["I dati sono trattati per le seguenti finalità:"],
      bullets: [
        "Rispondere alle richieste di informazioni e preparare una proposta commerciale — misure precontrattuali adottate su tua richiesta (art. 6, par. 1, lett. b GDPR).",
        "Adempiere a obblighi di legge, contabili o fiscali (art. 6, par. 1, lett. c GDPR).",
        "Garantire la sicurezza e il corretto funzionamento del sito — legittimo interesse del titolare (art. 6, par. 1, lett. f GDPR).",
      ],
    },
    {
      title: "Conservazione",
      paragraphs: [
        "I dati inviati tramite i moduli di contatto sono conservati per il tempo necessario a gestire la richiesta e l'eventuale rapporto commerciale che ne deriva. I log tecnici sono conservati dai fornitori di hosting per periodi limitati, secondo le rispettive policy.",
      ],
    },
    {
      title: "Destinatari",
      paragraphs: [
        "I dati possono essere trattati, per conto del titolare e in qualità di responsabili del trattamento, dai fornitori tecnici che erogano l'infrastruttura del servizio:",
      ],
      bullets: [
        "Hosting e CDN (Vercel Inc.).",
        "Database e backend (Supabase).",
        "Servizi e-mail utilizzati per rispondere alle richieste.",
      ],
    },
    {
      title: "Trasferimenti extra-UE",
      paragraphs: [
        "Alcuni fornitori possono trattare dati al di fuori dello Spazio Economico Europeo. In tal caso il trasferimento avviene sulla base di garanzie adeguate ai sensi degli artt. 44 e ss. GDPR, come le clausole contrattuali standard approvate dalla Commissione Europea.",
      ],
    },
    {
      title: "I tuoi diritti",
      paragraphs: [
        "Puoi esercitare in ogni momento i diritti previsti dagli artt. 15-22 GDPR: accesso, rettifica, cancellazione, limitazione del trattamento, opposizione e portabilità dei dati.",
        `Per esercitarli scrivi a ${brand.contactEmail}. Hai inoltre il diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).`,
      ],
    },
  ];
}

export function buildMarketingCookieSections(brand: MarketingBrandLegalInfo): LegalSection[] {
  return [
    {
      title: "Cosa sono i cookie",
      paragraphs: [
        `I cookie sono piccoli file di testo che un sito salva sul tuo dispositivo per memorizzare informazioni tecniche o preferenze. Questa pagina descrive i cookie utilizzati dal sito ${brand.domain}.`,
      ],
    },
    {
      title: "Cookie utilizzati da questo sito",
      paragraphs: [`${brand.domain} utilizza esclusivamente cookie tecnici, necessari al funzionamento del sito:`],
      bullets: [
        "NEXT_LOCALE — memorizza la lingua scelta per mostrarti il sito nella tua lingua. Durata: 12 mesi.",
        "MENUARY_MARKET — memorizza il mercato di riferimento (paese) per mostrarti prezzi e contenuti corretti. Durata: 12 mesi.",
      ],
    },
    {
      title: "Statistiche senza cookie",
      paragraphs: [
        "Per le statistiche di utilizzo il sito usa Vercel Analytics, che raccoglie dati aggregati e anonimi sulle visite senza installare cookie e senza creare identificatori persistenti dei visitatori.",
      ],
    },
    {
      title: "Nessuna profilazione",
      paragraphs: [
        "Il sito non utilizza cookie di profilazione, pubblicitari o di tracciamento di terze parti. Per questo motivo non è richiesto un banner di consenso: i cookie tecnici non necessitano di consenso ai sensi della normativa vigente.",
      ],
    },
    {
      title: "Come gestire i cookie",
      paragraphs: [
        "Puoi eliminare o bloccare i cookie in qualsiasi momento dalle impostazioni del tuo browser. Bloccando i cookie tecnici alcune preferenze, come la lingua scelta, non verranno ricordate tra una visita e l'altra.",
        `Per qualsiasi domanda puoi scrivere a ${brand.contactEmail}.`,
      ],
    },
  ];
}
