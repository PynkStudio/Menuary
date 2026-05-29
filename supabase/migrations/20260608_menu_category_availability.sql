-- Aggiunge fascia oraria opzionale alle categorie menu (es. pranzo/cena/aperisushi).
-- Shape JSON: { label: string, days?: number[] (0-6, 0=domenica), from: "HH:mm", to: "HH:mm" }.
-- NULL = categoria sempre disponibile (default backward-compat).

alter table public.menu_categories
  add column if not exists availability jsonb;

comment on column public.menu_categories.availability is
  'Fascia oraria opzionale. JSON { label, days?, from, to }. NULL = sempre disponibile.';
