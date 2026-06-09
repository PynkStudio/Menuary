import { messages as en } from "./en";
import { mergeMessages } from "./_merge";

export const messages = mergeMessages(en, {
  marketing: {
    shell: {
      nav: { offer: "Ponudba", about: "Studio", myAccount: "Moj račun", signIn: "Prijava", contact: "Pogovorimo se" },
      footer: { nav: "Navigacija", contacts: "Kontakti", forRestaurants: "Za restavracije", requestProposal: "Zahtevaj ponudbo", privacy: "Zasebnost", cookie: "Piškotki" },
    },
    home: {
      heroLabel: "Za restavracije, bare in gostilne",
      heroH1a: "Vaš lokal na spletu,",
      heroH1b: "brez zapletov.",
      heroSub: "Profesionalna spletna stran, spletne rezervacije in enostavno upravljanje vaše prisotnosti na Google Maps.",
      ctaDemo: "Zahtevaj demo", ctaExample: "Oglej si primer",
      badgeFreeCall: "Plačate le, če vam je všeč", badgeOnline: "Na spletu v 7 dneh", badgeMultilang: "Večjezično · IT EN FR DE ES +",
    },
    contact: {
      label: "Kontakt", h1a: "Povejte nam o svoji restavraciji.", h1b: "Odgovorimo s konkretnim predlogom.",
      emailLabel: "Pišite nam", phoneLabel: "Pokličite ali pišite na WhatsApp", responseTime: "Odgovor v 24 urah ob delovnih dneh.",
      locationNote: "Delamo z restavracijami po vsej Evropi.",
    },
    leadForm: {
      name: "Ime", restaurant: "Restavracija", email: "E-pošta", phone: "Telefon", city: "Mesto", country: "Država",
      interest: "Interes", message: "Cilj", submit: "Pošlji povpraševanje", success: "Povpraševanje poslano",
      errorConnection: "Povezava ni na voljo.", errorDefault: "Pošiljanje ni uspelo.",
    },
  },
  bizery: {
    shell: { nav: { offer: "Ponudba", about: "Studio", access: "Prijava", contact: "Pogovorimo se" } },
    home: {
      heroLabel: "Za studie in storitvena podjetja",
      heroH1a: "Vaše podjetje na spletu,", heroH1b: "brez zapletov.",
      ctaDemo: "Zahtevaj demo", ctaHow: "Kako deluje",
    },
  },
} as const);
