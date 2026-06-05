-- Policies para permitir borrado real en las tablas usadas por la app GPV.
-- Ejecutar en Supabase SQL Editor.
--
-- Contexto:
-- La app usa tablas con sufijo GPV, por ejemplo "candidatesGPV".
-- El script antiguo docs/supabase-auth-setup.sql define policies para
-- "candidates" y "distributors", pero esas no afectan a las tablas GPV.

ALTER TABLE IF EXISTS public."distributorsGPV" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."candidatesGPV" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."backofficeContactsGPV" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "GPV admins and global managers can delete distributors" ON public."distributorsGPV";
CREATE POLICY "GPV admins and global managers can delete distributors"
  ON public."distributorsGPV"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."user_profilesGPV" up
      WHERE up.id = auth.uid()
        AND (
          up.role = 'admin'
          OR (up.role = 'manager' AND COALESCE(up.zone, '') = 'todas')
        )
    )
  );

DROP POLICY IF EXISTS "GPV admins and global managers can delete candidates" ON public."candidatesGPV";
CREATE POLICY "GPV admins and global managers can delete candidates"
  ON public."candidatesGPV"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."user_profilesGPV" up
      WHERE up.id = auth.uid()
        AND (
          up.role = 'admin'
          OR (up.role = 'manager' AND COALESCE(up.zone, '') = 'todas')
        )
    )
  );

DROP POLICY IF EXISTS "GPV admins and global managers can delete backoffice contacts" ON public."backofficeContactsGPV";
CREATE POLICY "GPV admins and global managers can delete backoffice contacts"
  ON public."backofficeContactsGPV"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."user_profilesGPV" up
      WHERE up.id = auth.uid()
        AND (
          up.role = 'admin'
          OR (up.role = 'manager' AND COALESCE(up.zone, '') = 'todas')
        )
    )
  );
