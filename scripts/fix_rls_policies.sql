-- ============================================================
-- SCRIPT DE EMERGENCIA PARA RLS (Row Level Security)
-- Ejecuta esto en el SQL Editor de Supabase para desbloquear escrituras
-- ============================================================

-- 1. Candidatos
ALTER TABLE "candidatesGPV" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "candidatesGPV";
DROP POLICY IF EXISTS "Auth insert candidatesGPV" ON "candidatesGPV";
DROP POLICY IF EXISTS "Auth update candidatesGPV" ON "candidatesGPV";
DROP POLICY IF EXISTS "Auth read candidatesGPV" ON "candidatesGPV";
DROP POLICY IF EXISTS "Auth delete candidatesGPV" ON "candidatesGPV";

-- Política permisiva para usuarios autenticados (cualquier usuario logueado puede leer/escribir)
CREATE POLICY "Enable all access for authenticated users" ON "candidatesGPV"
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- 2. Distribuidores
ALTER TABLE "distributorsGPV" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "distributorsGPV";
DROP POLICY IF EXISTS "Auth insert distributorsGPV" ON "distributorsGPV";

CREATE POLICY "Enable all access for authenticated users" ON "distributorsGPV"
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- 3. Visitas
ALTER TABLE "visitsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "visitsGPV";
CREATE POLICY "Enable all access for authenticated users" ON "visitsGPV"
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- 4. Ventas
ALTER TABLE "salesGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "salesGPV";
CREATE POLICY "Enable all access for authenticated users" ON "salesGPV"
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
