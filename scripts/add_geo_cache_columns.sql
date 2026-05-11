-- ============================================================
-- GPV Canarias - Caché de Coordenadas (Optimización)
-- Añade columnas lat/lng a candidatos y distribuidores
-- ============================================================

-- 1. Añadir columnas a candidatesGPV
ALTER TABLE public."candidatesGPV" 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- 2. Añadir columnas a distributorsGPV
ALTER TABLE public."distributorsGPV" 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Comentario informativo: Estas columnas permitirán guardar las coordenadas
-- una vez obtenidas de Google Maps, evitando llamadas repetitivas a la API.
