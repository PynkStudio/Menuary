// Politica application fee per Menuary su Stripe Connect.
// 0% per dine-in/online (il tenant incassa il 100% meno fee Stripe).
// 3% per ordini AI dove la piattaforma genera valore (Retell vocale, WhatsApp AI).

export type PaymentSource =
  | "dine_in"      // ordine al tavolo
  | "takeaway"     // asporto via menu online
  | "delivery"     // delivery via menu online
  | "online"       // checkout web generico
  | "retell"       // ordine generato da assistente vocale AI
  | "whatsapp"     // ordine generato da assistente WhatsApp AI
  | "sms"          // pagamento richiesto via SMS
  | "manual";      // generato manualmente da admin

/** Basis points: 100 bps = 1%. */
const FEE_BPS_BY_SOURCE: Record<PaymentSource, number> = {
  dine_in: 0,
  takeaway: 0,
  delivery: 0,
  online: 0,
  retell: 300,
  whatsapp: 300,
  sms: 300,
  manual: 0,
};

export function feeBpsForSource(source: PaymentSource | string | null | undefined): number {
  if (!source) return 0;
  return FEE_BPS_BY_SOURCE[source as PaymentSource] ?? 0;
}

/**
 * Calcola application_fee_amount in centesimi.
 * `amountCents` è l'importo totale dell'ordine in centesimi.
 */
export function applicationFeeCents(
  amountCents: number,
  source: PaymentSource | string | null | undefined,
): number {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return 0;
  const bps = feeBpsForSource(source);
  if (bps <= 0) return 0;
  return Math.max(0, Math.floor((amountCents * bps) / 10_000));
}
