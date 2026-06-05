-- script para añadir columna converted_at a la tabla leads
-- Ejecutar en el Editor SQL de Supabase

ALTER TABLE "leadsGPV" ADD COLUMN IF NOT EXISTS converted_at timestamptz;

-- También aseguramos que el RLS esté configurado para permitir inserts (ya debería estarlo según el schema)
-- DROP POLICY IF EXISTS "Auth insert leadsGPV" ON "leadsGPV";
-- CREATE POLICY "Auth insert leadsGPV" ON "leadsGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
