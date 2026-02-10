-- ============================================================
-- GPV Canarias - Script de reparacion de schema
-- Ejecutar SOLO si las tablas ya existen con nombres incorrectos
-- ============================================================

-- Si existen tablas antiguas con nombres en minusculas, renombrar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sectorsgpv' AND table_schema = 'public') THEN
    ALTER TABLE sectorsgpv RENAME TO "sectorsGPV";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sectors' AND table_schema = 'public') THEN
    ALTER TABLE sectors RENAME TO "sectorsGPV";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brands' AND table_schema = 'public') THEN
    ALTER TABLE brands RENAME TO "brandsGPV";
  END IF;
END $$;

-- Asegurar que las tablas principales existen con nombres correctos
-- (ejecutar create_tables_gpv.sql si no existen)

-- Verificar RLS en todas las tablas
ALTER TABLE "sectorsGPV" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brandsGPV" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profilesGPV" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "distributorsGPV" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "candidatesGPV" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "visitsGPV" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "salesGPV" ENABLE ROW LEVEL SECURITY;

-- Recrear politicas con nombres correctos
-- sectorsGPV
DROP POLICY IF EXISTS "Public read access" ON "sectorsGPV";
DROP POLICY IF EXISTS "Public read sectorsGPV" ON "sectorsGPV";
CREATE POLICY "Public read sectorsGPV" ON "sectorsGPV" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth insert sectorsGPV" ON "sectorsGPV";
CREATE POLICY "Auth insert sectorsGPV" ON "sectorsGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update sectorsGPV" ON "sectorsGPV";
CREATE POLICY "Auth update sectorsGPV" ON "sectorsGPV" FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete sectorsGPV" ON "sectorsGPV";
CREATE POLICY "Auth delete sectorsGPV" ON "sectorsGPV" FOR DELETE USING (auth.role() = 'authenticated');

-- brandsGPV
DROP POLICY IF EXISTS "Public read access" ON "brandsGPV";
DROP POLICY IF EXISTS "Public read brandsGPV" ON "brandsGPV";
CREATE POLICY "Public read brandsGPV" ON "brandsGPV" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth insert brandsGPV" ON "brandsGPV";
CREATE POLICY "Auth insert brandsGPV" ON "brandsGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update brandsGPV" ON "brandsGPV";
CREATE POLICY "Auth update brandsGPV" ON "brandsGPV" FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete brandsGPV" ON "brandsGPV";
CREATE POLICY "Auth delete brandsGPV" ON "brandsGPV" FOR DELETE USING (auth.role() = 'authenticated');

-- Datos iniciales (upsert)
INSERT INTO "sectorsGPV" (id, label, icon, color) VALUES
('telco', 'Telefonía', '📱', 'indigo'),
('alarms', 'Alarmas', '🛡️', 'red'),
('energy', 'Energía', '⚡', 'yellow')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, icon = EXCLUDED.icon, color = EXCLUDED.color;

INSERT INTO "brandsGPV" (id, label, sector_id) VALUES
('silbo', 'Silbö', 'telco'),
('lowi', 'Lowi', 'telco'),
('vodafone_resid', 'Vodafone Residencial', 'telco'),
('vodafone_soho', 'Vodafone Soho', 'telco'),
('adt', 'ADT Alarmas', 'alarms'),
('securitas', 'Securitas Direct', 'alarms'),
('prosegur', 'Prosegur', 'alarms'),
('endesa', 'Endesa', 'energy'),
('iberdrola', 'Iberdrola', 'energy'),
('naturgy', 'Naturgy', 'energy')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sector_id = EXCLUDED.sector_id;
