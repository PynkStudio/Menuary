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

export type ContractData = {
  numero: string;
  dataStipula: string;
  cliente: {
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
    cliente: {
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
        "Sito pubblico tenant (Menuary/Bizery)",
        "Pannello gestionale admin",
        "Hosting, CDN e certificato SSL",
        "Dominio personalizzato (fornito dal Cliente)",
        "Integrazione Google Business Profile",
      ],
    },
    economiche: {
      canoneMensile: 89,
      setup: 290,
      cicloFatturazione: "monthly",
      metodoPagamento: "sdd",
      scontoAnnuale: 10,
    },
    noteAggiuntive: "",
  };
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

export function paymentMethodLabel(m: PaymentMethod): string {
  switch (m) {
    case "sdd":
      return "Addebito diretto SEPA (SDD) su IBAN del Cliente";
    case "bonifico":
      return "Bonifico bancario a 30 giorni data fattura";
    case "carta":
      return "Addebito ricorrente su carta di credito (circuito Stripe)";
  }
}
