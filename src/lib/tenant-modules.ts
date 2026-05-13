import type { TenantFeatureFlags, TenantFeatureKey } from "@/lib/tenant";

export type TenantModuleCategory =
  | "Presenza digitale"
  | "Ordini"
  | "Operatività"
  | "Crescita"
  | "Gestione";

export type TenantModuleDefinition = {
  key: TenantFeatureKey;
  label: string;
  description: string;
  category: TenantModuleCategory;
  requires?: TenantFeatureKey[];
  requiresAny?: TenantFeatureKey[];
};

export const TENANT_MODULES: TenantModuleDefinition[] = [
  {
    key: "website",
    label: "Sito del locale",
    description: "Pubblica pagine, contatti, orari, brand e contenuti base del ristorante.",
    category: "Presenza digitale",
  },
  {
    key: "onlineMenu",
    label: "Menu online",
    description: "Rende disponibile il menu digitale consultabile da sito, QR e preview.",
    category: "Presenza digitale",
    requires: ["website"],
  },
  {
    key: "takeaway",
    label: "Ordini da asporto",
    description: "Abilita percorso ordine e checkout da ritiro.",
    category: "Ordini",
    requires: ["onlineMenu"],
  },
  {
    key: "tableOrders",
    label: "Ordini al tavolo",
    description: "Abilita QR, sessioni tavolo e checkout condiviso.",
    category: "Ordini",
    requires: ["onlineMenu"],
  },
  {
    key: "orderKiosk",
    label: "Kiosk ordini",
    description: "Abilita postazioni self-order per consultare il menu e inviare ordini dal locale.",
    category: "Ordini",
    requires: ["onlineMenu"],
  },
  {
    key: "takeawaySlots",
    label: "Slot e carico asporto",
    description: "Gestisce fasce di ritiro, capacità per slot e avvisi di cucina satura.",
    category: "Ordini",
    requires: ["takeaway"],
  },
  {
    key: "deliveryHub",
    label: "Delivery proprietario",
    description: "Prepara il locale a ricevere ordini diretti e centralizzare i canali delivery.",
    category: "Ordini",
    requires: ["takeaway"],
  },
  {
    key: "kitchenDisplay",
    label: "Schermo cucina",
    description: "Rende disponibile la vista operativa per la brigata.",
    category: "Operatività",
    requiresAny: ["takeaway", "tableOrders", "orderKiosk"],
  },
  {
    key: "printStations",
    label: "Stampanti e reparti",
    description: "Divide le comande per cucina, bar, pizzeria e banco con stampa o ristampa.",
    category: "Operatività",
    requiresAny: ["takeaway", "tableOrders", "orderKiosk"],
  },
  {
    key: "dinerSeparation",
    label: "Commensali distinti",
    description: "Separa gli ordini dei clienti all'interno della sessione tavolo.",
    category: "Operatività",
    requires: ["tableOrders"],
  },
  {
    key: "reservations",
    label: "Prenotazioni",
    description: "Raccoglie prenotazioni online con recapiti, note, allergie e preferenze.",
    category: "Operatività",
    requires: ["website"],
  },
  {
    key: "tablePlanner",
    label: "Gestione sala",
    description: "Mappa tavoli e stati operativi: libero, occupato, ordinato, pagamento, pulizia.",
    category: "Operatività",
    requires: ["reservations"],
  },
  {
    key: "productAvailability",
    label: "Disponibilità piatti",
    description: "Nasconde esauriti, quantità limitate e piatti legati a ingredienti mancanti.",
    category: "Operatività",
    requires: ["onlineMenu"],
  },
  {
    key: "upselling",
    label: "Upselling menu",
    description: "Propone extra, abbinamenti, menu completi e suggerimenti in carrello.",
    category: "Crescita",
    requires: ["onlineMenu"],
  },
  {
    key: "crm",
    label: "CRM e fidelity",
    description: "Gestisce contatti, coupon, ritorno cliente, compleanni e storico preferenze.",
    category: "Crescita",
    requires: ["website"],
  },
  {
    key: "analytics",
    label: "Analytics locale",
    description: "Mostra vendite, fasce orarie, piatti forti, scontrino medio e tempi cucina.",
    category: "Crescita",
    requiresAny: ["onlineMenu", "takeaway", "tableOrders", "orderKiosk"],
  },
  {
    key: "reviews",
    label: "Recensioni",
    description: "Consente la pubblicazione del modulo recensioni.",
    category: "Crescita",
    requires: ["website"],
  },
  {
    key: "gallery",
    label: "Galleria",
    description: "Consente la pubblicazione del modulo gallery.",
    category: "Crescita",
    requires: ["website"],
  },
  {
    key: "favorites",
    label: "Preferiti",
    description: "Mantiene attivo il layer di salvataggio piatti preferiti.",
    category: "Crescita",
    requires: ["onlineMenu"],
  },
  {
    key: "inventoryFoodCost",
    label: "Magazzino e food cost",
    description: "Collega ingredienti, costi, soglie e margine stimato ai piatti del menu.",
    category: "Gestione",
    requires: ["onlineMenu"],
  },
  {
    key: "staffRoles",
    label: "Ruoli staff",
    description: "Abilita permessi per cameriere, cucina, manager e admin con log modifiche.",
    category: "Gestione",
    requires: ["website"],
  },
  {
    key: "multiLocation",
    label: "Multi-sede",
    description: "Gestisce menu centralizzato, prezzi per sede, report comparativi e permessi.",
    category: "Gestione",
    requires: ["website"],
  },
];

export const TENANT_MODULE_CATEGORIES: TenantModuleCategory[] = [
  "Presenza digitale",
  "Ordini",
  "Operatività",
  "Crescita",
  "Gestione",
];

export const TENANT_MODULE_BY_KEY = Object.fromEntries(
  TENANT_MODULES.map((module) => [module.key, module]),
) as Record<TenantFeatureKey, TenantModuleDefinition>;

export function allTenantFeatures(enabled = true): TenantFeatureFlags {
  return Object.fromEntries(
    TENANT_MODULES.map((module) => [module.key, enabled]),
  ) as TenantFeatureFlags;
}

export function getMissingFeatureDependencies(
  features: TenantFeatureFlags,
  key: TenantFeatureKey,
): TenantFeatureKey[] {
  const definition = TENANT_MODULE_BY_KEY[key];
  const missingRequired = (definition.requires ?? []).filter(
    (dependency) => !isTenantFeatureEffective(features, dependency),
  );
  const anyGroup = definition.requiresAny ?? [];
  const missingAny =
    anyGroup.length > 0 &&
    !anyGroup.some((dependency) => isTenantFeatureEffective(features, dependency))
      ? anyGroup
      : [];
  return [...missingRequired, ...missingAny];
}

export function isTenantFeatureEffective(
  features: TenantFeatureFlags,
  key: TenantFeatureKey,
): boolean {
  if (!features[key]) return false;
  return getMissingFeatureDependencies(features, key).length === 0;
}

export function resolveTenantFeatures(
  features: TenantFeatureFlags,
): TenantFeatureFlags {
  return Object.fromEntries(
    TENANT_MODULES.map((module) => [
      module.key,
      isTenantFeatureEffective(features, module.key),
    ]),
  ) as TenantFeatureFlags;
}

export function formatFeatureDependencies(key: TenantFeatureKey): string {
  const definition = TENANT_MODULE_BY_KEY[key];
  const required =
    definition.requires?.map((dependency) => TENANT_MODULE_BY_KEY[dependency].label) ?? [];
  const anyGroup =
    definition.requiresAny?.map((dependency) => TENANT_MODULE_BY_KEY[dependency].label) ?? [];

  if (required.length > 0 && anyGroup.length > 0) {
    return `Richiede ${required.join(", ")} e almeno uno tra ${anyGroup.join(", ")}.`;
  }
  if (required.length > 0) return `Richiede ${required.join(", ")}.`;
  if (anyGroup.length > 0) return `Richiede almeno uno tra ${anyGroup.join(", ")}.`;
  return "";
}
