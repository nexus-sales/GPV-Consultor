# GPV Canarias

Aplicación de gestión comercial para equipos GPV (Gestor Punto de Venta) en Canarias. Gestiona candidatos, distribuidores, visitas, leads, tareas y pipeline comercial con soporte offline y sincronización automática.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Estado:** Hooks propios con persistencia en localStorage + sincronización Supabase
- **Auth:** Supabase Auth (email/password + OTP)

## Módulos

| Módulo         | Descripción                                 |
| -------------- | ------------------------------------------- |
| Candidatos     | Prospectos activos con pipeline Kanban      |
| Distribuidores | Red de distribución con checklist operativo |
| Leads          | Prospectos desde Google Maps                |
| Visitas        | Acompañamientos y revisiones en campo       |
| Tareas         | Agenda de compromisos por comercial         |
| Pipeline       | Kanban de oportunidades comerciales         |
| Call Center    | Seguimiento telefónico prioritario          |
| Backoffice     | Contactos y gestión administrativa          |
| Pedidos        | Control de ventas y activaciones            |
| Reportes       | Análisis y métricas de equipo               |

## Roles

| Rol        | Acceso                                         |
| ---------- | ---------------------------------------------- |
| admin      | Total — todos los datos de todos los usuarios  |
| manager    | Total lectura; escritura según zona            |
| commercial | Solo sus propios datos (owner_id = auth.uid()) |
| gestor     | Lectura total; escritura solo lo propio        |

## Arquitectura de seguridad

### Row-Level Security (RLS en Supabase)

Cada tabla aplica filtrado por owner_id = auth.uid() para comerciales:

| Tabla                 | Política SELECT commercial                                    |
| --------------------- | ------------------------------------------------------------- |
| candidatesGPV         | auth.uid() = owner_id OR is_admin_or_manager()                |
| distributorsGPV       | auth.uid() = owner_id OR is_admin_or_manager()                |
| visitsGPV             | auth.uid() = owner_id OR is_admin_or_manager()                |
| tasksGPV              | auth.uid() = owner_id OR is_admin_or_manager()                |
| leadsGPV              | is_admin_or_manager() (acceso comercial pendiente de definir) |
| backofficeContactsGPV | admin/manager OR operador = full_name                         |

### Cache Guard (cliente)

Los hooks de entidad persisten datos en localStorage para soporte offline. Para evitar fuga de datos entre usuarios en el mismo dispositivo se implementa un sistema de tres capas en src/lib/cacheGuard.ts:

- Momento 0: runCacheGuard() en DataProviderWrapper via useState initializer — corre antes de que DataProvider monte sus hooks y lean localStorage. Compara el userId de la sesión activa (sb-\*-auth-token) con gpv_last_user_id; si difieren, limpia la caché.
- Momento A: signOut limpia entidades + gpv_last_user_id.
- Momento B: loadUserProfile limpia entidades + registra el nuevo userId confirmado.

La syncQueue se preserva en signOut para que operaciones offline pendientes se sincronicen cuando el usuario original vuelva a entrar.

## Desarrollo local

```bash
npm install
npm run dev        # localhost:3000
npm run build      # build de producción
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest
```

Variables de entorno:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Despliegue

- Producción: Vercel — https://gpv.nexus-sales.eu
- Supabase proyecto: ogkyfzjioeyxdvmnkolz
- Edge Functions: create-gpv-user, oauth-google-refresh
