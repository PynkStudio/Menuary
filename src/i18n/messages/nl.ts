import { messages as en } from "./en";
import { mergeMessages } from "./_merge";

export const messages = mergeMessages(en, {
  marketing: {
    shell: {
      nav: { offer: "Aanbod", about: "Studio", myAccount: "Mijn account", signIn: "Inloggen", contact: "Neem contact op" },
      footer: { nav: "Navigatie", contacts: "Contacten", forRestaurants: "Voor restaurants", requestProposal: "Vraag een voorstel aan", privacy: "Privacy", cookie: "Cookies" },
    },
    home: {
      heroLabel: "Voor restaurants, bars en eetcafes",
      heroH1a: "Uw zaak online,",
      heroH1b: "zonder gedoe.",
      heroSub: "Professionele website, online reserveringen en eenvoudig beheer van Google Maps en uw digitale aanwezigheid.",
      ctaDemo: "Vraag een demo aan",
      ctaExample: "Bekijk een voorbeeld",
      badgeFreeCall: "Eerste gesprek gratis",
      badgeOnline: "Online in 2-4 weken",
      badgeMultilang: "Meertalig · NL EN DE FR ES +",
    },
    contact: {
      label: "Contact", h1a: "Vertel ons over uw restaurant.", h1b: "Wij antwoorden met een concreet voorstel.",
      emailLabel: "Schrijf ons", phoneLabel: "Bel of WhatsApp ons", responseTime: "Antwoord binnen 24 uur op werkdagen.",
      locationNote: "Wij werken met restaurants in heel Europa.",
    },
    leadForm: {
      name: "Naam", restaurant: "Restaurant", email: "E-mail", phone: "Telefoon", city: "Stad", country: "Land",
      interest: "Interesse", message: "Doel", submit: "Aanvraag verzenden", success: "Aanvraag verzonden",
      errorConnection: "Verbinding niet beschikbaar.", errorDefault: "Verzenden mislukt.",
    },
  },
  bizery: {
    shell: { nav: { offer: "Aanbod", about: "Studio", access: "Inloggen", contact: "Neem contact op" } },
    home: {
      heroLabel: "Voor studio's en dienstverlenende bedrijven",
      heroH1a: "Uw bedrijf online,", heroH1b: "zonder gedoe.",
      ctaDemo: "Vraag een demo aan", ctaHow: "Hoe het werkt",
    },
  },
} as const);
