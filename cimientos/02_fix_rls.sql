-- ============================================================
-- MIGRACIÓN 02 — RLS ESTRICTA POR DUEÑO (OPCIÓN B)
-- ============================================================
-- Política elegida:
--   - Un comercial solo VE y EDITA sus propios registros
--     (los que tienen created_by = su id).
--   - admin y manager ven y editan TODO.
--   - Borrado: solo admin y manager.
--
-- IMPORTANTE sobre los datos antiguos:
--   Los registros que ya existen tienen created_by vacío (NULL).
--   Con esta política, esos registros antiguos solo serán visibles
--   para admin/manager hasta que se les asigne un dueño.
--   NO se borran: siguen en la base de datos, esperando asignación.
--   Al final de este archivo hay un SQL de ejemplo para asignarlos
--   por lotes desde Supabase.
--
-- Los registros NUEVOS se asignarán solos a su creador en cuanto
-- el código de la app guarde created_by (eso es la Fase 2).
--
-- ⚠️ ANTES DE EJECUTAR:
--   1. Haz backup en Supabase (Database > Backups).
--   2. Ejecuta primero 01_fix_dates.sql y verifica que fue bien.
--   3. Confirma que la tabla se llama "backofficeContactsGPV"
--      (ya verificado: sí coincide).
-- ============================================================


-- ------------------------------------------------------------
-- PASO 0: Columna de propiedad (quién creó cada registro)
--         Si ya existe, no hace nada.
-- ------------------------------------------------------------
ALTER TABLE "salesGPV"
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

ALTER TABLE "backofficeContactsGPV"
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Índices para que el filtro por dueño sea rápido
CREATE INDEX IF NOT EXISTS idx_sales_created_by
  ON "salesGPV" (created_by);
CREATE INDEX IF NOT EXISTS idx_backoffice_created_by
  ON "backofficeContactsGPV" (created_by);


-- ------------------------------------------------------------
-- Función auxiliar: ¿el usuario actual es admin o manager?
-- Centraliza la comprobación de rol para no repetirla.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "user_profilesGPV" p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'manager')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ============================================================
-- VENTAS (salesGPV) — Opción B
-- ============================================================

-- Limpiar TODAS las políticas viejas
DROP POLICY IF EXISTS "Auth read salesGPV"   ON "salesGPV";
DROP POLICY IF EXISTS "Auth insert salesGPV" ON "salesGPV";
DROP POLICY IF EXISTS "Auth update salesGPV" ON "salesGPV";
DROP POLICY IF EXISTS "Auth delete salesGPV" ON "salesGPV";
DROP POLICY IF EXISTS "open_access"          ON "salesGPV";
DROP POLICY IF EXISTS "sales_read"           ON "salesGPV";
DROP POLICY IF EXISTS "sales_insert"         ON "salesGPV";
DROP POLICY IF EXISTS "sales_update"         ON "salesGPV";
DROP POLICY IF EXISTS "sales_delete"         ON "salesGPV";

-- LECTURA: dueño o admin/manager
CREATE POLICY "sales_read" ON "salesGPV"
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin_or_manager()
  );

-- INSERCIÓN: cualquier autenticado puede crear, PERO solo puede
-- marcarse a sí mismo como dueño (no puede crear registros a nombre
-- de otro). admin/manager pueden crear a nombre de quien sea.
CREATE POLICY "sales_insert" ON "salesGPV"
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_admin_or_manager()
  );

-- ACTUALIZACIÓN: dueño o admin/manager
CREATE POLICY "sales_update" ON "salesGPV"
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin_or_manager()
  );

-- BORRADO: solo admin/manager
CREATE POLICY "sales_delete" ON "salesGPV"
  FOR DELETE TO authenticated
  USING (public.is_admin_or_manager());


-- ============================================================
-- CONTACTOS DE BACKOFFICE (backofficeContactsGPV) — Opción B
-- ============================================================

DROP POLICY IF EXISTS "Auth read backofficeContactsGPV"   ON "backofficeContactsGPV";
DROP POLICY IF EXISTS "Auth insert backofficeContactsGPV" ON "backofficeContactsGPV";
DROP POLICY IF EXISTS "Auth update backofficeContactsGPV" ON "backofficeContactsGPV";
DROP POLICY IF EXISTS "Auth delete backofficeContactsGPV" ON "backofficeContactsGPV";
DROP POLICY IF EXISTS "open_access"                       ON "backofficeContactsGPV";
DROP POLICY IF EXISTS "backoffice_read"                   ON "backofficeContactsGPV";
DROP POLICY IF EXISTS "backoffice_insert"                 ON "backofficeContactsGPV";
DROP POLICY IF EXISTS "backoffice_update"                 ON "backofficeContactsGPV";
DROP POLICY IF EXISTS "backoffice_delete"                 ON "backofficeContactsGPV";

CREATE POLICY "backoffice_read" ON "backofficeContactsGPV"
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin_or_manager()
  );

CREATE POLICY "backoffice_insert" ON "backofficeContactsGPV"
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_admin_or_manager()
  );

CREATE POLICY "backoffice_update" ON "backofficeContactsGPV"
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin_or_manager()
  );

CREATE POLICY "backoffice_delete" ON "backofficeContactsGPV"
  FOR DELETE TO authenticated
  USING (public.is_admin_or_manager());


-- ============================================================
-- VERIFICACIÓN — ejecuta después para confirmar
-- ============================================================
-- 1) Ver las políticas activas (debe haber 4 por tabla):
--
--   SELECT tablename, policyname, cmd
--   FROM pg_policies
--   WHERE tablename IN ('salesGPV', 'backofficeContactsGPV')
--   ORDER BY tablename, cmd;
--
-- 2) Cuántos registros antiguos quedan sin dueño (solo admin los verá):
--
--   SELECT 'salesGPV' AS tabla, count(*) AS sin_dueno
--   FROM "salesGPV" WHERE created_by IS NULL
--   UNION ALL
--   SELECT 'backofficeContactsGPV', count(*)
--   FROM "backofficeContactsGPV" WHERE created_by IS NULL;


-- ============================================================
-- ASIGNAR DATOS ANTIGUOS A UN DUEÑO (para el admin/manager)
-- ============================================================
-- Estos son EJEMPLOS comentados. NO se ejecutan solos.
-- El admin los usa cuando quiera asignar registros antiguos.
--
-- PASO 1 — Ver qué usuarios hay y sus IDs:
--
--   SELECT id, full_name, role FROM "user_profilesGPV" ORDER BY full_name;
--
-- PASO 2 — Asignar TODAS las ventas sin dueño a un comercial concreto
--          (sustituye el UUID por el id real del PASO 1):
--
--   UPDATE "salesGPV"
--   SET created_by = '00000000-0000-0000-0000-000000000000'
--   WHERE created_by IS NULL;
--
-- PASO 3 — O asignar solo las ventas de un distribuidor concreto
--          a un comercial (más preciso, por lotes):
--
--   UPDATE "salesGPV"
--   SET created_by = '00000000-0000-0000-0000-000000000000'
--   WHERE created_by IS NULL
--     AND "distributorId" = 'ID_DEL_DISTRIBUIDOR';
--
-- Lo mismo aplica a "backofficeContactsGPV".
--
-- ------------------------------------------------------------
-- NOTA PARA FASE 2 (botón en la app):
-- Más adelante conviene añadir en la pantalla de ventas/contactos
-- un botón "Asignar a..." visible solo para admin/manager, que haga
-- este mismo UPDATE desde la interfaz en vez de por SQL. Queda
-- anotado aquí como recordatorio; no se construye todavía.
-- ============================================================