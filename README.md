# GPV Consultor

Aplicación de gestión comercial multi-sector para equipos GPV (Gestor Punto de Venta). Gestiona candidatos a distribuidor, **clientes potenciales** (energía, telefonía, alarmas), distribuidores, visitas, leads, tareas y pipeline comercial con soporte offline y sincronización automática.

> **Nota:** la app nació como herramienta mono-usuario (un solo GPV) y se ha convertido en multi-usuario / equipo (admin, manager/GPV, comercial, gestor de backoffice). Buena parte de la arquitectura de seguridad descrita aquí es fruto de esa transición.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (PWA)
- **Backend/DB:** Supabase (PostgreSQL + Auth + Edge Functions). Proyecto Supabase **compartido** con otras apps; GPV se aísla por tablas con sufijo `GPV` y por RLS.
- **Estado:** Hooks propios con persistencia en localStorage + sincronización Supabase
- **Auth:** Supabase Auth (email/password + OTP)
- **Monitorización:** Sentry (solo en producción, sin datos personales)
- **Build:** `tsc --noEmit && vite build` (candado anti-regresión de tipos)

## Módulos

| Módulo         | Descripción                                                        | Estado v1                                   |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| Candidatos     | Prospectos activos con pipeline Kanban (distribuidores + clientes) | ✅ Cerrado                                  |
| Distribuidores | Red de distribución con checklist operativo                        | ✅ Cerrado                                  |
| Backoffice     | Contactos y gestión administrativa                                 | ✅ Cerrado                                  |
| Visitas        | Acompañamientos y revisiones en campo                              | ✅ Cerrado                                  |
| Leads          | Prospectos desde Google Maps → conversión a distribuidor o cliente | ⚠️ Captación admin/manager; asignación a v2 |
| Tareas         | Agenda de compromisos por comercial                                | —                                           |
| Pipeline       | Kanban de oportunidades comerciales                                | —                                           |
| Call Center    | Seguimiento telefónico prioritario                                 | —                                           |
| Pedidos        | Control de ventas y activaciones                                   | —                                           |
| Reportes       | Análisis y métricas de equipo                                      | —                                           |

## Roles

| Rol        | Acceso                                           |
| ---------- | ------------------------------------------------ |
| admin      | Total — todos los datos de todos los usuarios    |
| manager    | Total lectura; escritura según zona (GPV)        |
| commercial | Solo sus propios datos (owner_id = auth.uid())   |
| gestor     | Solo sus propios datos de backoffice (createdBy) |

Función SQL `is_admin_or_manager()` centraliza la comprobación de rol elevado.

## Arquitectura de seguridad

### Row-Level Security (RLS en Supabase)

| Tabla                 | Política SELECT / propiedad                                   |
| --------------------- | ------------------------------------------------------------- |
| candidatesGPV         | auth.uid() = owner_id OR is_admin_or_manager()                |
| distributorsGPV       | auth.uid() = owner_id OR is_admin_or_manager()                |
| visitsGPV             | auth.uid() = owner_id OR is_admin_or_manager()                |
| tasksGPV              | auth.uid() = owner_id OR is_admin_or_manager()                |
| backofficeContactsGPV | auth.uid() = createdBy OR is_admin_or_manager()               |
| leadsGPV              | is_admin_or_manager() (acceso comercial = v2, vía asignación) |
| pipelineStagesGPV     | lectura: perfil GPV · escritura: solo admin                   |

`owner_id` se autocompleta en la BD vía `DEFAULT auth.uid()` al insertar.

**Backoffice:** la propiedad migró de un campo de texto frágil (`operador = full_name`) a `createdBy` por id (inmutable). Los contactos históricos se reasignaron por id a sus gestoras reales.

### Pipeline de candidatos

Las etapas viven en la tabla `pipelineStagesGPV` (no en localStorage), ordenadas por `position`. Son **globales** para toda la empresa y solo el **admin** puede editarlas (candado por RLS + guard de UI en Settings → Flujos de Venta). El módulo lee de BD con fallback a `config.ts` si la consulta falla.

### Control de duplicados

### Clientes Potenciales

El módulo de Candidatos distingue dos tipos mediante el campo `candidateType`:

- **`distributor`** (por defecto, retrocompatible con todos los registros anteriores): candidato a incorporarse a la red de distribución.
- **`client`**: cliente potencial directo al que se le ofrecen servicios de energía, telefonía o alarmas. Incluye el campo `sector` para clasificar el área de interés.

El flujo de conversión desde Leads ahora presenta un modal de selección de tipo antes de crear el candidato. El listado de candidatos dispone de un filtro de tipo adicional. La ficha de detalle identifica visualmente el tipo y el sector.

**Migración Supabase requerida** (ejecutar en SQL Editor del proyecto):

```sql
ALTER TABLE "candidatesGPV"
  ADD COLUMN IF NOT EXISTS "candidateType" TEXT DEFAULT 'distributor';

ALTER TABLE "candidatesGPV"
  ADD COLUMN IF NOT EXISTS "sector" TEXT;
```

### Control de duplicados

Los formularios de Candidato, Distribuidor y Backoffice avisan de duplicados (por CIF/tax_id y por nombre normalizado) vía la función SQL `check_entity_exists`, que respeta la privacidad: devuelve datos solo si el registro es del propio usuario, y un veredicto sin datos si es de otro.

- **commercial / gestor:** no pueden crear un duplicado (bloqueo total, candado real en `handleSubmit`).
- **admin / manager:** pueden crear pese al aviso ("crear de todos modos").

El nombre es obligatorio (≥3 caracteres, lista negra de placeholders). El código de distribuidor es obligatorio y único (constraints `UNIQUE` + `CHECK` en BD).

### Captación de leads (Google Places)

La búsqueda y la importación de leads vía Google Places consumen cuota de la API y están restringidas a **admin / manager** (doble capa: UI oculta + guard `if (!canSearchLeads) return` en `handleSearch` y `handleImportLead`). La API key de Google va por variable de entorno y está restringida por dominio y por API en Google Cloud.

### Cache Guard (cliente)

Los hooks de entidad persisten datos en localStorage para soporte offline. Para evitar fuga de datos entre usuarios en el mismo dispositivo se implementa un sistema de tres capas en `src/lib/cacheGuard.ts`:

- **Momento 0:** `runCacheGuard()` en DataProviderWrapper vía useState initializer — corre antes de que DataProvider monte sus hooks y lean localStorage. Compara el userId de la sesión activa con `gpv_last_user_id`; si difieren, limpia la caché.
- **Momento A:** `signOut` limpia entidades + `gpv_last_user_id`.
- **Momento B:** `loadUserProfile` limpia entidades + registra el nuevo userId confirmado.

La syncQueue se preserva en signOut para que operaciones offline pendientes se sincronicen cuando el usuario original vuelva a entrar.

### Otras protecciones de sesión

- **Cambio de contraseña obligatorio** al primer acceso (`must_change_password`).
- **Auto-logout** por inactividad (30 min).
- **Gestión de usuarios** (crear/bloquear/eliminar) vía Edge Functions con verificación de rol server-side.

## Desarrollo local

```bash
npm install
npm run dev        # localhost:3000
npm run build      # tsc --noEmit && vite build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest
```

Variables de entorno:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_GOOGLE_PLACES_KEY=<google-key>      # restringida por dominio + API en Google Cloud
VITE_SENTRY_DSN=<sentry-dsn>             # solo configurar en entorno Production
```

## Despliegue

- **Producción:** Vercel — https://gpv.nexus-sales.eu
- **Supabase proyecto:** ogkyfzjioeyxdvmnkolz (compartido; GPV aislado por tablas `*GPV` + RLS)
- **Edge Functions:** create-gpv-user, delete-gpv-user, manage-gpv-user, oauth-google-refresh
- **Sentry:** proyecto gpv-canarias-app (org ucoip-canarias-sl). Solo activo en producción.

## Pendiente (v1.1 / v2)

**v1.1:** correlativo de código de distribuidor por marca (Nat-001) + multi-código; Sentry verificado post-deploy; mejoras de usabilidad en backoffice.

**v2 — modelo de pool:** asignación y traspaso de registros con histórico (registro único compartido, reasignable por admin); reasignación de candidatos entre comerciales; asignación de leads (selector + RLS por `asignado_a`, solo admin/GPV puede asignar); delegación de visitas (`assignedUserId`); identidad visual aplicada al tema (lavado de imagen); defensa server-side del bloqueo de duplicados.

Ver `docs/ROADMAP.md` para el detalle completo.
