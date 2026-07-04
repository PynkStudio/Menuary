import type { TenantFeatureFlags, TenantFeatureKey } from "@/lib/tenant";

/**
 * Segmento URL di primo livello delle route pubbliche "globali" (condivise da
 * tutti i tenant tramite gli stessi file in src/app/) → feature flag che deve
 * essere attiva perché la route abbia senso per quel tenant. Una route non
 * presente qui non viene mai bloccata da questo controllo.
 */
export const ROUTE_MODULE_REQUIREMENTS: Record<string, TenantFeatureKey[]> = {
  menu: ["onlineMenu"],
  "assistant-menu": ["onlineMenu"],
  prenota: ["reservations"],
  galleria: ["gallery"],
  recensioni: ["reviews"],
  preferiti: ["favorites"],
  tavolo: ["tableOrders"],
  ordina: ["takeaway", "tableOrders", "deliveryHub"],
  staff: ["staffRoles"],
  cucina: ["kitchenDisplay"],
};

export function isRouteModuleAllowed(
  segment: string,
  features: TenantFeatureFlags,
): boolean {
  const required = ROUTE_MODULE_REQUIREMENTS[segment];
  if (!required) return true;
  return required.some((key) => Boolean(features[key]));
}
