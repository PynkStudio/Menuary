import { messages as en } from "./en";
import { mergeMessages } from "./_merge";

export const messages = mergeMessages(en, {
  marketing: {
    shell: {
      nav: { offer: "Erbjudande", about: "Studio", myAccount: "Mitt konto", signIn: "Logga in", contact: "Kontakta oss" },
      footer: { nav: "Navigation", contacts: "Kontakt", forRestaurants: "För restauranger", requestProposal: "Begär offert", privacy: "Integritet", cookie: "Cookies" },
    },
    home: {
      heroLabel: "För restauranger, barer och caféer",
      heroH1a: "Din verksamhet online,",
      heroH1b: "utan krångel.",
      heroSub: "Professionell webbplats, onlinebokningar och enkel hantering av Google Maps och din digitala närvaro.",
      ctaDemo: "Begär en demo",
      ctaExample: "Se ett exempel",
      badgeFreeCall: "Första samtalet gratis",
      badgeOnline: "Online på 2-4 veckor",
      badgeMultilang: "Flerspråkig · SV EN DE FI NO +",
    },
    contact: {
      label: "Kontakt", h1a: "Berätta om din restaurang.", h1b: "Vi svarar med ett konkret förslag.",
      emailLabel: "Skriv till oss", phoneLabel: "Ring eller skriv på WhatsApp", responseTime: "Svar inom 24 timmar på vardagar.",
      locationNote: "Vi arbetar med restauranger i hela Europa.",
    },
    leadForm: {
      name: "Namn", restaurant: "Restaurang", email: "E-post", phone: "Telefon", city: "Stad", country: "Land",
      interest: "Intresse", message: "Mål", submit: "Skicka förfrågan", success: "Förfrågan skickad",
      errorConnection: "Anslutning saknas.", errorDefault: "Det gick inte att skicka.",
    },
  },
  bizery: {
    shell: { nav: { offer: "Erbjudande", about: "Studio", access: "Logga in", contact: "Kontakta oss" } },
    home: {
      heroLabel: "För mottagningar och tjänsteföretag",
      heroH1a: "Ditt företag online,", heroH1b: "utan krångel.",
      ctaDemo: "Begär en demo", ctaHow: "Så fungerar det",
    },
  },
} as const);
