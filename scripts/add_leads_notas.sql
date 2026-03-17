-- Añadir columna notas a la tabla leads (si no existe)
-- Ejecutar en Supabase SQL Editor

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS notas TEXT DEFAULT '';

-- Verificar que la columna existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'notas';
