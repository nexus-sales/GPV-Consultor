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

- `/dashboard`
- `/kanban`
- `/distributors` y `/distributors/:id`
- `/candidates` y `/candidates/:id`
- `/reports/weekly`

## 📚 Documentación

- [Especificación funcional v1](./docs/especificacion-v1.md): reglas de negocio, métricas, roadmap PWA y backlog sugerido.
- [Estilos CSS Inline](./docs/CSS_INLINE_STYLES.md): justificación técnica de los estilos inline en componentes de visualización de datos.

## 🛠️ Stack

- React 19 + Vite
- Tailwind CSS + utilidades personalizadas
- Context API con persistencia en `localStorage`
- TypeScript incremental (allowJs) y validación con Zod
- Heroicons y componentes UI propios

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
