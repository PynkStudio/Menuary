-- Aggiunge vertical e status alla tabella tenants.
-- vertical → ramo della piattaforma ("food" | "services")
-- status   → ciclo di vita del tenant ("active" | "trial" | "offline" | "trattativa")

alter table public.tenants
  add column if not exists vertical text not null default 'food',
  add column if not exists status   text not null default 'active';

-- Officina KAM: primo tenant reale Bizery (officina auto/moto), in fase di trattativa commerciale.
insert into public.tenants (id, name, label, domains, preview_slug, enabled, vertical, status, theme, features)
values (
  'officinakam',
  'Officina KAM',
  'Demo · Officina KAM',
  '{}',
  'officinakam',
  true,
  'services',
  'trattativa',
  '{
    "red":        "#F97316",
    "redDark":    "#C2410C",
    "peach":      "#FED7AA",
    "cream":      "#0A0A0B",
    "ink":        "#F8FAFC",
    "brick":      "#18181B",
    "mustard":    "#F97316",
    "mustardSoft":"#FEF3C7",
    "green":      "#22C55E",
    "pink":       "#A855F7"
  }',
  '{
    "website":             true,
    "onlineMenu":          true,
    "takeaway":            false,
    "tableOrders":         false,
    "orderKiosk":          false,
    "kitchenDisplay":      false,
    "dinerSeparation":     false,
    "reservations":        true,
    "tablePlanner":        true,
    "productAvailability": true,
    "upselling":           true,
    "crm":                 true,
    "analytics":           true,
    "takeawaySlots":       false,
    "deliveryHub":         false,
    "inventoryFoodCost":   true,
    "printStations":       false,
    "staffRoles":          true,
    "multiLocation":       false,
    "favorites":           false,
    "reviews":             true,
    "gallery":             true
  }'
)
on conflict (id) do update set
  vertical     = excluded.vertical,
  status       = excluded.status,
  preview_slug = excluded.preview_slug,
  enabled      = excluded.enabled,
  theme        = excluded.theme,
  features     = excluded.features;
