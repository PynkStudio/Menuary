alter type public.siteadmin_role add value if not exists 'lead_inserter';

comment on type public.siteadmin_role is
  'Ruoli admin.menuary.it: superadmin/admin accesso completo, venditore CRM e demo, amministrazione billing, gestore tenant, lead_inserter solo inserimento lead manuale.';
