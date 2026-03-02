-- SQL Migration to create salesGPV table based on Excel structure
-- Columns: Sector, Codigo, Nombre distribuidor, Modo, Tipo, Nombre cliente, Documento, Fecha de Oferta, Fecha de Cierre, Estado, Fecha de Activacion, Fecha de Baja, Observaciones

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public."salesGPV" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "distributorId" TEXT REFERENCES public."distributorsGPV"(id) ON DELETE SET NULL,
    "distributorCode" TEXT, -- To keep redundancy/search if needed
    "distributorName" TEXT,
    
    -- Mandatory fields from Excel
    sector TEXT NOT NULL, -- Alarma, Energía, Telefonía
    modo TEXT,           -- PYME, RESI
    "tipoDocumento" TEXT, -- Cif, DNI, NIE
    "nombreCliente" TEXT,
    documento TEXT,
    
    -- Dates
    "fechaOferta" DATE,
    "fechaCierre" DATE,
    "fechaActivacion" DATE,
    "fechaBaja" DATE,
    
    -- Status and Others
    status TEXT DEFAULT 'Pendiente', -- Enviado, Pendiente, Scoring, Aceptado, Activado, Baja
    observaciones TEXT,
    
    -- Metadata
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "userId" UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Add RLS policies (adjust based on your existing profile/role logic)
ALTER TABLE public."salesGPV" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to salesGPV" 
ON public."salesGPV" 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_distributor_id ON public."salesGPV"("distributorId");
CREATE INDEX IF NOT EXISTS idx_sales_status ON public."salesGPV"(status);
CREATE INDEX IF NOT EXISTS idx_sales_sector ON public."salesGPV"(sector);
CREATE INDEX IF NOT EXISTS idx_sales_fecha_cierre ON public."salesGPV"("fechaCierre");
