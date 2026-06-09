import { messages as en } from "./en";
import { mergeMessages } from "./_merge";

export const messages = mergeMessages(en, {
  marketing: {
    shell: {
      nav: { offer: "Ponuda", about: "Studio", myAccount: "Moj račun", signIn: "Prijava", contact: "Razgovarajmo" },
      footer: { nav: "Navigacija", contacts: "Kontakti", forRestaurants: "Za restorane", requestProposal: "Zatraži ponudu", privacy: "Privatnost", cookie: "Kolačići" },
    },
    home: {
      heroLabel: "Za restorane, barove i konobe",
      heroH1a: "Vaš lokal online,",
      heroH1b: "bez komplikacija.",
      heroSub: "Profesionalna web stranica, online rezervacije i jednostavno upravljanje prisutnošću na Google Maps.",
      ctaDemo: "Zatraži demo", ctaExample: "Pogledaj primjer",
      badgeFreeCall: "Plaćate samo ako vam se sviđa", badgeOnline: "Online za 7 dana", badgeMultilang: "Višejezično · IT EN FR DE ES +",
    },
    contact: {
      label: "Kontakt", h1a: "Recite nam nešto o svom restoranu.", h1b: "Odgovorit ćemo konkretnim prijedlogom.",
      emailLabel: "Pišite nam", phoneLabel: "Nazovite ili pošaljite WhatsApp", responseTime: "Odgovor unutar 24 sata radnim danom.",
      locationNote: "Radimo s restoranima diljem Europe.",
    },
    leadForm: {
      name: "Ime", restaurant: "Restoran", email: "E-mail", phone: "Telefon", city: "Grad", country: "Država",
      interest: "Interes", message: "Cilj", submit: "Pošalji upit", success: "Upit poslan",
      errorConnection: "Veza nije dostupna.", errorDefault: "Slanje nije uspjelo.",
    },
  },
  bizery: {
    shell: { nav: { offer: "Ponuda", about: "Studio", access: "Prijava", contact: "Razgovarajmo" } },
    home: {
      heroLabel: "Za studije i uslužne tvrtke",
      heroH1a: "Vaše poslovanje online,", heroH1b: "bez komplikacija.",
      ctaDemo: "Zatraži demo", ctaHow: "Kako funkcionira",
    },
  },
} as const);
