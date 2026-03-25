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

## 🎨 Sistema de Diseño (v3.0 — Marzo 2026)

### Filosofía

**Restar, no añadir.** Máxima información, mínimo ruido visual. Sin gradientes en botones, sin glassmorphism, sin transformaciones CSS en hover de acciones principales.

### Paleta de color

| Token Tailwind                | Uso                                     |
| ----------------------------- | --------------------------------------- |
| `indigo-600` / `indigo-500`   | Acción primaria, énfasis, links activos |
| `cyan-500` / `cyan-600`       | Acción secundaria                       |
| `emerald-500` / `emerald-600` | Éxito, valores positivos                |
| `amber-500`                   | Advertencias, pendientes                |
| `red-500` / `red-600`         | Peligro, errores, eliminación           |
| `gray-200` / `gray-700`       | Bordes                                  |
| `white` / `gray-800`          | Superficie de cards                     |

### Componentes base

#### `Button` (`src/components/ui/Button.tsx`)

Variantes sólidas sin gradiente: `primary` · `secondary` · `success` · `warning` · `danger` · `outline` · `ghost`.

```tsx
<Button variant="primary" size="md" icon={PlusIcon}>Nuevo</Button>
<Button variant="outline" loading={isSaving}>Guardar</Button>
```

#### `Card` (`src/components/ui/Card.tsx`)

Solo dos variantes: `default` (sombra leve) y `elevated` (sombra mayor).

```tsx
<Card variant="elevated" hover>
  <Card.Header>
    <Card.Title>Título</Card.Title>
  </Card.Header>
  <Card.Content>...</Card.Content>
</Card>
```

#### `KpiCard` (`src/components/KpiCard.tsx`)

Superficie neutral. El `color` prop solo afecta al icono, no al fondo de la card.

```tsx
<KpiCard
  title="Activos"
  value={42}
  color="indigo"
  icon={UsersIcon}
  trend={12}
/>
```

### Paleta de gráficos (Recharts)

Todos los charts usan la misma secuencia de colores Tailwind 500-level:

```js
;[
  '#6366F1',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#F97316',
  '#94A3B8'
]
// indigo   cyan       emerald    amber      red        violet     orange     slate
```

### Tipografía

| Uso               | Clase Tailwind                                                    |
| ----------------- | ----------------------------------------------------------------- |
| Título de página  | `text-2xl font-bold`                                              |
| Título de sección | `text-lg font-semibold`                                           |
| Eyebrow           | `text-sm font-semibold uppercase tracking-widest text-indigo-600` |
| Valor KPI grande  | `text-3xl font-bold`                                              |
| Cuerpo            | `text-sm text-gray-600 dark:text-gray-400`                        |
| Label de campo    | `text-xs font-medium text-gray-700 dark:text-gray-300`            |

**Prohibido:** `font-black` / `font-extrabold` en texto funcional. `text-4xl+` en páginas que ya tienen header de navegación.

### Reglas para nuevos desarrollos

1. **Sin gradientes en botones.** Usa `bg-indigo-600 hover:bg-indigo-700`.
2. **Sin scale/translate en hover** sobre botones o cards. Solo sombra (`hover:shadow-md`).
3. **Card solo tiene `default` y `elevated`.** No crear variantes nuevas.
4. **Focus states con ring:** `focus:ring-2 focus:ring-indigo-500/20`, nunca `focus:shadow` + `focus:scale`.
5. **Títulos de página máximo `text-2xl font-bold`** si hay header de navegación.
6. **`font-semibold` como máximo en texto funcional.**
7. **Modales con scroll** usando el patrón de `Modal.tsx` — outer `overflow-y-auto`, inner `flex min-h-full items-center justify-center`.

---

## 🎨 Refactorización Visual Completa — Marzo 2026

Rediseño de sistema visual en 3 fases. Diagnóstico inicial: 7 esquemas de color, 9 variantes de Card, 7 variantes de Button con gradiente, `font-black` en labels, `hover:scale` en todos los botones.

### Fase 1 — Sistema base

| Archivo                             | Cambio                                                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles.css`                    | Eliminados 5 de 7 esquemas de color, animaciones decorativas (`float`, `bounce-subtle`), `.glass`, `.premium-card`. Scrollbar neutral. |
| `src/components/layout/Sidebar.tsx` | Estado activo universal sin colores per-item. Eliminadas Quick Stats y help banner. Logo sólido.                                       |
| `src/components/layout/Header.tsx`  | Altura reducida `h-14 lg:h-16`. Fondo sólido. Eliminados icono grande, descripción y SyncStatus.                                       |
| `src/Layout.tsx`                    | Eliminados blobs decorativos de fondo. Footer simplificado.                                                                            |
| `src/components/ui/Button.tsx`      | Todos los gradientes → colores sólidos. Sin `hover:scale`.                                                                             |
| `src/components/ui/Modal.tsx`       | Scroll arreglado con patrón headless UI estándar.                                                                                      |

### Fase 2 — Componentes y consistencia

| Archivo                                   | Cambio                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/components/ui/Card.tsx`              | 5 variantes → 2 (`default`, `elevated`). Eliminado `useTheme`. 15 usages actualizados.       |
| `src/components/KpiCard.tsx`              | Superficie neutral. Eliminado `useTheme`, `isHovered`, gradientes por color, `hover:scale`.  |
| `src/components/CandidateForm.tsx`        | Focus: `focus:scale + focus:shadow-lg` → `focus:ring-2`. Submit: gradient → `bg-indigo-600`. |
| `src/components/DistributorForm.tsx`      | Submit: gradient + scale → sólido.                                                           |
| `src/components/SaleForm.tsx`             | Submit: gradient + scale → sólido.                                                           |
| `src/components/VisitForm.tsx`            | Submit: gradient + scale → sólido.                                                           |
| `src/components/PdfButton.tsx`            | Default className: gradient → sólido.                                                        |
| `src/components/ContactSelectorModal.tsx` | Botones: gradient + scale → sólidos.                                                         |
| `src/pages/Candidates.tsx`                | CTA button: gradient + scale → sólido.                                                       |
| `src/pages/Login.tsx`                     | Submit: gradient + scale → sólido. Fix encoding `producciÃ³n`.                               |
| `src/pages/Kanban.tsx`                    | CTA: gradient overlay + scale → sólido.                                                      |
| `src/pages/Leads.tsx`                     | Submit: `active:scale` → sin transform.                                                      |
| `charts/*.tsx`                            | Paleta unificada a Tailwind 500-level en todos los archivos de gráficos.                     |

### Fase 3 — Páginas y tipografía

| Archivo                                      | Cambio                                                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/CommissionAgreementsBox.tsx` | Todos los `pastel-*` → Tailwind estándar. Contenedor: `backdrop-blur bg-white/95` → `border shadow-sm`.                                                 |
| `src/pages/Leads.tsx`                        | Hero: `text-4xl font-extrabold sm:text-5xl` + gradient text → `text-2xl font-bold`. Labels: `font-black` → `font-semibold`.                             |
| `src/pages/Kanban.tsx`                       | Hero: `text-4xl font-black` → `text-2xl font-bold`.                                                                                                     |
| `src/pages/Settings.tsx`                     | `text-3xl font-black` → `text-2xl font-bold`.                                                                                                           |
| `src/pages/Calls.tsx`                        | Hero: `text-4xl` → `text-2xl`. KPI values: `text-pastel-*` → Tailwind estándar.                                                                         |
| `src/pages/Candidates.tsx`                   | Hero: `text-4xl` → `text-2xl`. Badge simplificado.                                                                                                      |
| `src/pages/Visits.tsx`                       | Hero: `text-4xl` → `text-2xl`. Fix `dark:text-gray-400` triplicado.                                                                                     |
| `src/pages/Distributors.tsx`                 | Hero gradient completo eliminado. Fondo de página normalizado. Botones filtro/vista normalizados. KPI cards: `hover:translate-y` + gradients → neutros. |
| `src/pages/ReportsWeekly.tsx`                | Hero: `text-4xl` → `text-2xl`. `text-pastel-indigo` → `text-indigo-600`.                                                                                |
| `src/pages/Dashboard.tsx`                    | Activity feed: `hover:translate-y` eliminado.                                                                                                           |
| `src/lib/ConfirmProvider.tsx`                | Confirm button: `hover:-translate-y shadow-lg` → `shadow-sm`.                                                                                           |
| `src/components/ui/EmptyState.tsx`           | CTA: `hover:-translate-y shadow-indigo-600/20` → `shadow-sm`.                                                                                           |
| `src/components/charts/StatsChart.tsx`       | Icon container + badge: gradient, scale, animate-pulse → neutros.                                                                                       |

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
