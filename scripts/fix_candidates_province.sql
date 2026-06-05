-- Add geolocation fields to tables that may have incomplete data.
-- Keep column names aligned with the app logic for city and province.

-- 1. CANDIDATES
ALTER TABLE "candidatesGPV" ADD COLUMN IF NOT EXISTS province text DEFAULT '';
ALTER TABLE "candidatesGPV" ADD COLUMN IF NOT EXISTS island text DEFAULT '';

-- 2. LEADS
ALTER TABLE "leadsGPV" ADD COLUMN IF NOT EXISTS isla text DEFAULT '';
ALTER TABLE "leadsGPV" ADD COLUMN IF NOT EXISTS provincia text DEFAULT '';

-- 3. DISTRIBUTORS
ALTER TABLE "distributorsGPV" ADD COLUMN IF NOT EXISTS island text DEFAULT '';

-- Informative schema comments
COMMENT ON COLUMN "candidatesGPV"."city" IS 'Stores the candidate city or municipality.';
COMMENT ON COLUMN "leadsGPV".ciudad IS 'Stores the lead city or municipality.';
COMMENT ON COLUMN "distributorsGPV".city IS 'Stores the distributor city or municipality.';
