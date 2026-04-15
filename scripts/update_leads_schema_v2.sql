-- Actualización de la tabla leads para capturar más metadata de Google
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS isla text,
ADD COLUMN IF NOT EXISTS codigo_postal text;

-- Comentario para documentar las columnas
COMMENT ON COLUMN public.leads.isla IS 'ID de la isla vinculada (ej: tenerife, gran_canaria)';
COMMENT ON COLUMN public.leads.codigo_postal IS 'Código postal extraído de Google Places';
