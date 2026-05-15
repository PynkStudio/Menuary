import "server-only";
import { getRefreshToken, upsertGoogleAuth } from "@/lib/data/google-sync";
import { toGoogleRegularHours, toGoogleSpecialHours, type SpecialHourInput } from "@/lib/google/hours-converter";
import type { DaySchedule } from "@/lib/venue-hours";

// ─── Google Business Profile API — scaffold ───────────────────────────────────
// API abilitate su Google Cloud Console (progetto 144376832025):
//   • My Business Business Information API  → lettura/scrittura info attività
//   • My Business Account Management API    → gestione account e location
//   • Business Profile Performance API      → metriche (views, ricerche, click)
//
// STATO: scaffold non operativo. L'implementazione reale richiede:
//   1. OAuth2 flow per ottenere il refresh_token del titolare dell'attività.
//      Client ID: GOOGLE_MY_BUSINESS_CLIENT_ID (già su Vercel)
//      Client Secret: GOOGLE_MY_BUSINESS_CLIENT_SECRET (da aggiungere)
//      Redirect URI: GOOGLE_MY_BUSINESS_REDIRECT_URI
//      Scope: https://www.googleapis.com/auth/business.manage
//   2. Persistenza del refresh_token per tenant su Supabase.
//   3. Il resource name della location: "accounts/{id}/locations/{id}"
//      Recuperabile via My Business Account Management API.

const API_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const ACCOUNT_API_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";
const PERFORMANCE_API_BASE = "https://businessprofileperformance.googleapis.com/v1";

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

async function getAccessToken(tenantId: string): Promise<string> {
  const refreshToken = await getRefreshToken(tenantId);
  if (!refreshToken) throw new Error(`Tenant ${tenantId} non ha ancora collegato Google Business`);

  const clientId = process.env.GOOGLE_MY_BUSINESS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_MY_BUSINESS_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Credenziali OAuth Google My Business non configurate");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Token refresh fallito: HTTP ${res.status}`);
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!json.access_token) throw new Error(`Token refresh error: ${json.error ?? "unknown"}`);
  return json.access_token;
}

// ─── OAuth flow ───────────────────────────────────────────────────────────────

/**
 * Scambia il codice OAuth ricevuto nel callback con i token e li persiste.
 * Da chiamare da /api/auth/google-business/callback.
 */
export async function exchangeCodeAndSave(
  tenantId: string,
  code: string,
  authorizedBy?: string,
): Promise<void> {
  const clientId = process.env.GOOGLE_MY_BUSINESS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_MY_BUSINESS_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_MY_BUSINESS_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Credenziali OAuth Google My Business non configurate");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Code exchange fallito: HTTP ${res.status}`);
  const json = (await res.json()) as { refresh_token?: string; error?: string };
  if (!json.refresh_token) throw new Error(`Nessun refresh_token ricevuto: ${json.error ?? "unknown"}`);

  await upsertGoogleAuth(tenantId, json.refresh_token, authorizedBy);
}

/**
 * Costruisce l'URL per avviare il flow OAuth Google Business dal pannello
 * di gestione. Il `state` codifica il tenantId per ritrovarlo nel callback.
 */
export function buildOAuthUrl(tenantId: string): string {
  const clientId = process.env.GOOGLE_MY_BUSINESS_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_MY_BUSINESS_REDIRECT_URI;
  if (!clientId || !redirectUri) throw new Error("Credenziali OAuth non configurate");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/business.manage",
    access_type: "offline",
    prompt: "consent",                  // forza sempre il refresh_token
    state: Buffer.from(JSON.stringify({ tenantId })).toString("base64url"),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Collega una sede Google a un tenant e ne persiste il Place ID.
 * Da chiamare dopo che il gestore ha selezionato la sede dal pannello.
 *
 * TODO: multi-location — permettere la selezione di più sedi.
 *   Attualmente sovrascrive la sede primaria esistente.
 */
export async function linkLocation(
  tenantId: string,
  locationResourceName: string,
  placeId: string | null,
  locationName: string | null,
): Promise<void> {
  const { createSupabaseServiceClient } = await import("@/lib/supabase/service");
  const supabase = createSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service client non disponibile");

  await supabase.from("tenant_google_locations").upsert(
    {
      tenant_id: tenantId,
      location_resource_name: locationResourceName,
      place_id: placeId,
      location_name: locationName,
      is_primary: true,
      linked_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,location_resource_name" },
  );
}

/**
 * Elenca gli account Google Business del titolare autorizzato.
 * Da chiamare una volta dopo l'OAuth per ottenere l'accountId.
 */
export async function listAccounts(tenantId: string): Promise<unknown[]> {
  const token = await getAccessToken(tenantId);
  const res = await fetch(`${ACCOUNT_API_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Account Management API HTTP ${res.status}`);
  const json = (await res.json()) as { accounts?: unknown[] };
  return json.accounts ?? [];
}

/**
 * Elenca le location (sedi) di un account.
 * Da chiamare dopo listAccounts per ottenere il locationId.
 */
export async function listLocations(tenantId: string, accountId: string): Promise<unknown[]> {
  const token = await getAccessToken(tenantId);
  const res = await fetch(`${ACCOUNT_API_BASE}/accounts/${accountId}/locations`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Account Management API HTTP ${res.status}`);
  const json = (await res.json()) as { locations?: unknown[] };
  return json.locations ?? [];
}

/**
 * Recupera le metriche di performance della scheda (impressioni, click, chiamate).
 * Richiede Business Profile Performance API.
 */
export async function getPerformanceMetrics(
  tenantId: string,
  locationResourceName: string,
  startDate: { year: number; month: number; day: number },
  endDate: { year: number; month: number; day: number },
): Promise<unknown> {
  const token = await getAccessToken(tenantId);
  const params = new URLSearchParams({
    "dailyMetric": "ALL",
    "dailyRange.start_date.year": String(startDate.year),
    "dailyRange.start_date.month": String(startDate.month),
    "dailyRange.start_date.day": String(startDate.day),
    "dailyRange.end_date.year": String(endDate.year),
    "dailyRange.end_date.month": String(endDate.month),
    "dailyRange.end_date.day": String(endDate.day),
  });
  const res = await fetch(
    `${PERFORMANCE_API_BASE}/${locationResourceName}:fetchMultiDailyMetricsTimeSeries?${params}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Performance API HTTP ${res.status}`);
  return res.json();
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

// ─── Orari ────────────────────────────────────────────────────────────────────

/** Sincronizza gli orari settimanali standard su Google Business Profile. */
export async function syncRegularHours(
  tenantId: string,
  locationResourceName: string,
  week: DaySchedule[],
): Promise<void> {
  const token = await getAccessToken(tenantId);
  const regularHours = toGoogleRegularHours(week);
  const res = await fetch(
    `${API_BASE}/${locationResourceName}?updateMask=regularHours`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ regularHours }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Hours sync HTTP ${res.status}: ${detail}`);
  }
}

/** Sincronizza gli orari straordinari (date-specific) su Google Business Profile. */
export async function syncSpecialHours(
  tenantId: string,
  locationResourceName: string,
  specials: SpecialHourInput[],
): Promise<void> {
  const token = await getAccessToken(tenantId);
  const specialHours = toGoogleSpecialHours(specials);
  const res = await fetch(
    `${API_BASE}/${locationResourceName}?updateMask=specialHours`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ specialHours }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Special hours sync HTTP ${res.status}: ${detail}`);
  }
}

// ─── Recensioni ───────────────────────────────────────────────────────────────

// Le recensioni sono accessibili via l'API Google My Business v4 (legacy endpoint
// ancora in uso per reviews — non migrata a v1 al momento della scrittura).
const REVIEWS_API_BASE = "https://mybusiness.googleapis.com/v4";

export type GmbReview = {
  name: string;            // resource name completo della recensione
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string } | null;
};

const STAR_MAP: Record<GmbReview["starRating"], number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
};

export function starRatingToNumber(r: GmbReview["starRating"]): number {
  return STAR_MAP[r];
}

/** Recupera le recensioni della sede da Google My Business API. */
export async function getBusinessReviews(
  tenantId: string,
  locationResourceName: string,
  pageSize = 50,
): Promise<{ reviews: GmbReview[]; averageRating: number; totalCount: number }> {
  const token = await getAccessToken(tenantId);
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  const res = await fetch(
    `${REVIEWS_API_BASE}/${locationResourceName}/reviews?${params}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Reviews API HTTP ${res.status}`);
  const json = (await res.json()) as {
    reviews?: GmbReview[];
    averageRating?: number;
    totalReviewCount?: number;
  };
  return {
    reviews: json.reviews ?? [],
    averageRating: json.averageRating ?? 0,
    totalCount: json.totalReviewCount ?? 0,
  };
}

/** Risponde a una recensione su Google. */
export async function replyToReview(
  tenantId: string,
  reviewResourceName: string,
  comment: string,
): Promise<void> {
  const token = await getAccessToken(tenantId);
  const res = await fetch(`${REVIEWS_API_BASE}/${reviewResourceName}/reply`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Reply HTTP ${res.status}: ${detail}`);
  }
}

/** Elimina la risposta a una recensione. */
export async function deleteReviewReply(
  tenantId: string,
  reviewResourceName: string,
): Promise<void> {
  const token = await getAccessToken(tenantId);
  const res = await fetch(`${REVIEWS_API_BASE}/${reviewResourceName}/reply`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Delete reply HTTP ${res.status}`);
}

// ─── Locations con metadata ────────────────────────────────────────────────────

export type LocationWithMeta = {
  name: string;           // "accounts/{id}/locations/{id}"
  title: string;
  placeId: string | null;
  address?: string;
};

/** Elenca le location di un account includendo i metadata (place_id). */
export async function listLocationsWithMeta(
  tenantId: string,
  accountName: string,
): Promise<LocationWithMeta[]> {
  const token = await getAccessToken(tenantId);
  const params = new URLSearchParams({
    readMask: "name,title,metadata,storefrontAddress",
  });
  const res = await fetch(
    `${API_BASE}/${accountName}/locations?${params}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Locations API HTTP ${res.status}`);
  const json = (await res.json()) as {
    locations?: Array<{
      name: string;
      title?: string;
      metadata?: { placeId?: string };
      storefrontAddress?: { addressLines?: string[] };
    }>;
  };
  return (json.locations ?? []).map((l) => ({
    name: l.name,
    title: l.title ?? l.name,
    placeId: l.metadata?.placeId ?? null,
    address: l.storefrontAddress?.addressLines?.join(", "),
  }));
}
