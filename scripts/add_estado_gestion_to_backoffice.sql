-- Migration: Add estadoGestion column to backofficeContactsGPV
-- Values: 'Pendiente' | 'Visitado' | 'En valoración' | 'Firmado' | 'Rechazado'

ALTER TABLE public."backofficeContactsGPV"
  ADD COLUMN IF NOT EXISTS "estadoGestion" TEXT NOT NULL DEFAULT 'Pendiente';

CREATE INDEX IF NOT EXISTS idx_bo_estado_gestion
  ON public."backofficeContactsGPV"("estadoGestion");
