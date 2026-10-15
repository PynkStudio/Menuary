-- Email opzionale nel CRM: UNIQUE(email) ammette più NULL; le stringhe vuote vanno normalizzate a NULL.
ALTER TABLE public.pynkstudio_crm ALTER COLUMN email DROP NOT NULL;
UPDATE public.pynkstudio_crm SET email = NULL WHERE trim(email) = '';
