-- Migration: Create backofficeContactsGPV table
-- Purpose: Tracks contacts proposed by account managers (gestores de cuenta / operadores)
--          as potential distributors/collaborators. Separate from candidatesGPV.

CREATE TABLE IF NOT EXISTS public."backofficeContactsGPV" (
    "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Gestor de cuenta que propone el contacto
    "operador"              TEXT NOT NULL,

    -- Datos del contacto/colaborador
    "nombreColaborador"     TEXT NOT NULL,
    "direccion"             TEXT,
    "poblacion"             TEXT,
    "codigoPostal"          TEXT,
    "telefonoContacto"      TEXT,

    -- Estado del seguimiento
    "estado"                TEXT NOT NULL DEFAULT 'PENDIENTE DE RESPUESTA',
    -- Valores esperados: 'COLABORA' | 'NO COLABORA' | 'PENDIENTE DE RESPUESTA' | 'ENVIADO CORREO'

    -- Notas y comentarios
    "observaciones"         TEXT,
    "ultimosComentarios"    TEXT,

    -- Propuesta de visita GPV
    "proponeVisitaGPV"      BOOLEAN NOT NULL DEFAULT FALSE,
    "fechaVisita"           DATE,
    "visitas"               TEXT,
    "seguimiento"           TEXT,

    -- Metadata
    "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "userId"                UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Row Level Security
ALTER TABLE public."backofficeContactsGPV" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to backofficeContactsGPV"
    ON public."backofficeContactsGPV";

CREATE POLICY "Allow authenticated full access to backofficeContactsGPV"
ON public."backofficeContactsGPV"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bo_operador
    ON public."backofficeContactsGPV"("operador");
CREATE INDEX IF NOT EXISTS idx_bo_estado
    ON public."backofficeContactsGPV"("estado");
CREATE INDEX IF NOT EXISTS idx_bo_created
    ON public."backofficeContactsGPV"("createdAt");
CREATE INDEX IF NOT EXISTS idx_bo_propone_visita
    ON public."backofficeContactsGPV"("proponeVisitaGPV");

-- Auto-update updatedAt trigger
CREATE OR REPLACE FUNCTION update_backoffice_contacts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bo_contacts_updated_at
    ON public."backofficeContactsGPV";

CREATE TRIGGER trg_bo_contacts_updated_at
    BEFORE UPDATE ON public."backofficeContactsGPV"
    FOR EACH ROW EXECUTE FUNCTION update_backoffice_contacts_updated_at();
