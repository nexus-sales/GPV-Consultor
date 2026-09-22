-- =============================================================================
-- Visitas por zona — columnas necesarias
--
-- NO se ha ejecutado: aplícalo tú en el SQL Editor de Supabase, o trasládalo
-- a la migración del backend propio si esta app se migra antes.
--
-- IMPORTANTE mientras no se aplique: createEntityStore.addItem NO lanza cuando
-- PostgREST rechaza una escritura — la encola como "guardado offline". Es decir,
-- si estas columnas no existen, concertar una cita o guardar la próxima acción
-- parecerá funcionar y no persistirá. Aplicar antes de usar la pantalla.
--
-- Las tres columnas son aditivas y opcionales: ejecutarlas no afecta a ninguna
-- funcionalidad existente, y son seguras de re-ejecutar.
-- =============================================================================

-- Cita concertada con un lead: la visita apunta al lead igual que ya apunta a
-- distribuidor, candidato o contacto de backoffice.
ALTER TABLE public."visitsGPV"
  ADD COLUMN IF NOT EXISTS "leadId" text;

CREATE INDEX IF NOT EXISTS "visitsGPV_leadId_idx"
  ON public."visitsGPV" ("leadId");

-- Próxima acción sobre el lead y fecha sugerida de visita.
ALTER TABLE public."leadsGPV"
  ADD COLUMN IF NOT EXISTS proxima_accion text,
  ADD COLUMN IF NOT EXISTS proxima_visita date;

-- Nota sobre la zona: NO se añade columna. La zona se calcula a partir de
-- codigo_postal (o del municipio como respaldo) en src/lib/data/zones.ts, de
-- modo que no puede quedar desincronizada con la dirección del lead.

-- Verificación:
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_name IN ('visitsGPV', 'leadsGPV')
--     AND column_name IN ('leadId', 'proxima_accion', 'proxima_visita');
