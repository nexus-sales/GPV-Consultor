-- ============================================================
-- SCRIPT PARA UNIFICAR PERFILES (Tabla 'profiles' genérica)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Crear tabla profiles si no existe
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamptz DEFAULT now(),
  username text,
  full_name text,
  avatar_url text,
  website text,
  
  -- Campos específicos de GPV
  role text DEFAULT 'commercial',
  zone text DEFAULT 'todas',
  permissions text[] DEFAULT '{}'
);

-- 2. Añadir columnas si faltan (para tablas existentes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'commercial';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'zone') THEN
        ALTER TABLE public.profiles ADD COLUMN zone text DEFAULT 'todas';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'permissions') THEN
        ALTER TABLE public.profiles ADD COLUMN permissions text[] DEFAULT '{}';
    END IF;
END $$;

-- 3. Configurar Seguridad (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas viejas
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Nuevas políticas
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Asegurar lectura pública de config
ALTER TABLE "sectorsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read sectorsGPV" ON "sectorsGPV";
CREATE POLICY "Public read sectorsGPV" ON "sectorsGPV" FOR SELECT USING (true);

ALTER TABLE "brandsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read brandsGPV" ON "brandsGPV";
CREATE POLICY "Public read brandsGPV" ON "brandsGPV" FOR SELECT USING (true);
