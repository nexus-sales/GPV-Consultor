-- Añadir campos de geolocalización a las tablas que puedan tener datos incompletos
-- y asegurar que los nombres de columnas coincidan con la lógica de 'Población' y 'Provincia'.

-- 1. TABLA CANDIDATOS
ALTER TABLE "candidatesGPV" ADD COLUMN IF NOT EXISTS province text DEFAULT '';
ALTER TABLE "candidatesGPV" ADD COLUMN IF NOT EXISTS island text DEFAULT '';

-- 2. TABLA LEADS
ALTER TABLE leads ADD COLUMN IF NOT EXISTS isla text DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS provincia text DEFAULT '';

-- 3. TABLA DISTRIBUIDORES
ALTER TABLE "distributorsGPV" ADD COLUMN IF NOT EXISTS island text DEFAULT '';

-- Comentarios informativos para el esquema
COMMENT ON COLUMN "candidatesGPV"."city" IS 'Almacena la población o municipio del candidato.';
COMMENT ON COLUMN leads.ciudad IS 'Almacena la población o municipio del lead.';
COMMENT ON COLUMN "distributorsGPV".city IS 'Almacena la población o municipio del distribuidor.';

