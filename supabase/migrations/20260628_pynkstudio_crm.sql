CREATE TABLE public.pynkstudio_crm (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  email             text        NOT NULL,
  phone             text        NOT NULL DEFAULT '',
  company           text,
  employees_count   integer,
  industry          text,
  address           text,
  work_hours        text,
  notes             text,
  tags              text[]      NOT NULL DEFAULT '{}',
  status            text        NOT NULL DEFAULT 'lead',
  source            text        NOT NULL DEFAULT 'booking',
  last_booking_id   uuid        REFERENCES public.consultation_bookings(id) ON DELETE SET NULL,
  last_booking_at   timestamptz,
  bookings_count    integer     NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pynkstudio_crm ADD CONSTRAINT pynkstudio_crm_email_unique UNIQUE (email);

CREATE INDEX ON public.pynkstudio_crm (status);
CREATE INDEX ON public.pynkstudio_crm (last_booking_at DESC NULLS LAST);
CREATE INDEX ON public.pynkstudio_crm (created_at DESC);

ALTER TABLE public.pynkstudio_crm ENABLE ROW LEVEL SECURITY;
