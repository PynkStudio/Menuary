type ConsentCopy = {
  title: string;
  body: string;
  accept: string;
  reject: string;
  policy: string;
};

// Testi brevi e neutri: il banner compare su siti di brand diversi, quindi non
// nomina mai il brand. "Rifiuta" ha lo stesso peso di "Accetta" (linee guida
// Garante privacy 2021).
const COPY: Record<string, ConsentCopy> = {
  it: {
    title: "Cookie e misurazione",
    body: "Usiamo cookie di terze parti per misurare le visite e l'efficacia delle nostre campagne solo se ci dai il consenso. Puoi cambiare idea quando vuoi.",
    accept: "Accetta",
    reject: "Rifiuta",
    policy: "Cookie policy",
  },
  en: {
    title: "Cookies and measurement",
    body: "We only use third-party cookies to measure visits and campaign performance if you agree. You can change your mind at any time.",
    accept: "Accept",
    reject: "Reject",
    policy: "Cookie policy",
  },
  fr: {
    title: "Cookies et mesure d'audience",
    body: "Nous utilisons des cookies tiers pour mesurer les visites et l'efficacité de nos campagnes uniquement avec votre accord. Vous pouvez changer d'avis à tout moment.",
    accept: "Accepter",
    reject: "Refuser",
    policy: "Politique cookies",
  },
  es: {
    title: "Cookies y medición",
    body: "Solo usamos cookies de terceros para medir las visitas y la eficacia de nuestras campañas si nos das tu consentimiento. Puedes cambiar de opinión cuando quieras.",
    accept: "Aceptar",
    reject: "Rechazar",
    policy: "Política de cookies",
  },
  de: {
    title: "Cookies und Reichweitenmessung",
    body: "Cookies von Drittanbietern zur Messung von Besuchen und Kampagnen setzen wir nur mit Ihrer Einwilligung ein. Sie können Ihre Wahl jederzeit ändern.",
    accept: "Akzeptieren",
    reject: "Ablehnen",
    policy: "Cookie-Richtlinie",
  },
  pt: {
    title: "Cookies e medição",
    body: "Só usamos cookies de terceiros para medir as visitas e a eficácia das nossas campanhas se nos der o seu consentimento. Pode mudar de ideia a qualquer momento.",
    accept: "Aceitar",
    reject: "Recusar",
    policy: "Política de cookies",
  },
  nl: {
    title: "Cookies en metingen",
    body: "We gebruiken cookies van derden om bezoeken en de resultaten van onze campagnes te meten, alleen met jouw toestemming. Je kunt je keuze altijd wijzigen.",
    accept: "Accepteren",
    reject: "Weigeren",
    policy: "Cookiebeleid",
  },
  da: {
    title: "Cookies og måling",
    body: "Vi bruger kun tredjepartscookies til at måle besøg og kampagners effekt, hvis du giver samtykke. Du kan altid ændre dit valg.",
    accept: "Accepter",
    reject: "Afvis",
    policy: "Cookiepolitik",
  },
  sv: {
    title: "Cookies och mätning",
    body: "Vi använder bara tredjepartscookies för att mäta besök och kampanjernas effekt om du samtycker. Du kan ändra dig när som helst.",
    accept: "Godkänn",
    reject: "Avvisa",
    policy: "Cookiepolicy",
  },
  nb: {
    title: "Informasjonskapsler og måling",
    body: "Vi bruker bare tredjeparts informasjonskapsler til å måle besøk og kampanjeeffekt hvis du samtykker. Du kan endre valget når som helst.",
    accept: "Godta",
    reject: "Avslå",
    policy: "Retningslinjer for informasjonskapsler",
  },
  fi: {
    title: "Evästeet ja mittaus",
    body: "Käytämme kolmansien osapuolten evästeitä käyntien ja kampanjoiden tulosten mittaamiseen vain suostumuksellasi. Voit muuttaa valintaasi milloin tahansa.",
    accept: "Hyväksy",
    reject: "Hylkää",
    policy: "Evästekäytäntö",
  },
  pl: {
    title: "Pliki cookie i pomiary",
    body: "Pliki cookie stron trzecich do mierzenia odwiedzin i skuteczności kampanii stosujemy wyłącznie za Twoją zgodą. Możesz zmienić zdanie w dowolnym momencie.",
    accept: "Akceptuję",
    reject: "Odrzucam",
    policy: "Polityka cookie",
  },
  cs: {
    title: "Cookies a měření",
    body: "Cookies třetích stran k měření návštěv a účinnosti kampaní používáme jen s vaším souhlasem. Svou volbu můžete kdykoli změnit.",
    accept: "Přijmout",
    reject: "Odmítnout",
    policy: "Zásady cookies",
  },
  sl: {
    title: "Piškotki in merjenje",
    body: "Piškotke tretjih oseb za merjenje obiskov in uspešnosti kampanj uporabljamo samo z vašo privolitvijo. Izbiro lahko kadar koli spremenite.",
    accept: "Sprejmi",
    reject: "Zavrni",
    policy: "Pravilnik o piškotkih",
  },
  hr: {
    title: "Kolačići i mjerenje",
    body: "Kolačiće trećih strana za mjerenje posjeta i uspješnosti kampanja koristimo samo uz vašu privolu. Izbor možete promijeniti u bilo kojem trenutku.",
    accept: "Prihvati",
    reject: "Odbij",
    policy: "Pravila o kolačićima",
  },
  sq: {
    title: "Cookies dhe matja",
    body: "Përdorim cookies të palëve të treta për të matur vizitat dhe efektivitetin e fushatave vetëm me pëlqimin tuaj. Mund ta ndryshoni zgjedhjen në çdo kohë.",
    accept: "Prano",
    reject: "Refuzo",
    policy: "Politika e cookies",
  },
  el: {
    title: "Cookies και μέτρηση",
    body: "Χρησιμοποιούμε cookies τρίτων για τη μέτρηση επισκέψεων και της απόδοσης των καμπανιών μας μόνο με τη συγκατάθεσή σας. Μπορείτε να αλλάξετε γνώμη οποτεδήποτε.",
    accept: "Αποδοχή",
    reject: "Απόρριψη",
    policy: "Πολιτική cookies",
  },
};

export function getConsentCopy(lang: string | null | undefined): ConsentCopy {
  const key = (lang ?? "it").slice(0, 2).toLowerCase();
  return COPY[key] ?? COPY.en;
}

const PREFERENCES_LABEL: Record<string, string> = {
  it: "Preferenze cookie",
  en: "Cookie preferences",
  fr: "Préférences cookies",
  es: "Preferencias de cookies",
  de: "Cookie-Einstellungen",
  pt: "Preferências de cookies",
  nl: "Cookievoorkeuren",
  da: "Cookieindstillinger",
  sv: "Cookieinställningar",
  nb: "Innstillinger for informasjonskapsler",
  fi: "Evästeasetukset",
  pl: "Ustawienia cookie",
  cs: "Nastavení cookies",
  sl: "Nastavitve piškotkov",
  hr: "Postavke kolačića",
  sq: "Preferencat e cookies",
  el: "Προτιμήσεις cookies",
};

export function getConsentPreferencesLabel(lang: string | null | undefined): string {
  const key = (lang ?? "it").slice(0, 2).toLowerCase();
  return PREFERENCES_LABEL[key] ?? PREFERENCES_LABEL.en;
}
