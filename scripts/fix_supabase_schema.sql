-- Create sectors table
CREATE TABLE IF NOT EXISTS sectorsgpv (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT,
  color TEXT
);

-- Secure sectors table (allow read to everyone, write to authenticated or service_role)
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON sectors;
CREATE POLICY "Public read access" ON sectors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated insert access" ON sectors;
CREATE POLICY "Authenticated insert access" ON sectors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated update access" ON sectors;
CREATE POLICY "Authenticated update access" ON sectors FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated delete access" ON sectors;
CREATE POLICY "Authenticated delete access" ON sectors FOR DELETE USING (auth.role() = 'authenticated');

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sector_id TEXT REFERENCES sectors(id)
);

-- Secure brands table
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON brands;
CREATE POLICY "Public read access" ON brands FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated insert access" ON brands;
CREATE POLICY "Authenticated insert access" ON brands FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated update access" ON brands;
CREATE POLICY "Authenticated update access" ON brands FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated delete access" ON brands;
CREATE POLICY "Authenticated delete access" ON brands FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default sectors
INSERT INTO sectors (id, label, icon, color) VALUES
('telco', 'Telefonía', '📱', 'indigo'),
('alarms', 'Alarmas', '🛡️', 'red'),
('energy', 'Energía', '⚡', 'yellow')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, icon = EXCLUDED.icon, color = EXCLUDED.color;

-- Insert default brands
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
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sector_id = EXCLUDED.sector_id;
