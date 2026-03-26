-- ============================================================
-- GPV Canarias - Configuración de integraciones admin-only
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS "integration_settingsGPV" (
  setting_key text PRIMARY KEY DEFAULT 'default',
  config jsonb NOT NULL DEFAULT '{
    "calendar": {
      "enabled": false,
      "provider": null,
      "calendarId": "primary",
      "defaultReminderMinutes": 15,
      "syncVisits": true,
      "syncCalls": true,
      "syncDeadlines": true
    },
    "tasks": {
      "enabled": false,
      "provider": null,
      "taskListId": null,
      "syncFollowUps": true,
      "syncPendingData": true
    },
    "email": {
      "enabled": false,
      "provider": null,
      "sendConfirmations": false,
      "sendReminders": false
    }
  }'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE "integration_settingsGPV" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read integration settings" ON "integration_settingsGPV";
CREATE POLICY "Admins read integration settings" ON "integration_settingsGPV"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM "user_profilesGPV" p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins insert integration settings" ON "integration_settingsGPV";
CREATE POLICY "Admins insert integration settings" ON "integration_settingsGPV"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "user_profilesGPV" p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins update integration settings" ON "integration_settingsGPV";
CREATE POLICY "Admins update integration settings" ON "integration_settingsGPV"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM "user_profilesGPV" p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "user_profilesGPV" p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins delete integration settings" ON "integration_settingsGPV";
CREATE POLICY "Admins delete integration settings" ON "integration_settingsGPV"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM "user_profilesGPV" p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

INSERT INTO "integration_settingsGPV" (setting_key)
VALUES ('default')
ON CONFLICT (setting_key) DO NOTHING;