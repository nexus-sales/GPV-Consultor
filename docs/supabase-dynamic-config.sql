-- Crear tabla de sectores
CREATE TABLE IF NOT EXISTS sectors (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de marcas
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sector_id TEXT REFERENCES sectors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Políticas para sectores
CREATE POLICY "Public read access for sectors" ON sectors FOR SELECT USING (true);
CREATE POLICY "Admin write access for sectors" ON sectors FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para marcas
CREATE POLICY "Public read access for brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Admin write access for brands" ON brands FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Insertar datos iniciales (opcional, para poblar la DB la primera vez)
INSERT INTO sectors (id, label, icon, color) VALUES
('telco', 'Telefonía', '📱', 'indigo'),
('alarms', 'Alarmas', '🛡️', 'red'),
('energy', 'Energía', '⚡', 'yellow')
ON CONFLICT (id) DO NOTHING;

INSERT INTO brands (id, label, sector_id) VALUES
('silbo', 'Silbö', 'telco'),
('lowi', 'Lowi', 'telco'),
('vodafone_resid', 'Vodafone Residencial', 'telco'),
('vodafone_soho', 'Vodafone Soho', 'telco'),
('adt', 'ADT Alarmas', 'alarms'),
('securitas', 'Securitas Direct', 'alarms'),
('prosegur', 'Prosegur', 'alarms'),
('endesa', 'Endesa', 'energy'),
('iberdrola', 'Iberdrola', 'energy'),
('naturgy', 'Naturgy', 'energy')
ON CONFLICT (id) DO NOTHING;
