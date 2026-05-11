-- ============================================================
-- GPV Canarias - Refuerzo de Seguridad (RLS y Auditoria)
-- Ejecutar en el SQL Editor de Supabase.
--
-- Corrige tambien el error:
--   relation "user_profilesgpv" does not exist
--
-- Causa habitual: una funcion/politica RLS previa resolvia el perfil
-- sin comillas o sin esquema, y PostgreSQL convertia user_profilesGPV
-- a user_profilesgpv.
-- ============================================================

-- 0. Perfil de usuario requerido por AuthContext y por public.is_admin().
CREATE TABLE IF NOT EXISTS public."user_profilesGPV" (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'commercial',
  zone text DEFAULT 'todas',
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public."user_profilesGPV"
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'commercial',
  ADD COLUMN IF NOT EXISTS zone text DEFAULT 'todas',
  ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public."user_profilesGPV" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public."user_profilesGPV";
DROP POLICY IF EXISTS "Users update own profile" ON public."user_profilesGPV";
DROP POLICY IF EXISTS "Auth insert profile" ON public."user_profilesGPV";
DROP POLICY IF EXISTS "Users insert own profile" ON public."user_profilesGPV";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."user_profilesGPV";

CREATE POLICY "Users read own profile" ON public."user_profilesGPV"
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public."user_profilesGPV"
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public."user_profilesGPV"
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 1. Columnas owner_id en tablas principales.
--    Se aplican solo si la tabla existe para que el script no se corte
--    en instalaciones parciales.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'distributorsGPV',
    'candidatesGPV',
    'visitsGPV',
    'salesGPV',
    'tasksGPV'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) DEFAULT auth.uid()',
        table_name
      );
    END IF;
  END LOOP;
END $$;

-- 2. Funcion para verificar si un usuario es administrador.
--    Usa esquema y comillas explicitas para evitar user_profilesGPV -> user_profilesgpv.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE((
    SELECT p.role = 'admin'
    FROM public."user_profilesGPV" AS p
    WHERE p.id = auth.uid()
    LIMIT 1
  ), false);
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Politicas reforzadas.
--    Borra nombres antiguos, nombres nuevos y politica permisiva de emergencia.

-- Distribuidores
ALTER TABLE public."distributorsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read distributorsGPV" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Auth insert distributorsGPV" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Auth update distributorsGPV" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Auth delete distributorsGPV" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Selective read distributors" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Secure insert distributors" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Secure update distributors" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Secure delete distributors" ON public."distributorsGPV";

CREATE POLICY "Selective read distributors" ON public."distributorsGPV"
  FOR SELECT
  USING (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure insert distributors" ON public."distributorsGPV"
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure update distributors" ON public."distributorsGPV"
  FOR UPDATE
  USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure delete distributors" ON public."distributorsGPV"
  FOR DELETE
  USING (auth.uid() = owner_id OR public.is_admin());

-- Candidatos
ALTER TABLE public."candidatesGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read candidatesGPV" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Auth insert candidatesGPV" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Auth update candidatesGPV" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Auth delete candidatesGPV" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Selective read candidates" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Secure insert candidates" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Secure update candidates" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Secure delete candidates" ON public."candidatesGPV";

CREATE POLICY "Selective read candidates" ON public."candidatesGPV"
  FOR SELECT
  USING (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure insert candidates" ON public."candidatesGPV"
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure update candidates" ON public."candidatesGPV"
  FOR UPDATE
  USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure delete candidates" ON public."candidatesGPV"
  FOR DELETE
  USING (auth.uid() = owner_id OR public.is_admin());

-- Visitas
ALTER TABLE public."visitsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read visitsGPV" ON public."visitsGPV";
DROP POLICY IF EXISTS "Auth insert visitsGPV" ON public."visitsGPV";
DROP POLICY IF EXISTS "Auth update visitsGPV" ON public."visitsGPV";
DROP POLICY IF EXISTS "Auth delete visitsGPV" ON public."visitsGPV";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."visitsGPV";
DROP POLICY IF EXISTS "Selective read visits" ON public."visitsGPV";
DROP POLICY IF EXISTS "Secure insert visits" ON public."visitsGPV";
DROP POLICY IF EXISTS "Secure update visits" ON public."visitsGPV";
DROP POLICY IF EXISTS "Secure delete visits" ON public."visitsGPV";

CREATE POLICY "Selective read visits" ON public."visitsGPV"
  FOR SELECT
  USING (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure insert visits" ON public."visitsGPV"
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure update visits" ON public."visitsGPV"
  FOR UPDATE
  USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure delete visits" ON public."visitsGPV"
  FOR DELETE
  USING (auth.uid() = owner_id OR public.is_admin());

-- Ventas
ALTER TABLE public."salesGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read salesGPV" ON public."salesGPV";
DROP POLICY IF EXISTS "Auth insert salesGPV" ON public."salesGPV";
DROP POLICY IF EXISTS "Auth update salesGPV" ON public."salesGPV";
DROP POLICY IF EXISTS "Auth delete salesGPV" ON public."salesGPV";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."salesGPV";
DROP POLICY IF EXISTS "Selective read sales" ON public."salesGPV";
DROP POLICY IF EXISTS "Secure insert sales" ON public."salesGPV";
DROP POLICY IF EXISTS "Secure update sales" ON public."salesGPV";
DROP POLICY IF EXISTS "Secure delete sales" ON public."salesGPV";

CREATE POLICY "Selective read sales" ON public."salesGPV"
  FOR SELECT
  USING (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure insert sales" ON public."salesGPV"
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure update sales" ON public."salesGPV"
  FOR UPDATE
  USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Secure delete sales" ON public."salesGPV"
  FOR DELETE
  USING (auth.uid() = owner_id OR public.is_admin());

-- Tareas. Esta tabla no aparece en todos los scripts historicos, asi que
-- se endurece solo si ya existe.
DO $$
BEGIN
  IF to_regclass('public."tasksGPV"') IS NOT NULL THEN
    ALTER TABLE public."tasksGPV" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Auth read tasksGPV" ON public."tasksGPV";
    DROP POLICY IF EXISTS "Auth insert tasksGPV" ON public."tasksGPV";
    DROP POLICY IF EXISTS "Auth update tasksGPV" ON public."tasksGPV";
    DROP POLICY IF EXISTS "Auth delete tasksGPV" ON public."tasksGPV";
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."tasksGPV";
    DROP POLICY IF EXISTS "Selective read tasks" ON public."tasksGPV";
    DROP POLICY IF EXISTS "Secure insert tasks" ON public."tasksGPV";
    DROP POLICY IF EXISTS "Secure update tasks" ON public."tasksGPV";
    DROP POLICY IF EXISTS "Secure delete tasks" ON public."tasksGPV";

    CREATE POLICY "Selective read tasks" ON public."tasksGPV"
      FOR SELECT
      USING (auth.uid() = owner_id OR public.is_admin());

    CREATE POLICY "Secure insert tasks" ON public."tasksGPV"
      FOR INSERT
      WITH CHECK (auth.uid() = owner_id OR public.is_admin());

    CREATE POLICY "Secure update tasks" ON public."tasksGPV"
      FOR UPDATE
      USING (auth.uid() = owner_id OR public.is_admin())
      WITH CHECK (auth.uid() = owner_id OR public.is_admin());

    CREATE POLICY "Secure delete tasks" ON public."tasksGPV"
      FOR DELETE
      USING (auth.uid() = owner_id OR public.is_admin());
  END IF;
END $$;

-- 4. Aviso operativo:
--    Los registros antiguos con owner_id NULL solo seran visibles para admins.
--    Para asignarlos a un usuario concreto, ejecuta despues:
--      UPDATE public."distributorsGPV" SET owner_id = '<USER_UUID>' WHERE owner_id IS NULL;
--      UPDATE public."candidatesGPV" SET owner_id = '<USER_UUID>' WHERE owner_id IS NULL;
--      UPDATE public."visitsGPV" SET owner_id = '<USER_UUID>' WHERE owner_id IS NULL;
--      UPDATE public."salesGPV" SET owner_id = '<USER_UUID>' WHERE owner_id IS NULL;
--      UPDATE public."tasksGPV" SET owner_id = '<USER_UUID>' WHERE owner_id IS NULL;

-- 5. Refrescar cache de esquema de PostgREST.
NOTIFY pgrst, 'reload schema';
