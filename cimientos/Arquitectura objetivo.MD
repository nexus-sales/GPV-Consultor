# Arquitectura objetivo — GPV Consultor

> Documento maestro. Describe **cómo queda la app cuando esté robusta**
> (el destino) y el **plan por capas** para llegar sin romper nada.
> Este archivo es la referencia permanente para el trabajo de refactor.

---

## Cómo usar este documento (LEER PRIMERO)

Este plan se ejecuta **por capas, en orden, verificando cada una antes de
pasar a la siguiente**. NO se hace todo de una vez. Esa es una decisión
deliberada: la app es frágil precisamente por cambios grandes hechos de
golpe sin verificar. Vamos a lo seguro.

**Reparto de responsabilidades:**
- **El humano** ejecuta todos los SQL en el panel de Supabase. Los datos
  son reales (clientes de Naturgy) y un error en BD es irreversible.
- **Claude Code** toca SOLO código del repositorio (hooks, mappers, tests,
  componentes, limpieza). Nunca ejecuta SQL contra la base de datos ni
  modifica datos de producción. El código siempre es reversible con git.

**Regla de avance:** no se empieza una capa hasta que la anterior está
verificada y la app funciona. Si una capa da problemas, las demás siguen
intactas.

---

## El destino: cómo es la app cuando está robusta

### 1. Una base de datos uniforme
Hoy cada tabla tiene una estructura de fechas distinta (unas con columnas
text, otras timestamptz, unas con `updated_at` y otras sin ella). El
destino es que TODAS las tablas sigan la misma convención:

- Nombres en `snake_case` sin comillas (estándar PostgreSQL).
- `created_at timestamptz` y `updated_at timestamptz` en todas, con trigger
  automático que mantiene `updated_at` al día.
- Sin columnas duplicadas de fecha (nada de `"createdAt"` text + `created_at`
  timestamptz conviviendo).

### 2. Un motor de datos único
Hoy hay 8 hooks de entidad (`useDistributors`, `useCandidates`, `useVisits`,
`useSales`, `useLeads`, `useTasks`, `useBackofficeContacts`,
`useCommissionAgreements`) que copian el mismo patrón pero divergen: unos
detectan conflictos de sincronización y otros no. El destino es UNA factoría
genérica que todos usan, de modo que la lógica de fetch, merge, sync y caché
viva en un solo sitio y sea idéntica para todas las entidades.

La API pública de cada hook se mantiene igual para no romper los componentes:
```
{ <entidades>, add<X>, update<X>, delete<X>, refresh }
```

### 3. Sincronización fiable
- Detección de conflictos por `updated_at` en todas las entidades (no solo
  en candidatos como ahora), usando comparación de fechas a prueba de datos
  sucios (módulo `mergeEntities.ts`, ya creado).
- `localStorage` envuelto para capturar `QuotaExceededError` sin perder
  datos en silencio.
- Cola de sync que no descarta operaciones fallidas sin avisar (dead letter
  queue).

### 4. Seguridad por rol real
- RLS de Supabase que refleja los roles (un comercial solo ve y edita lo
  suyo; admin/manager ven todo). El control de roles del frontend deja de
  ser la única barrera.
- `created_by` en las tablas de negocio para saber de quién es cada registro.

### 5. Código limpio
- Sin archivos muertos ni dependencias sin usar.
- Un solo logger, un solo módulo de storage, un solo sistema de KPI.
- Una sola librería de PDF, cargada bajo demanda.

---

## Las tres capas

### CAPA 1 — Base de datos (cimientos)

**Objetivo:** que la BD tenga fechas uniformes y RLS por rol, sin perder
datos y sin romper la app actual.

**SQL (los ejecuta el humano en Supabase, en orden):**
1. `migrations_nuevas/01_fix_dates.sql` — añade `updated_at` real a todas
   las tablas, con triggers. NO destructivo. (Ya adaptado a los tipos reales
   de cada tabla.)
2. `migrations_nuevas/02_fix_rls.sql` — RLS por dueño en `salesGPV` y
   `backofficeContactsGPV` (Opción B: comercial solo ve lo suyo). Añade
   `created_by`.

**Código (Claude Code):**
- En esta capa, el código casi no cambia. Las columnas viejas siguen ahí y
  la app las sigue usando. El único trabajo de código aquí es preparar el
  terreno: confirmar que `mergeEntities.ts` y sus tests están en el repo y
  pasan.

**Verificación antes de avanzar:**
- La consulta de verificación de `01` da 0 filas sin `updated_at`.
- La app arranca y funciona igual que antes.
- `npx tsc --noEmit` y `npx vitest run` en verde.

---

### CAPA 2 — Motor de datos único

**Objetivo:** sustituir los 8 hooks divergentes por una factoría única,
empezando el `created_by` y la detección de conflictos consistente.

**Código (Claude Code), un hook cada vez:**
1. Crear `src/lib/data/createEntityStore.ts` — la factoría genérica que
   encapsula fetch + merge (usando `mergeEntities`) + sync + caché +
   `AbortController` + `safeSetItem`.
2. Migrar `useCandidates` a la factoría (es el que ya tiene merge, sirve de
   plantilla). Verificar pantalla de candidatos.
3. Migrar `useDistributors`. Verificar.
4. Migrar `useVisits` (aquí el motor APORTA detección de conflictos que hoy
   no existe). Verificar.
5. Migrar `useSales` — y aquí conectar el guardado de `created_by` al crear,
   para que los registros nuevos tengan dueño automáticamente. Verificar.
6. Migrar `useLeads`, `useTasks`, `useBackofficeContacts`,
   `useCommissionAgreements`. Verificar cada uno.

**Reglas de esta capa:**
- Un hook por vez. Tras cada uno: `tsc`, `vitest`, `lint`, y prueba manual
  de esa pantalla.
- La API pública de cada hook NO cambia (mismos nombres de retorno).
- Las funciones `refresh` deben ser estables (`useCallback` con deps
  vacías o estables). PROHIBIDO usar `eslint-disable` para silenciar
  `react-hooks/exhaustive-deps`: si ESLint avisa, es un bug futuro; se
  arregla la dependencia.
- Añadir un test por entidad migrada.

**Verificación antes de avanzar:**
- Los 8 hooks usan la factoría.
- Cero `eslint-disable` de exhaustive-deps en el repo.
- Todas las pantallas funcionan. Tests en verde.

---

### CAPA 3 — Uniformidad y limpieza

**Objetivo:** snake_case en toda la BD, y eliminar todo lo muerto y
duplicado. Es la capa más grande y va al final, cuando el motor de datos
ya está unificado.

**Estrategia de columnas-puente (para no romper nada):**
1. SQL (humano): añadir columnas snake_case JUNTO a las viejas, copiar datos.
2. Código (Claude Code): migrar mappers y hooks para leer/escribir las nuevas.
3. Verificar en uso real unos días.
4. SQL (humano): solo entonces, eliminar las columnas viejas.

**Limpieza de código (Claude Code) — verificado por análisis de imports:**
- Borrar dependencias muertas: `chart.js`, `react-chartjs-2`,
  `google-map-react` (0 imports).
- Borrar archivos huérfanos: `src/lib/syncQueue.ts`,
  `src/lib/data/{stats,callCenter}.ts`, `src/lib/validation/brandValidation.ts`,
  `src/lib/utils/supabaseStatus.ts`, y los componentes UI sin uso
  (`Skeleton`, `SyncStatus`, `EmptyState`, `Breadcrumbs`) — confirmar 0 uso
  antes de borrar cada uno.
- Unificar duplicados: un solo `logger` (quedarse con `src/lib/logger.ts`),
  un solo `storage`, un solo sistema de KPI, un solo `helpers`.
- Una sola librería PDF (jsPDF), cargada con `import()` dinámico bajo demanda.
- Arreglar el bug del KPI de conversión (vincular candidato→distribuidor con
  un campo `convertedFromCandidateId`, en vez de comparar IDs que nunca
  coinciden).

**Verificación final:**
- `npx tsc --noEmit`, `npx vitest run`, `npm run lint`, `npm run build`
  todos en verde.
- Bundle más pequeño (objetivo: bajar el precache de 5.5MB).
- La app funciona entera.

---

## Lo que NO se hace (límites para Claude Code)

- NO ejecutar SQL contra Supabase. Los `.sql` se entregan al humano.
- NO eliminar columnas de BD ni datos. El renombrado/borrado de columnas es
  Capa 3 con estrategia puente, y el DROP final lo hace el humano.
- NO migrar más de un hook por vez en la Capa 2.
- NO usar `eslint-disable` para tapar warnings de hooks.
- NO añadir dependencias nuevas sin justificarlo.
- NO tocar la lógica de OAuth/MFA (está bien hecha; ver auditoría).

---

## Estado actual (punto de partida)

- `migrations_nuevas/01_fix_dates.sql` — listo, adaptado por tabla.
- `migrations_nuevas/02_fix_rls.sql` — listo, Opción B.
- `src/lib/data/mergeEntities.ts` — creado, con 15 tests en verde.
- Tests del proyecto: 4 archivos / 47 tests, todos pasando.
- TypeScript: 0 errores. Build: compila.

El primer paso real es que el humano ejecute la Capa 1 (los dos SQL) y
verifique. A partir de ahí, Claude Code arranca la Capa 2.