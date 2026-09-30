import type { Attribution } from "@/lib/tracking/types";

export type CrmStatus = "lead" | "prospect" | "client" | "lost";
export type CrmActivityType =
  | "form" | "booking" | "note" | "call" | "email" | "whatsapp" | "status" | "unsubscribe" | "system";

export const CRM_STATUSES: CrmStatus[] = ["lead", "prospect", "client", "lost"];
export const CRM_MANUAL_ACTIVITY_TYPES: CrmActivityType[] = ["note", "call", "email", "whatsapp"];

export const CRM_STATUS_LABELS: Record<CrmStatus, string> = {
  lead: "Lead",
  prospect: "Prospect",
  client: "Cliente",
  lost: "Perso",
};

export const CRM_SOURCE_LABELS: Record<string, string> = {
  "landing-ia": "Landing IA in azienda",
  "contact-form": "Modulo contatti",
  booking: "Prenotazione call",
  unsubscribe: "Disiscrizione",
  manual: "Inserito a mano",
};

export const CRM_ACTIVITY_LABELS: Record<CrmActivityType, string> = {
  form: "Richiesta dal sito",
  booking: "Call",
  note: "Nota",
  call: "Telefonata",
  email: "Email",
  whatsapp: "WhatsApp",
  status: "Cambio stato",
  unsubscribe: "Disiscrizione",
  system: "Sistema",
};

// Le opzioni dei form sono tradotte per lingua: al CRM arriva sempre l'etichetta italiana canonica,
// scelta per posizione, così filtri e punteggio non dipendono dalla lingua del visitatore.
export const CRM_SIZE_OPTIONS = ["1–10", "11–20", "21–50", "Oltre 50"] as const;
export const CRM_TIMING_OPTIONS = ["Il prima possibile", "Entro 3 mesi", "Sto solo valutando"] as const;

export function sourceLabel(source: string): string {
  return CRM_SOURCE_LABELS[source] ?? source;
}

/** Numero stimato da un'etichetta come "11–20", "Oltre 50" o "5-10": il valore più alto trovato. */
export function parseEmployees(raw: string | number | null | undefined): { range: string | null; count: number | null } {
  if (raw === null || raw === undefined) return { range: null, count: null };
  const text = String(raw).trim().slice(0, 40);
  if (!text) return { range: null, count: null };
  const numbers = text.match(/\d+/g)?.map(Number).filter((n) => n > 0 && n < 100000) ?? [];
  const count = numbers.length ? Math.max(...numbers) : null;
  return { range: /^\d+$/.test(text) ? null : text, count };
}

export function employeesLabel(c: { employees_range: string | null; employees_count: number | null }): string | null {
  if (c.employees_range) return c.employees_range;
  return c.employees_count ? String(c.employees_count) : null;
}

export type ChannelInfo = { channel: string; detail: string | null };

/** Traduce l'attribuzione grezza in un canale leggibile (es. "Google Ads · campagna X"). */
export function describeAttribution(a: Attribution | null | undefined): ChannelInfo {
  if (!a || Object.keys(a).length === 0) return { channel: "Diretto / non tracciato", detail: null };
  const campaign = a.utm_campaign ?? null;
  const source = a.utm_source?.toLowerCase() ?? "";
  const medium = a.utm_medium?.toLowerCase() ?? "";

  if (a.gclid || a.gbraid || a.wbraid || (source === "google" && /cpc|ppc|paid/.test(medium))) {
    return { channel: "Google Ads", detail: campaign };
  }
  if (a.fbclid || /facebook|instagram|meta/.test(source)) {
    return { channel: /paid|cpc|ads/.test(medium) || a.fbclid ? "Meta Ads" : "Social (Meta)", detail: campaign };
  }
  if (a.msclkid) return { channel: "Microsoft Ads", detail: campaign };
  if (a.oppref) return { channel: "OpenAI Ads", detail: campaign };
  if (source) {
    const label = medium ? `${a.utm_source} / ${a.utm_medium}` : (a.utm_source as string);
    return { channel: label, detail: campaign };
  }
  if (a.referrer) {
    try {
      const host = new URL(a.referrer).hostname.replace(/^www\./, "");
      const search = /(^|\.)(google|bing|duckduckgo|ecosia|yahoo)\./.test(host);
      return { channel: search ? `Ricerca organica · ${host}` : `Referral · ${host}`, detail: null };
    } catch {
      return { channel: "Referral", detail: null };
    }
  }
  return { channel: "Diretto / non tracciato", detail: null };
}

export type Temperature = "hot" | "warm" | "cold";

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
  hot: "Caldo",
  warm: "Tiepido",
  cold: "Freddo",
};

type ScoreInput = {
  status: CrmStatus;
  bookings_count: number;
  employees_count: number | null;
  timing: string | null;
  phone: string;
  submissions_count: number;
  interests: string[];
  unsubscribed_at: string | null;
};

/** Priorità commerciale a colpo d'occhio, ricavata da ciò che il contatto ha dichiarato. */
export function leadTemperature(c: ScoreInput): Temperature | null {
  if (c.status === "client" || c.status === "lost" || c.unsubscribed_at) return null;
  let score = 0;
  if (c.bookings_count > 0) score += 3;
  if (c.timing === CRM_TIMING_OPTIONS[0]) score += 3;
  else if (c.timing === CRM_TIMING_OPTIONS[1]) score += 1;
  if ((c.employees_count ?? 0) >= 21) score += 2;
  else if ((c.employees_count ?? 0) >= 11) score += 1;
  if (c.phone.trim()) score += 1;
  if (c.submissions_count > 1) score += 1;
  if (c.interests.length >= 2) score += 1;
  return score >= 5 ? "hot" : score >= 3 ? "warm" : "cold";
}
