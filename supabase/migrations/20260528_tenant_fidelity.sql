-- Fidelity program (modulo "crm" lato tenant)
-- Una entry per tenant per il programma, N regole di accumulo, N premi,
-- N iscritti (member = utente Menuary × tenant), ledger append-only dei
-- movimenti punti e tabella di redemptions per i premi richiesti.
--
-- Identità: l'iscritto è un account auth.users globale (clienti.menuary.it).
-- Saldo: somma del ledger. La colonna cache `points_balance` su members è
-- aggiornata da trigger su ogni insert nel ledger (idempotente, additivo).

-- ── enums ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE fidelity_expiry_kind AS ENUM (
    'never', 'yearly_dec31', 'custom_date', 'days_from_accrual'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fidelity_earn_kind AS ENUM (
    'signup_bonus', 'per_euro_spent', 'per_order_count',
    'day_of_week_bonus', 'date_range_bonus'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fidelity_reward_kind AS ENUM (
    'order_discount_amount', 'free_product',
    'external_coupon_code', 'category_percent_discount'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fidelity_ledger_source AS ENUM (
    'signup', 'order_earn', 'rule_bonus', 'redemption',
    'expiry', 'manual_adjustment', 'refund'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fidelity_redemption_status AS ENUM (
    'pending', 'applied', 'expired', 'refunded', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── tenant_fidelity_programs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_fidelity_programs (
  tenant_id text PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false,
  program_name text NOT NULL DEFAULT 'Programma Fedeltà',
  points_label text NOT NULL DEFAULT 'punti',
  expiry_kind fidelity_expiry_kind NOT NULL DEFAULT 'days_from_accrual',
  expiry_days int CHECK (expiry_days IS NULL OR expiry_days > 0),
  expiry_custom_date date,
  optin_text text NOT NULL DEFAULT 'Iscrivendomi accetto il regolamento del programma fedeltà e la privacy policy.',
  terms_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fidelity_program_expiry_consistency CHECK (
    (expiry_kind = 'days_from_accrual' AND expiry_days IS NOT NULL)
    OR (expiry_kind = 'custom_date' AND expiry_custom_date IS NOT NULL)
    OR (expiry_kind IN ('never', 'yearly_dec31'))
  )
);

-- ── tenant_fidelity_earn_rules ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_fidelity_earn_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind fidelity_earn_kind NOT NULL,
  label text NOT NULL,
  -- params dipende da kind:
  --  signup_bonus       → { "points": 50 }
  --  per_euro_spent     → { "points_per_euro": 1, "min_order": 0 }
  --  per_order_count    → { "points_per_order": 10, "min_order": 0 }
  --  day_of_week_bonus  → { "weekday": 2, "multiplier": 2 }   -- 0=dom..6=sab
  --  date_range_bonus   → { "from": "2026-12-20", "to": "2026-12-31", "multiplier": 3 }
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority int NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fidelity_earn_rules_tenant_idx
  ON tenant_fidelity_earn_rules(tenant_id, is_active, priority);

-- ── tenant_fidelity_rewards ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_fidelity_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind fidelity_reward_kind NOT NULL,
  name text NOT NULL,
  description text,
  points_cost int NOT NULL CHECK (points_cost > 0),
  -- payload dipende da kind:
  --  order_discount_amount      → { "amount_eur": 5 }
  --  free_product               → { "menu_item_id": "<uuid>" }
  --  external_coupon_code       → { "code_prefix": "FID", "code_length": 8 }
  --  category_percent_discount  → { "category_id": "<uuid>", "percent": 20 }
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  stock int CHECK (stock IS NULL OR stock >= 0),
  valid_from date,
  valid_to date,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fidelity_rewards_tenant_idx
  ON tenant_fidelity_rewards(tenant_id, is_active, sort_order);

-- ── tenant_fidelity_members ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_fidelity_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  optin_text text NOT NULL,
  optin_ip inet,
  optin_user_agent text,
  points_balance int NOT NULL DEFAULT 0,
  lifetime_earned int NOT NULL DEFAULT 0,
  lifetime_spent int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS fidelity_members_user_idx
  ON tenant_fidelity_members(user_id);

-- ── tenant_fidelity_ledger ────────────────────────────────────────────────
-- Append-only. Le righe negative rappresentano consumo/scadenza/refund.
CREATE TABLE IF NOT EXISTS tenant_fidelity_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES tenant_fidelity_members(id) ON DELETE CASCADE,
  points int NOT NULL,
  source fidelity_ledger_source NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES tenant_fidelity_earn_rules(id) ON DELETE SET NULL,
  redemption_id uuid,
  note text,
  -- Per le righe positive: data oltre la quale i punti non sono più spendibili.
  -- Per le righe negative (consumo/scadenza/refund): NULL.
  expires_at timestamptz,
  -- Quando una riga positiva viene parzialmente o totalmente "consumata" da
  -- una scadenza, marchiamo qui i punti già scaduti per evitare doppi prelievi.
  expired_points int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fidelity_ledger_member_idx
  ON tenant_fidelity_ledger(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS fidelity_ledger_expiry_idx
  ON tenant_fidelity_ledger(tenant_id, expires_at)
  WHERE expires_at IS NOT NULL AND points > 0;
CREATE INDEX IF NOT EXISTS fidelity_ledger_order_idx
  ON tenant_fidelity_ledger(order_id)
  WHERE order_id IS NOT NULL;

-- ── tenant_fidelity_redemptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_fidelity_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES tenant_fidelity_members(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES tenant_fidelity_rewards(id) ON DELETE RESTRICT,
  points_spent int NOT NULL CHECK (points_spent > 0),
  coupon_code text,
  status fidelity_redemption_status NOT NULL DEFAULT 'pending',
  -- Snapshot al momento del riscatto (il reward può cambiare poi).
  reward_kind fidelity_reward_kind NOT NULL,
  reward_payload jsonb NOT NULL,
  expires_at timestamptz,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS fidelity_redemptions_coupon_unique
  ON tenant_fidelity_redemptions(tenant_id, coupon_code)
  WHERE coupon_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS fidelity_redemptions_member_idx
  ON tenant_fidelity_redemptions(member_id, created_at DESC);

-- ── trigger aggiornamento saldo ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fidelity_apply_ledger() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE tenant_fidelity_members m
     SET points_balance   = m.points_balance + NEW.points,
         lifetime_earned  = m.lifetime_earned + GREATEST(NEW.points, 0),
         lifetime_spent   = m.lifetime_spent + GREATEST(-NEW.points, 0)
   WHERE m.id = NEW.member_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS fidelity_ledger_apply ON tenant_fidelity_ledger;
CREATE TRIGGER fidelity_ledger_apply
  AFTER INSERT ON tenant_fidelity_ledger
  FOR EACH ROW EXECUTE FUNCTION public.fidelity_apply_ledger();

-- ── trigger updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fidelity_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS fidelity_programs_touch ON tenant_fidelity_programs;
CREATE TRIGGER fidelity_programs_touch BEFORE UPDATE ON tenant_fidelity_programs
  FOR EACH ROW EXECUTE FUNCTION public.fidelity_touch_updated_at();

DROP TRIGGER IF EXISTS fidelity_earn_rules_touch ON tenant_fidelity_earn_rules;
CREATE TRIGGER fidelity_earn_rules_touch BEFORE UPDATE ON tenant_fidelity_earn_rules
  FOR EACH ROW EXECUTE FUNCTION public.fidelity_touch_updated_at();

DROP TRIGGER IF EXISTS fidelity_rewards_touch ON tenant_fidelity_rewards;
CREATE TRIGGER fidelity_rewards_touch BEFORE UPDATE ON tenant_fidelity_rewards
  FOR EACH ROW EXECUTE FUNCTION public.fidelity_touch_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE tenant_fidelity_programs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_fidelity_earn_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_fidelity_rewards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_fidelity_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_fidelity_ledger      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_fidelity_redemptions ENABLE ROW LEVEL SECURITY;

-- Programmi/regole/premi: leggibili da tutti (pubblici nel checkout/area cliente),
-- modificabili solo dagli admin del tenant.
DROP POLICY IF EXISTS fidelity_programs_read ON tenant_fidelity_programs;
CREATE POLICY fidelity_programs_read ON tenant_fidelity_programs
  FOR SELECT USING (true);
DROP POLICY IF EXISTS fidelity_programs_admin_write ON tenant_fidelity_programs;
CREATE POLICY fidelity_programs_admin_write ON tenant_fidelity_programs
  FOR ALL USING (can_admin_tenant(tenant_id)) WITH CHECK (can_admin_tenant(tenant_id));

DROP POLICY IF EXISTS fidelity_earn_rules_read ON tenant_fidelity_earn_rules;
CREATE POLICY fidelity_earn_rules_read ON tenant_fidelity_earn_rules
  FOR SELECT USING (true);
DROP POLICY IF EXISTS fidelity_earn_rules_admin_write ON tenant_fidelity_earn_rules;
CREATE POLICY fidelity_earn_rules_admin_write ON tenant_fidelity_earn_rules
  FOR ALL USING (can_admin_tenant(tenant_id)) WITH CHECK (can_admin_tenant(tenant_id));

DROP POLICY IF EXISTS fidelity_rewards_read ON tenant_fidelity_rewards;
CREATE POLICY fidelity_rewards_read ON tenant_fidelity_rewards
  FOR SELECT USING (true);
DROP POLICY IF EXISTS fidelity_rewards_admin_write ON tenant_fidelity_rewards;
CREATE POLICY fidelity_rewards_admin_write ON tenant_fidelity_rewards
  FOR ALL USING (can_admin_tenant(tenant_id)) WITH CHECK (can_admin_tenant(tenant_id));

-- Membri: il cliente vede solo sé stesso; admin tenant vede tutti i propri.
DROP POLICY IF EXISTS fidelity_members_self_read ON tenant_fidelity_members;
CREATE POLICY fidelity_members_self_read ON tenant_fidelity_members
  FOR SELECT USING (user_id = auth.uid() OR can_admin_tenant(tenant_id));
DROP POLICY IF EXISTS fidelity_members_self_insert ON tenant_fidelity_members;
CREATE POLICY fidelity_members_self_insert ON tenant_fidelity_members
  FOR INSERT WITH CHECK (user_id = auth.uid() OR can_admin_tenant(tenant_id));
DROP POLICY IF EXISTS fidelity_members_admin_update ON tenant_fidelity_members;
CREATE POLICY fidelity_members_admin_update ON tenant_fidelity_members
  FOR UPDATE USING (can_admin_tenant(tenant_id)) WITH CHECK (can_admin_tenant(tenant_id));

-- Ledger: cliente vede solo i propri movimenti; admin tenant vede tutti.
-- Scritture solo via service role o admin (l'engine punti gira lato server).
DROP POLICY IF EXISTS fidelity_ledger_member_read ON tenant_fidelity_ledger;
CREATE POLICY fidelity_ledger_member_read ON tenant_fidelity_ledger
  FOR SELECT USING (
    can_admin_tenant(tenant_id)
    OR EXISTS (
      SELECT 1 FROM tenant_fidelity_members m
      WHERE m.id = tenant_fidelity_ledger.member_id AND m.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS fidelity_ledger_admin_write ON tenant_fidelity_ledger;
CREATE POLICY fidelity_ledger_admin_write ON tenant_fidelity_ledger
  FOR INSERT WITH CHECK (can_admin_tenant(tenant_id));

-- Redemptions: cliente vede e crea solo le proprie; admin tenant vede tutto.
DROP POLICY IF EXISTS fidelity_redemptions_read ON tenant_fidelity_redemptions;
CREATE POLICY fidelity_redemptions_read ON tenant_fidelity_redemptions
  FOR SELECT USING (
    can_admin_tenant(tenant_id)
    OR EXISTS (
      SELECT 1 FROM tenant_fidelity_members m
      WHERE m.id = tenant_fidelity_redemptions.member_id AND m.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS fidelity_redemptions_self_insert ON tenant_fidelity_redemptions;
CREATE POLICY fidelity_redemptions_self_insert ON tenant_fidelity_redemptions
  FOR INSERT WITH CHECK (
    can_admin_tenant(tenant_id)
    OR EXISTS (
      SELECT 1 FROM tenant_fidelity_members m
      WHERE m.id = tenant_fidelity_redemptions.member_id AND m.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS fidelity_redemptions_admin_update ON tenant_fidelity_redemptions;
CREATE POLICY fidelity_redemptions_admin_update ON tenant_fidelity_redemptions
  FOR UPDATE USING (can_admin_tenant(tenant_id)) WITH CHECK (can_admin_tenant(tenant_id));
