-- ============================================================
-- GPV Canarias - Alineacion de schema Supabase con la app
-- Ejecutar en el SQL Editor de Supabase.
--
-- Objetivo:
--   Evitar perdida de datos por columnas ausentes en Supabase.
--   Todas las operaciones son idempotentes y no borran datos.
--
-- Tablas cubiertas:
--   distributorsGPV, candidatesGPV, visitsGPV, salesGPV, tasksGPV,
--   leads, commissionAgreementsGPV, backofficeContactsGPV.
-- ============================================================

-- ============================================================
-- 1. Distribuidores
-- ============================================================
CREATE TABLE IF NOT EXISTS public."distributorsGPV" (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT 'Distribuidor sin nombre',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public."distributorsGPV"
  ADD COLUMN IF NOT EXISTS name text DEFAULT 'Distribuidor sin nombre',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS code text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "externalCode" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS category jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "categoryId" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "pendingData" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "brandPolicy" jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "contactPerson" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "contactPersonBackup" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "channelType" text DEFAULT 'non_exclusive',
  ADD COLUMN IF NOT EXISTS brands text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sectors text[] DEFAULT '{telco}'::text[],
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS province text DEFAULT '',
  ADD COLUMN IF NOT EXISTS island text DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "postalCode" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "createdAt" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "notesHistory" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "taxId" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "fiscalName" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "fiscalAddress" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "upgradeRequested" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "teamId" text,
  ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "checklistComplete" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS completion numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "salesYtd" numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "priorityScore" numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "priorityLevel" text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "priorityDrivers" jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- ============================================================
-- 2. Candidatos
-- ============================================================
CREATE TABLE IF NOT EXISTS public."candidatesGPV" (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT 'Candidato sin nombre',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public."candidatesGPV"
  ADD COLUMN IF NOT EXISTS name text DEFAULT 'Candidato sin nombre',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "taxId" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stage text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS "channelCode" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "postalCode" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS island text DEFAULT '',
  ADD COLUMN IF NOT EXISTS province text DEFAULT '',
  ADD COLUMN IF NOT EXISTS category jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "categoryId" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "pendingData" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "brandPolicy" jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS score numeric,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "notesHistory" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS operator text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "gpvProposal" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "createdAt" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "updatedAt" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "lastContactAt" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS position integer,
  ADD COLUMN IF NOT EXISTS source text DEFAULT '',
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- ============================================================
-- 3. Visitas
-- ============================================================
CREATE TABLE IF NOT EXISTS public."visitsGPV" (
  id text PRIMARY KEY,
  date text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public."visitsGPV"
  ADD COLUMN IF NOT EXISTS date text DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "distributorId" text,
  ADD COLUMN IF NOT EXISTS "candidateId" text,
  ADD COLUMN IF NOT EXISTS "scheduledTime" text DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'presentacion',
  ADD COLUMN IF NOT EXISTS objective text DEFAULT '',
  ADD COLUMN IF NOT EXISTS summary text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "nextSteps" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS result text DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "statusOperative" text DEFAULT 'planificada',
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "linkedSaleId" text,
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric,
  ADD COLUMN IF NOT EXISTS "durationMinutes" integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "createdAt" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS reminder jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "notesHistory" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- ============================================================
-- 4. Ventas
-- ============================================================
CREATE TABLE IF NOT EXISTS public."salesGPV" (
  id text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public."salesGPV"
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "distributorId" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "distributorCode" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "distributorName" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sector text DEFAULT 'Otros',
  ADD COLUMN IF NOT EXISTS "sectorId" text DEFAULT 'telco',
  ADD COLUMN IF NOT EXISTS modo text,
  ADD COLUMN IF NOT EXISTS "tipoDocumento" text,
  ADD COLUMN IF NOT EXISTS "nombreCliente" text,
  ADD COLUMN IF NOT EXISTS documento text,
  ADD COLUMN IF NOT EXISTS date text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "fechaOferta" text,
  ADD COLUMN IF NOT EXISTS "fechaCierre" text,
  ADD COLUMN IF NOT EXISTS "fechaActivacion" text,
  ADD COLUMN IF NOT EXISTS "fechaBaja" text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pendiente',
  ADD COLUMN IF NOT EXISTS observaciones text,
  ADD COLUMN IF NOT EXISTS brand text DEFAULT '',
  ADD COLUMN IF NOT EXISTS family text DEFAULT '',
  ADD COLUMN IF NOT EXISTS operations integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "createdAt" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "updatedAt" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- ============================================================
-- 5. Tareas
-- ============================================================
CREATE TABLE IF NOT EXISTS public."tasksGPV" (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT 'Nueva tarea',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public."tasksGPV"
  ADD COLUMN IF NOT EXISTS title text DEFAULT 'Nueva tarea',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "dueDate" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "dueTime" text,
  ADD COLUMN IF NOT EXISTS "entityId" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "entityType" text DEFAULT 'distributor',
  ADD COLUMN IF NOT EXISTS "creatorId" text,
  ADD COLUMN IF NOT EXISTS "completedAt" text,
  ADD COLUMN IF NOT EXISTS "createdAt" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "updatedAt" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- ============================================================
-- 6. Leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id text PRIMARY KEY,
  nombre text NOT NULL DEFAULT 'Lead sin nombre',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS nombre text DEFAULT 'Lead sin nombre',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS fuente text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS web text,
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS provincia text,
  ADD COLUMN IF NOT EXISTS isla text,
  ADD COLUMN IF NOT EXISTS codigo_postal text,
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS rating numeric,
  ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'nuevo',
  ADD COLUMN IF NOT EXISTS notas text DEFAULT '',
  ADD COLUMN IF NOT EXISTS asignado_a text,
  ADD COLUMN IF NOT EXISTS "convertedAt" text;

-- ============================================================
-- 7. Acuerdos de comisiones
-- ============================================================
CREATE TABLE IF NOT EXISTS public."commissionAgreementsGPV" (
  id text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public."commissionAgreementsGPV"
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "distributorId" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sector text DEFAULT '',
  ADD COLUMN IF NOT EXISTS operator text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "resiType" text DEFAULT 'adoc',
  ADD COLUMN IF NOT EXISTS "resiAmount" text,
  ADD COLUMN IF NOT EXISTS "resiLevels" text,
  ADD COLUMN IF NOT EXISTS "resiTiers" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "resiRappel" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "pymeType" text DEFAULT 'adoc',
  ADD COLUMN IF NOT EXISTS "pymeAmount" text,
  ADD COLUMN IF NOT EXISTS "pymeLevels" text,
  ADD COLUMN IF NOT EXISTS "pymeTiers" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "pymeRappel" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "createdAt" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "updatedAt" text DEFAULT '';

-- ============================================================
-- 8. Backoffice
-- ============================================================
CREATE TABLE IF NOT EXISTS public."backofficeContactsGPV" (
  id text PRIMARY KEY,
  "nombreColaborador" text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public."backofficeContactsGPV"
  ADD COLUMN IF NOT EXISTS "nombreColaborador" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS operador text DEFAULT '',
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS poblacion text,
  ADD COLUMN IF NOT EXISTS "codigoPostal" text,
  ADD COLUMN IF NOT EXISTS "telefonoContacto" text,
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'PENDIENTE DE RESPUESTA',
  ADD COLUMN IF NOT EXISTS observaciones text,
  ADD COLUMN IF NOT EXISTS "ultimosComentarios" text,
  ADD COLUMN IF NOT EXISTS "estadoGestion" text DEFAULT 'Pendiente',
  ADD COLUMN IF NOT EXISTS "historialComentarios" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "proponeVisitaGPV" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "fechaVisita" text,
  ADD COLUMN IF NOT EXISTS "proximoContacto" text,
  ADD COLUMN IF NOT EXISTS visitas text,
  ADD COLUMN IF NOT EXISTS seguimiento text,
  ADD COLUMN IF NOT EXISTS "createdAt" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "updatedAt" text DEFAULT '';

-- ============================================================
-- 9. Valores seguros para filas antiguas
-- ============================================================
UPDATE public."distributorsGPV"
SET "notesHistory" = '[]'::jsonb
WHERE "notesHistory" IS NULL;

UPDATE public."candidatesGPV"
SET "notesHistory" = '[]'::jsonb
WHERE "notesHistory" IS NULL;

UPDATE public."visitsGPV"
SET "notesHistory" = '[]'::jsonb
WHERE "notesHistory" IS NULL;

UPDATE public."backofficeContactsGPV"
SET "historialComentarios" = '[]'::jsonb
WHERE "historialComentarios" IS NULL;

-- ============================================================
-- 10. Indices utiles
-- ============================================================
CREATE INDEX IF NOT EXISTS "idx_distributorsGPV_owner_id"
  ON public."distributorsGPV"(owner_id);

CREATE INDEX IF NOT EXISTS "idx_candidatesGPV_owner_id"
  ON public."candidatesGPV"(owner_id);

CREATE INDEX IF NOT EXISTS "idx_visitsGPV_owner_id"
  ON public."visitsGPV"(owner_id);

CREATE INDEX IF NOT EXISTS "idx_salesGPV_owner_id"
  ON public."salesGPV"(owner_id);

CREATE INDEX IF NOT EXISTS "idx_tasksGPV_owner_id"
  ON public."tasksGPV"(owner_id);

CREATE INDEX IF NOT EXISTS "idx_backofficeContactsGPV_estadoGestion"
  ON public."backofficeContactsGPV"("estadoGestion");

-- Refrescar cache de schema de PostgREST para que el API REST vea columnas nuevas.
NOTIFY pgrst, 'reload schema';

-- Comprobacion rapida: ejecuta este SELECT despues si quieres ver columnas clave.
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'distributorsGPV', 'candidatesGPV', 'visitsGPV', 'salesGPV',
--     'tasksGPV', 'leads', 'commissionAgreementsGPV', 'backofficeContactsGPV'
--   )
-- ORDER BY table_name, ordinal_position;
