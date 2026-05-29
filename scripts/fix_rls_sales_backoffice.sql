-- =============================================================================
-- FIX: RLS policies for salesGPV and backofficeContactsGPV
-- BEFORE: USING (true) WITH CHECK (true) — any authenticated user can read/write ALL rows
-- AFTER:  admin/manager see everything; commercial only sees their own records
-- Apply this in Supabase SQL editor or via Supabase CLI
-- =============================================================================

-- ── salesGPV ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow authenticated full access to salesGPV" ON public."salesGPV";
DROP POLICY IF EXISTS "sales_by_role" ON public."salesGPV";

CREATE POLICY "sales_by_role" ON public."salesGPV"
  FOR ALL TO authenticated
  USING (
    -- admin and manager see all records
    EXISTS (
      SELECT 1 FROM public."user_profilesGPV"
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
    OR
    -- commercial only sees records they created
    created_by = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."user_profilesGPV"
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
    OR created_by = auth.uid()
  );

-- NOTE: salesGPV needs a created_by column (uuid references auth.users).
-- If it doesn't exist yet:
-- ALTER TABLE public."salesGPV" ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
-- UPDATE public."salesGPV" SET created_by = auth.uid() WHERE created_by IS NULL;


-- ── backofficeContactsGPV ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow authenticated full access to backofficeContactsGPV" ON public."backofficeContactsGPV";
DROP POLICY IF EXISTS "backoffice_by_role" ON public."backofficeContactsGPV";

CREATE POLICY "backoffice_by_role" ON public."backofficeContactsGPV"
  FOR ALL TO authenticated
  USING (
    -- admin and manager see all contacts
    EXISTS (
      SELECT 1 FROM public."user_profilesGPV"
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
    OR
    -- commercial only sees contacts assigned to their operator name
    "operador" = (
      SELECT name FROM public."user_profilesGPV" WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."user_profilesGPV"
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
    OR "operador" = (
      SELECT name FROM public."user_profilesGPV" WHERE id = auth.uid()
    )
  );
