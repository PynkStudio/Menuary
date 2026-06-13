export const FORNITORE = {
  ragioneSociale: "PynkStudio di Pernozzoli Massimo",
  piva: "13577530960",
  cf: "13577530960",
  indirizzo: "Via Gino Severini, 1 — 20138 Milano (MI)",
  pec: "massimo.pernozzoli@widipec.it",
  email: "massimo.pernozzoli@gmail.com",
  legaleRappresentante: "Massimo Pernozzoli",
  foro: "Milano",
} as const;

export type BillingCycle = "monthly" | "yearly";
export type PaymentMethod = "sdd" | "bonifico" | "carta";
export type ContractBrand = "menuary" | "bizery" | "orpheo";
export type ContractClientType = "business" | "individual";

export const BRAND_INFO: Record<ContractBrand, {
  label: string;
  platformName: string;
  verticalDescription: string;
  vertical: "food" | "services" | "creative";
  supportEmail: string;
  privacyUrl: string;
}> = {
  menuary: {
    label: "Menuary",
    platformName: "Menuary",
    verticalDescription:
      "piattaforma SaaS multi-tenant per la pubblicazione e gestione di siti e moduli operativi per attività HORECA (ristoranti, bar, pizzerie, trattorie)",
    vertical: "food",
    supportEmail: "support@menuary.it",
    privacyUrl: "https://menuary.it/privacy",
  },
  bizery: {
    label: "Bizery",
    platformName: "Bizery",
    verticalDescription:
      "piattaforma SaaS multi-tenant per la pubblicazione e gestione di siti e moduli operativi per attività non-HORECA (officine, studi professionali, saloni, centri benessere, servizi)",
    vertical: "services",
    supportEmail: "support@bizery.it",
    privacyUrl: "https://bizery.it/privacy",
  },
  orpheo: {
    label: "Orpheo",
    platformName: "Orpheo",
    verticalDescription:
      "piattaforma SaaS multi-tenant per artisti, autori, musicisti, attori, registi, collettivi e professionisti creativi, dedicata alla gestione della presenza digitale, delle opere, del booking, dei diritti e della relazione con il pubblico",
    vertical: "creative",
    supportEmail: "support@weuseorpheo.com",
    privacyUrl: "https://weuseorpheo.com/privacy",
  },
};

export type ContractData = {
  numero: string;
  dataStipula: string;
  brand: ContractBrand;
  cliente: {
    tipo: ContractClientType;
    ragioneSociale: string;
    legaleRappresentante: string;
    piva: string;
    cf: string;
    sedeLegale: string;
    pec: string;
    email: string;
    telefono: string;
    sdi: string;
  };
  servizio: {
    tenantSlug: string;
    dominio: string;
    pianoNome: string;
    moduliInclusi: string[];
  };
  economiche: {
    canoneMensile: number;
    setup: number;
    cicloFatturazione: BillingCycle;
    metodoPagamento: PaymentMethod;
    scontoAnnuale: number;
    /** Quando true, il setup viene rateizzato (max 6 rate mensili). */
    setupRateale: boolean;
    /** Rate del setup. Lunghezza ∈ [2, 6] quando rateale, [1] altrimenti. */
    setupRate: number[];
  };
  noteAggiuntive: string;
};

export function defaultContractData(): ContractData {
  const today = new Date();
  const yyyy = today.getFullYear();
  const numero = `MEN-${yyyy}-${String(today.getTime()).slice(-5)}`;
  return {
    numero,
    dataStipula: today.toISOString().slice(0, 10),
    brand: "menuary",
    cliente: {
      tipo: "business",
      ragioneSociale: "",
      legaleRappresentante: "",
      piva: "",
      cf: "",
      sedeLegale: "",
      pec: "",
      email: "",
      telefono: "",
      sdi: "",
    },
    servizio: {
      tenantSlug: "",
      dominio: "",
      pianoNome: "Operatività",
      moduliInclusi: [
        "Sito pubblico tenant sulla piattaforma",
        "Pannello gestionale admin",
        "Hosting, CDN e certificato SSL",
        "Dominio personalizzato (primo anno incluso per nuove attivazioni)",
        "Integrazione Google Business Profile",
      ],
    },
    economiche: {
      canoneMensile: 89,
      setup: 290,
      cicloFatturazione: "monthly",
      metodoPagamento: "sdd",
      scontoAnnuale: 10,
      setupRateale: false,
      setupRate: [290],
    },
    noteAggiuntive: "",
  };
}

export function normalizeContractData(data: ContractData): ContractData {
  return {
    ...data,
    brand: data.brand in BRAND_INFO ? data.brand : "menuary",
    cliente: {
      ...data.cliente,
      tipo: data.cliente.tipo ?? "business",
    },
  };
}

export function isIndividualClient(data: ContractData): boolean {
  return data.cliente.tipo === "individual";
}

export function clientName(data: ContractData): string {
  return data.cliente.ragioneSociale || "—";
}

export function clientTaxDetails(data: ContractData): string {
  const parts = [
    data.cliente.piva ? `P.IVA ${data.cliente.piva}` : "",
    data.cliente.cf ? `C.F. ${data.cliente.cf}` : "",
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}

export function formatEUR(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function computeYearlyTotal(canoneMensile: number, scontoPct: number): number {
  const lordo = canoneMensile * 12;
  return Math.round((lordo * (1 - scontoPct / 100)) * 100) / 100;
}

export const MAX_SETUP_RATE = 6;

/**
 * Divide `total` in `count` rate da 2 decimali, attribuendo l'eventuale resto
 * (centesimi non distribuibili equamente) alla prima rata.
 */
export function splitSetupEvenly(total: number, count: number): number[] {
  const safeCount = Math.max(1, Math.min(MAX_SETUP_RATE, Math.floor(count)));
  if (safeCount === 1) return [round2(total)];
  const base = Math.floor((total / safeCount) * 100) / 100;
  const remainder = round2(total - base * safeCount);
  const rate = Array.from({ length: safeCount }, () => base);
  rate[0] = round2(base + remainder);
  return rate;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function setupRateTotal(rate: number[]): number {
  return round2(rate.reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0));
}

export function computeCanoneAmount(economiche: ContractData['economiche']): number {
  if (economiche.cicloFatturazione === "yearly") {
    return computeYearlyTotal(economiche.canoneMensile, economiche.scontoAnnuale);
  }
  return economiche.canoneMensile;
}

export function computeFirstPayment(economiche: ContractData['economiche']): number {
  const canone = computeCanoneAmount(economiche);
  const setupPortion = economiche.setupRateale && economiche.setupRate.length > 1
    ? economiche.setupRate[0]
    : economiche.setup;
  return round2(canone + setupPortion);
}

export function computeRecurringPayment(economiche: ContractData['economiche']): number {
  return computeCanoneAmount(economiche);
}

export function paymentMethodLabel(m: PaymentMethod): string {
  switch (m) {
    case "sdd":
      return "Addebito diretto SEPA (SDD) su IBAN del Cliente";
    case "bonifico":
      return "Bonifico bancario a 30 giorni data fattura — IBAN: NL33BUNQ2063062498 intestato a Massimo Pernozzoli";
    case "carta":
      return "Addebito ricorrente su carta di credito (circuito Stripe)";
  }
}
