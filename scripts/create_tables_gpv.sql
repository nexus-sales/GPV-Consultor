-- ============================================================
-- GPV Canarias - Schema completo para Supabase
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Sectores
CREATE TABLE IF NOT EXISTS "sectorsGPV" (
  id text PRIMARY KEY,
  label text NOT NULL,
  icon text,
  color text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "sectorsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read sectorsGPV" ON "sectorsGPV";
CREATE POLICY "Public read sectorsGPV" ON "sectorsGPV" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth insert sectorsGPV" ON "sectorsGPV";
CREATE POLICY "Auth insert sectorsGPV" ON "sectorsGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update sectorsGPV" ON "sectorsGPV";
CREATE POLICY "Auth update sectorsGPV" ON "sectorsGPV" FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete sectorsGPV" ON "sectorsGPV";
CREATE POLICY "Auth delete sectorsGPV" ON "sectorsGPV" FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Marcas
CREATE TABLE IF NOT EXISTS "brandsGPV" (
  id text PRIMARY KEY,
  label text NOT NULL,
  sector_id text REFERENCES "sectorsGPV"(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "brandsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read brandsGPV" ON "brandsGPV";
CREATE POLICY "Public read brandsGPV" ON "brandsGPV" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth insert brandsGPV" ON "brandsGPV";
CREATE POLICY "Auth insert brandsGPV" ON "brandsGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update brandsGPV" ON "brandsGPV";
CREATE POLICY "Auth update brandsGPV" ON "brandsGPV" FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete brandsGPV" ON "brandsGPV";
CREATE POLICY "Auth delete brandsGPV" ON "brandsGPV" FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Perfiles de usuario
CREATE TABLE IF NOT EXISTS "user_profilesGPV" (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'commercial',
  zone text DEFAULT 'todas',
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE "user_profilesGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own profile" ON "user_profilesGPV";
CREATE POLICY "Users read own profile" ON "user_profilesGPV" FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own profile" ON "user_profilesGPV";
CREATE POLICY "Users update own profile" ON "user_profilesGPV" FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Auth insert profile" ON "user_profilesGPV";
CREATE POLICY "Auth insert profile" ON "user_profilesGPV" FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Distribuidores
CREATE TABLE IF NOT EXISTS "distributorsGPV" (
  id text PRIMARY KEY,
  code text,
  "externalCode" text,
  category jsonb DEFAULT '{}',
  "categoryId" text DEFAULT '',
  "pendingData" boolean DEFAULT false,
  "brandPolicy" jsonb DEFAULT '{}',
  name text NOT NULL DEFAULT 'Distribuidor sin nombre',
  "contactPerson" text DEFAULT '',
  "contactPersonBackup" text DEFAULT '',
  "channelType" text DEFAULT 'non_exclusive',
  brands text[] DEFAULT '{}',
  sectors text[] DEFAULT '{telco}',
  status text DEFAULT 'pending',
  province text DEFAULT '',
  city text DEFAULT '',
  "postalCode" text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  "createdAt" text DEFAULT '',
  notes text DEFAULT '',
  "notesHistory" jsonb DEFAULT '[]',
  "taxId" text DEFAULT '',
  "fiscalName" text DEFAULT '',
  "fiscalAddress" text DEFAULT '',
  "upgradeRequested" boolean DEFAULT false,
  "teamId" text,
  checklist jsonb DEFAULT '{}',
  "checklistComplete" boolean DEFAULT false,
  completion numeric DEFAULT 0,
  "salesYtd" numeric DEFAULT 0,
  "priorityScore" numeric DEFAULT 0,
  "priorityLevel" text DEFAULT 'medium',
  "priorityDrivers" jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "distributorsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read distributorsGPV" ON "distributorsGPV";
CREATE POLICY "Auth read distributorsGPV" ON "distributorsGPV" FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth insert distributorsGPV" ON "distributorsGPV";
CREATE POLICY "Auth insert distributorsGPV" ON "distributorsGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update distributorsGPV" ON "distributorsGPV";
CREATE POLICY "Auth update distributorsGPV" ON "distributorsGPV" FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete distributorsGPV" ON "distributorsGPV";
CREATE POLICY "Auth delete distributorsGPV" ON "distributorsGPV" FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Candidatos
CREATE TABLE IF NOT EXISTS "candidatesGPV" (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT 'Candidato sin nombre',
  "taxId" text DEFAULT '',
  stage text DEFAULT 'new',
  "channelCode" text DEFAULT '',
  contact jsonb,
  city text DEFAULT '',
  island text DEFAULT '',
  province text DEFAULT '',
  category jsonb,
  "categoryId" text,
  "pendingData" boolean DEFAULT false,
  "brandPolicy" jsonb,
  priority text DEFAULT 'medium',
  score numeric,
  notes text DEFAULT '',
  "notesHistory" jsonb DEFAULT '[]',
  "createdAt" text DEFAULT '',
  "updatedAt" text,
  "lastContactAt" text,
  position integer,
  source text,
  operator text DEFAULT '',
  "gpvProposal" boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "candidatesGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read candidatesGPV" ON "candidatesGPV";
CREATE POLICY "Auth read candidatesGPV" ON "candidatesGPV" FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth insert candidatesGPV" ON "candidatesGPV";
CREATE POLICY "Auth insert candidatesGPV" ON "candidatesGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update candidatesGPV" ON "candidatesGPV";
CREATE POLICY "Auth update candidatesGPV" ON "candidatesGPV" FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete candidatesGPV" ON "candidatesGPV";
CREATE POLICY "Auth delete candidatesGPV" ON "candidatesGPV" FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Visitas
CREATE TABLE IF NOT EXISTS "visitsGPV" (
  id text PRIMARY KEY,
  "distributorId" text,
  "candidateId" text,
  date text NOT NULL,
  "scheduledTime" text DEFAULT '09:00',
  type text DEFAULT 'presentacion',
  objective text DEFAULT '',
  summary text DEFAULT '',
  "nextSteps" text DEFAULT '',
  result text DEFAULT 'pendiente',
  "durationMinutes" integer DEFAULT 30,
  "createdAt" text DEFAULT '',
  reminder jsonb DEFAULT '{}',
  notes text DEFAULT '',
  "notesHistory" jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "visitsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read visitsGPV" ON "visitsGPV";
CREATE POLICY "Auth read visitsGPV" ON "visitsGPV" FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth insert visitsGPV" ON "visitsGPV";
CREATE POLICY "Auth insert visitsGPV" ON "visitsGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update visitsGPV" ON "visitsGPV";
CREATE POLICY "Auth update visitsGPV" ON "visitsGPV" FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete visitsGPV" ON "visitsGPV";
CREATE POLICY "Auth delete visitsGPV" ON "visitsGPV" FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Ventas
CREATE TABLE IF NOT EXISTS "salesGPV" (
  id text PRIMARY KEY,
  "distributorId" text DEFAULT '',
  date text NOT NULL,
  brand text DEFAULT '',
  "sectorId" text DEFAULT 'telco',
  family text DEFAULT '',
  operations integer DEFAULT 0,
  notes text DEFAULT '',
  "createdAt" text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "salesGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read salesGPV" ON "salesGPV";
CREATE POLICY "Auth read salesGPV" ON "salesGPV" FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth insert salesGPV" ON "salesGPV";
CREATE POLICY "Auth insert salesGPV" ON "salesGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update salesGPV" ON "salesGPV";
CREATE POLICY "Auth update salesGPV" ON "salesGPV" FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete salesGPV" ON "salesGPV";
CREATE POLICY "Auth delete salesGPV" ON "salesGPV" FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- Datos iniciales
-- ============================================================

INSERT INTO "sectorsGPV" (id, label, icon, color) VALUES
('telco', 'Telefonía', '📱', 'indigo'),
('alarms', 'Alarmas', '🛡️', 'red'),
('energy', 'Energía', '⚡', 'yellow')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, icon = EXCLUDED.icon, color = EXCLUDED.color;

INSERT INTO "brandsGPV" (id, label, sector_id) VALUES
('silbo', 'Silbö', 'telco'),
('lowi', 'Lowi', 'telco'),
('vodafone_resid', 'Vodafone Residencial', 'telco'),
('vodafone_soho', 'Vodafone Soho', 'telco'),
('adt', 'ADT Alarmas', 'alarms'),
('securitas', 'Securitas Direct', 'alarms'),
('prosegur', 'Prosegur', 'alarms'),
('endesa', 'Endesa', 'energy'),
('iberdrola', 'Iberdrola', 'energy'),
('naturgy', 'Naturgy', 'energy')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sector_id = EXCLUDED.sector_id;
