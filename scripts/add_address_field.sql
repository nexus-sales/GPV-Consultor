-- ============================================================
-- GPV Canarias - Migración: añadir campo dirección
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Añadir columna "address" a candidatesGPV (si no existe)
ALTER TABLE "candidatesGPV"
  ADD COLUMN IF NOT EXISTS address text DEFAULT '';

-- 2. La tabla distributorsGPV ya tiene la columna "address".
--    Si por algún motivo no existe, ejecutar:
ALTER TABLE "distributorsGPV"
  ADD COLUMN IF NOT EXISTS address text DEFAULT '';

-- Verificar resultado
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('candidatesGPV', 'distributorsGPV')
  AND column_name = 'address'
ORDER BY table_name;
