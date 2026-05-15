import "server-only";

// ─── Google Business Profile API — scaffold ───────────────────────────────────
// Questo modulo predispone la struttura per la sincronizzazione bidirezionale
// tra la scheda Google My Business di un tenant e il suo sito Menuary/Bizery.
//
// STATO: scaffold non operativo. L'implementazione reale richiede:
//   1. Un OAuth2 flow per ottenere il refresh_token del proprietario dell'attività.
//   2. Le credenziali dell'app Google Cloud (client_id, client_secret) con
//      lo scope: https://www.googleapis.com/auth/business.manage
//   3. Il resource name della location nel formato:
//      "accounts/{accountId}/locations/{locationId}"
//
// Quando si implementa, aggiungere in .env.local:
//   GOOGLE_MY_BUSINESS_CLIENT_ID=
//   GOOGLE_MY_BUSINESS_CLIENT_SECRET=
//   GOOGLE_MY_BUSINESS_REDIRECT_URI=

const API_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BusinessHours = {
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  openTime: string;   // "HH:MM"
  closeTime: string;  // "HH:MM"
};

export type BusinessInfo = {
  name: string;                  // resource name, es. "accounts/123/locations/456"
  title: string;                 // nome pubblico attività
  phoneNumbers?: { primaryPhone?: string };
  websiteUri?: string;
  regularHours?: { periods: BusinessHours[] };
  description?: string;
};

// ─── OAuth token helper (stub) ────────────────────────────────────────────────

async function getAccessToken(_tenantId: string): Promise<string> {
  // TODO: recuperare il refresh_token del tenant da Supabase,
  // scambiarlo con un access_token fresco via:
  // POST https://oauth2.googleapis.com/token
  throw new Error("Google My Business OAuth non ancora implementato");
}

// ─── API calls (stub) ─────────────────────────────────────────────────────────

/**
 * Recupera le informazioni pubbliche dell'attività da Google Business Profile.
 * Da usare per pre-popolare i dati del tenant al primo setup.
 */
export async function getBusinessInfo(
  tenantId: string,
  locationResourceName: string,
): Promise<BusinessInfo> {
  const token = await getAccessToken(tenantId);
  const res = await fetch(`${API_BASE}/${locationResourceName}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`My Business API HTTP ${res.status}`);
  return res.json() as Promise<BusinessInfo>;
}

/**
 * Sincronizza sul sito i campi dell'attività che l'operatore gestisce su Google:
 * orari, descrizione, telefono.
 *
 * Strategia: Google è la "fonte di verità" per questi campi.
 * Il sito li legge e li mostra, non li sovrascrive su Google.
 */
export async function syncBusinessDetailsToSite(
  tenantId: string,
  locationResourceName: string,
): Promise<BusinessInfo> {
  // Recupera da Google e restituisce al chiamante che si occupa
  // di persistere nel proprio store/DB.
  return getBusinessInfo(tenantId, locationResourceName);
}

/**
 * Aggiorna la descrizione dell'attività su Google Business Profile.
 * Da usare quando l'operatore modifica la bio dal backoffice Menuary/Bizery.
 */
export async function pushDescriptionToGoogle(
  tenantId: string,
  locationResourceName: string,
  description: string,
): Promise<void> {
  const token = await getAccessToken(tenantId);
  const res = await fetch(
    `${API_BASE}/${locationResourceName}?updateMask=profile.description`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile: { description } }),
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`My Business PATCH HTTP ${res.status}`);
}
