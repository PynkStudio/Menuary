import type {
  ClientOrder,
  ClientProfile,
  MarketingConsentState,
  SharedRestaurantRecord,
} from "@/lib/clients-types";

/** Dati dimostrativi finché non c'è Supabase. */
export const MOCK_CLIENT_PROFILE: ClientProfile = {
  id: "demo-user",
  firstName: "Giulia",
  lastName: "Rossi",
  email: "giulia.rossi@example.com",
  phone: "+39 333 1234567",
  birthDate: "1992-04-18",
  allergiesNote: "Arachidi, crostacei.",
  dietaryPreferences: ["vegetariano"],
};

export const MOCK_MARKETING_CONSENTS: MarketingConsentState = {
  menuaryMarketing: true,
  restaurantMarketing: {
    bepork: true,
    faak: false,
  },
};

export const MOCK_SHARED_RESTAURANTS: SharedRestaurantRecord[] = [
  {
    tenantId: "bepork",
    displayName: "ThePork",
    city: "Citta Demo",
    sharedSince: "2025-11-02",
    marketingConsentGranted: true,
    removalRequestedAt: null,
  },
  {
    tenantId: "faak",
    displayName: "FAAK",
    city: "Milano",
    sharedSince: "2025-08-12",
    marketingConsentGranted: false,
    removalRequestedAt: null,
  },
];

export const MOCK_ORDERS: ClientOrder[] = [
  {
    id: "ord-24091",
    tenantId: "bepork",
    restaurantName: "ThePork",
    placedAt: "2026-05-10T19:42:00+02:00",
    totalEur: 38.5,
    channel: "asporto",
    lines: [
      { label: "Smash doppio", qty: 1, unitPriceEur: 14 },
      { label: "Patatine rosemary", qty: 1, unitPriceEur: 6 },
    ],
  },
  {
    id: "ord-23802",
    tenantId: "faak",
    restaurantName: "FAAK",
    placedAt: "2026-04-22T21:05:00+02:00",
    totalEur: 62,
    channel: "tavolo",
    lines: [{ label: "Degustazione vini", qty: 1, unitPriceEur: 62 }],
  },
];
