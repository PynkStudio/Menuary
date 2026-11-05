// Tassonomia del beta manager PynkStudio: usata da sito pubblico, admin, API ed email.

/** Lingue del Beta program (colonna `locale` del tester). L'admin resta in italiano: default "it". */
export type BetaLang = "it" | "en";

export function toBetaLang(v: unknown): BetaLang {
  return v === "en" ? "en" : "it";
}

/** Preferenza esplicita (cookie) > lingua principale del browser: l'italiano resta il default. */
export const BETA_LANG_COOKIE = "pynk_beta_lang";

export function preferredBetaLang(cookie: string | null | undefined, acceptLanguage: string | null | undefined): BetaLang {
  if (cookie === "it" || cookie === "en") return cookie;
  const first = acceptLanguage?.split(",")[0]?.trim().toLowerCase();
  if (!first || first === "*" || first.startsWith("it")) return "it";
  return "en";
}

export function betaAreaPath(lang: BetaLang) {
  return lang === "en" ? "/beta/en" : "/beta";
}

function pick(en: Record<string, string>, lang: BetaLang, id: string, fallback: string) {
  return lang === "en" ? en[id] ?? fallback : fallback;
}

export type BetaDeviceGroup = "apple" | "android" | "computer" | "altro";

export const BETA_DEVICE_GROUPS: { id: BetaDeviceGroup; label: string }[] = [
  { id: "apple", label: "Apple" },
  { id: "android", label: "Android e Google" },
  { id: "computer", label: "Computer" },
  { id: "altro", label: "Altri dispositivi" },
];

export const BETA_DEVICES = [
  { id: "iphone", label: "iPhone", group: "apple" },
  { id: "ipad", label: "iPad", group: "apple" },
  { id: "mac", label: "Mac", group: "apple" },
  { id: "apple_watch", label: "Apple Watch", group: "apple" },
  { id: "apple_tv", label: "Apple TV", group: "apple" },
  { id: "vision_pro", label: "Apple Vision Pro", group: "apple" },
  { id: "android_phone", label: "Telefono Android", group: "android" },
  { id: "android_tablet", label: "Tablet Android", group: "android" },
  { id: "android_tv", label: "Android TV / Google TV", group: "android" },
  { id: "wear_os", label: "Smartwatch Wear OS", group: "android" },
  { id: "android_auto", label: "Android Auto", group: "android" },
  { id: "chromebook", label: "Chromebook", group: "android" },
  { id: "windows", label: "PC Windows", group: "computer" },
  { id: "linux", label: "PC Linux", group: "computer" },
  { id: "steam_deck", label: "Steam Deck", group: "altro" },
  { id: "meta_quest", label: "Meta Quest", group: "altro" },
  { id: "fire_tv", label: "Amazon Fire TV", group: "altro" },
  { id: "fire_tablet", label: "Tablet Amazon Fire", group: "altro" },
  { id: "huawei", label: "Huawei (AppGallery)", group: "altro" },
] as const satisfies readonly { id: string; label: string; group: BetaDeviceGroup }[];

export type BetaDevice = (typeof BETA_DEVICES)[number]["id"] | "web";

/** Canale "web": vale per chiunque abbia un browser, quindi per ogni tester. */
export const BETA_WEB_DEVICE = "web";

const DEVICE_IDS = new Set<string>([...BETA_DEVICES.map((d) => d.id), BETA_WEB_DEVICE]);

const DEVICE_GROUPS_EN: Record<string, string> = { android: "Android and Google", altro: "Other devices" };
const DEVICES_EN: Record<string, string> = {
  android_phone: "Android phone",
  android_tablet: "Android tablet",
  wear_os: "Wear OS smartwatch",
  windows: "Windows PC",
  linux: "Linux PC",
  fire_tablet: "Amazon Fire tablet",
};

export function betaDeviceLabel(id: string, lang: BetaLang = "it"): string {
  if (id === BETA_WEB_DEVICE) return "Browser (web)";
  return pick(DEVICES_EN, lang, id, BETA_DEVICES.find((d) => d.id === id)?.label ?? id);
}

export function betaDeviceGroupLabel(id: string, label: string, lang: BetaLang = "it"): string {
  return pick(DEVICE_GROUPS_EN, lang, id, label);
}

export const APPLE_DEVICES = new Set(["iphone", "ipad", "mac", "apple_watch", "apple_tv", "vision_pro"]);
export const GOOGLE_DEVICES = new Set(["android_phone", "android_tablet", "android_tv", "wear_os", "android_auto", "chromebook"]);

export type BetaMethod =
  | "testflight"
  | "testflight_invite"
  | "play_open"
  | "play_closed"
  | "play_group"
  | "firebase"
  | "download"
  | "web"
  | "other";

export type BetaMethodInfo = {
  id: BetaMethod;
  label: string;
  /** Testo del bottone per unirsi. */
  cta: string;
  /** Serve una richiesta approvata dallo staff prima di mostrare il link. */
  needsApproval: boolean;
  /** Account che lo staff deve aggiungere alla lista tester. */
  account?: "apple" | "google";
  steps: string[];
};

export const BETA_METHODS: BetaMethodInfo[] = [
  {
    id: "testflight",
    label: "TestFlight · link pubblico",
    cta: "Apri l'invito TestFlight",
    needsApproval: false,
    steps: [
      "Installa l'app TestFlight dall'App Store sul dispositivo (su Mac serve macOS 12 o successivo).",
      "Apri il link d'invito dal dispositivo e tocca «Accetta», poi «Installa».",
      "Per Apple TV e Apple Watch: accetta l'invito da iPhone con lo stesso Apple ID, poi installa dall'app TestFlight del dispositivo.",
    ],
  },
  {
    id: "testflight_invite",
    label: "TestFlight · invito via email",
    cta: "Richiedi l'invito",
    needsApproval: true,
    account: "apple",
    steps: [
      "Richiedi l'accesso: ti aggiungiamo come tester con l'Apple ID indicato nel profilo.",
      "Riceverai un'email da TestFlight: aprila dal dispositivo e tocca «Visualizza in TestFlight».",
    ],
  },
  {
    id: "play_open",
    label: "Google Play · test aperto",
    cta: "Diventa tester su Google Play",
    needsApproval: false,
    steps: [
      "Apri il link con l'account Google che usi sul dispositivo e tocca «Diventa un tester».",
      "Scarica o aggiorna l'app dal Play Store: riceverai la versione beta (può servire qualche minuto).",
    ],
  },
  {
    id: "play_closed",
    label: "Google Play · test chiuso",
    cta: "Richiedi l'accesso",
    needsApproval: true,
    account: "google",
    steps: [
      "Richiedi l'accesso: aggiungiamo l'account Google indicato nel profilo alla lista dei tester.",
      "Quando la richiesta è approvata apri il link, tocca «Diventa un tester» e scarica l'app dal Play Store.",
    ],
  },
  {
    id: "play_group",
    label: "Google Play · test chiuso con gruppo aperto",
    cta: "Diventa tester su Google Play",
    needsApproval: false,
    account: "google",
    steps: [
      "Entra nel gruppo dei tester con l'account Google che usi sul dispositivo Android: tocca «Iscriviti al gruppo».",
      "Apri il link di opt-in con lo stesso account e tocca «Diventa un tester».",
      "Installa l'app dal Play Store: la versione di prova può impiegare qualche minuto a comparire.",
    ],
  },
  {
    id: "firebase",
    label: "Firebase App Distribution",
    cta: "Apri l'invito",
    needsApproval: false,
    steps: [
      "Apri il link dal dispositivo e accedi con il tuo account Google.",
      "Segui le istruzioni per installare «App Tester» e scaricare la build di prova.",
    ],
  },
  {
    id: "download",
    label: "Download diretto",
    cta: "Scarica la beta",
    needsApproval: false,
    steps: [
      "Scarica il file dal dispositivo su cui vuoi installarlo.",
      "Su Android potrebbe servire consentire l'installazione da questa fonte; su Mac e Windows conferma l'apertura dell'app scaricata.",
    ],
  },
  {
    id: "web",
    label: "Versione web",
    cta: "Apri la beta",
    needsApproval: false,
    steps: ["Apri il link nel browser: non serve installare nulla."],
  },
  {
    id: "other",
    label: "Altro (store o programma beta)",
    cta: "Unisciti alla beta",
    needsApproval: false,
    steps: ["Apri il link e segui le istruzioni della piattaforma."],
  },
];

const METHODS_EN: Record<BetaMethod, Pick<BetaMethodInfo, "label" | "cta" | "steps">> = {
  testflight: {
    label: "TestFlight · public link",
    cta: "Open the TestFlight invite",
    steps: [
      "Install the TestFlight app from the App Store on your device (Mac needs macOS 12 or later).",
      "Open the invite link on your device and tap “Accept”, then “Install”.",
      "For Apple TV and Apple Watch: accept the invite on an iPhone with the same Apple ID, then install from the device's TestFlight app.",
    ],
  },
  testflight_invite: {
    label: "TestFlight · email invite",
    cta: "Request an invite",
    steps: [
      "Request access: we'll add you as a tester using the Apple ID in your profile.",
      "You'll get an email from TestFlight: open it on your device and tap “View in TestFlight”.",
    ],
  },
  play_open: {
    label: "Google Play · open test",
    cta: "Become a tester on Google Play",
    steps: [
      "Open the link with the Google account you use on your device and tap “Become a tester”.",
      "Download or update the app from the Play Store: you'll get the beta version (it can take a few minutes).",
    ],
  },
  play_closed: {
    label: "Google Play · closed test",
    cta: "Request access",
    steps: [
      "Request access: we'll add the Google account in your profile to the tester list.",
      "Once your request is approved, open the link, tap “Become a tester” and download the app from the Play Store.",
    ],
  },
  play_group: {
    label: "Google Play · closed test with open group",
    cta: "Become a tester on Google Play",
    steps: [
      "Join the tester group with the Google account you use on your Android device: tap “Join group”.",
      "Open the opt-in link with the same account and tap “Become a tester”.",
      "Install the app from the Play Store: the test version can take a few minutes to appear.",
    ],
  },
  firebase: {
    label: "Firebase App Distribution",
    cta: "Open the invite",
    steps: [
      "Open the link on your device and sign in with your Google account.",
      "Follow the instructions to install “App Tester” and download the test build.",
    ],
  },
  download: {
    label: "Direct download",
    cta: "Download the beta",
    steps: [
      "Download the file on the device you want to install it on.",
      "On Android you may need to allow installs from this source; on Mac and Windows, confirm that you want to open the downloaded app.",
    ],
  },
  web: {
    label: "Web version",
    cta: "Open the beta",
    steps: ["Open the link in your browser: there's nothing to install."],
  },
  other: {
    label: "Other (store or beta program)",
    cta: "Join the beta",
    steps: ["Open the link and follow the platform's instructions."],
  },
};

export function betaMethodInfo(id: string, lang: BetaLang = "it"): BetaMethodInfo {
  const info = BETA_METHODS.find((m) => m.id === id) ?? BETA_METHODS[BETA_METHODS.length - 1];
  return lang === "en" ? { ...info, ...METHODS_EN[info.id] } : info;
}

export const BETA_CATEGORIES = [
  { id: "giochi", label: "Giochi" },
  { id: "produttivita", label: "Produttività" },
  { id: "utility", label: "Utility" },
  { id: "social", label: "Social e messaggi" },
  { id: "intrattenimento", label: "Intrattenimento" },
  { id: "foto-video", label: "Foto e video" },
  { id: "musica", label: "Musica e audio" },
  { id: "business", label: "Business" },
  { id: "food", label: "Food e ristoranti" },
  { id: "salute", label: "Salute e benessere" },
  { id: "istruzione", label: "Istruzione" },
  { id: "ai", label: "Intelligenza artificiale" },
  { id: "altro", label: "Altro" },
] as const;

const CATEGORIES_EN: Record<string, string> = {
  giochi: "Games",
  produttivita: "Productivity",
  utility: "Utilities",
  social: "Social and messaging",
  intrattenimento: "Entertainment",
  "foto-video": "Photo and video",
  musica: "Music and audio",
  business: "Business",
  food: "Food and restaurants",
  salute: "Health and wellness",
  istruzione: "Education",
  ai: "Artificial intelligence",
  altro: "Other",
};

export function betaCategoryLabel(id: string, lang: BetaLang = "it"): string {
  return pick(CATEGORIES_EN, lang, id, BETA_CATEGORIES.find((c) => c.id === id)?.label ?? id);
}

export const BETA_LANGUAGES = [
  { id: "it", label: "Italiano" },
  { id: "en", label: "Inglese" },
  { id: "es", label: "Spagnolo" },
  { id: "fr", label: "Francese" },
  { id: "de", label: "Tedesco" },
  { id: "pt", label: "Portoghese" },
] as const;

const LANGUAGES_EN: Record<string, string> = {
  it: "Italian",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
};

export function betaLanguageLabel(id: string, lang: BetaLang = "it"): string {
  return pick(LANGUAGES_EN, lang, id, BETA_LANGUAGES.find((l) => l.id === id)?.label ?? id.toUpperCase());
}

export const BETA_KINDS = [
  { id: "new", label: "App nuova" },
  { id: "update", label: "Aggiornamento" },
] as const;

const KINDS_EN: Record<string, string> = { new: "New app", update: "Update" };

export function betaKindLabel(id: string, lang: BetaLang = "it"): string {
  return pick(KINDS_EN, lang, id, BETA_KINDS.find((k) => k.id === id)?.label ?? id);
}

/** Opzioni {id, label} di filtri e selettori nella lingua della pagina. */
export function localizedOptions(
  options: readonly { id: string; label: string }[],
  label: (id: string, lang: BetaLang) => string,
  lang: BetaLang,
) {
  return options.map((o) => ({ id: o.id, label: label(o.id, lang) }));
}

export const BETA_STATUSES = [
  { id: "draft", label: "Bozza" },
  { id: "open", label: "Aperta" },
  { id: "full", label: "Posti esauriti" },
  { id: "closed", label: "Chiusa" },
] as const;

export type BetaStatus = (typeof BETA_STATUSES)[number]["id"];

export function betaStatusLabel(id: string): string {
  return BETA_STATUSES.find((s) => s.id === id)?.label ?? id;
}

export const BETA_FEEDBACK_KINDS = [
  { id: "bug", label: "Bug", hint: "Qualcosa non funziona come dovrebbe" },
  { id: "crash", label: "Crash", hint: "L'app si chiude o si blocca" },
  { id: "feature", label: "Suggerimento", hint: "Un'idea o una funzione che vorresti" },
  { id: "ux", label: "Usabilità", hint: "Qualcosa è poco chiaro o scomodo da usare" },
  { id: "performance", label: "Prestazioni", hint: "Lentezza, batteria, surriscaldamento" },
  { id: "content", label: "Testi e traduzioni", hint: "Errori nei testi, nelle traduzioni o nei contenuti" },
  { id: "other", label: "Altro", hint: "Tutto il resto" },
] as const;

export type BetaFeedbackKind = (typeof BETA_FEEDBACK_KINDS)[number]["id"];

const FEEDBACK_KINDS_EN: Record<BetaFeedbackKind, { label: string; hint: string }> = {
  bug: { label: "Bug", hint: "Something doesn't work as it should" },
  crash: { label: "Crash", hint: "The app closes or freezes" },
  feature: { label: "Suggestion", hint: "An idea or a feature you'd like" },
  ux: { label: "Usability", hint: "Something is unclear or awkward to use" },
  performance: { label: "Performance", hint: "Slowness, battery, overheating" },
  content: { label: "Text and translations", hint: "Mistakes in text, translations or content" },
  other: { label: "Other", hint: "Everything else" },
};

export function betaFeedbackKindLabel(id: string, lang: BetaLang = "it"): string {
  if (lang === "en" && id in FEEDBACK_KINDS_EN) return FEEDBACK_KINDS_EN[id as BetaFeedbackKind].label;
  return BETA_FEEDBACK_KINDS.find((k) => k.id === id)?.label ?? id;
}

export function betaFeedbackKinds(lang: BetaLang = "it") {
  return BETA_FEEDBACK_KINDS.map((k) => (lang === "en" ? { id: k.id, ...FEEDBACK_KINDS_EN[k.id] } : k));
}

export const BETA_FEEDBACK_STATUSES = [
  { id: "new", label: "Ricevuto" },
  { id: "in_progress", label: "In lavorazione" },
  { id: "resolved", label: "Risolto" },
  { id: "closed", label: "Chiuso" },
] as const;

const FEEDBACK_STATUSES_EN: Record<string, string> = {
  new: "Received",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function betaFeedbackStatusLabel(id: string, lang: BetaLang = "it"): string {
  return pick(FEEDBACK_STATUSES_EN, lang, id, BETA_FEEDBACK_STATUSES.find((s) => s.id === id)?.label ?? id);
}

export type BetaChannel = {
  device: string;
  method: BetaMethod;
  url: string;
  notes?: string;
  /** Nota in inglese; se manca, il tester inglese vede quella italiana. */
  notesEn?: string;
  /** Passo prima del link: es. il Google Group aperto da cui passa il test chiuso di Play. */
  groupUrl?: string;
  /** Passo dopo il link: es. la scheda Play Store da cui installare dopo l'opt-in al test. */
  installUrl?: string;
};

export function cleanBetaChannels(raw: unknown): BetaChannel[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: BetaChannel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const device = typeof c.device === "string" ? c.device : "";
    const method = typeof c.method === "string" ? c.method : "";
    if (!DEVICE_IDS.has(device) || !BETA_METHODS.some((m) => m.id === method) || seen.has(device)) continue;
    const url = typeof c.url === "string" ? c.url.trim().slice(0, 500) : "";
    if (url && !/^https:\/\//i.test(url)) continue;
    seen.add(device);
    out.push({
      device,
      method: method as BetaMethod,
      url,
      ...(typeof c.notes === "string" && c.notes.trim() ? { notes: c.notes.trim().slice(0, 500) } : {}),
      ...(typeof c.notesEn === "string" && c.notesEn.trim() ? { notesEn: c.notesEn.trim().slice(0, 500) } : {}),
      ...(typeof c.groupUrl === "string" && /^https:\/\//i.test(c.groupUrl.trim())
        ? { groupUrl: c.groupUrl.trim().slice(0, 500) }
        : {}),
      ...(typeof c.installUrl === "string" && /^https:\/\//i.test(c.installUrl.trim())
        ? { installUrl: c.installUrl.trim().slice(0, 500) }
        : {}),
    });
  }
  return out;
}

/** Testi scritti dallo staff: l'inglese è facoltativo e ricade sull'italiano. */
export function betaLocalizedText(
  beta: { tagline: string | null; description?: string | null; tagline_en?: string | null; description_en?: string | null },
  lang: BetaLang,
) {
  return {
    tagline: (lang === "en" && beta.tagline_en) || beta.tagline,
    description: (lang === "en" && beta.description_en) || beta.description || null,
  };
}

export function betaChannelNotes(channel: BetaChannel, lang: BetaLang) {
  return (lang === "en" && channel.notesEn) || channel.notes;
}

export function cleanBetaDevices(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((d): d is string => typeof d === "string" && DEVICE_IDS.has(d) && d !== BETA_WEB_DEVICE))];
}

export function cleanFromList(raw: unknown, allowed: readonly { id: string }[]): string[] {
  if (!Array.isArray(raw)) return [];
  const ids = new Set(allowed.map((a) => a.id));
  return [...new Set(raw.filter((v): v is string => typeof v === "string" && ids.has(v)))];
}

/** Canali della beta utilizzabili con i dispositivi del tester (il web vale sempre). */
export function channelsForDevices(channels: BetaChannel[], devices: readonly string[]): BetaChannel[] {
  return channels.filter((c) => c.device === BETA_WEB_DEVICE || devices.includes(c.device));
}

type NotifyPrefs = {
  devices: readonly string[];
  notify_categories: readonly string[];
  notify_languages: readonly string[];
  notify_kinds: readonly string[];
};

type BetaForMatch = { channels: BetaChannel[]; category: string; languages: readonly string[]; kind: string };

/** Filtri vuoti = nessuna restrizione. Una beta senza lingue dichiarate passa ogni filtro lingua. */
export function testerWantsBeta(tester: NotifyPrefs, beta: BetaForMatch): boolean {
  if (channelsForDevices(beta.channels, tester.devices).length === 0) return false;
  if (tester.notify_categories.length > 0 && !tester.notify_categories.includes(beta.category)) return false;
  if (tester.notify_kinds.length > 0 && !tester.notify_kinds.includes(beta.kind)) return false;
  if (
    tester.notify_languages.length > 0 &&
    beta.languages.length > 0 &&
    !beta.languages.some((l) => tester.notify_languages.includes(l))
  ) {
    return false;
  }
  return true;
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
