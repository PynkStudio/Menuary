import { messages as en } from "./en";
import { mergeMessages } from "./_merge";

export const messages = mergeMessages(en, {
  marketing: {
    shell: {
      nav: { offer: "Oferta", about: "Studio", myAccount: "Llogaria ime", signIn: "Hyr", contact: "Flasim" },
      footer: { nav: "Navigimi", contacts: "Kontaktet", forRestaurants: "Për restorante", requestProposal: "Kërko ofertë", privacy: "Privatësia", cookie: "Cookies" },
    },
    home: {
      heroLabel: "Për restorante, bare dhe trattoria",
      heroH1a: "Lokali juaj online,",
      heroH1b: "pa komplikime.",
      heroSub: "Faqe profesionale, rezervime online dhe menaxhim i thjeshtë i pranisë suaj në Google Maps.",
      ctaDemo: "Kërko demo", ctaExample: "Shiko një shembull",
      badgeFreeCall: "Telefonata e parë falas", badgeOnline: "Online në 2-4 javë", badgeMultilang: "Shumëgjuhëshe · IT EN FR DE ES +",
    },
    contact: {
      label: "Kontakt", h1a: "Na tregoni për restorantin tuaj.", h1b: "Ju përgjigjemi me një ide konkrete.",
      emailLabel: "Na shkruani", phoneLabel: "Telefononi ose shkruani në WhatsApp", responseTime: "Përgjigje brenda 24 orësh në ditë pune.",
      locationNote: "Punojmë me restorante në të gjithë Europën.",
    },
    leadForm: {
      name: "Emri", restaurant: "Restoranti", email: "Email", phone: "Telefoni", city: "Qyteti", country: "Shteti",
      interest: "Interesi", message: "Objektivi", submit: "Dërgo kërkesën", success: "Kërkesa u dërgua",
      errorConnection: "Lidhja nuk është e disponueshme.", errorDefault: "Dërgimi dështoi.",
    },
  },
  bizery: {
    shell: { nav: { offer: "Oferta", about: "Studio", access: "Hyr", contact: "Flasim" } },
    home: {
      heroLabel: "Për studio dhe biznese shërbimesh",
      heroH1a: "Biznesi juaj online,", heroH1b: "pa komplikime.",
      ctaDemo: "Kërko demo", ctaHow: "Si funksionon",
    },
  },
} as const);
