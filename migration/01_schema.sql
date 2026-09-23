-- =============================================================================
-- GPV-Consultor — FASE 1: esquema en Postgres propio
--
-- Destino: Postgres 17 en el VPS (Dokploy), base de datos propia para GPV.
-- Este fichero NO se ejecuta contra Supabase. La app sigue funcionando contra
-- Supabase hasta la Fase 3; esto se aplica en paralelo, sin tocar nada vivo.
--
-- ── Tres diferencias de fondo frente al esquema actual ────────────────────────
--
-- 1. `auth.users` no existe. Lo sustituye la tabla `users` de aquí. Las ocho
--    claves ajenas que apuntaban al esquema propietario de Supabase apuntan
--    ahora a esa tabla.
--
-- 2. `owner_id` pierde su `DEFAULT auth.uid()`. Esa función es de Supabase; el
--    backend Node rellena el propietario explícitamente en cada inserción. La
--    columna se conserva porque es la base del filtrado por propietario que
--    hoy aplica la RLS.
--
-- 3. No hay RLS. La autorización pasa al backend: la base de datos deja de ser
--    alcanzable desde el navegador, así que no necesita defenderse sola. La
--    regla que hoy vive en las políticas (`owner_id = auth.uid() OR
--    is_admin_or_manager()`) se traduce a la capa de alcance del backend.
--
-- ── Lo que se deja fuera a propósito ─────────────────────────────────────────
--
--  · `distributorsGPV.upgradeRequested` y `.teamId` — huérfanas desde que se
--    retiraron los módulos de equipos D2D y solicitudes de upgrade.
--  · Las políticas RLS y las funciones `is_admin()` / `is_admin_or_manager()`,
--    que se reimplementan en TypeScript.
--
-- ── Una decisión que puede sorprender ────────────────────────────────────────
--
-- Muchas fechas siguen siendo `text` y no `date`/`timestamptz`. Es deliberado:
-- los normalizadores y mapeadores de la app tratan hoy esas columnas como
-- texto, y cambiar tipo de dato y plataforma a la vez sería mezclar dos
-- migraciones. Queda como limpieza posterior, ya en el servidor propio.
--
-- ── AVISO: restricciones que antes NO existían ───────────────────────────────
--
-- Este esquema añade integridad que Supabase no tenía. Son mejoras, pero
-- pueden RECHAZAR datos existentes al importarlos en la Fase 6:
--
--  · Claves ajenas reales entre tablas de negocio. Hoy `visitsGPV.distributorId`
--    es texto suelto: una visita puede apuntar a un distribuidor borrado y a
--    nadie le importa. Aquí la referencia se comprueba.
--  · CHECK en `user_profilesGPV.role` y `.zone`, y en `audit_logsGPV.action`.
--
-- Antes de importar, comprobar que no hay referencias huérfanas:
--
--   SELECT 'visita→distribuidor' AS rel, count(*) FROM "visitsGPV" v
--     WHERE v."distributorId" IS NOT NULL AND NOT EXISTS
--       (SELECT 1 FROM "distributorsGPV" d WHERE d.id = v."distributorId")
--   UNION ALL SELECT 'visita→candidato', count(*) FROM "visitsGPV" v
--     WHERE v."candidateId" IS NOT NULL AND NOT EXISTS
--       (SELECT 1 FROM "candidatesGPV" c WHERE c.id = v."candidateId")
--   UNION ALL SELECT 'venta→distribuidor', count(*) FROM "salesGPV" s
--     WHERE s."distributorId" IS NOT NULL AND NOT EXISTS
--       (SELECT 1 FROM "distributorsGPV" d WHERE d.id = s."distributorId")
--   UNION ALL SELECT 'acuerdo→distribuidor', count(*) FROM "commissionAgreementsGPV" a
--     WHERE a."distributorId" IS NOT NULL AND NOT EXISTS
--       (SELECT 1 FROM "distributorsGPV" d WHERE d.id = a."distributorId");
--
-- (ejecutarlo en Supabase, sobre los datos de origen, antes de migrarlos)
--
-- Si sale algo distinto de cero: o se limpia el dato, o se crean las claves
-- ajenas como NOT VALID después de la importación. Lo que NO conviene es
-- descubrirlo a mitad del volcado.
--
-- Seguro de re-ejecutar: todo es IF NOT EXISTS.
--
-- ── Estado de validación ─────────────────────────────────────────────────────
-- Sintaxis comprobada con el parser propio de Postgres (libpg-query, el mismo
-- libpg_query que usa el servidor): 34 sentencias y 3 bloques plpgsql sin
-- errores. Eso descarta erratas de sintaxis, NO valida la semántica —que una
-- tabla referenciada exista o que los tipos encajen solo se ve al ejecutarlo.
-- =============================================================================

-- gen_random_uuid() es nativo desde Postgres 13; la extensión queda por si se
-- despliega sobre una versión anterior.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =============================================================================
-- IDENTIDAD — sustituye a auth.users
-- =============================================================================

-- Credenciales. Nada de perfil ni de negocio: eso vive en user_profilesGPV,
-- igual que hoy, para que la app no tenga que cambiar sus consultas de perfil.
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  -- argon2id o bcrypt; el backend decide. Nunca la contraseña en claro.
  password_hash text NOT NULL,
  -- Secreto TOTP del segundo factor. NULL = 2FA no configurado.
  -- Sustituye a supabase.auth.mfa, que guardaba el factor por su cuenta.
  mfa_secret    text,
  mfa_enabled   boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- El email identifica al usuario al entrar: único sin distinguir mayúsculas.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key
  ON users (lower(email));

-- Perfil GPV. Sigue siendo la puerta de acceso: sin fila aquí, no se entra,
-- aunque las credenciales sean válidas. Ese comportamiento se conserva.
CREATE TABLE IF NOT EXISTS "user_profilesGPV" (
  id                    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name             text,
  -- Debe coincidir con ROLE_DEFINITIONS de src/lib/roles.ts. La restricción se
  -- deja como CHECK y no como enum para que añadir un rol sea un ALTER simple.
  role                  text NOT NULL DEFAULT 'commercial'
                          CHECK (role IN ('admin', 'manager', 'gestor', 'commercial')),
  zone                  text NOT NULL DEFAULT 'todas'
                          CHECK (zone IN ('las_palmas', 'tenerife', 'todas')),
  permissions           text[] NOT NULL DEFAULT '{}',
  -- Estos dos viven aquí y no en `users` porque es de donde los lee hoy
  -- AuthContext.loadUserProfile; moverlos obligaría a tocar la app.
  must_change_password  boolean NOT NULL DEFAULT false,
  blocked               boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- CATÁLOGOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS "sectorsGPV" (
  id         text PRIMARY KEY,
  label      text NOT NULL,
  icon       text,
  color      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "brandsGPV" (
  id         text PRIMARY KEY,
  label      text NOT NULL,
  sector_id  text REFERENCES "sectorsGPV"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Etapas del pipeline. NINGÚN script del repo la creaba, pese a que el código
-- la consulta seis veces: se creó a mano en el dashboard de Supabase. Las
-- columnas se derivan del tipo PipelineStage y del uso real (order by position).
CREATE TABLE IF NOT EXISTS "pipelineStagesGPV" (
  id          text PRIMARY KEY,
  label       text NOT NULL,
  description text DEFAULT '',
  tone        text DEFAULT '',
  accent      text DEFAULT '',
  badge       text DEFAULT '',
  empty       text DEFAULT '',
  icon        text,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "pipelineStagesGPV_position_idx"
  ON "pipelineStagesGPV" (position);


-- =============================================================================
-- NEGOCIO
-- =============================================================================

CREATE TABLE IF NOT EXISTS "distributorsGPV" (
  id                text PRIMARY KEY,
  code              text,
  "externalCode"    text,
  category          jsonb DEFAULT '{}',
  "categoryId"      text DEFAULT '',
  "pendingData"     boolean DEFAULT false,
  "brandPolicy"     jsonb DEFAULT '{}',
  name              text NOT NULL DEFAULT 'Distribuidor sin nombre',
  "contactPerson"   text DEFAULT '',
  "contactPersonBackup" text DEFAULT '',
  "channelType"     text DEFAULT 'non_exclusive',
  brands            text[] DEFAULT '{}',
  sectors           text[] DEFAULT '{telco}',
  status            text DEFAULT 'pending',
  province          text DEFAULT '',
  island            text DEFAULT '',
  city              text DEFAULT '',
  "postalCode"      text DEFAULT '',
  phone             text DEFAULT '',
  email             text DEFAULT '',
  address           text DEFAULT '',
  latitude          double precision,
  longitude         double precision,
  "createdAt"       text DEFAULT '',
  "updatedAt"       text DEFAULT '',
  notes             text DEFAULT '',
  "notesHistory"    jsonb DEFAULT '[]',
  "taxId"           text DEFAULT '',
  "fiscalName"      text DEFAULT '',
  "fiscalAddress"   text DEFAULT '',
  checklist         jsonb DEFAULT '{}',
  "checklistComplete" boolean DEFAULT false,
  completion        numeric DEFAULT 0,
  "salesYtd"        numeric DEFAULT 0,
  "priorityScore"   numeric DEFAULT 0,
  "priorityLevel"   text DEFAULT 'medium',
  "priorityDrivers" jsonb DEFAULT '{}',
  "convertedFromCandidateId" text,
  "convertedAt"     text,
  -- Propietario de la fila. Sin DEFAULT: lo fija el backend.
  owner_id          uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "candidatesGPV" (
  id               text PRIMARY KEY,
  name             text NOT NULL DEFAULT 'Candidato sin nombre',
  "candidateType"  text,
  sector           text,
  "taxId"          text DEFAULT '',
  stage            text DEFAULT 'new',
  "channelCode"    text DEFAULT '',
  contact          jsonb,
  city             text DEFAULT '',
  island           text DEFAULT '',
  province         text DEFAULT '',
  address          text DEFAULT '',
  "postalCode"     text DEFAULT '',
  latitude         double precision,
  longitude        double precision,
  category         jsonb,
  "categoryId"     text,
  "pendingData"    boolean DEFAULT false,
  "brandPolicy"    jsonb,
  priority         text DEFAULT 'medium',
  score            numeric,
  notes            text DEFAULT '',
  "notesHistory"   jsonb DEFAULT '[]',
  operator         text DEFAULT '',
  "gpvProposal"    boolean DEFAULT false,
  "createdAt"      text DEFAULT '',
  "updatedAt"      text,
  "lastContactAt"  text,
  position         integer,
  source           text,
  owner_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "candidatesGPV_stage_idx" ON "candidatesGPV" (stage);

CREATE TABLE IF NOT EXISTS "leadsGPV" (
  id             text PRIMARY KEY,
  fuente         text DEFAULT 'manual',
  nombre         text NOT NULL DEFAULT 'Lead sin nombre',
  telefono       text,
  email          text,
  web            text,
  direccion      text,
  ciudad         text,
  provincia      text,
  isla           text,
  codigo_postal  text,
  sector         text,
  rating         numeric,
  reviews_count  integer DEFAULT 0,
  place_id       text,
  estado         text DEFAULT 'nuevo',
  notas          text DEFAULT '',
  asignado_a     text,
  -- Coordenadas: desde que el buscador pide `geometry` a Google, el lead nace
  -- geolocalizado. Es lo que permite ordenar la ruta de "Visitas por zona".
  latitude       double precision,
  longitude      double precision,
  -- Próxima acción y fecha sugerida de visita
  proxima_accion text,
  proxima_visita date,
  converted_at   timestamptz,
  owner_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- La zona se calcula del código postal, así que se consulta por él
CREATE INDEX IF NOT EXISTS "leadsGPV_codigo_postal_idx"
  ON "leadsGPV" (codigo_postal);
CREATE INDEX IF NOT EXISTS "leadsGPV_estado_idx" ON "leadsGPV" (estado);

CREATE TABLE IF NOT EXISTS "visitsGPV" (
  id                  text PRIMARY KEY,
  "distributorId"     text REFERENCES "distributorsGPV"(id) ON DELETE SET NULL,
  "candidateId"       text REFERENCES "candidatesGPV"(id) ON DELETE SET NULL,
  "backofficeContactId" uuid,
  -- Cita concertada con un lead desde "Visitas por zona"
  "leadId"            text REFERENCES "leadsGPV"(id) ON DELETE SET NULL,
  "sourceModule"      text DEFAULT 'visits',
  "assignedUserId"    text,
  date                text NOT NULL,
  "scheduledTime"     text DEFAULT '09:00',
  type                text DEFAULT 'presentacion',
  objective           text DEFAULT '',
  summary             text DEFAULT '',
  "nextSteps"         text DEFAULT '',
  result              text DEFAULT 'pendiente',
  "statusOperative"   text DEFAULT 'planificada',
  location            text DEFAULT '',
  "locationQuality"   text DEFAULT 'missing',
  "scheduleWarnings"  text[] DEFAULT '{}',
  lat                 numeric,
  lng                 numeric,
  "durationMinutes"   integer DEFAULT 30,
  "linkedSaleId"      text,
  checklist           jsonb DEFAULT '{}',
  reminder            jsonb DEFAULT '{}',
  notes               text DEFAULT '',
  "notesHistory"      jsonb DEFAULT '[]',
  "createdAt"         text DEFAULT '',
  "updatedAt"         text DEFAULT '',
  owner_id            uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "visitsGPV_leadId_idx" ON "visitsGPV" ("leadId");
CREATE INDEX IF NOT EXISTS "visitsGPV_date_idx" ON "visitsGPV" (date);

CREATE TABLE IF NOT EXISTS "salesGPV" (
  id                text PRIMARY KEY,
  "distributorId"   text REFERENCES "distributorsGPV"(id) ON DELETE SET NULL,
  "distributorCode" text DEFAULT '',
  "distributorName" text DEFAULT '',
  sector            text DEFAULT 'Otros',
  "sectorId"        text DEFAULT 'telco',
  modo              text,
  "tipoDocumento"   text,
  "nombreCliente"   text,
  documento         text,
  date              text DEFAULT '',
  "fechaOferta"     text,
  "fechaCierre"     text,
  "fechaActivacion" text,
  "fechaBaja"       text,
  status            text DEFAULT 'Pendiente',
  observaciones     text,
  brand             text DEFAULT '',
  family            text DEFAULT '',
  operations        integer DEFAULT 0,
  notes             text DEFAULT '',
  "createdAt"       text DEFAULT '',
  "updatedAt"       text DEFAULT '',
  owner_id          uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "salesGPV_distributorId_idx"
  ON "salesGPV" ("distributorId");

CREATE TABLE IF NOT EXISTS "tasksGPV" (
  id            text PRIMARY KEY,
  title         text NOT NULL DEFAULT 'Nueva tarea',
  description   text DEFAULT '',
  status        text DEFAULT 'pending',
  priority      text DEFAULT 'medium',
  "dueDate"     text DEFAULT '',
  "dueTime"     text,
  "entityId"    text DEFAULT '',
  "entityType"  text DEFAULT 'distributor',
  "creatorId"   text,
  "completedAt" text,
  "createdAt"   text DEFAULT '',
  "updatedAt"   text DEFAULT '',
  owner_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "tasksGPV_status_idx" ON "tasksGPV" (status);

-- Contactos de backoffice. La tabla original se creó mínima y fue creciendo a
-- base de ALTER; estas columnas son las que el tipo BackofficeContact declara,
-- que es lo que la app realmente lee y escribe.
CREATE TABLE IF NOT EXISTS "backofficeContactsGPV" (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operador                  text NOT NULL,
  "nombreColaborador"       text NOT NULL,
  direccion                 text,
  poblacion                 text,
  "codigoPostal"            text,
  "telefonoContacto"        text,
  "razonSocial"             text,
  "cifNif"                  text,
  "personaContacto"         text,
  "cargoContacto"           text,
  "emailContacto"           text,
  "telefonoAlternativo"     text,
  web                       text,
  provincia                 text,
  isla                      text,
  zona                      text,
  sector                    text,
  "tipoNegocio"             text,
  "origenContacto"          text,
  "gestorProponente"        text,
  "prioridadBackoffice"     text,
  "potencialComercial"      text,
  "competenciaActual"       text,
  "canalPreferente"         text,
  "resultadoUltimoContacto" text,
  "motivoRechazo"           text,
  "assignedTo"              text,
  "createdBy"               uuid REFERENCES users(id) ON DELETE SET NULL,
  visibility                text,
  "sharedWithGpv"           boolean NOT NULL DEFAULT false,
  "handoffStatus"           text,
  "lockedReason"            text,
  estado                    text NOT NULL DEFAULT 'PENDIENTE DE RESPUESTA',
  observaciones             text,
  "ultimosComentarios"      text,
  "estadoGestion"           text DEFAULT 'Pendiente',
  "historialComentarios"    jsonb DEFAULT '[]',
  "proponeVisitaGPV"        boolean NOT NULL DEFAULT false,
  "fechaVisita"             date,
  "proximoContacto"         text,
  visitas                   text,
  seguimiento               text,
  "createdAt"               timestamptz NOT NULL DEFAULT now(),
  "updatedAt"               timestamptz NOT NULL DEFAULT now(),
  "userId"                  uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "backofficeContactsGPV_cifNif_idx"
  ON "backofficeContactsGPV" ("cifNif");

CREATE TABLE IF NOT EXISTS "commissionAgreementsGPV" (
  id              text PRIMARY KEY,
  "distributorId" text REFERENCES "distributorsGPV"(id) ON DELETE CASCADE,
  sector          text DEFAULT '',
  operator        text DEFAULT '',
  "resiType"      text DEFAULT 'adoc',
  "resiAmount"    text,
  "resiLevels"    text,
  "resiTiers"     jsonb DEFAULT '[]',
  "resiRappel"    text DEFAULT '',
  "pymeType"      text DEFAULT 'adoc',
  "pymeAmount"    text,
  "pymeLevels"    text,
  "pymeTiers"     jsonb DEFAULT '[]',
  "pymeRappel"    text DEFAULT '',
  notes           text,
  history         jsonb DEFAULT '[]',
  "createdAt"     text DEFAULT '',
  "updatedAt"     text DEFAULT '',
  owner_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "commissionAgreementsGPV_distributorId_idx"
  ON "commissionAgreementsGPV" ("distributorId");


-- =============================================================================
-- INTEGRACIONES
-- =============================================================================

CREATE TABLE IF NOT EXISTS "integration_settingsGPV" (
  setting_key text PRIMARY KEY DEFAULT 'default',
  config      jsonb NOT NULL DEFAULT '{
    "calendar": {"enabled": false, "provider": null, "calendarId": "primary", "defaultReminderMinutes": 15, "syncVisits": true, "syncCalls": true, "syncDeadlines": true},
    "tasks": {"enabled": false, "provider": null, "taskListId": null, "syncFollowUps": true, "syncPendingData": true},
    "email": {"enabled": false, "provider": null, "sendConfirmations": false, "sendReminders": false}
  }'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Tokens de refresco de Google y Microsoft. En Supabase estaba blindada con una
-- política `USING (false)` porque el navegador hablaba con la base directamente.
-- Aquí ya no hace falta: solo el backend la alcanza.
CREATE TABLE IF NOT EXISTS "integration_oauth_connectionsGPV" (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider            text NOT NULL CHECK (provider IN ('google', 'microsoft')),
  provider_user_email text,
  refresh_token       text NOT NULL,
  scopes              text[] NOT NULL DEFAULT '{}',
  token_type          text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  last_refreshed_at   timestamptz,
  CONSTRAINT integration_oauth_connections_user_provider_key
    UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integration_oauth_connections_user
  ON "integration_oauth_connectionsGPV" (user_id);


-- =============================================================================
-- AUDITORÍA (RGPD)
-- =============================================================================

CREATE TABLE IF NOT EXISTS "audit_logsGPV" (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  action      text NOT NULL CHECK (action IN ('READ', 'INSERT', 'UPDATE', 'DELETE')),
  entity_type text NOT NULL,
  entity_id   text,
  details     jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "audit_logsGPV_created_at_idx"
  ON "audit_logsGPV" (created_at DESC);
CREATE INDEX IF NOT EXISTS "audit_logsGPV_entity_idx"
  ON "audit_logsGPV" (entity_type, entity_id);

-- La versión de Supabase tomaba el usuario de auth.uid(). Aquí lo recibe como
-- parámetro: quien sabe qué usuario actúa es el backend, no la base.
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id     uuid,
  p_action      text,
  p_entity_type text,
  p_entity_id   text,
  p_details     jsonb DEFAULT '{}'::jsonb,
  p_ip_address  text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "audit_logsGPV"
    (user_id, action, entity_type, entity_id, details, ip_address)
  VALUES
    (p_user_id, p_action, p_entity_type, p_entity_id, p_details, p_ip_address);
END;
$$;


-- =============================================================================
-- MANTENIMIENTO DE updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'user_profilesGPV', 'leadsGPV',
    'integration_settingsGPV', 'integration_oauth_connectionsGPV'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I; '
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t
    );
  END LOOP;
END $$;


-- =============================================================================
-- VERIFICACIÓN
--
--   -- Las 15 tablas creadas
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
--
--   -- Ninguna clave ajena debe apuntar fuera de este esquema
--   SELECT conrelid::regclass AS tabla, conname, confrelid::regclass AS apunta_a
--   FROM pg_constraint WHERE contype = 'f' ORDER BY 1;
--
--   -- No debe quedar rastro de los módulos retirados
--   SELECT table_name, column_name FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND column_name IN ('upgradeRequested', 'teamId');   -- debe salir vacío
-- =============================================================================
