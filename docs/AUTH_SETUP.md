# Configuración de Autenticación con Supabase

## Pasos para implementar autenticación real

### 1. **Ejecutar SQL en Supabase**

Ve al Dashboard de Supabase > SQL Editor y ejecuta el archivo `docs/supabase-auth-setup.sql`

Este script:

- Crea tabla `user_profiles` con roles y zonas
- Configura RLS (Row Level Security) en todas las tablas
- Establece políticas de acceso por roles
- Crea triggers automáticos para nuevos usuarios

### 2. **Crear usuario administrador**

En Supabase Dashboard > Authentication > Users:

1. Crear usuario manualmente con email: `admin@gpvcanarias.com`
2. Copiar el UUID generado
3. Ejecutar en SQL Editor:

```sql
INSERT INTO user_profiles (id, full_name, role, zone, permissions)
VALUES (
  'UUID-DEL-USUARIO-ADMIN', -- Pegar UUID real aquí
  'Administrador GPV',
  'admin',
  'todas',
  ARRAY['*']
);
```

### 3. **Configurar variables de entorno**

Verificar que en Netlify/Vercel están configuradas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4. **Roles y permisos implementados**

#### **Admin**

- Ve y edita todo
- Gestiona usuarios
- Acceso completo a reportes

#### **Manager**

- Ve todo (solo lectura para reportes)
- Edita según zona asignada
- No puede eliminar

#### **Commercial**

- Ve y edita solo su zona
- No puede eliminar
- Acceso limitado a reportes

### 5. **Funciones de autenticación disponibles**

```typescript
const {
  authUser, // Datos del usuario autenticado
  isAuthenticated, // true si está logueado
  isAdmin, // true si es admin
  signInWithPassword, // Login con email/password
  signInWithOTP, // Login con enlace por email
  signOut, // Cerrar sesión
  canAccess // Verificar permisos
} = useAuth()
```

### 6. **Componentes actualizados**

- ✅ `useAuth` - Hook principal de autenticación
- ✅ `ProtectedRoute` - Redirección automática si no autenticado
- ✅ `Login` - Soporte para password y OTP
- ✅ `Layout` - Información de usuario real y logout

### 7. **Próximos pasos**

1. Ejecutar SQL de configuración
2. Crear usuario admin
3. Probar login/logout
4. Verificar que RLS bloquea acceso no autorizado
5. Crear usuarios de prueba con diferentes roles

### 8. **Seguridad implementada**

- **RLS habilitado**: Solo usuarios autenticados acceden a datos
- **Políticas por zona**: Comerciales ven solo su territorio
- **Roles diferenciados**: Admin > Manager > Commercial
- **Sesiones persistentes**: No se pierde login al recargar
- **Magic links**: Opción sin contraseñas por email

¿Necesitas ayuda con algún paso específico?
