# GPV Canarias · Herramienta Comercial

Aplicación React 19 + Vite para la gestión comercial de GPV Canarias: pipeline de distribuidores, candidatos, visitas y reporting con soporte de modo oscuro.

## 👥 Autor

- **Salvador Muñoz Portillo** ([salvador.munoz@masvoip.com](mailto:salvador.munoz@masvoip.com))

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

- `/dashboard`
- `/kanban`
- `/distributors` y `/distributors/:id`
- `/candidates` y `/candidates/:id`
- `/leads`
- `/reports/weekly`
- `/settings` — incluye gestión de 2FA

**Públicas (sin login):**

- `/login`
- `/legal/aviso` — Aviso Legal
- `/legal/privacidad` — Política de Privacidad
- `/legal/cookies` — Política de Cookies

## 📚 Documentación

- [Especificación funcional v1](./docs/especificacion-v1.md): reglas de negocio, métricas, roadmap PWA y backlog sugerido.
- [Estilos CSS Inline](./docs/CSS_INLINE_STYLES.md): justificación técnica de los estilos inline en componentes de visualización de datos.

## 🛠️ Stack

- React 19 + Vite
- Tailwind CSS + utilidades personalizadas
- Context API con persistencia en `localStorage`
- TypeScript incremental (allowJs) y validación con Zod
- Heroicons y componentes UI propios
- **API**: Google Places API para prospección inteligente
- **Excel**: Exportación de datos con `xlsx`

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

**Cobertura actual:** 32 tests pasando

```bash
# Ejecutar tests
npm run test

# Con cobertura
npm run test:coverage

# Watch mode
npm run test:watch
```

**Tests incluidos:**

- `KpiCard.test.tsx` (17 tests) - Renderizado, interacción, accesibilidad
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
- **Importación Inteligente**: Obtención automática de teléfonos, sitios web, direcciones y valoraciones de clientes.
- **Filtrado y Ordenación**: Sistema avanzado de filtrado por estado, búsqueda de texto y ordenación por rating o fecha.
- **Conversión de Pipeline**: Flujo de un solo clic para transformar un Prospecto (Lead) en un Candidato activo dentro del pipeline comercial.
- **Exportación Excel**: Generación de reportes profesionales en formato `.xlsx` que respetan los filtros aplicados en pantalla.
- **Sincronización Offline**: Integración con el sistema de mensajería y persistencia local para trabajar sin conexión.

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

| Métrica         | Valor  | Objetivo | Estado |
| --------------- | ------ | -------- | ------ |
| ESLint Errors   | 0      | 0        | ✅     |
| ESLint Warnings | 23     | <20      | ⚠️     |
| Test Coverage   | ~15%   | >50%     | 🔄     |
| Tests Unitarios | 32     | 50+      | 🔄     |
| Bundle Size     | ~2.8MB | <2MB     | ⚠️     |
| Build Time      | 17s    | <10s     | ⚠️     |

## 🔄 CI/CD

El workflow `.github/workflows/ci.yml` ejecuta:

- ✅ Lint y formato de código
- ✅ Tests unitarios con reporte de cobertura
- ✅ Security scanning (npm audit + Snyk)
- ✅ Build de producción optimizado
- ✅ Tests E2E con Playwright
- ✅ Verificación de tamaño de bundle
- ✅ Lighthouse performance check (PRs)

## 🗺️ Próximos pasos

### Corto Plazo (1-2 semanas)

1. Aumentar cobertura de tests → Objetivo: 50%
2. Reemplazar tipos `any` en forms críticos
3. Configurar Sentry para error tracking

### Medio Plazo (2-4 semanas)

4. Implementar Codecov en CI
5. Optimizar imágenes (WebP/AVIF)
6. Agregar React Query para cache de datos

### Largo Plazo (1-2 meses)

7. Migrar a React 19 (estable)
8. Implementar SSR para SEO
9. PWA offline-first con IndexedDB
