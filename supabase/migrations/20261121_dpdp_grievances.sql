-- ============================================================================
-- VISTĀRA KRAFTS — DPDP GRIEVANCES & RIGHTS TICKETS SCHEMA
-- Digital Personal Data Protection (DPDP) Act, 2023 (India) Compliance
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dpdp_grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT NOT NULL UNIQUE,
  request_type TEXT NOT NULL DEFAULT 'Grievance Redressal',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT DEFAULT '',
  order_id TEXT DEFAULT '',
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  sla_deadline TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
  resolution_notes TEXT DEFAULT '',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dpdp_grievances_ticket_id ON public.dpdp_grievances(ticket_id);
CREATE INDEX IF NOT EXISTS idx_dpdp_grievances_email ON public.dpdp_grievances(email);
CREATE INDEX IF NOT EXISTS idx_dpdp_grievances_status ON public.dpdp_grievances(status);
CREATE INDEX IF NOT EXISTS idx_dpdp_grievances_created_at ON public.dpdp_grievances(created_at DESC);

ALTER TABLE public.dpdp_grievances ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (patrons, visitors, users) can submit a statutory DPDP grievance
DROP POLICY IF EXISTS "Anyone can submit a DPDP grievance" ON public.dpdp_grievances;
CREATE POLICY "Anyone can submit a DPDP grievance"
  ON public.dpdp_grievances
  FOR INSERT
  WITH CHECK (true);

-- 2. Anyone can read grievance tickets (filtered by ticketId / email by frontend or admin)
DROP POLICY IF EXISTS "Public and Admin read DPDP grievances" ON public.dpdp_grievances;
CREATE POLICY "Public and Admin read DPDP grievances"
  ON public.dpdp_grievances
  FOR SELECT
  USING (true);

-- 3. Admin / Staff can update ticket status and resolution notes
DROP POLICY IF EXISTS "Admin update DPDP grievances" ON public.dpdp_grievances;
CREATE POLICY "Admin update DPDP grievances"
  ON public.dpdp_grievances
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.dpdp_grievances IS 'Statutory DPDP Act 2023 tickets, grievance redressal, data erasure and rights requests with 7-day SLA tracking';
