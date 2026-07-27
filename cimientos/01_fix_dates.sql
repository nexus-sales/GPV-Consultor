-- ============================================================
-- MIGRACIÓN 01 — CIMIENTO DE FECHAS · v3 (adaptada por tabla)
-- ============================================================
-- Esta versión trata CADA tabla según los tipos REALES que tiene
-- (verificados con information_schema). No asume que todas son
-- iguales, porque NO lo son:
--
--   distributorsGPV : "createdAt" text · updated_at YA existe (tstz)
--   candidatesGPV   : "createdAt" text · "updatedAt" text · updated_at existe
--   visitsGPV       : "createdAt" text · updated_at YA existe (tstz)
--   salesGPV        : TODO tstz ya · updated_at existe → casi nada que hacer
--   commissionAgreementsGPV : "updatedAt" text · updated_at NO existe → crear
--   leads           : todo tstz nativo → solo trigger
--
-- SEGURIDAD: no borra columnas ni datos. Solo añade y rellena.
-- Idempotente: re-ejecutable sin daño.
--
-- ANTES: backup en Supabase. Ejecutar el script completo.
-- DESPUÉS: ejecutar el bloque de VERIFICACIÓN del final.
-- ============================================================


-- ------------------------------------------------------------
-- Función de conversión SEGURA text → timestamptz.
-- Solo se usa sobre columnas que SON text. Ante basura, da NULL.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.safe_to_timestamptz(val text)
RETURNS timestamptz AS $$
BEGIN
  RETURN val::timestamptz;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ------------------------------------------------------------
-- Función del trigger: pone updated_at = now() en cada UPDATE
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- DISTRIBUIDORES — updated_at ya existe (tstz). "createdAt" es text.
-- ============================================================
-- Asegurar la columna por si acaso (no hace nada si ya está)
ALTER TABLE "distributorsGPV" ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
-- Rellenar solo las filas con updated_at nulo, desde "createdAt" (text) o created_at
UPDATE "distributorsGPV"
SET updated_at = COALESCE(
  public.safe_to_timestamptz("createdAt"),
  created_at,
  now()
)
WHERE updated_at IS NULL;


-- ============================================================
-- CANDIDATOS — tiene las cuatro columnas. "createdAt"/"updatedAt" son text.
-- ============================================================
ALTER TABLE "candidatesGPV" ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
UPDATE "candidatesGPV"
SET updated_at = COALESCE(
  public.safe_to_timestamptz("updatedAt"),
  public.safe_to_timestamptz("createdAt"),
  created_at,
  now()
)
WHERE updated_at IS NULL;


-- ============================================================
-- VISITAS — updated_at ya existe (tstz). "createdAt" es text.
-- ============================================================
ALTER TABLE "visitsGPV" ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
UPDATE "visitsGPV"
SET updated_at = COALESCE(
  public.safe_to_timestamptz("createdAt"),
  created_at,
  now()
)
WHERE updated_at IS NULL;


-- ============================================================
-- VENTAS — TODO es timestamptz ya. NO usar la función (no es text).
-- Solo rellenar updated_at nulo desde las columnas tstz existentes.
-- ============================================================
ALTER TABLE "salesGPV" ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
UPDATE "salesGPV"
SET updated_at = COALESCE(
  "updatedAt",     -- ya es timestamptz, se usa directo
  "createdAt",     -- ya es timestamptz
  created_at,
  now()
)
WHERE updated_at IS NULL;


-- ============================================================
-- ACUERDOS DE COMISIONES — updated_at NO EXISTE. Hay que crearla.
-- "updatedAt"/"createdAt" son text.
-- ============================================================
ALTER TABLE "commissionAgreementsGPV" ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
UPDATE "commissionAgreementsGPV"
SET updated_at = COALESCE(
  public.safe_to_timestamptz("updatedAt"),
  public.safe_to_timestamptz("createdAt"),
  created_at,
  now()
)
WHERE updated_at IS NULL;


-- ============================================================
-- LEADS — todo timestamptz nativo. Solo asegurar columna.
-- ============================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
UPDATE leads SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;


-- ------------------------------------------------------------
-- Red de seguridad: cualquier updated_at todavía nulo → now()
-- ------------------------------------------------------------
UPDATE "distributorsGPV"         SET updated_at = now() WHERE updated_at IS NULL;
UPDATE "candidatesGPV"           SET updated_at = now() WHERE updated_at IS NULL;
UPDATE "visitsGPV"               SET updated_at = now() WHERE updated_at IS NULL;
UPDATE "salesGPV"                SET updated_at = now() WHERE updated_at IS NULL;
UPDATE "commissionAgreementsGPV" SET updated_at = now() WHERE updated_at IS NULL;
UPDATE leads                     SET updated_at = now() WHERE updated_at IS NULL;


-- ------------------------------------------------------------
-- TRIGGERS — mantienen updated_at al día en cada UPDATE futuro
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_updated_at ON "distributorsGPV";
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON "distributorsGPV"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON "candidatesGPV";
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON "candidatesGPV"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON "visitsGPV";
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON "visitsGPV"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON "salesGPV";
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON "salesGPV"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON "commissionAgreementsGPV";
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON "commissionAgreementsGPV"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON leads;
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- VERIFICACIÓN — quita los -- y ejecuta. Todo debe dar 0.
-- ============================================================
--   SELECT 'distributorsGPV' AS tabla, count(*) AS sin_fecha
--   FROM "distributorsGPV" WHERE updated_at IS NULL
--   UNION ALL SELECT 'candidatesGPV', count(*) FROM "candidatesGPV" WHERE updated_at IS NULL
--   UNION ALL SELECT 'visitsGPV', count(*) FROM "visitsGPV" WHERE updated_at IS NULL
--   UNION ALL SELECT 'salesGPV', count(*) FROM "salesGPV" WHERE updated_at IS NULL
--   UNION ALL SELECT 'commissionAgreementsGPV', count(*) FROM "commissionAgreementsGPV" WHERE updated_at IS NULL
--   UNION ALL SELECT 'leads', count(*) FROM leads WHERE updated_at IS NULL;
--
-- Probar el trigger:
--   UPDATE "distributorsGPV" SET notes = notes WHERE id = (SELECT id FROM "distributorsGPV" LIMIT 1);
--   SELECT id, updated_at FROM "distributorsGPV" ORDER BY updated_at DESC LIMIT 1;
-- ============================================================

-- NOTA: las columnas viejas (text) siguen intactas. Se eliminan
-- en una migración posterior, solo cuando el código ya use
-- created_at/updated_at. La app nunca se rompe en el proceso.