import type { TenantFeatureFlags, TenantFeatureKey, TenantVertical } from "@/lib/tenant";

export type TenantModuleCategory =
  | "Presenza digitale"
  | "Ordini"
  | "Operatività"
  | "Crescita"
  | "Gestione";

// Copy alternativo per vertical diversi dal default ("food").
// Se non specificato per un vertical, si usano label e description di default.
export type VerticalModuleCopy = {
  label: string;
  description: string;
};

export type TenantModuleDefinition = {
  key: TenantFeatureKey;
  label: string;
  description: string;
  category: TenantModuleCategory;
  requires?: TenantFeatureKey[];
  requiresAny?: TenantFeatureKey[];
  // Sub-sistemi garantiti: quando questo modulo è attivo, i moduli in `implies`
  // vengono attivati automaticamente indipendentemente dal flag nel registry del tenant.
  // Usare per funzionalità che fanno parte integrante del pacchetto (es. favorites con menu).
  implies?: TenantFeatureKey[];
  // Copy specifico per vertical. Il default (food) è già in label/description.
  verticalCopy?: Partial<Record<TenantVertical, VerticalModuleCopy>>;
};

export const TENANT_MODULES: TenantModuleDefinition[] = [
  {
    key: "website",
    label: "Sito del locale",
    description: "Pubblica pagine, contatti, orari, brand e contenuti base del ristorante.",
    category: "Presenza digitale",
    verticalCopy: {
      services: {
        label: "Sito dell'attività",
        description: "Pubblica pagine, contatti, indirizzo, orari, brand e contenuti base dell'azienda.",
      },
    },
  },
  {
    key: "onlineMenu",
    label: "Menu online",
    description: "Rende disponibile il menu digitale consultabile da sito, QR e preview.",
    category: "Presenza digitale",
    requires: ["website"],
    // favorites è parte integrante del pacchetto menu: sempre incluso quando onlineMenu è attivo.
    implies: ["favorites"],
    verticalCopy: {
      services: {
        label: "Listino prezzi",
        description: "Pubblica servizi, prezzi, disponibilità, foto e cataloghi consultabili da sito e QR.",
      },
    },
  },
  {
    key: "takeaway",
    label: "Ordini da asporto",
    description: "Abilita percorso ordine e checkout da ritiro.",
    category: "Ordini",
    requires: ["onlineMenu"],
    verticalCopy: {
      services: {
        label: "Richieste a domicilio",
        description: "Abilita richieste per servizi in loco o a domicilio con checkout dedicato.",
      },
    },
  },
  {
    key: "tableOrders",
    label: "Ordini al tavolo",
    description: "Abilita QR, sessioni tavolo e checkout condiviso.",
    category: "Ordini",
    requires: ["onlineMenu"],
    verticalCopy: {
      services: {
        label: "Ordini in postazione",
        description: "Abilita QR, sessioni per postazione e checkout condiviso in sala.",
      },
    },
  },
  {
    key: "orderKiosk",
    label: "Kiosk ordini",
    description: "Abilita postazioni self-order per consultare il menu e inviare ordini dal locale.",
    category: "Ordini",
    requires: ["onlineMenu"],
    verticalCopy: {
      services: {
        label: "Kiosk self-service",
        description: "Abilita postazioni self-service per consultare i servizi e inviare richieste.",
      },
    },
  },
  {
    key: "takeawaySlots",
    label: "Slot e carico asporto",
    description: "Gestisce fasce di ritiro, capacità per slot e avvisi di cucina satura.",
    category: "Ordini",
    requires: ["takeaway"],
    verticalCopy: {
      services: {
        label: "Slot disponibilità",
        description: "Gestisce fasce orarie, capacità per slot e avvisi di agenda satura.",
      },
    },
  },
  {
    key: "deliveryHub",
    label: "Delivery proprietario",
    description: "Prepara il locale a ricevere ordini diretti e centralizzare i canali delivery.",
    category: "Ordini",
    requires: ["takeaway"],
    verticalCopy: {
      services: {
        label: "Hub interventi a domicilio",
        description: "Centralizza le richieste di intervento domiciliare e i canali di contatto.",
      },
    },
  },
  {
    key: "kitchenDisplay",
    label: "Schermo cucina",
    description: "Rende disponibile la vista operativa per la brigata.",
    category: "Operatività",
    requiresAny: ["takeaway", "tableOrders", "orderKiosk"],
    verticalCopy: {
      services: {
        label: "Bacheca operatori",
        description: "Vista operativa in tempo reale per gli operatori: richieste in coda, in lavorazione, completate.",
      },
    },
  },
  {
    key: "printStations",
    label: "Stampanti e reparti",
    description: "Divide le comande per cucina, bar, pizzeria e banco con stampa o ristampa.",
    category: "Operatività",
    requiresAny: ["takeaway", "tableOrders", "orderKiosk"],
    verticalCopy: {
      services: {
        label: "Reparti e stampa",
        description: "Divide le richieste per reparto o operatore con stampa o notifica dedicata.",
      },
    },
  },
  {
    key: "dinerSeparation",
    label: "Commensali distinti",
    description: "Separa gli ordini dei clienti all'interno della sessione tavolo.",
    category: "Operatività",
    requires: ["tableOrders"],
    verticalCopy: {
      services: {
        label: "Clienti distinti per postazione",
        description: "Separa i servizi richiesti da clienti diversi nella stessa sessione.",
      },
    },
  },
  {
    key: "reservations",
    label: "Prenotazioni",
    description: "Raccoglie prenotazioni online con recapiti, note, allergie e preferenze.",
    category: "Operatività",
    requires: ["website"],
    verticalCopy: {
      services: {
        label: "Appuntamenti",
        description: "Raccoglie richieste di appuntamento online con recapiti, note e preferenze del cliente.",
      },
    },
  },
  {
    key: "tablePlanner",
    label: "Gestione sala",
    description: "Mappa tavoli e stati operativi: libero, occupato, ordinato, pagamento, pulizia.",
    category: "Operatività",
    requires: ["reservations"],
    verticalCopy: {
      services: {
        label: "Agenda e postazioni",
        description: "Mappa postazioni e stati: libero, occupato, in lavorazione, completato.",
      },
    },
  },
  {
    key: "productAvailability",
    label: "Disponibilità piatti",
    description: "Nasconde esauriti, quantità limitate e piatti legati a ingredienti mancanti.",
    category: "Operatività",
    requires: ["onlineMenu"],
    verticalCopy: {
      services: {
        label: "Disponibilità servizi",
        description: "Nasconde servizi non disponibili, sospesi o con capacità esaurita.",
      },
    },
  },
  {
    key: "upselling",
    label: "Upselling menu",
    description: "Propone extra, abbinamenti, menu completi e suggerimenti in carrello.",
    category: "Crescita",
    requires: ["onlineMenu"],
    verticalCopy: {
      services: {
        label: "Servizi aggiuntivi",
        description: "Propone trattamenti complementari, pacchetti e add-on durante il percorso di prenotazione.",
      },
    },
  },
  {
    key: "crm",
    label: "CRM e fidelity",
    description: "Gestisce contatti, coupon, ritorno cliente, compleanni e storico preferenze.",
    category: "Crescita",
    requires: ["website"],
    verticalCopy: {
      services: {
        label: "CRM clienti",
        description: "Gestisce contatti, richieste, appuntamenti, follow-up e storico preferenze.",
      },
    },
  },
  {
    key: "analytics",
    label: "Analytics locale",
    description: "Mostra vendite, fasce orarie, piatti forti, scontrino medio e tempi cucina.",
    category: "Crescita",
    requiresAny: ["onlineMenu", "takeaway", "tableOrders", "orderKiosk"],
    verticalCopy: {
      services: {
        label: "Analytics attività",
        description: "Mostra richieste, appuntamenti, servizi più consultati, canali e conversioni.",
      },
    },
  },
  {
    key: "reviews",
    label: "Recensioni",
    description: "Consente la pubblicazione del modulo recensioni.",
    category: "Crescita",
    requires: ["website"],
    verticalCopy: {
      services: {
        label: "Recensioni",
        description: "Consente la pubblicazione e la gestione delle recensioni dell'attività.",
      },
    },
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
    verticalCopy: {
      services: {
        label: "Preferiti",
        description: "Mantiene attivo il salvataggio dei servizi preferiti da parte dei clienti.",
      },
    },
  },
  {
    key: "inventoryFoodCost",
    label: "Magazzino e food cost",
    description: "Collega ingredienti, costi, soglie e margine stimato ai piatti del menu.",
    category: "Gestione",
    requires: ["onlineMenu"],
    verticalCopy: {
      services: {
        label: "Costi e margini",
        description: "Collega materiali, costi operativi e margine stimato ai singoli servizi.",
      },
    },
  },
  {
    key: "staffRoles",
    label: "Ruoli staff",
    description: "Abilita permessi per cameriere, cucina, manager e admin con log modifiche.",
    category: "Gestione",
    requires: ["website"],
    verticalCopy: {
      services: {
        label: "Ruoli team",
        description: "Abilita permessi per operatori, tecnici, manager e admin con log modifiche.",
      },
    },
  },
  {
    key: "multiLocation",
    label: "Multi-sede",
    description: "Gestisce menu centralizzato, prezzi per sede, report comparativi e permessi.",
    category: "Gestione",
    requires: ["website"],
    verticalCopy: {
      services: {
        label: "Multi-sede",
        description: "Gestisce listini centralizzati, prezzi per sede, report comparativi e permessi.",
      },
    },
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
  // Prima passata: risolve i flag in base ai declared flags + dependency requirements.
  const resolved = Object.fromEntries(
    TENANT_MODULES.map((module) => [
      module.key,
      isTenantFeatureEffective(features, module.key),
    ]),
  ) as TenantFeatureFlags;

  // Seconda passata: propaga gli `implies` (sub-sistemi garantiti dal modulo padre).
  // Un modulo attivo porta sempre con sé i suoi sotto-sistemi, indipendentemente
  // da come il tenant ha configurato i flag nel registry.
  for (const mod of TENANT_MODULES) {
    if (resolved[mod.key]) {
      for (const implied of mod.implies ?? []) {
        resolved[implied] = true;
      }
    }
  }

  return resolved;
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
