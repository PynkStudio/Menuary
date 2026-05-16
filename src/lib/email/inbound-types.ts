// ─── Payload Resend Inbound ───────────────────────────────────────────────────
// Resend invia questo payload via POST al webhook quando riceve un'email
// sul dominio configurato (menuary.it o bizery.it).

export type ResendInboundHeader = {
  name: string;
  value: string;
};

export type ResendInboundAttachment = {
  filename?: string;
  content_type?: string;
  size?: number;
  content?: string; // base64
};

/** Payload grezzo del webhook Resend Inbound. */
export type ResendInboundPayload = {
  from: string;
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  headers?: ResendInboundHeader[] | Record<string, string>;
  attachments?: ResendInboundAttachment[];
  /** Resend può wrappare il payload in { type, data } */
  type?: string;
  data?: Omit<ResendInboundPayload, "type" | "data">;
};

// ─── Riga DB ──────────────────────────────────────────────────────────────────

export type InboundEmailBrand = "menuary" | "bizery";

export type InboundEmail = {
  id: string;
  created_at: string;
  message_id: string | null;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  subject: string;
  text_body: string | null;
  html_body: string | null;
  headers: ResendInboundHeader[];
  attachments: ResendInboundAttachment[];
  brand: InboundEmailBrand;
  read: boolean;
  starred: boolean;
  archived: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Estrae nome e indirizzo da una stringa tipo "Mario Rossi <mario@esempio.it>".
 */
export function parseEmailAddress(raw: string): { name: string | null; address: string } {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim() || null, address: match[2].trim() };
  return { name: null, address: raw.trim() };
}

/**
 * Determina il brand dalla lista di destinatari.
 * Priorità: bizery.it > menuary.it > fallback menuary.
 */
export function detectBrandFromRecipients(toAddresses: string[]): InboundEmailBrand {
  const addresses = toAddresses.join(" ").toLowerCase();
  if (addresses.includes("@bizery.it")) return "bizery";
  return "menuary";
}
