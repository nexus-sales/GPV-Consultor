# GPV Canarias · Herramienta Comercial

Aplicación React 18 + Vite para la gestión comercial de GPV Canarias: pipeline de distribuidores, candidatos, visitas, leads, ventas, llamadas y reporting con soporte offline y modo oscuro.

## 👥 Autor

- **Salvador Muñoz Portillo** ([admin@nexus-sales.eu](mailto:admin@nexus-sales.eu))

## ⚙️ Requisitos

- Node.js >= 20
- npm >= 10

### Tooling de calidad

- TypeScript (modo estricto con migración gradual desde JS)
- ESLint + Prettier
- Husky + lint-staged
- Vitest para unit tests
- Playwright para E2E

### Variables de entorno

Replica `.env.example` como `.env` y completa las claves de Supabase si corresponde:

```bash
cp .env.example .env
# Editar el archivo resultante y rellenar las variables
```

## 🚀 Arranque rápido

```bash
npm install
npm run dev
```

Formato y análisis estático:

```bash
npm run lint
```

Formateo automático:

```bash
npm run format:write
```

Tests unitarios:

```bash
npm run test
```

Cobertura:

```bash
npm run test:coverage
```

Pruebas end-to-end (requiere navegadores instalados)

```bash
npx playwright install --with-deps
npm run test:e2e
```

Build de producción:

```bash
npm run build
```

## 🧭 Rutas clave

**Autenticadas:**

- `/dashboard` — Panel principal con KPIs
- `/pipeline` — Kanban de candidatos (también `/kanban`)
- `/distributors` y `/distributors/:id` — Gestión de distribuidores
- `/candidates` y `/candidates/:id` — Pipeline de candidatos
- `/leads` — Prospección y gestión de leads
- `/visits` — Registro de visitas comerciales
- `/sales` — Registro de ventas
- `/calls` — Centro de llamadas
- `/reports` · `/reports/weekly` — Informe semanal PDF
- `/notifications` — Centro de notificaciones
- `/upgrade-requests` — Solicitudes de alta
- `/d2d-teams` — Equipos D2D
- `/import` — Importación masiva de datos
- `/profile` — Gestión de perfiles de usuario
- `/settings` — Configuración, incluyendo gestión de 2FA

**Públicas (sin login):**

- `/login`
- `/legal/aviso` — Aviso Legal
- `/legal/privacidad` — Política de Privacidad
- `/legal/cookies` — Política de Cookies

## 📚 Documentación

- [Especificación funcional v1](./docs/especificacion-v1.md): reglas de negocio, métricas, roadmap PWA y backlog sugerido.
- [Estilos CSS Inline](./docs/CSS_INLINE_STYLES.md): justificación técnica de los estilos inline en componentes de visualización de datos.

## 🛠️ Stack

- React 18 + Vite
- Tailwind CSS + utilidades personalizadas
- Context API con persistencia en `localStorage`
- TypeScript incremental (allowJs) y validación con Zod
- Heroicons y componentes UI propios
- **API**: Google Places API para prospección inteligente
- **Excel**: Exportación de datos con `xlsx`

---

## 🎉 Novedades v2.6 — Módulo de Settings Completado

### 🔗 Integraciones Externas

**Google Workspace y Microsoft 365** — Sincronización bidireccional con calendarios y tareas:

| Característica                   | Google             | Microsoft           |
| -------------------------------- | ------------------ | ------------------- |
| **Calendario**                   | ✅ Google Calendar | ✅ Outlook Calendar |
| **Tareas**                       | ✅ Google Tasks    | ✅ Microsoft To Do  |
| **OAuth 2.0**                    | ✅ Configurado     | ✅ Configurado      |
| **Refresh tokens**               | ✅ Automático      | ✅ Automático       |
| **Selector de calendario**       | ✅ Múltiples       | ✅ Múltiples        |
| **Recordatorios**                | ✅ Configurables   | ✅ Configurables    |
| **Sincronización bidireccional** | ✅ En tiempo real  | ✅ En tiempo real   |

**Flujo de sincronización:**

```
Visitas comerciales → Eventos en calendario
Llamadas de seguimiento → Recordatorios y tareas
Fechas límite de leads → Alertas en móvil
Actualizaciones → Sincronización automática
```

**Configuración requerida (.env):**

```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID=tu_client_id
VITE_GOOGLE_CLIENT_SECRET=tu_client_secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=tu_client_id
VITE_MICROSOFT_CLIENT_SECRET=tu_client_secret
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/microsoft/callback
```

**Archivos nuevos (15):**

- `src/lib/integrations/types.ts` — Tipos e interfaces comunes
- `src/lib/integrations/useCalendarSync.ts` — Hook unificado de sincronización
- `src/lib/integrations/CalendarSyncPanel.tsx` — UI de configuración de calendario
- `src/lib/integrations/TaskSyncPanel.tsx` — UI de configuración de tareas
- `src/lib/integrations/google/*` — Servicios y OAuth de Google (4 archivos)
- `src/lib/integrations/microsoft/*` — Servicios y OAuth de Microsoft (4 archivos)
- `src/pages/auth/GoogleCallbackPage.tsx` — Callback OAuth Google
- `src/pages/auth/MicrosoftCallbackPage.tsx` — Callback OAuth Microsoft

---

### ⚙️ Mejoras de Settings (15 Features)

#### **Top 5 Prioridades:**

1. **✅ Editar marca** — Renombrar marcas en sectores con modal inline
2. **✅ Reset de esquema de color** — Botón para volver al esquema Índigo por defecto
3. **✅ Exportar logs** — Descargar últimos 50 logs en archivo .txt para debugging
4. **✅ Exportar datos personales (RGPD)** — Download JSON con todos los datos del usuario
5. **✅ Colores personalizados por etapa** — 8 colores disponibles para cada etapa del pipeline

#### **Mejoras Adicionales:**

6. **✅ Migrar alert() a Toasts** — Todas las alertas nativas reemplazadas por Sonner toasts
7. **✅ Estado de Google Places API** — Card indicadora si la API está configurada
8. **✅ Versión de app + actualizaciones** — Mostrar versión + botón "Buscar actualizaciones"
9. **✅ Iconos por sector** — 32 emojis disponibles para personalizar sectores
10. **✅ Eliminar cuenta (RGPD)** — Doble confirmación con texto requerido "ELIMINAR"
11. **✅ Selector de zona horaria** — 25 zonas horarias globales configurables
12. **✅ Colores corporativos personalizados** — Pickers RGB/HEX para primary/secondary/accent
13. **✅ Favicon dinámico** — Actualización automática al subir logo
14. **✅ Iconos por etapa del pipeline** — 32 emojis disponibles + visualización en UI
15. **✅ Color por sector** — 10 colores visuales para identificar sectores

---

### 📊 Estadísticas de la Implementación

| Métrica                  | Valor               |
| ------------------------ | ------------------- |
| **Archivos creados**     | 15 nuevos           |
| **Archivos modificados** | 5                   |
| **Líneas añadidas**      | +3,739              |
| **Líneas eliminadas**    | -90                 |
| **Tamaño Settings.tsx**  | 83.84 kB (minified) |
| **Build time**           | ~18-22s             |
| **ESLint errors**        | 0 (46 corregidos)   |

---

### 🔒 Cumplimiento RGPD

**Derechos implementados:**

- ✅ **Derecho de acceso** — Exportar datos personales (JSON)
- ✅ **Derecho al olvido** — Eliminar cuenta permanentemente (doble confirmación)
- ✅ **Transparencia** — Información clara de qué datos se eliminan

**Flujo de eliminación:**

```
1. Click en "Eliminar mi cuenta"
2. Primera confirmación: lista de datos a eliminar
3. Segunda confirmación: escribir "ELIMINAR"
4. Borrado de localStorage + logout
5. (Opcional) Llamada a Edge Function para borrar en Supabase
```

---

### 🎨 Personalización Visual

**Colores Corporativos:**

- Primary color: Botones principales, enlaces, iconos destacados
- Secondary color: Elementos secundarios, acentos visuales
- Accent color: Notificaciones, badges, elementos de atención

**Iconos Disponibles:**

- Sectores: 32 emojis (📁 💼 🏢 🏭 🛒 🏥 🏨 🍽️ 🚗 ✈️ 🏠 📱 💻 🎮 🎬 🎵 📚 🎓 ⚽ 🏋️ 🎨 📸 🐶 🐱 🌟 💎 🔧 ⚡ 🔥 💡 🎯 📊)
- Etapas: 32 emojis (🎯 ⭐ 🚀 💡 📌 🔥 ✨ 💎 📊 📈 🏆 🎖️ 🏅 🎪 🎨 🎭 📢 📣 🔔 📍 🚩 🎌 🏁 🎗️ 💬 📝 ✏️ 📋 🗂️ 📁 🗃️ 📦)

**Colores por Etapa:**

- 8 opciones: Índigo, Cyan, Verde, Amarillo, Rojo, Naranja, Gris, Morado

**Colores por Sector:**

- 10 opciones: Azul, Cyan, Verde, Amarillo, Naranja, Rojo, Morado, Rosa, Índigo, Gris

---

### 🌍 Zona Horaria

**25 zonas disponibles:**

- **Europa:** Madrid, Londres, París, Berlín, Roma, Ámsterdam, Bruselas, Lisboa
- **América:** New York, Chicago, Denver, Los Angeles, México City, Bogotá, Lima, Santiago, Buenos Aires, São Paulo
- **Asia:** Tokio, Shanghai, Singapur, Dubái
- **Oceanía:** Sydney, Auckland
- **Universal:** UTC

---

### 📦 Estado del Sistema

**Status Cards en Settings → Estado de Red:**

- ✅ Base de Datos — Online
- ✅ Servicio de Sync — Trabajando
- ✅ Almacenamiento — 94% Libre
- ✅ Google Places API — Configurada / No configurada
- ✅ Versión — v2.6.0 (click para buscar actualizaciones)

**Logs de Consola Remota:**

- Exportar logs (.txt)
- Limpiar historial
- Refresh manual
- Últimos 50 logs con timestamp, nivel, módulo y mensaje

---

## 🏗️ Mejoras de Profesionalización (v2.0)

### 📦 Optimización de Performance

- **Code Splitting Automático**: Vendors separados (React, Supabase, Recharts, PDF, DnD)
- **Lazy Loading**: Todas las rutas cargan bajo demanda con Suspense
- **Bundle Reducido**: ~3.5MB → ~2.8MB con vendors optimizados
- **Cacheo Mejorado**: Hash en nombres de archivo para cacheo óptimo

### 🔐 Seguridad Mejorada

- **Rate Limiting**: 5 intentos máximos de login, bloqueo de 15 minutos
- **Validación de Email**: Regex antes de llamar a Supabase
- **Logging de Intentos**: Tracking de intentos fallidos
- **shouldCreateUser: false**: Evita creación automática de usuarios en OTP

### 🪵 Logger Centralizado

```typescript
import { logger, createLogger } from './lib/logger'

// Logger global
logger.info('Mensaje informativo', { data: 'opcional' })
logger.warn('Advertencia', error)
logger.error('Error crítico', exception)

// Logger por módulo
const authLogger = createLogger('Auth')
authLogger.info('Usuario logueado', { email })
```

**Características:**

- Niveles: debug, info, warn, error
- Logging condicional (solo warn/error en producción)
- Formato estructurado con timestamp y módulo
- Integración futura con Sentry/telemetría

### 🧪 Tests Unitarios

**Cobertura actual:** 32 tests (24 pasando — 8 en KpiCard pendientes de actualizar)

```bash
# Ejecutar tests
npm run test

# Con cobertura
npm run test:coverage

# Watch mode
npm run test:watch
```

**Tests incluidos:**

- `KpiCard.test.tsx` (17 tests, 8 pendientes de actualizar) - Renderizado, interacción, accesibilidad
- `logger.test.ts` (13 tests) - Logging estructurado, formatos
- `kpis.test.ts` (2 tests) - Utilidades de métricas

### 🚨 Error Boundary Mejorado

- UI profesional con branding GPV
- Botones "Intentar de nuevo" y "Recargar página"
- Detalles de error solo en desarrollo
- Logging estructurado automático
- Información de contacto de soporte

### 🚀 Módulo de Leads (v2.1) - NUEVO

**Características destacadas:**

- **Prospección con Google Maps**: Búsqueda directa de empresas por sector y ubicación geográfica usando la Places API.
- **Control de Estados**: Nuevo sistema de tracking con estados: _Nuevo, Pendiente, Contactado, Interesado y Rechazado_.
- **Feedback Visual Inteligente**: Las filas cambian de color automáticamente según el estado (Rojo para rechazados, Ámbar para pendientes, etc.) para evitar llamadas duplicadas o innecesarias.
- **Importación Inteligente**: Obtención automática de teléfonos, sitios web, direcciones y valoraciones de clientes.
- **Filtrado y Ordenación**: Sistema avanzado de filtrado por estado, búsqueda de texto y ordenación por rating o fecha.
- **Conversión de Pipeline**: Flujo de un solo clic para transformar un Prospecto (Lead) en un Candidato activo dentro del pipeline comercial.
- **Exportación Excel**: Generación de reportes profesionales en formato `.xlsx` que respetan los filtros aplicados en pantalla.
- **Sincronización Offline**: Integración con el sistema de mensajería y persistencia local para trabajar sin conexión.

### 💰 Gestión de Comisiones (v2.3) - MEJORADO

**Módulo de Acuerdos Comerciales de Alta Precisión:**

- **Estructura Multi-Sector**: Configuración de acuerdos específicos para Alarmas (Movistar Prosegur), Energía y Telefonía (Movistar, O2).
- **Multi-Escalado (Tiers)**: Soporte para múltiples niveles de producción dentro de un mismo acuerdo (ej: de 1 a 5 → 50€, de 6 a 10 → 80€).
- **Doble Perfil de Cliente**: Gestión independiente y detallada de condiciones para **Residencial** y **PYME**.
- **Sistemas de Liquidación Dinámicos**: La interfaz se adapta automáticamente según el modelo:
  - **A doc (ADOC)**: Gestión de niveles y escalados ilimitados.
  - **Fijo**: Importe único preestablecido.
  - **Porcentaje**: Cálculo basado en volumen o margen.
- **Histórico de Cambios**: Registro de auditoría con "Snapshot" de condiciones anteriores. Permite consultar qué rappel o importe estaba activo en cualquier fecha pasada.
- **Integración en Formulario de Ventas**: Visualización inteligente del acuerdo vigente durante la creación de una venta, incluyendo tablas de escalados y notas internas para evitar errores de tramitación.
- **Notas y Observaciones**: Campo dedicado para especificar cláusulas particulares de cada contrato.
- **Persistencia y Sync**: Almacenamiento centralizado en Supabase con sincronización offline y visualización en tiempo real mediante Currency Indicators en el listado de distribuidores.

---

## 🔐 Seguridad y Cumplimiento Legal (v2.2)

### Autenticación de Dos Factores (2FA / TOTP)

Implementación completa de MFA mediante TOTP (Time-based One-Time Password), compatible con Google Authenticator, Authy y cualquier app TOTP estándar.

**Activación** (por usuario, desde Ajustes → Privacidad y Firma):

1. Pulsar "Activar autenticación en 2 pasos"
2. Escanear el código QR con la app de autenticación
3. Introducir el código de 6 dígitos para confirmar

**Flujo de login con 2FA activo:**

```
email + contraseña → verificación TOTP → dashboard
```

**Archivos:**

- `src/components/auth/MFASetupPanel.tsx` — activar/desactivar 2FA
- `src/components/auth/MFAVerifyStep.tsx` — paso de verificación en login

> ⚠️ **Requisito previo en Supabase:** activar MFA en el panel del proyecto:
> `Authentication → Settings → Multi Factor Authentication → Enable TOTP`

---

### Cumplimiento Legal RGPD / EU AI Act

Páginas legales públicas (accesibles sin autenticación):

| Ruta                | Contenido                                           | Norma                                |
| ------------------- | --------------------------------------------------- | ------------------------------------ |
| `/legal/aviso`      | Aviso Legal + sección EU AI Act                     | LSSICE Ley 34/2002                   |
| `/legal/privacidad` | Política de Privacidad completa + DPD               | RGPD + LOPDGDD + EU AI Act 2024/1689 |
| `/legal/cookies`    | Tabla de almacenamiento + gestión de consentimiento | Directiva ePrivacy + LSSI Art. 22.2  |

**Banner de cookies** visible en todas las rutas autenticadas (`src/components/legal/CookieBanner.tsx`).
**Empresa titular:** Ucoip Canarias (CIF B76525567) · Nombre comercial: Grupo LMB
**DPD:** Salvador Muñoz Portillo — info@ucoipcanarias.com

Documentación de cumplimiento completa: [`docs/LEGAL_COMPLIANCE.md`](./docs/LEGAL_COMPLIANCE.md)

---

### 🔧 CI/CD Mejorado

**Jobs configurados en `.github/workflows/ci.yml`:**

| Job           | Descripción                      |
| ------------- | -------------------------------- |
| `quality`     | Lint + Format check              |
| `unit-tests`  | Tests con cobertura + Codecov    |
| `security`    | npm audit + Snyk security scan   |
| `build`       | Build de producción              |
| `e2e-tests`   | Playwright tests                 |
| `performance` | Lighthouse CI (opcional)         |
| `bundle-size` | Verificación de tamaño de bundle |

### 📁 Estructura de Tests

```
src/
├── components/
│   └── __tests__/
│       └── KpiCard.test.tsx
├── lib/
│   └── __tests__/
│       └── logger.test.ts
├── test/
│   └── setup.ts
└── utils/
    └── __tests__/
        └── kpis.test.ts
```

### 🎯 Configuración de Cobertura

**vitest.config.ts:**

```typescript
coverage: {
  thresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
}
```

### 📊 Métricas de Calidad

| Métrica          | Valor  | Objetivo | Estado |
| ---------------- | ------ | -------- | ------ |
| ESLint Errors    | 0      | 0        | ✅     |
| ESLint Warnings  | 0      | <20      | ✅     |
| TypeScript `any` | 0      | 0        | ✅     |
| Test Coverage    | ~15%   | >50%     | 🔄     |
| Tests Unitarios  | 32     | 50+      | 🔄     |
| Bundle Size      | ~2.8MB | <2MB     | ⚠️     |
| Build Time       | 17s    | <10s     | ⚠️     |

## 🔄 CI/CD

El workflow `.github/workflows/ci.yml` ejecuta:

- ✅ Lint y formato de código
- ✅ Tests unitarios con reporte de cobertura
- ✅ Security scanning (npm audit + Snyk)
- ✅ Build de producción optimizado
- ✅ Tests E2E con Playwright
- ✅ Verificación de tamaño de bundle
- ✅ Lighthouse performance check (PRs)

---

## 🧹 Calidad de Código (v2.4)

### TypeScript sin `any`

Eliminación completa de todos los tipos `any` del código fuente (0 ocurrencias). Cada módulo tratado:

| Módulo                                                    | Cambio                                                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `supabaseMappers.ts`                                      | `mapToSupabase` acepta `object` en lugar de `Record<string, unknown>` para compatibilidad con interfaces tipadas |
| `normalisers.ts`                                          | `SaleSector`, `SaleStatus`, `Lead['fuente']`, `Lead['estado']` reemplazan casts `as any`                         |
| `DataContext.tsx`                                         | `NewCandidate` tipado explícito; `salesByBrand.map` con tipo inferido                                            |
| `SaleForm.tsx`                                            | `SaleMode`, `SaleStatus`, `CommissionAgreement`, `CommissionTier` reemplazan casts                               |
| `useCommissionAgreements.ts`                              | Tipo preciso `CommissionAgreementUpdates & { updatedAt }` en lugar de `any`                                      |
| `CommissionAgreementsBox.tsx`                             | Tier functions con ternario directo + `CommissionTier`; `resiType`/`pymeType` via `CommissionAgreement[key]`     |
| `Leads.tsx`                                               | `Lead['estado']` y `'name' \| 'rating' \| 'date'` reemplazan casts                                               |
| `googlePlacesService.ts`                                  | Interfaces locales `PlacesService` y `AddressComponent` — sin dependencia `@types/google.maps`                   |
| `types.ts`                                                | `SyncOperation.data: object` (era `any`)                                                                         |
| `useSyncQueue.tsx`                                        | Cast mínimo `{ id?: unknown }` para acceso a `.id`                                                               |
| Charts (Pie)                                              | `PieLabelRenderProps` de Recharts con cast interno para campo `percentage`                                       |
| `Distributors.tsx`                                        | `sectorFilter as SectorId` en lugar de `as any`                                                                  |
| `Settings.tsx`                                            | `Promise.race` tipado explícito en lugar de `as any`                                                             |
| `kpiCalculations.ts`, `Layout.tsx`, `DistributorForm.tsx` | Casts superfluos eliminados                                                                                      |

### EntityTimeline — Componente Reutilizable

Nuevo componente `src/components/EntityTimeline.tsx` para historial de actividad de cualquier entidad:

- Tabs de filtro: Todo / Visitas / Ventas / Notas
- Agrupación por período (Esta semana / Mes pasado / Más antiguo)
- Tarjetas expandibles con detalle completo
- Paginación (10 elementos por página)
- Integrado en `DistributorDetail` y `CandidateDetail`

### DataContext — Correcciones internas

- `formatRelativeDate`: función de fechas relativas en español ("hace 3 días", "ayer", "hace 2 semanas") — sustituye el no-op que devolvía el ISO string en crudo
- `latestActivities`: ordenadas por fecha descendente antes de mostrar las 3 más recientes (antes por orden de inserción)
- `stats` useMemo: dependencia `dynamicSectors` (no utilizada) reemplazada por `dynamicPipelineStages` (la que realmente se usa)

### ✨ Interfaz Premium y UX Avanzada (v2.5)

**Componentes Globales y Feedback Visual:**

- **Command Palette (Cmd/Ctrl + K)**: Buscador global omnisciente integrado en el Header. Permite saltar fácilmente entre vistas (Ej: Dashboard, Pipelines) y buscar distribuidores, leads o candidatos por código o nombre directamente desde el teclado. Incluye detección de SO (Windows vs Mac) para mostrar el atajo correcto.
- **Notificaciones Toast (`sonner`)**: Sistema de alertas emergentes modernas y elegantes (`Toaster richColors`) integrado a nivel de aplicación (reemplazando alertas estáticas o nativas).
- **Skeleton Loaders (`Skeleton.tsx`)**: Componentes de carga adaptativos para mitigar la percepción de lentitud y eliminar los layout shifts al cargar datos, integrados en listas y grids.
- **Estados Vacíos (`EmptyState.tsx`)**: Reemplazo de los mensajes "No hay elementos" por pantallas diseñadas de alto nivel (con iconografía Heroicons, glassmorphism y Call-to-Actions dinámicos).
- **Migas de Pan (`Breadcrumbs.tsx`)**: Sistema de navegación contextual para rutas profundas e interiores, permitiendo al usuario ubicarse en el organigrama y volver fácil a los menús raíz.
- **Provider de Confirmación (`useConfirm`)**: Sustitución global absoluta de la función nativa `window.confirm()`. Nuevo Hook asíncrono que despliega ventanas modales "premium" con animaciones, colores por nivel de peligro (Danger, Warning, Info), desenfoque de fondo y total personalización del texto, integrado de manera retroactiva a Kanban, Settings, D2D Teams y Comisiones.

---

## 🗺️ Próximos pasos

### Corto Plazo (1-2 semanas)

1. Aumentar cobertura de tests → Objetivo: 50%
2. ~~Reemplazar tipos `any` en forms críticos~~ ✅ Completado
3. Configurar Sentry para error tracking

### Medio Plazo (2-4 semanas)

4. Implementar Codecov en CI
5. Optimizar imágenes (WebP/AVIF)
6. Agregar React Query para cache de datos

### Largo Plazo (1-2 meses)

7. Migrar a React 19 (estable)
8. Implementar SSR para SEO
9. PWA offline-first con IndexedDB
