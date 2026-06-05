-- ============================================================
-- GPV Canarias - Migrar tabla public.leads a public."leadsGPV"
-- Seguro para ejecutar varias veces.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public."leadsGPV"') IS NULL
     AND to_regclass('public.leads') IS NOT NULL THEN
    ALTER TABLE public.leads RENAME TO "leadsGPV";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public."leadsGPV" (
  id text PRIMARY KEY,
  fuente text DEFAULT 'manual',
  nombre text NOT NULL DEFAULT 'Lead sin nombre',
  telefono text,
  email text,
  web text,
  direccion text,
  ciudad text,
  provincia text,
  isla text,
  codigo_postal text,
  sector text,
  rating numeric,
  reviews_count integer DEFAULT 0,
  place_id text,
  estado text DEFAULT 'nuevo',
  notas text DEFAULT '',
  asignado_a text,
  converted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public."leadsGPV" ADD COLUMN IF NOT EXISTS isla text;
ALTER TABLE public."leadsGPV" ADD COLUMN IF NOT EXISTS codigo_postal text;
ALTER TABLE public."leadsGPV" ADD COLUMN IF NOT EXISTS converted_at timestamptz;
ALTER TABLE public."leadsGPV" ADD COLUMN IF NOT EXISTS notas text DEFAULT '';

DO $$
BEGIN
  IF to_regclass('public.leads') IS NOT NULL THEN
    INSERT INTO public."leadsGPV" (
      id,
      fuente,
      nombre,
      telefono,
      email,
      web,
      direccion,
      ciudad,
      provincia,
      isla,
      codigo_postal,
      sector,
      rating,
      reviews_count,
      place_id,
      estado,
      notas,
      asignado_a,
      converted_at,
      created_at,
      updated_at
    )
    SELECT
      id,
      fuente,
      nombre,
      telefono,
      email,
      web,
      direccion,
      ciudad,
      provincia,
      NULL::text AS isla,
      NULL::text AS codigo_postal,
      sector,
      rating,
      reviews_count,
      place_id,
      estado,
      notas,
      asignado_a,
      NULL::timestamptz AS converted_at,
      created_at,
      updated_at
    FROM public.leads
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

ALTER TABLE public."leadsGPV" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read leads" ON public."leadsGPV";
DROP POLICY IF EXISTS "Auth insert leads" ON public."leadsGPV";
DROP POLICY IF EXISTS "Auth update leads" ON public."leadsGPV";
DROP POLICY IF EXISTS "Auth delete leads" ON public."leadsGPV";

DROP POLICY IF EXISTS "Auth read leadsGPV" ON public."leadsGPV";
CREATE POLICY "Auth read leadsGPV" ON public."leadsGPV"
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Auth insert leadsGPV" ON public."leadsGPV";
CREATE POLICY "Auth insert leadsGPV" ON public."leadsGPV"
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Auth update leadsGPV" ON public."leadsGPV";
CREATE POLICY "Auth update leadsGPV" ON public."leadsGPV"
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Auth delete leadsGPV" ON public."leadsGPV";
CREATE POLICY "Auth delete leadsGPV" ON public."leadsGPV"
  FOR DELETE TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_updated_at ON public."leadsGPV";
CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON public."leadsGPV"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
