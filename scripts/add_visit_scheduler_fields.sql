-- ============================================================
-- GPV Canarias - Campos de planificacion comun para visitsGPV
-- Seguro para ejecutar varias veces.
-- ============================================================

ALTER TABLE public."visitsGPV" ADD COLUMN IF NOT EXISTS "backofficeContactId" text;
ALTER TABLE public."visitsGPV" ADD COLUMN IF NOT EXISTS "sourceModule" text DEFAULT 'visits';
ALTER TABLE public."visitsGPV" ADD COLUMN IF NOT EXISTS "assignedUserId" text;
ALTER TABLE public."visitsGPV" ADD COLUMN IF NOT EXISTS "statusOperative" text DEFAULT 'planificada';
ALTER TABLE public."visitsGPV" ADD COLUMN IF NOT EXISTS location text DEFAULT '';
ALTER TABLE public."visitsGPV" ADD COLUMN IF NOT EXISTS "locationQuality" text DEFAULT 'missing';
ALTER TABLE public."visitsGPV" ADD COLUMN IF NOT EXISTS "scheduleWarnings" text[] DEFAULT '{}';
ALTER TABLE public."visitsGPV" ADD COLUMN IF NOT EXISTS lat numeric;
ALTER TABLE public."visitsGPV" ADD COLUMN IF NOT EXISTS lng numeric;

UPDATE public."visitsGPV"
SET "sourceModule" = CASE
  WHEN "candidateId" IS NOT NULL THEN 'candidates'
  WHEN "distributorId" IS NOT NULL THEN 'distributors'
  ELSE COALESCE("sourceModule", 'visits')
END
WHERE "sourceModule" IS NULL OR "sourceModule" = 'visits';

UPDATE public."visitsGPV"
SET "locationQuality" = CASE
  WHEN lat IS NOT NULL AND lng IS NOT NULL THEN 'verified'
  WHEN COALESCE(location, '') <> '' THEN 'partial'
  ELSE COALESCE("locationQuality", 'missing')
END
WHERE "locationQuality" IS NULL OR "locationQuality" = 'missing';
