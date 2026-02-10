-- ============================================================
-- SCRIPT DE EMERGENCIA PARA PERFILES (user_profilesGPV)
-- Ejecuta esto si recibes error 406 Not Acceptable al cargar la app
-- ============================================================

ALTER TABLE "user_profilesGPV" ENABLE ROW LEVEL SECURITY;

-- Borrar políticas viejas
DROP POLICY IF EXISTS "Users read own profile" ON "user_profilesGPV";
DROP POLICY IF EXISTS "Users update own profile" ON "user_profilesGPV";
DROP POLICY IF EXISTS "Auth insert profile" ON "user_profilesGPV";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "user_profilesGPV";

-- Crear nuevas políticas CORRECTAS
-- 1. Leer: Un usuario solo puede leer su propio perfil
CREATE POLICY "Users read own profile" ON "user_profilesGPV"
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Actualizar: Un usuario solo puede actualizar su propio perfil
CREATE POLICY "Users update own profile" ON "user_profilesGPV"
  FOR UPDATE
  USING (auth.uid() = id);

-- 3. Insertar: Un usuario solo puede crear un perfil con su propio ID (al registrarse)
CREATE POLICY "Users insert own profile" ON "user_profilesGPV"
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Arreglos adicionales por si acaso
-- ============================================================

-- Sectores (público lectura)
ALTER TABLE "sectorsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read sectorsGPV" ON "sectorsGPV";
CREATE POLICY "Public read sectorsGPV" ON "sectorsGPV" FOR SELECT USING (true);

-- Marcas (público lectura)
ALTER TABLE "brandsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read brandsGPV" ON "brandsGPV";
CREATE POLICY "Public read brandsGPV" ON "brandsGPV" FOR SELECT USING (true);
