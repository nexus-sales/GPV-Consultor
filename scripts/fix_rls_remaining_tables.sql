-- =============================================================================
-- FIX: RLS policies for distributorsGPV, candidatesGPV, visitsGPV, leadsGPV, tasksGPV
-- These tables currently use generic "authenticated" access — any user can read all data.
-- AFTER: admin/manager see everything; commercial sees only records in their zone.
-- Run in Supabase SQL editor. Safe to re-run (DROP POLICY IF EXISTS).
-- =============================================================================

-- Helper: current user's role
-- CREATE OR REPLACE FUNCTION current_user_role() RETURNS text AS $$
--   SELECT role FROM public."user_profilesGPV" WHERE id = auth.uid()
-- $$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── distributorsGPV ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Auth read distributorsGPV" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Auth insert distributorsGPV" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Auth update distributorsGPV" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Auth delete distributorsGPV" ON public."distributorsGPV";
DROP POLICY IF EXISTS "distributors_by_role" ON public."distributorsGPV";

CREATE POLICY "distributors_by_role" ON public."distributorsGPV"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."user_profilesGPV"
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
    OR zone IS NULL
    OR zone = (SELECT zone FROM public."user_profilesGPV" WHERE id = auth.uid())
    OR zone = 'todas'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."user_profilesGPV"
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
    OR zone IS NULL
    OR zone = (SELECT zone FROM public."user_profilesGPV" WHERE id = auth.uid())
    OR zone = 'todas'
  );

-- ── candidatesGPV ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Auth read candidatesGPV" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Auth insert candidatesGPV" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Auth update candidatesGPV" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Auth delete candidatesGPV" ON public."candidatesGPV";
DROP POLICY IF EXISTS "candidates_by_role" ON public."candidatesGPV";

CREATE POLICY "candidates_by_role" ON public."candidatesGPV"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."user_profilesGPV"
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
    OR province IS NULL
    OR province = (SELECT zone FROM public."user_profilesGPV" WHERE id = auth.uid())
    OR (SELECT zone FROM public."user_profilesGPV" WHERE id = auth.uid()) = 'todas'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."user_profilesGPV"
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
    OR province IS NULL
    OR province = (SELECT zone FROM public."user_profilesGPV" WHERE id = auth.uid())
    OR (SELECT zone FROM public."user_profilesGPV" WHERE id = auth.uid()) = 'todas'
  );

-- ── visitsGPV ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "visits_by_role" ON public."visitsGPV";

CREATE POLICY "visits_by_role" ON public."visitsGPV"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."user_profilesGPV"
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
    OR "userId" = auth.uid()
    OR "userId" IS NULL
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."user_profilesGPV"
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
    OR "userId" = auth.uid()
    OR "userId" IS NULL
  );

-- ── leadsGPV ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads'
  ) THEN
    DROP POLICY IF EXISTS "leads_by_role" ON public.leads;
    CREATE POLICY "leads_by_role" ON public.leads
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public."user_profilesGPV"
          WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
        OR asignado_a = auth.uid()::text
        OR asignado_a IS NULL
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public."user_profilesGPV"
          WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
        OR asignado_a = auth.uid()::text
        OR asignado_a IS NULL
      );
  END IF;
END $$;

-- ── tasksGPV ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tasksGPV'
  ) THEN
    DROP POLICY IF EXISTS "tasks_by_role" ON public."tasksGPV";
    CREATE POLICY "tasks_by_role" ON public."tasksGPV"
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public."user_profilesGPV"
          WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
        OR "creatorId" = auth.uid()::text
        OR "creatorId" IS NULL
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public."user_profilesGPV"
          WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
        OR "creatorId" = auth.uid()::text
        OR "creatorId" IS NULL
      );
  END IF;
END $$;

-- =============================================================================
-- NOTE on distributorsGPV zone column:
-- If distributorsGPV does not have a 'zone' column, use a simpler policy:
--   CREATE POLICY "distributors_authenticated" ON public."distributorsGPV"
--     FOR ALL TO authenticated USING (auth.role() = 'authenticated');
-- The zone-based policy requires user_profilesGPV.zone to match distributor.zone.
-- =============================================================================
