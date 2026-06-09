import { messages as en } from "./en";
import { mergeMessages } from "./_merge";

export const messages = mergeMessages(en, {
  marketing: {
    shell: {
      nav: { offer: "Tilbud", about: "Studio", myAccount: "Min konto", signIn: "Log ind", contact: "Kontakt os" },
      footer: { nav: "Navigation", contacts: "Kontakt", forRestaurants: "For restauranter", requestProposal: "Anmod om tilbud", privacy: "Privatliv", cookie: "Cookies" },
    },
    home: {
      heroLabel: "For restauranter, barer og cafeer",
      heroH1a: "Din forretning online,",
      heroH1b: "uden besvær.",
      heroSub: "Professionel hjemmeside, online booking og enkel styring af Google Maps og din digitale tilstedeværelse.",
      ctaDemo: "Anmod om demo",
      ctaExample: "Se et eksempel",
      badgeFreeCall: "Betal kun hvis du kan lide det",
      badgeOnline: "Online på 7 dage",
      badgeMultilang: "Flersproget · DA EN DE SV NO +",
    },
    contact: {
      label: "Kontakt", h1a: "Fortæl os om din restaurant.", h1b: "Vi svarer med et konkret forslag.",
      emailLabel: "Skriv til os", phoneLabel: "Ring eller skriv på WhatsApp", responseTime: "Svar inden for 24 timer på hverdage.",
      locationNote: "Vi arbejder med restauranter i hele Europa.",
    },
    leadForm: {
      name: "Navn", restaurant: "Restaurant", email: "E-mail", phone: "Telefon", city: "By", country: "Land",
      interest: "Interesse", message: "Mål", submit: "Send forespørgsel", success: "Forespørgsel sendt",
      errorConnection: "Forbindelse ikke tilgængelig.", errorDefault: "Afsendelse mislykkedes.",
    },
  },
  bizery: {
    shell: { nav: { offer: "Tilbud", about: "Studio", access: "Log ind", contact: "Kontakt os" } },
    home: {
      heroLabel: "For klinikker og servicevirksomheder",
      heroH1a: "Din virksomhed online,", heroH1b: "uden besvær.",
      ctaDemo: "Anmod om demo", ctaHow: "Sådan fungerer det",
    },
  },
} as const);
