import type { AppLocale } from "@/i18n/locales";
import type { MarketCode } from "@/lib/markets";
import type { PricingPlan } from "@/lib/platform-pricing";

type PlanLabelSet = {
  presence: string;
  booking: string;
  appointments: string;
  operations: string;
};

const PLAN_LABELS: Record<AppLocale, PlanLabelSet> = {
  it: { presence: "Presenza", booking: "Prenotazioni", appointments: "Appuntamenti", operations: "Operatività" },
  en: { presence: "Online Presence", booking: "Bookings", appointments: "Appointments", operations: "Operations" },
  fr: { presence: "Présence", booking: "Réservations", appointments: "Rendez-vous", operations: "Opérations" },
  es: { presence: "Presencia", booking: "Reservas", appointments: "Citas", operations: "Operativa" },
  de: { presence: "Präsenz", booking: "Reservierungen", appointments: "Termine", operations: "Betrieb" },
  pt: { presence: "Presença", booking: "Reservas", appointments: "Marcações", operations: "Operações" },
  nl: { presence: "Aanwezigheid", booking: "Reserveringen", appointments: "Afspraken", operations: "Operaties" },
  da: { presence: "Synlighed", booking: "Bookinger", appointments: "Aftaler", operations: "Drift" },
  sv: { presence: "Närvaro", booking: "Bokningar", appointments: "Tidsbokning", operations: "Drift" },
  nb: { presence: "Synlighet", booking: "Bookinger", appointments: "Avtaler", operations: "Drift" },
  fi: { presence: "Näkyvyys", booking: "Varaukset", appointments: "Ajanvaraukset", operations: "Toiminta" },
  pl: { presence: "Obecność", booking: "Rezerwacje", appointments: "Wizyty", operations: "Operacje" },
  cs: { presence: "Prezentace", booking: "Rezervace", appointments: "Schůzky", operations: "Provoz" },
  sl: { presence: "Prisotnost", booking: "Rezervacije", appointments: "Termini", operations: "Operativa" },
  hr: { presence: "Prisutnost", booking: "Rezervacije", appointments: "Termini", operations: "Operativa" },
  sq: { presence: "Prania", booking: "Rezervime", appointments: "Takime", operations: "Operacione" },
  el: { presence: "Παρουσία", booking: "Κρατήσεις", appointments: "Ραντεβού", operations: "Λειτουργίες" },
};

export function getPlanLabels(locale: AppLocale, vertical: "food" | "services"): [string, string, string] {
  const labels = PLAN_LABELS[locale] ?? PLAN_LABELS.en;
  return [
    labels.presence,
    vertical === "services" ? labels.appointments : labels.booking,
    labels.operations,
  ];
}

export function localizePricingPlanName(plan: PricingPlan, locale: AppLocale, vertical: "food" | "services"): string {
  const labels = PLAN_LABELS[locale] ?? PLAN_LABELS.en;
  if (plan.slug === "presenza") return labels.presence;
  if (plan.slug === "prenotazioni") return vertical === "services" ? labels.appointments : labels.booking;
  if (plan.slug === "operativita") return labels.operations;
  return plan.marketing_name;
}

export type MockupCopy = {
  dashboardToday: string;
  dashboardBookings: string;
  dashboardAverage: string;
  dashboardHours: string;
  dashboardUpdated: string;
  dashboardUpdatedWhen: string;
  googleCard: string;
  googleOpen: string;
  phoneName: string[];
  phoneMeta: string;
  phoneAction: string;
  phoneStatus: string;
};

const FOOD_MOCKUPS: Record<MarketCode, Pick<MockupCopy, "phoneName" | "phoneMeta">> = {
  IT: { phoneName: ["Trattoria", "Da Marco"], phoneMeta: "Bologna · cucina tipica" },
  FR: { phoneName: ["Bistrot", "Maison Moreau"], phoneMeta: "Lyon · cuisine française" },
  DE: { phoneName: ["Gasthaus", "Müller"], phoneMeta: "München · regionale küche" },
  ES: { phoneName: ["Taberna", "La Plaza"], phoneMeta: "Madrid · cocina local" },
  PT: { phoneName: ["Casa", "Do Mercado"], phoneMeta: "Lisboa · cozinha portuguesa" },
  NL: { phoneName: ["Bistro", "De Markt"], phoneMeta: "Amsterdam · lokale keuken" },
  BE: { phoneName: ["Brasserie", "De Markt"], phoneMeta: "Bruxelles · cuisine belge" },
  AT: { phoneName: ["Gasthaus", "Hofmann"], phoneMeta: "Wien · österreichische küche" },
  CH: { phoneName: ["Restaurant", "Alpenhof"], phoneMeta: "Zürich · swiss dining" },
  IE: { phoneName: ["The", "Harbour Table"], phoneMeta: "Dublin · modern dining" },
  DK: { phoneName: ["Bistro", "Havnen"], phoneMeta: "København · nordisk køkken" },
  SE: { phoneName: ["Krog", "Söder"], phoneMeta: "Stockholm · nordiskt kök" },
  NO: { phoneName: ["Bistro", "Bryggen"], phoneMeta: "Oslo · nordisk kjøkken" },
  FI: { phoneName: ["Ravintola", "Satama"], phoneMeta: "Helsinki · suomalainen keittiö" },
  PL: { phoneName: ["Bistro", "Rynek"], phoneMeta: "Warszawa · kuchnia lokalna" },
  CZ: { phoneName: ["Restaurace", "U Mostu"], phoneMeta: "Praha · česká kuchyně" },
  SI: { phoneName: ["Gostilna", "Pri Luki"], phoneMeta: "Ljubljana · domača kuhinja" },
  HR: { phoneName: ["Konoba", "Marina"], phoneMeta: "Split · domaća kuhinja" },
  AL: { phoneName: ["Restorant", "Bregdeti"], phoneMeta: "Tiranë · kuzhinë shqiptare" },
  GR: { phoneName: ["Taverna", "Thalassa"], phoneMeta: "Athens · ελληνική κουζίνα" },
  BR: { phoneName: ["Bistrô", "Do Mercado"], phoneMeta: "São Paulo · cozinha brasileira" },
  AU: { phoneName: ["Harbour", "Bistro"], phoneMeta: "Sydney · modern dining" },
};

const SERVICE_MOCKUPS: Record<MarketCode, Pick<MockupCopy, "phoneName" | "phoneMeta">> = {
  IT: { phoneName: ["Studio", "Legale Rossi"], phoneMeta: "Milano · diritto civile" },
  FR: { phoneName: ["Cabinet", "Moreau"], phoneMeta: "Paris · droit civil" },
  DE: { phoneName: ["Kanzlei", "Müller"], phoneMeta: "Berlin · zivilrecht" },
  ES: { phoneName: ["Estudio", "García"], phoneMeta: "Madrid · derecho civil" },
  PT: { phoneName: ["Clínica", "Santos"], phoneMeta: "Lisboa · consultas" },
  NL: { phoneName: ["Praktijk", "De Vries"], phoneMeta: "Amsterdam · advies" },
  BE: { phoneName: ["Cabinet", "Lefevre"], phoneMeta: "Bruxelles · conseil" },
  AT: { phoneName: ["Kanzlei", "Hofer"], phoneMeta: "Wien · zivilrecht" },
  CH: { phoneName: ["Praxis", "Keller"], phoneMeta: "Zürich · beratung" },
  IE: { phoneName: ["Legal", "O'Connor"], phoneMeta: "Dublin · civil law" },
  DK: { phoneName: ["Klinik", "Nielsen"], phoneMeta: "København · rådgivning" },
  SE: { phoneName: ["Studio", "Lindberg"], phoneMeta: "Stockholm · rådgivning" },
  NO: { phoneName: ["Klinikk", "Hansen"], phoneMeta: "Oslo · rådgivning" },
  FI: { phoneName: ["Studio", "Korhonen"], phoneMeta: "Helsinki · neuvonta" },
  PL: { phoneName: ["Kancelaria", "Kowalski"], phoneMeta: "Warszawa · prawo cywilne" },
  CZ: { phoneName: ["Kancelář", "Novák"], phoneMeta: "Praha · občanské právo" },
  SI: { phoneName: ["Pisarna", "Kovač"], phoneMeta: "Ljubljana · svetovanje" },
  HR: { phoneName: ["Ured", "Horvat"], phoneMeta: "Zagreb · savjetovanje" },
  AL: { phoneName: ["Studio", "Hoxha"], phoneMeta: "Tiranë · këshillim" },
  GR: { phoneName: ["Γραφείο", "Παπαδόπουλος"], phoneMeta: "Athens · συμβουλευτική" },
  BR: { phoneName: ["Clínica", "Silva"], phoneMeta: "São Paulo · atendimento" },
  AU: { phoneName: ["Legal", "Harper"], phoneMeta: "Sydney · civil law" },
};

const MOCKUP_LABELS: Record<AppLocale, Omit<MockupCopy, "phoneName" | "phoneMeta">> = {
  it: { dashboardToday: "Oggi", dashboardBookings: "prenotazioni", dashboardAverage: "★ media", dashboardHours: "Orari", dashboardUpdated: "Aggiornati", dashboardUpdatedWhen: "ieri", googleCard: "Google · scheda", googleOpen: "Aperto · chiude alle 23:00", phoneAction: "Prenota un tavolo", phoneStatus: "Aperto oggi" },
  en: { dashboardToday: "Today", dashboardBookings: "bookings", dashboardAverage: "★ average", dashboardHours: "Hours", dashboardUpdated: "Updated", dashboardUpdatedWhen: "yesterday", googleCard: "Google · listing", googleOpen: "Open · closes at 23:00", phoneAction: "Book a table", phoneStatus: "Open today" },
  fr: { dashboardToday: "Aujourd'hui", dashboardBookings: "réservations", dashboardAverage: "★ moyenne", dashboardHours: "Horaires", dashboardUpdated: "Mis à jour", dashboardUpdatedWhen: "hier", googleCard: "Google · fiche", googleOpen: "Ouvert · ferme à 23:00", phoneAction: "Réserver une table", phoneStatus: "Ouvert aujourd'hui" },
  es: { dashboardToday: "Hoy", dashboardBookings: "reservas", dashboardAverage: "★ media", dashboardHours: "Horarios", dashboardUpdated: "Actualizado", dashboardUpdatedWhen: "ayer", googleCard: "Google · ficha", googleOpen: "Abierto · cierra a las 23:00", phoneAction: "Reservar mesa", phoneStatus: "Abierto hoy" },
  de: { dashboardToday: "Heute", dashboardBookings: "reservierungen", dashboardAverage: "★ schnitt", dashboardHours: "Öffnungszeiten", dashboardUpdated: "Aktualisiert", dashboardUpdatedWhen: "gestern", googleCard: "Google · eintrag", googleOpen: "Geöffnet · schließt um 23:00", phoneAction: "Tisch buchen", phoneStatus: "Heute geöffnet" },
  pt: { dashboardToday: "Hoje", dashboardBookings: "reservas", dashboardAverage: "★ média", dashboardHours: "Horários", dashboardUpdated: "Atualizado", dashboardUpdatedWhen: "ontem", googleCard: "Google · ficha", googleOpen: "Aberto · fecha às 23:00", phoneAction: "Reservar mesa", phoneStatus: "Aberto hoje" },
  nl: { dashboardToday: "Vandaag", dashboardBookings: "reserveringen", dashboardAverage: "★ gemiddeld", dashboardHours: "Openingstijden", dashboardUpdated: "Bijgewerkt", dashboardUpdatedWhen: "gisteren", googleCard: "Google · vermelding", googleOpen: "Open · sluit om 23:00", phoneAction: "Reserveer een tafel", phoneStatus: "Vandaag open" },
  da: { dashboardToday: "I dag", dashboardBookings: "bookinger", dashboardAverage: "★ gennemsnit", dashboardHours: "Åbningstider", dashboardUpdated: "Opdateret", dashboardUpdatedWhen: "i går", googleCard: "Google · profil", googleOpen: "Åben · lukker kl. 23:00", phoneAction: "Book et bord", phoneStatus: "Åben i dag" },
  sv: { dashboardToday: "I dag", dashboardBookings: "bokningar", dashboardAverage: "★ snitt", dashboardHours: "Öppettider", dashboardUpdated: "Uppdaterad", dashboardUpdatedWhen: "i går", googleCard: "Google · profil", googleOpen: "Öppet · stänger 23:00", phoneAction: "Boka bord", phoneStatus: "Öppet idag" },
  nb: { dashboardToday: "I dag", dashboardBookings: "bookinger", dashboardAverage: "★ snitt", dashboardHours: "Åpningstider", dashboardUpdated: "Oppdatert", dashboardUpdatedWhen: "i går", googleCard: "Google · profil", googleOpen: "Åpent · stenger 23:00", phoneAction: "Bestill bord", phoneStatus: "Åpent i dag" },
  fi: { dashboardToday: "Tänään", dashboardBookings: "varaukset", dashboardAverage: "★ keskiarvo", dashboardHours: "Aukioloajat", dashboardUpdated: "Päivitetty", dashboardUpdatedWhen: "eilen", googleCard: "Google · profiili", googleOpen: "Avoinna · sulkeutuu 23:00", phoneAction: "Varaa pöytä", phoneStatus: "Avoinna tänään" },
  pl: { dashboardToday: "Dziś", dashboardBookings: "rezerwacje", dashboardAverage: "★ średnia", dashboardHours: "Godziny", dashboardUpdated: "Zaktualizowano", dashboardUpdatedWhen: "wczoraj", googleCard: "Google · profil", googleOpen: "Otwarte · zamyka o 23:00", phoneAction: "Zarezerwuj stolik", phoneStatus: "Otwarte dziś" },
  cs: { dashboardToday: "Dnes", dashboardBookings: "rezervace", dashboardAverage: "★ průměr", dashboardHours: "Otevírací doba", dashboardUpdated: "Aktualizováno", dashboardUpdatedWhen: "včera", googleCard: "Google · profil", googleOpen: "Otevřeno · zavírá ve 23:00", phoneAction: "Rezervovat stůl", phoneStatus: "Dnes otevřeno" },
  sl: { dashboardToday: "Danes", dashboardBookings: "rezervacije", dashboardAverage: "★ povprečje", dashboardHours: "Odpiralni čas", dashboardUpdated: "Posodobljeno", dashboardUpdatedWhen: "včeraj", googleCard: "Google · profil", googleOpen: "Odprto · zapre ob 23:00", phoneAction: "Rezerviraj mizo", phoneStatus: "Odprto danes" },
  hr: { dashboardToday: "Danas", dashboardBookings: "rezervacije", dashboardAverage: "★ prosjek", dashboardHours: "Radno vrijeme", dashboardUpdated: "Ažurirano", dashboardUpdatedWhen: "jučer", googleCard: "Google · profil", googleOpen: "Otvoreno · zatvara u 23:00", phoneAction: "Rezerviraj stol", phoneStatus: "Otvoreno danas" },
  sq: { dashboardToday: "Sot", dashboardBookings: "rezervime", dashboardAverage: "★ mesatarja", dashboardHours: "Orari", dashboardUpdated: "Përditësuar", dashboardUpdatedWhen: "dje", googleCard: "Google · profili", googleOpen: "Hapur · mbyllet në 23:00", phoneAction: "Rezervo tavolinë", phoneStatus: "Hapur sot" },
  el: { dashboardToday: "Σήμερα", dashboardBookings: "κρατήσεις", dashboardAverage: "★ μέσος όρος", dashboardHours: "Ωράριο", dashboardUpdated: "Ενημερώθηκε", dashboardUpdatedWhen: "χθες", googleCard: "Google · καταχώριση", googleOpen: "Ανοιχτά · κλείνει στις 23:00", phoneAction: "Κράτηση τραπεζιού", phoneStatus: "Ανοιχτά σήμερα" },
};

const SERVICE_LABEL_OVERRIDES: Partial<Record<AppLocale, Partial<Omit<MockupCopy, "phoneName" | "phoneMeta">>>> = {
  it: { dashboardBookings: "appuntamenti", googleOpen: "Aperto · chiude alle 19:00", phoneAction: "Prenota un appuntamento" },
  en: { dashboardBookings: "appointments", googleOpen: "Open · closes at 19:00", phoneAction: "Book an appointment" },
  fr: { dashboardBookings: "rendez-vous", googleOpen: "Ouvert · ferme à 19:00", phoneAction: "Prendre rendez-vous" },
  es: { dashboardBookings: "citas", googleOpen: "Abierto · cierra a las 19:00", phoneAction: "Reservar una cita" },
  de: { dashboardBookings: "termine", googleOpen: "Geöffnet · schließt um 19:00", phoneAction: "Termin buchen" },
  pt: { dashboardBookings: "marcações", googleOpen: "Aberto · fecha às 19:00", phoneAction: "Marcar uma consulta" },
  nl: { dashboardBookings: "afspraken", googleOpen: "Open · sluit om 19:00", phoneAction: "Boek een afspraak" },
  da: { dashboardBookings: "aftaler", googleOpen: "Åben · lukker kl. 19:00", phoneAction: "Book en aftale" },
  sv: { dashboardBookings: "tidsbokningar", googleOpen: "Öppet · stänger 19:00", phoneAction: "Boka tid" },
  nb: { dashboardBookings: "avtaler", googleOpen: "Åpent · stenger 19:00", phoneAction: "Bestill time" },
  fi: { dashboardBookings: "ajanvaraukset", googleOpen: "Avoinna · sulkeutuu 19:00", phoneAction: "Varaa aika" },
  pl: { dashboardBookings: "wizyty", googleOpen: "Otwarte · zamyka o 19:00", phoneAction: "Umów wizytę" },
  cs: { dashboardBookings: "schůzky", googleOpen: "Otevřeno · zavírá v 19:00", phoneAction: "Rezervovat schůzku" },
  sl: { dashboardBookings: "termini", googleOpen: "Odprto · zapre ob 19:00", phoneAction: "Rezerviraj termin" },
  hr: { dashboardBookings: "termini", googleOpen: "Otvoreno · zatvara u 19:00", phoneAction: "Rezerviraj termin" },
  sq: { dashboardBookings: "takime", googleOpen: "Hapur · mbyllet në 19:00", phoneAction: "Rezervo takim" },
  el: { dashboardBookings: "ραντεβού", googleOpen: "Ανοιχτά · κλείνει στις 19:00", phoneAction: "Κλείστε ραντεβού" },
};

export function getMockupCopy(locale: AppLocale, market: MarketCode, vertical: "food" | "services"): MockupCopy {
  const baseLabels = MOCKUP_LABELS[locale] ?? MOCKUP_LABELS.en;
  const labels = vertical === "services"
    ? { ...baseLabels, ...(SERVICE_LABEL_OVERRIDES[locale] ?? SERVICE_LABEL_OVERRIDES.en) }
    : baseLabels;
  const marketCopy = vertical === "services" ? SERVICE_MOCKUPS[market] : FOOD_MOCKUPS[market];
  return { ...labels, ...marketCopy };
}
