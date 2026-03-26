-- ============================================================
-- GPV Canarias - Almacenamiento server-side para OAuth
-- Ejecutar en Supabase SQL Editor
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

CREATE INDEX IF NOT EXISTS idx_integration_oauth_connections_user
  ON "integration_oauth_connectionsGPV" (user_id);

CREATE INDEX IF NOT EXISTS idx_integration_oauth_connections_provider
  ON "integration_oauth_connectionsGPV" (provider);

ALTER TABLE "integration_oauth_connectionsGPV" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct select oauth connections" ON "integration_oauth_connectionsGPV";
CREATE POLICY "No direct select oauth connections" ON "integration_oauth_connectionsGPV"
  FOR SELECT
  USING (false);

DROP POLICY IF EXISTS "No direct insert oauth connections" ON "integration_oauth_connectionsGPV";
CREATE POLICY "No direct insert oauth connections" ON "integration_oauth_connectionsGPV"
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "No direct update oauth connections" ON "integration_oauth_connectionsGPV";
CREATE POLICY "No direct update oauth connections" ON "integration_oauth_connectionsGPV"
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "No direct delete oauth connections" ON "integration_oauth_connectionsGPV";
CREATE POLICY "No direct delete oauth connections" ON "integration_oauth_connectionsGPV"
  FOR DELETE
  USING (false);