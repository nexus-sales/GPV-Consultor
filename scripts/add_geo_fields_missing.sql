-- ============================================================
-- Campos geográficos faltantes en leads y distributorsGPV
-- Ejecutar en el SQL Editor de Supabase
-- Seguro de ejecutar múltiples veces (IF NOT EXISTS)
-- ============================================================

-- 1. LEADS: añadir isla y codigo_postal
--    (también cubierto por update_leads_schema_v2.sql si ya se ejecutó)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS isla text,
  ADD COLUMN IF NOT EXISTS codigo_postal text;

-- 2. DISTRIBUTORS: añadir island (faltaba en el schema original)
ALTER TABLE public."distributorsGPV"
  ADD COLUMN IF NOT EXISTS island text DEFAULT '';
