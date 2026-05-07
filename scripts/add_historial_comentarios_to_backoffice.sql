-- Migration: Add historialComentarios JSONB column to backofficeContactsGPV
-- Stores structured comment history: [{id, timestamp, autor, rol, contenido}]

ALTER TABLE public."backofficeContactsGPV"
  ADD COLUMN IF NOT EXISTS "historialComentarios" JSONB NOT NULL DEFAULT '[]'::jsonb;
