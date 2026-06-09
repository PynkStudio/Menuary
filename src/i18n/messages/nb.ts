import { messages as en } from "./en";
import { mergeMessages } from "./_merge";

export const messages = mergeMessages(en, {
  marketing: {
    shell: {
      nav: { offer: "Tilbud", about: "Studio", myAccount: "Min konto", signIn: "Logg inn", contact: "Kontakt oss" },
      footer: { nav: "Navigasjon", contacts: "Kontakt", forRestaurants: "For restauranter", requestProposal: "Be om tilbud", privacy: "Personvern", cookie: "Informasjonskapsler" },
    },
    home: {
      heroLabel: "For restauranter, barer og kafeer",
      heroH1a: "Din virksomhet på nett,",
      heroH1b: "uten stress.",
      heroSub: "Profesjonell nettside, online booking og enkel administrasjon av Google Maps og din digitale tilstedeværelse.",
      ctaDemo: "Be om demo",
      ctaExample: "Se et eksempel",
      badgeFreeCall: "Betal kun hvis du liker det",
      badgeOnline: "Online på 7 dager",
      badgeMultilang: "Flerspråklig · NO EN DE SV DA +",
    },
    contact: {
      label: "Kontakt", h1a: "Fortell oss om restauranten din.", h1b: "Vi svarer med et konkret forslag.",
      emailLabel: "Skriv til oss", phoneLabel: "Ring eller skriv på WhatsApp", responseTime: "Svar innen 24 timer på virkedager.",
      locationNote: "Vi jobber med restauranter i hele Europa.",
    },
    leadForm: {
      name: "Navn", restaurant: "Restaurant", email: "E-post", phone: "Telefon", city: "By", country: "Land",
      interest: "Interesse", message: "Mål", submit: "Send forespørsel", success: "Forespørsel sendt",
      errorConnection: "Tilkobling ikke tilgjengelig.", errorDefault: "Sending mislyktes.",
    },
  },
  bizery: {
    shell: { nav: { offer: "Tilbud", about: "Studio", access: "Logg inn", contact: "Kontakt oss" } },
    home: {
      heroLabel: "For klinikker og tjenestebedrifter",
      heroH1a: "Din bedrift på nett,", heroH1b: "uten stress.",
      ctaDemo: "Be om demo", ctaHow: "Slik fungerer det",
    },
  },
} as const);
