-- ============================================================
-- GPV Canarias - Refuerzo de Seguridad (RLS y Auditoría)
-- CORREGIDO: DROP POLICY IF EXISTS antes de cada CREATE
-- ============================================================

-- 0. Perfil de usuario
CREATE TABLE IF NOT EXISTS public."user_profilesGPV" (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'commercial',
  zone text DEFAULT 'todas',
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public."user_profilesGPV" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public."user_profilesGPV";
DROP POLICY IF EXISTS "Users update own profile" ON public."user_profilesGPV";
DROP POLICY IF EXISTS "Users insert own profile" ON public."user_profilesGPV";

CREATE POLICY "Users read own profile" ON public."user_profilesGPV" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public."user_profilesGPV" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public."user_profilesGPV" FOR INSERT WITH CHECK (auth.uid() = id);

-- 1. Función is_admin
-- Usamos CREATE OR REPLACE para evitar errores de dependencia si la función ya existe
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT COALESCE((SELECT p.role = 'admin' FROM public."user_profilesGPV" AS p WHERE p.id = auth.uid() LIMIT 1), false);
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Columnas owner_id
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['distributorsGPV', 'candidatesGPV', 'visitsGPV', 'salesGPV', 'tasksGPV'] LOOP
    IF to_regclass(format('public."%s"', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public."%s" ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) DEFAULT auth.uid()', t);
    END IF;
  END LOOP;
END $$;

-- 3. POLÍTICAS (SELECTIVE READ / SECURE WRITE)

-- DISTRIBUIDORES
ALTER TABLE public."distributorsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Selective read distributors" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Secure insert distributors" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Secure update distributors" ON public."distributorsGPV";
DROP POLICY IF EXISTS "Secure delete distributors" ON public."distributorsGPV";

CREATE POLICY "Selective read distributors" ON public."distributorsGPV" FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure insert distributors" ON public."distributorsGPV" FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure update distributors" ON public."distributorsGPV" FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure delete distributors" ON public."distributorsGPV" FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- CANDIDATOS
ALTER TABLE public."candidatesGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Selective read candidates" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Secure insert candidates" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Secure update candidates" ON public."candidatesGPV";
DROP POLICY IF EXISTS "Secure delete candidates" ON public."candidatesGPV";

CREATE POLICY "Selective read candidates" ON public."candidatesGPV" FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure insert candidates" ON public."candidatesGPV" FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure update candidates" ON public."candidatesGPV" FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure delete candidates" ON public."candidatesGPV" FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- VISITAS
ALTER TABLE public."visitsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Selective read visits" ON public."visitsGPV";
DROP POLICY IF EXISTS "Secure insert visits" ON public."visitsGPV";
DROP POLICY IF EXISTS "Secure update visits" ON public."visitsGPV";
DROP POLICY IF EXISTS "Secure delete visits" ON public."visitsGPV";

CREATE POLICY "Selective read visits" ON public."visitsGPV" FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure insert visits" ON public."visitsGPV" FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure update visits" ON public."visitsGPV" FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure delete visits" ON public."visitsGPV" FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- VENTAS
ALTER TABLE public."salesGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Selective read sales" ON public."salesGPV";
DROP POLICY IF EXISTS "Secure insert sales" ON public."salesGPV";
DROP POLICY IF EXISTS "Secure update sales" ON public."salesGPV";
DROP POLICY IF EXISTS "Secure delete sales" ON public."salesGPV";

CREATE POLICY "Selective read sales" ON public."salesGPV" FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure insert sales" ON public."salesGPV" FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure update sales" ON public."salesGPV" FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure delete sales" ON public."salesGPV" FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- TAREAS
ALTER TABLE public."tasksGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Selective read tasks" ON public."tasksGPV";
DROP POLICY IF EXISTS "Secure insert tasks" ON public."tasksGPV";
DROP POLICY IF EXISTS "Secure update tasks" ON public."tasksGPV";
DROP POLICY IF EXISTS "Secure delete tasks" ON public."tasksGPV";

CREATE POLICY "Selective read tasks" ON public."tasksGPV" FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure insert tasks" ON public."tasksGPV" FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure update tasks" ON public."tasksGPV" FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());
CREATE POLICY "Secure delete tasks" ON public."tasksGPV" FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());
