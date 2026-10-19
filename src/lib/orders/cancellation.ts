// Causali di annullamento scelte dal locale nel pannello ordini. I codici sono vincolati
// dal check su `orders.cancellation_reason`: aggiungerne uno richiede una migration.
export const ORDER_CANCELLATION_REASONS = [
  "fuori_area",
  "ordine_finto",
  "prodotti_esauriti",
  "richiesta_cliente",
  "altro",
] as const;

export type OrderCancellationReason = (typeof ORDER_CANCELLATION_REASONS)[number];

export function isOrderCancellationReason(value: unknown): value is OrderCancellationReason {
  return typeof value === "string" && (ORDER_CANCELLATION_REASONS as readonly string[]).includes(value);
}

/** Stati da cui il locale può ancora annullare: dopo la consegna non ha senso. */
export const CANCELLABLE_ORDER_STATUSES = ["nuovo", "in_preparazione", "pronto"] as const;

export function cancelDeadline(createdAt: string, windowMinutes: number | null): Date | null {
  if (!windowMinutes) return null;
  return new Date(new Date(createdAt).getTime() + windowMinutes * 60 * 1000);
}
