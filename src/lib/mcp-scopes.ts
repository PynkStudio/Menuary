export const PYNK_MCP_SCOPES = [
  "marketing:read", "marketing:write", "marketing:send",
  "crm:read", "crm:write",
  "mail:read", "mail:write", "mail:send",
  "admin:read", "admin:write",
] as const;

export type PynkMcpScope = (typeof PYNK_MCP_SCOPES)[number];

export const DEFAULT_PYNK_MCP_SCOPES: PynkMcpScope[] = [
  "marketing:read", "marketing:write", "marketing:send",
  "crm:read", "crm:write", "mail:read", "mail:write", "mail:send", "admin:read",
];

export function isPynkMcpScope(value: string): value is PynkMcpScope {
  return PYNK_MCP_SCOPES.includes(value as PynkMcpScope);
}

export const PYNK_MCP_SCOPE_LABELS: Record<PynkMcpScope, string> = {
  "marketing:read": "Leggere funnel e campagne Menuary",
  "marketing:write": "Gestire prospect, sequenze e stati",
  "marketing:send": "Inviare email del funnel",
  "crm:read": "Leggere il CRM PynkStudio",
  "crm:write": "Creare e aggiornare contatti CRM",
  "mail:read": "Leggere la posta amministrativa",
  "mail:write": "Gestire stato e assegnazione della posta",
  "mail:send": "Inviare e rispondere alle email",
  "admin:read": "Consultare tenant, contratti, supporto e configurazione",
  "admin:write": "Modificare dati amministrativi consentiti",
};
