-- =============================================================================
-- MIGRATION: Add updated_at timestamptz + triggers to all entity tables
-- Run this ONCE in Supabase SQL editor.
-- Safe to re-run: uses IF NOT EXISTS and OR REPLACE.
-- Existing rows get DEFAULT now() automatically when the column is added.
-- =============================================================================

-- Shared trigger function (created once, used by all tables)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── distributorsGPV ──────────────────────────────────────────────────────────
ALTER TABLE public."distributorsGPV"
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS trg_updated_at ON public."distributorsGPV";
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public."distributorsGPV"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── candidatesGPV ────────────────────────────────────────────────────────────
ALTER TABLE public."candidatesGPV"
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS trg_updated_at ON public."candidatesGPV";
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public."candidatesGPV"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── visitsGPV ────────────────────────────────────────────────────────────────
ALTER TABLE public."visitsGPV"
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS trg_updated_at ON public."visitsGPV";
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public."visitsGPV"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── salesGPV ─────────────────────────────────────────────────────────────────
ALTER TABLE public."salesGPV"
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS trg_updated_at ON public."salesGPV";
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public."salesGPV"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── leadsGPV ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leadsGPV'
  ) THEN
    ALTER TABLE public."leadsGPV"
      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
    DROP TRIGGER IF EXISTS trg_updated_at ON public."leadsGPV";
    CREATE TRIGGER trg_updated_at
      BEFORE UPDATE ON public."leadsGPV"
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ── tasksGPV ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tasksGPV'
  ) THEN
    ALTER TABLE public."tasksGPV"
      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
    DROP TRIGGER IF EXISTS trg_updated_at ON public."tasksGPV";
    CREATE TRIGGER trg_updated_at
      BEFORE UPDATE ON public."tasksGPV"
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ── backofficeContactsGPV ────────────────────────────────────────────────────
ALTER TABLE public."backofficeContactsGPV"
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS trg_updated_at ON public."backofficeContactsGPV";
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public."backofficeContactsGPV"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- VERIFY: run this after applying to confirm all triggers are active
-- SELECT trigger_name, event_object_table FROM information_schema.triggers
-- WHERE trigger_name = 'trg_updated_at' ORDER BY event_object_table;
-- =============================================================================
