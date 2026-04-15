-- ============================================================
-- GPV Canarias - Schema completo y definitivo
-- Seguro de ejecutar múltiples veces (IF NOT EXISTS / IF NOT EXISTS)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- 1. SECTORES
-- ============================================================
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

-- ============================================================
-- 2. MARCAS
-- ============================================================
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

-- ============================================================
-- 3. PERFILES DE USUARIO
-- ============================================================
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

-- ============================================================
-- 4. DISTRIBUIDORES
-- ============================================================
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

-- ============================================================
-- 5. CANDIDATOS
-- ============================================================
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
  address text DEFAULT '',
  "postalCode" text DEFAULT '',
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
  created_at timestamptz DEFAULT now()
);

-- Columnas que pueden faltar si la tabla ya existía
ALTER TABLE "candidatesGPV" ADD COLUMN IF NOT EXISTS address text DEFAULT '';
ALTER TABLE "candidatesGPV" ADD COLUMN IF NOT EXISTS "postalCode" text DEFAULT '';

ALTER TABLE "candidatesGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read candidatesGPV" ON "candidatesGPV";
CREATE POLICY "Auth read candidatesGPV" ON "candidatesGPV" FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth insert candidatesGPV" ON "candidatesGPV";
CREATE POLICY "Auth insert candidatesGPV" ON "candidatesGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update candidatesGPV" ON "candidatesGPV";
CREATE POLICY "Auth update candidatesGPV" ON "candidatesGPV" FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete candidatesGPV" ON "candidatesGPV";
CREATE POLICY "Auth delete candidatesGPV" ON "candidatesGPV" FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 6. VISITAS
-- ============================================================
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

-- Columna que puede faltar si la tabla ya existía
ALTER TABLE "visitsGPV" ADD COLUMN IF NOT EXISTS "scheduledTime" text DEFAULT '09:00';

ALTER TABLE "visitsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read visitsGPV" ON "visitsGPV";
CREATE POLICY "Auth read visitsGPV" ON "visitsGPV" FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth insert visitsGPV" ON "visitsGPV";
CREATE POLICY "Auth insert visitsGPV" ON "visitsGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update visitsGPV" ON "visitsGPV";
CREATE POLICY "Auth update visitsGPV" ON "visitsGPV" FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete visitsGPV" ON "visitsGPV";
CREATE POLICY "Auth delete visitsGPV" ON "visitsGPV" FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. VENTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS "salesGPV" (
  id text PRIMARY KEY,
  "distributorId" text,
  "distributorCode" text DEFAULT '',
  "distributorName" text DEFAULT '',
  -- Datos del formulario / Excel
  sector text DEFAULT 'Otros',
  "sectorId" text DEFAULT 'telco',
  modo text,
  "tipoDocumento" text,
  "nombreCliente" text,
  documento text,
  -- Fechas
  date text DEFAULT '',
  "fechaOferta" text,
  "fechaCierre" text,
  "fechaActivacion" text,
  "fechaBaja" text,
  -- Estado y compatibilidad
  status text DEFAULT 'Pendiente',
  observaciones text,
  brand text DEFAULT '',
  family text DEFAULT '',
  operations integer DEFAULT 0,
  notes text DEFAULT '',
  "createdAt" text DEFAULT '',
  "updatedAt" text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Columnas que pueden faltar si la tabla ya existía con estructura antigua
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS "distributorCode" text DEFAULT '';
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS "distributorName" text DEFAULT '';
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS sector text DEFAULT 'Otros';
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS "sectorId" text DEFAULT 'telco';
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS modo text;
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS "tipoDocumento" text;
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS "nombreCliente" text;
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS documento text;
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS "fechaOferta" text;
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS "fechaCierre" text;
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS "fechaActivacion" text;
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS "fechaBaja" text;
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pendiente';
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS observaciones text;
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS "updatedAt" text DEFAULT '';

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
-- 8. LEADS
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY,
  fuente text DEFAULT 'manual',
  nombre text NOT NULL DEFAULT 'Lead sin nombre',
  telefono text,
  email text,
  web text,
  direccion text,
  ciudad text,
  provincia text,
  sector text,
  rating numeric,
  reviews_count integer DEFAULT 0,
  place_id text,
  estado text DEFAULT 'nuevo',
  notas text DEFAULT '',
  asignado_a text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Columna que puede faltar si la tabla ya existía
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notas text DEFAULT '';

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read leads" ON leads;
CREATE POLICY "Auth read leads" ON leads FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth insert leads" ON leads;
CREATE POLICY "Auth insert leads" ON leads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update leads" ON leads;
CREATE POLICY "Auth update leads" ON leads FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete leads" ON leads;
CREATE POLICY "Auth delete leads" ON leads FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 9. ACUERDOS DE COMISIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS "commissionAgreementsGPV" (
  id text PRIMARY KEY,
  "distributorId" text,
  sector text DEFAULT '',
  operator text DEFAULT '',
  -- Residencial
  "resiType" text DEFAULT 'adoc',
  "resiAmount" text,
  "resiLevels" text,
  "resiTiers" jsonb DEFAULT '[]',
  "resiRappel" text DEFAULT '',
  -- PYME
  "pymeType" text DEFAULT 'adoc',
  "pymeAmount" text,
  "pymeLevels" text,
  "pymeTiers" jsonb DEFAULT '[]',
  "pymeRappel" text DEFAULT '',
  -- Común
  notes text,
  history jsonb DEFAULT '[]',
  "createdAt" text DEFAULT '',
  "updatedAt" text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "commissionAgreementsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read commissionAgreementsGPV" ON "commissionAgreementsGPV";
CREATE POLICY "Auth read commissionAgreementsGPV" ON "commissionAgreementsGPV" FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth insert commissionAgreementsGPV" ON "commissionAgreementsGPV";
CREATE POLICY "Auth insert commissionAgreementsGPV" ON "commissionAgreementsGPV" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth update commissionAgreementsGPV" ON "commissionAgreementsGPV";
CREATE POLICY "Auth update commissionAgreementsGPV" ON "commissionAgreementsGPV" FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth delete commissionAgreementsGPV" ON "commissionAgreementsGPV";
CREATE POLICY "Auth delete commissionAgreementsGPV" ON "commissionAgreementsGPV" FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 10. CONFIGURACIÓN DE INTEGRACIONES (admin-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS "integration_settingsGPV" (
  setting_key text PRIMARY KEY DEFAULT 'default',
  config jsonb NOT NULL DEFAULT '{
    "calendar": {"enabled": false, "provider": null, "calendarId": "primary", "defaultReminderMinutes": 15, "syncVisits": true, "syncCalls": true, "syncDeadlines": true},
    "tasks": {"enabled": false, "provider": null, "taskListId": null, "syncFollowUps": true, "syncPendingData": true},
    "email": {"enabled": false, "provider": null, "sendConfirmations": false, "sendReminders": false}
  }'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE "integration_settingsGPV" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read integration settings" ON "integration_settingsGPV";
CREATE POLICY "Admins read integration settings" ON "integration_settingsGPV"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "user_profilesGPV" p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "Admins write integration settings" ON "integration_settingsGPV";
CREATE POLICY "Admins write integration settings" ON "integration_settingsGPV"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "user_profilesGPV" p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- 11. CONEXIONES OAUTH (server-side, sin acceso directo desde cliente)
-- ============================================================
CREATE TABLE IF NOT EXISTS "integration_oauth_connectionsGPV" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'microsoft')),
  provider_user_email text,
  refresh_token text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  token_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_refreshed_at timestamptz,
  CONSTRAINT integration_oauth_connections_user_provider_key UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integration_oauth_connections_user ON "integration_oauth_connectionsGPV" (user_id);
CREATE INDEX IF NOT EXISTS idx_integration_oauth_connections_provider ON "integration_oauth_connectionsGPV" (provider);

ALTER TABLE "integration_oauth_connectionsGPV" ENABLE ROW LEVEL SECURITY;
-- Sin acceso directo desde el cliente: solo accesible por Edge Functions con service_role
DROP POLICY IF EXISTS "No direct access oauth connections" ON "integration_oauth_connectionsGPV";
CREATE POLICY "No direct access oauth connections" ON "integration_oauth_connectionsGPV"
  FOR ALL USING (false);

-- ============================================================
-- 12. DATOS INICIALES
-- ============================================================
INSERT INTO "sectorsGPV" (id, label, icon, color) VALUES
  ('telco', 'Telefonía', '📱', 'indigo'),
  ('alarms', 'Alarmas', '🛡️', 'red'),
  ('energy', 'Energía', '⚡', 'yellow')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, icon = EXCLUDED.icon, color = EXCLUDED.color;

INSERT INTO "brandsGPV" (id, label, sector_id) VALUES

  ('lowi', 'Lowi', 'telco'),
  ('o2', 'O2', 'telco'),
  ('vodafone_resid', 'Vodafone Residencial', 'telco'),
  ('vodafone_soho', 'Vodafone Soho', 'telco'),
  ('adt', 'ADT Alarmas', 'alarms'),
  ('securitas', 'Securitas Direct', 'alarms'),
  ('prosegur', 'Prosegur', 'alarms'),
  ('endesa', 'Endesa', 'energy'),
  ('iberdrola', 'Iberdrola', 'energy'),
  ('naturgy', 'Naturgy', 'energy')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sector_id = EXCLUDED.sector_id;
