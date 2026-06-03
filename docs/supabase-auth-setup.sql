-- Crear tabla de perfiles de usuario extendida
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'commercial', 'gestor')) DEFAULT 'commercial',
  zone TEXT CHECK (zone IN ('las_palmas', 'tenerife', 'todas')) DEFAULT 'todas',
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, role, zone, permissions)
  VALUES (
    NEW.id, 
    'commercial', 
    'todas',
    ARRAY['read_distributors', 'write_distributors', 'read_candidates', 'write_candidates']
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS en todas las tablas principales
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
-- Los usuarios pueden ver y editar solo su propio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Solo admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para distributors
-- Admin puede ver todo
CREATE POLICY "Admins can view all distributors" ON distributors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Manager puede ver todo (para reportes)
CREATE POLICY "Managers can view all distributors" ON distributors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Comercial puede ver según su zona
CREATE POLICY "Commercial can view zone distributors" ON distributors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.zone = 'todas' OR 
        up.zone = distributors.province OR
        up.role IN ('admin', 'manager')
      )
    )
  );

-- Todos los usuarios autenticados pueden crear distribuidores
CREATE POLICY "Authenticated users can insert distributors" ON distributors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Los usuarios pueden actualizar distribuidores que pueden ver
CREATE POLICY "Users can update accessible distributors" ON distributors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.role = 'admin' OR
        up.role = 'manager' OR
        (up.role = 'commercial' AND (up.zone = 'todas' OR up.zone = distributors.province))
      )
    )
  );

-- Solo admin y manager pueden eliminar
CREATE POLICY "Admin and managers can delete distributors" ON distributors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Políticas similares para candidates
CREATE POLICY "Admins can view all candidates" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Managers can view all candidates" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Commercial can view zone candidates" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.zone = 'todas' OR 
        up.zone = candidates.province OR
        up.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Authenticated users can insert candidates" ON candidates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update accessible candidates" ON candidates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.role = 'admin' OR
        up.role = 'manager' OR
        (up.role = 'commercial' AND (up.zone = 'todas' OR up.zone = candidates.province))
      )
    )
  );

CREATE POLICY "Admin and managers can delete candidates" ON candidates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Políticas para visits (similares pero más flexibles)
CREATE POLICY "Users can view accessible visits" ON visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.role IN ('admin', 'manager') OR
        up.role = 'commercial'
      )
    )
  );

CREATE POLICY "Authenticated users can insert visits" ON visits
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update accessible visits" ON visits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('admin', 'manager', 'commercial')
    )
  );

CREATE POLICY "Admin and managers can delete visits" ON visits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Políticas para sales (similares a visits)
CREATE POLICY "Users can view accessible sales" ON sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.role IN ('admin', 'manager') OR
        up.role = 'commercial'
      )
    )
  );

CREATE POLICY "Authenticated users can insert sales" ON sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update accessible sales" ON sales
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('admin', 'manager', 'commercial')
    )
  );

CREATE POLICY "Admin and managers can delete sales" ON sales
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Insertar usuario admin por defecto (cambiar email y crear en Supabase Auth primero)
-- INSERT INTO user_profiles (id, full_name, role, zone, permissions)
-- VALUES (
--   'uuid-del-usuario-admin', -- Reemplazar con UUID real del usuario en auth.users
--   'Administrador',
--   'admin',
--   'todas',
--   ARRAY['*']
-- );

-- Comentario: Para crear el primer usuario admin:
-- 1. Ir a Supabase Dashboard > Authentication > Users
-- 2. Crear usuario manualmente o usar SQL:
--    INSERT INTO auth.users (email, email_confirmed_at) VALUES ('admin@gpvcanarias.com', NOW());
-- 3. Copiar el UUID generado y usarlo en el INSERT de arriba