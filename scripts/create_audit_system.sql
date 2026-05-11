-- ============================================================
-- GPV Canarias - Registro de Auditoría (Cumplimiento RGPD/GDPR)
-- Registra accesos y modificaciones a datos sensibles
-- ============================================================

-- 1. Crear tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS public."audit_logsGPV" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL, -- 'READ', 'INSERT', 'UPDATE', 'DELETE'
  entity_type text NOT NULL, -- 'candidate', 'distributor', 'sale'
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS (Solo admins pueden ver logs)
ALTER TABLE public."audit_logsGPV" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read audit logs" ON public."audit_logsGPV";
CREATE POLICY "Admins can read audit logs" ON public."audit_logsGPV" 
  FOR SELECT USING (public.is_admin());

-- 3. Función simplificada para registrar logs desde el cliente o triggers
CREATE OR REPLACE FUNCTION public.log_audit_event(
  event_action text,
  event_entity_type text,
  event_entity_id text,
  event_details jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public."audit_logsGPV" (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), event_action, event_entity_type, event_entity_id, event_details);
END;
$$;

-- 4. Trigger opcional para capturar cambios automáticos en candidatos
CREATE OR REPLACE FUNCTION public.trigger_audit_candidate_changes() 
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO public."audit_logsGPV" (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'UPDATE', 'candidate', OLD.id::text, jsonb_build_object('changes', row_to_json(NEW)));
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public."audit_logsGPV" (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'DELETE', 'candidate', OLD.id::text, jsonb_build_object('old_data', row_to_json(OLD)));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_candidates_trigger ON public."candidatesGPV";
CREATE TRIGGER audit_candidates_trigger
AFTER UPDATE OR DELETE ON public."candidatesGPV"
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_candidate_changes();

-- 5. Trigger para Distribuidores
CREATE OR REPLACE FUNCTION public.trigger_audit_distributor_changes() 
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO public."audit_logsGPV" (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'UPDATE', 'distributor', OLD.id::text, jsonb_build_object('changes', row_to_json(NEW)));
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public."audit_logsGPV" (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'DELETE', 'distributor', OLD.id::text, jsonb_build_object('old_data', row_to_json(OLD)));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_distributors_trigger ON public."distributorsGPV";
CREATE TRIGGER audit_distributors_trigger
AFTER UPDATE OR DELETE ON public."distributorsGPV"
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_distributor_changes();

-- 6. Trigger para Ventas
CREATE OR REPLACE FUNCTION public.trigger_audit_sale_changes() 
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO public."audit_logsGPV" (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'UPDATE', 'sale', OLD.id::text, jsonb_build_object('changes', row_to_json(NEW)));
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public."audit_logsGPV" (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'DELETE', 'sale', OLD.id::text, jsonb_build_object('old_data', row_to_json(OLD)));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_sales_trigger ON public."salesGPV";
CREATE TRIGGER audit_sales_trigger
AFTER UPDATE OR DELETE ON public."salesGPV"
FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_sale_changes();
