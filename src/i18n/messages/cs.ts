import { messages as en } from "./en";
import { mergeMessages } from "./_merge";

export const messages = mergeMessages(en, {
  marketing: {
    shell: {
      nav: { offer: "Nabídka", about: "Studio", myAccount: "Můj účet", signIn: "Přihlášení", contact: "Kontaktujte nás" },
      footer: { nav: "Navigace", contacts: "Kontakty", forRestaurants: "Pro restaurace", requestProposal: "Vyžádat nabídku", privacy: "Soukromí", cookie: "Cookies" },
    },
    home: {
      heroLabel: "Pro restaurace, bary a kavárny",
      heroH1a: "Váš podnik online,",
      heroH1b: "bez starostí.",
      heroSub: "Profesionální web, online rezervace a jednoduchá správa Google Maps a digitální prezentace.",
      ctaDemo: "Vyžádat demo",
      ctaExample: "Zobrazit příklad",
      badgeFreeCall: "První hovor zdarma",
      badgeOnline: "Online za 2-4 týdny",
      badgeMultilang: "Vícejazyčné · CS EN DE PL SK +",
    },
    contact: {
      label: "Kontakt", h1a: "Řekněte nám o své restauraci.", h1b: "Odpovíme konkrétním návrhem.",
      emailLabel: "Napište nám", phoneLabel: "Zavolejte nebo napište na WhatsApp", responseTime: "Odpověď do 24 hodin v pracovních dnech.",
      locationNote: "Pracujeme s restauracemi po celé Evropě.",
    },
    leadForm: {
      name: "Jméno", restaurant: "Restaurace", email: "E-mail", phone: "Telefon", city: "Město", country: "Země",
      interest: "Zájem", message: "Cíl", submit: "Odeslat poptávku", success: "Poptávka odeslána",
      errorConnection: "Připojení není dostupné.", errorDefault: "Odeslání se nezdařilo.",
    },
  },
  bizery: {
    shell: { nav: { offer: "Nabídka", about: "Studio", access: "Přihlášení", contact: "Kontaktujte nás" } },
    home: {
      heroLabel: "Pro ordinace a servisní firmy",
      heroH1a: "Vaše firma online,", heroH1b: "bez starostí.",
      ctaDemo: "Vyžádat demo", ctaHow: "Jak to funguje",
    },
  },
} as const);
