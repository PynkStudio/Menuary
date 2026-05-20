import { messages as en } from "./en";
import { mergeMessages } from "./_merge";

export const messages = mergeMessages(en, {
  marketing: {
    shell: {
      nav: { offer: "Tarjous", about: "Studio", myAccount: "Oma tili", signIn: "Kirjaudu", contact: "Ota yhteyttä" },
      footer: { nav: "Navigointi", contacts: "Yhteystiedot", forRestaurants: "Ravintoloille", requestProposal: "Pyydä ehdotus", privacy: "Tietosuoja", cookie: "Evästeet" },
    },
    home: {
      heroLabel: "Ravintoloille, baareille ja kahviloille",
      heroH1a: "Yrityksesi verkkoon,",
      heroH1b: "ilman vaivaa.",
      heroSub: "Ammattimainen verkkosivusto, online-varaukset ja helppo Google Mapsin sekä digitaalisen näkyvyyden hallinta.",
      ctaDemo: "Pyydä demo",
      ctaExample: "Katso esimerkki",
      badgeFreeCall: "Ensimmäinen puhelu maksuton",
      badgeOnline: "Verkossa 2-4 viikossa",
      badgeMultilang: "Monikielinen · FI EN SV DE RU +",
    },
    contact: {
      label: "Yhteys", h1a: "Kerro meille ravintolastasi.", h1b: "Vastaamme konkreettisella ehdotuksella.",
      emailLabel: "Kirjoita meille", phoneLabel: "Soita tai lähetä WhatsApp-viesti", responseTime: "Vastaamme 24 tunnin kuluessa arkipäivisin.",
      locationNote: "Työskentelemme ravintoloiden kanssa kaikkialla Euroopassa.",
    },
    leadForm: {
      name: "Nimi", restaurant: "Ravintola", email: "Sähköposti", phone: "Puhelin", city: "Kaupunki", country: "Maa",
      interest: "Kiinnostus", message: "Tavoite", submit: "Lähetä pyyntö", success: "Pyyntö lähetetty",
      errorConnection: "Yhteys ei ole käytettävissä.", errorDefault: "Lähetys epäonnistui.",
    },
  },
  bizery: {
    shell: { nav: { offer: "Tarjous", about: "Studio", access: "Kirjaudu", contact: "Ota yhteyttä" } },
    home: {
      heroLabel: "Vastaanotoille ja palveluyrityksille",
      heroH1a: "Yrityksesi verkkoon,", heroH1b: "ilman vaivaa.",
      ctaDemo: "Pyydä demo", ctaHow: "Näin se toimii",
    },
  },
} as const);
