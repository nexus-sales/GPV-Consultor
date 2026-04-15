-- script para sincronizar esquema de distribuidores con el nuevo sistema geográfico
-- Ejecutar en el Editor SQL de Supabase

-- 1. Añadir columna island si no existe (importante para el nuevo filtrado)
ALTER TABLE "distributorsGPV" ADD COLUMN IF NOT EXISTS island text DEFAULT '';

-- 2. Asegurar que externalCode y notesHistory estén bien tipados (ya deberían estarlo pero por si acaso)
-- notesHistory suele ser JSONB para historial de notas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributorsGPV' AND column_name='notesHistory') THEN
        ALTER TABLE "distributorsGPV" ADD COLUMN "notesHistory" jsonb DEFAULT '[]';
    END IF;
END $$;

-- 3. Inserción de prueba o actualización de datos existentes si fuera necesario
-- UPDATE "distributorsGPV" SET island = 'Tenerife' WHERE province = 'Santa Cruz de Tenerife' AND island = '';
