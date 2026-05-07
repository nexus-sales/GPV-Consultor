-- Migration: Add proximoContacto column to backofficeContactsGPV
-- Stores the next scheduled contact date (ISO date string, nullable)

ALTER TABLE public."backofficeContactsGPV"
  ADD COLUMN IF NOT EXISTS "proximoContacto" TEXT;
