import { messages as en } from "./en";
import { mergeMessages } from "./_merge";

export const messages = mergeMessages(en, {
  marketing: {
    shell: {
      nav: { offer: "Oferta", about: "Studio", myAccount: "Moje konto", signIn: "Zaloguj się", contact: "Porozmawiajmy" },
      footer: { nav: "Nawigacja", contacts: "Kontakt", forRestaurants: "Dla restauracji", requestProposal: "Poproś o ofertę", privacy: "Prywatność", cookie: "Cookies" },
    },
    home: {
      heroLabel: "Dla restauracji, barów i kawiarni",
      heroH1a: "Twój lokal online,",
      heroH1b: "bez komplikacji.",
      heroSub: "Profesjonalna strona, rezerwacje online oraz proste zarządzanie Google Maps i obecnością cyfrową.",
      ctaDemo: "Poproś o demo",
      ctaExample: "Zobacz przykład",
      badgeFreeCall: "Pierwsza rozmowa gratis",
      badgeOnline: "Online w 2-4 tygodnie",
      badgeMultilang: "Wielojęzyczne · PL EN DE FR UA +",
    },
    contact: {
      label: "Kontakt", h1a: "Opowiedz nam o swojej restauracji.", h1b: "Odpowiemy konkretną propozycją.",
      emailLabel: "Napisz do nas", phoneLabel: "Zadzwoń lub napisz na WhatsApp", responseTime: "Odpowiedź w ciągu 24 godzin w dni robocze.",
      locationNote: "Pracujemy z restauracjami w całej Europie.",
    },
    leadForm: {
      name: "Imię i nazwisko", restaurant: "Restauracja", email: "E-mail", phone: "Telefon", city: "Miasto", country: "Kraj",
      interest: "Zainteresowanie", message: "Cel", submit: "Wyślij zapytanie", success: "Zapytanie wysłane",
      errorConnection: "Połączenie niedostępne.", errorDefault: "Wysyłka nie powiodła się.",
    },
  },
  bizery: {
    shell: { nav: { offer: "Oferta", about: "Studio", access: "Zaloguj się", contact: "Porozmawiajmy" } },
    home: {
      heroLabel: "Dla gabinetów i firm usługowych",
      heroH1a: "Twoja firma online,", heroH1b: "bez komplikacji.",
      ctaDemo: "Poproś o demo", ctaHow: "Jak to działa",
    },
  },
} as const);
