# Cimientos GPV Consultor — Fase 1

Este documento acompaña a los archivos generados. Explica qué se ha
construido, en qué orden aplicarlo, y cómo seguir módulo a módulo sin
romper nada en ningún punto.

La estrategia es **migración no destructiva por capas**: en ningún
momento intermedio la app queda rota, y en cualquier punto puedes parar.

---

## Lo que se ha creado

| Archivo                                        | Qué es                                                             | Riesgo                                     |
| ---------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `migrations_nuevas/01_fix_dates.sql`           | Añade `updated_at` real (timestamptz + trigger) a todas las tablas | Nulo — solo añade, no borra                |
| `migrations_nuevas/02_fix_rls.sql`             | Cierra la RLS abierta de ventas y contactos                        | Bajo — revisa la política de negocio antes |
| `src/lib/data/mergeEntities.ts`                | Motor de merge robusto con comparación de fechas segura            | Nulo — código nuevo, nadie lo usa aún      |
| `src/lib/data/__tests__/mergeEntities.test.ts` | 15 tests que protegen el motor                                     | Nulo — solo tests                          |

Nada de esto rompe la app actual. Los SQL solo añaden; el código nuevo
todavía no está conectado a ningún hook.

---

## Orden de aplicación (importante)

### Paso 1 — Backup

En Supabase: Database → Backups → crea un backup manual. **No te saltes esto.**

### Paso 2 — Migración de fechas

Pega `01_fix_dates.sql` completo en el SQL Editor de Supabase y ejecútalo.
Luego ejecuta el bloque de VERIFICACIÓN comentado al final del archivo.
Debe dar 0 filas con `updated_at` nulo. Esto no toca tus datos viejos:
las columnas `"createdAt"` y `"updatedAt"` text siguen ahí intactas.

### Paso 3 — Migración de RLS

**Antes de ejecutar `02_fix_rls.sql`**, decide tu política de negocio
(está explicada dentro del archivo: Opción A vs B). El script trae la
Opción A, que es la más segura de adoptar porque no rompe las vistas de
equipo actuales, solo cierra la escritura ajena. Verifica el nombre real
de la tabla de contactos de backoffice antes (el script te dice cómo).

### Paso 4 — Verificar en la app

Despliega o corre la app en local. Todo debe funcionar igual que antes,
porque el código aún usa las columnas viejas. Si algo falla aquí, las
migraciones SQL no son la causa (no cambiaron nada que la app lea).

---

## Fase 2 — Adoptar el motor de merge (módulo a módulo)

Aquí empieza el trabajo "módulo a módulo" que mencionaste. La idea es
migrar **un hook cada vez** al motor único, probarlo, y solo entonces
pasar al siguiente. Si uno da problemas, los demás siguen funcionando.

Orden recomendado (de menos a más arriesgado):

1. **useCandidates** — ya tiene merge propio, es el más fácil de sustituir
   y sirve de plantilla. Reemplazar su lógica manual por `mergeEntities`.
2. **useDistributors** — similar a candidates.
3. **useVisits** — actualmente NO compara conflictos. Aquí el motor aporta
   protección que hoy no existe.
4. **useSales** — igual que visitas.
5. **useLeads**, **useTasks**, **useBackofficeContacts** — los últimos.

Para cada hook, el patrón de cambio es:

```typescript
import { mergeEntities } from '../data/mergeEntities'

// Dentro de refresh(), donde hoy hay lógica manual de merge:
const { merged, conflicts } = mergeEntities(normalised, localSnapshot)

if (conflicts.length > 0) {
  // opcional: avisar al usuario de los conflictos resueltos
  log.info(`Sync: ${conflicts.length} conflictos resueltos por fecha`)
}

persistToStorage(merged)
return merged
```

Después de migrar cada hook, ejecuta `npx vitest run` y prueba esa
pantalla concreta en la app antes de pasar al siguiente.

---

## Fase 3 — Renombrar columnas a snake_case (la más grande)

Esto se hace **al final**, cuando el motor de datos ya esté unificado,
porque toca tanto BD como mappers y hooks a la vez. La estrategia segura
es de "columnas puente":

1. Añadir las columnas nuevas en snake_case **junto** a las viejas.
2. Copiar los datos de las viejas a las nuevas.
3. Migrar el código (mappers + hooks) para leer/escribir las nuevas.
4. Verificar que todo funciona durante unos días.
5. **Solo entonces** eliminar las columnas viejas.

No generamos este SQL todavía a propósito: tiene sentido escribirlo
cuando llegues aquí, porque dependerá de cómo haya quedado el código
tras la Fase 2. Generarlo ahora sería adivinar.

---

## Qué NO se ha tocado (y por qué)

- **Las columnas viejas `"createdAt"`/`"updatedAt"` text**: siguen ahí con
  tus datos. Eliminarlas ahora rompería la app. Se quitan en Fase 3.
- **Los nombres de tabla `*GPV`**: el renombrado va en Fase 3, junto al de
  columnas, para hacer un solo cambio coordinado y no dos sustos.
- **Los hooks**: el motor de merge existe pero aún no está conectado. Eso
  es Fase 2, paso a paso.

---

## Estado de los tests

Antes: 3 archivos de test / 32 tests.
Ahora: 4 archivos / 47 tests.

El nuevo cubre el motor de fiabilidad de datos, que era el punto más
crítico sin red de seguridad. A medida que migres cada hook en Fase 2,
conviene añadir un test de integración por entidad.
