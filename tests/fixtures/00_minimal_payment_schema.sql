-- ====================================================================
-- SYNTHETIC TEST FIXTURE: MINIMAL SCHEMA FOR PHASE 6B PAYMENT TESTS
-- ====================================================================
-- DISCLAIMER: This fixture is strictly a synthetic test harness shim
-- for isolated CI execution. It is NOT a full production database schema.
-- It provides only the prerequisite objects necessary to apply and verify
-- Phase 6B migration 20260930121000_payment_invoice_integrity_phase6b.sql.
-- ====================================================================

-- 1. PostgreSQL Extensions & Base Security Roles
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- 2. Supabase Auth Simulation Shim
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- 3. Multi-Tenant Root & Context Resolution
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invoice_prefix text DEFAULT 'YSL-INV',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name text DEFAULT 'Admin User',
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 4. Parties Master (Customers & Consignors)
CREATE TABLE IF NOT EXISTS public.parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  outstanding_amount numeric DEFAULT 0,
  total_business numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Trips Master
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  party_id uuid REFERENCES public.parties(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  freight_amount numeric DEFAULT 0,
  advance_paid numeric DEFAULT 0,
  payment_status text DEFAULT 'pending',
  invoice_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 6. Invoices Table & Sequential Sequences
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  party_id uuid REFERENCES public.parties(id) ON DELETE SET NULL,
  invoice_number text,
  amount numeric DEFAULT 0,
  gst_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  status text DEFAULT 'unpaid',
  paid_at timestamptz,
  due_date date,
  consignee_name text,
  consignee_address text,
  consignee_gstin text,
  consignee_state text,
  consignee_state_code text,
  container_size text,
  loading_date date,
  unloading_date date,
  empty_location text,
  green_tax numeric DEFAULT 0,
  kata_charges numeric DEFAULT 0,
  toll_charges numeric DEFAULT 0,
  offloading_charges numeric DEFAULT 0,
  handling_charges numeric DEFAULT 0,
  loading_charges numeric DEFAULT 0,
  unloading_charges numeric DEFAULT 0,
  detention_charges numeric DEFAULT 0,
  loading_mode text DEFAULT 'not_applicable',
  non_taxable_amount numeric DEFAULT 0,
  taxable_amount numeric DEFAULT 0,
  round_off numeric DEFAULT 0,
  subtotal_freight numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  financial_year text NOT NULL,
  last_sequence integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_invoice_sequences_org_fy UNIQUE (org_id, financial_year)
);

-- 7. Canonical Payments Ledger Table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  party_id uuid REFERENCES public.parties(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text DEFAULT 'cash',
  reference_number text,
  notes text,
  payment_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Grant privileges on all created tables to authenticated and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
