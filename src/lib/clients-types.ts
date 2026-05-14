/** Modello profilo utente (allineare a Supabase / RLS). */
export type ClientProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** ISO yyyy-mm-dd */
  birthDate: string;
  /** Testo libero o codici allergeni normalizzati lato backend */
  allergiesNote: string;
  dietaryPreferences: string[];
};

/** Consensi marketing: Menuary vs singoli locali. */
export type MarketingConsentState = {
  menuaryMarketing: boolean;
  /** per tenant_id */
  restaurantMarketing: Record<string, boolean>;
};

/** Locale che ha ricevuto dati identificativi o di profilo (GDPR / registry). */
export type SharedRestaurantRecord = {
  tenantId: string;
  displayName: string;
  city: string;
  /** ISO date prima condivisione o ultimo aggiornamento policy */
  sharedSince: string;
  marketingConsentGranted: boolean;
  /** richiesta rimozione in coda — backend anonimizza (TODO) */
  removalRequestedAt: string | null;
};

export type ClientOrderLine = { label: string; qty: number; unitPriceEur: number };

export type ClientOrder = {
  id: string;
  tenantId: string;
  restaurantName: string;
  placedAt: string;
  totalEur: number;
  channel: "asporto" | "tavolo" | "delivery" | "altro";
  lines: ClientOrderLine[];
};
