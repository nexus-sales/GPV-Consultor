// ============================================================
// MERGE ROBUSTO CON DETECCIÓN DE CONFLICTOS
// ============================================================
// Este módulo centraliza la lógica de fusionar datos locales
// (offline) con datos de Supabase (nube) SIN perder cambios.
//
// Problema que resuelve:
//   Hoy cada hook implementa su propio merge, y unos comparan
//   fechas y otros no. Además, la comparación actual usa
//   `new Date(texto)` que devuelve "Invalid Date" si el texto
//   está vacío o malformado, haciendo que la comparación falle
//   en silencio y se pierdan datos.
//
// Solución:
//   Una única función `mergeEntities` que TODOS los hooks usan,
//   con comparación de fechas a prueba de datos sucios.
// ============================================================

/** Entidad mínima que puede pasar por el merge */
export interface MergeableEntity {
  id: string | number
  updatedAt?: string | null
  notesHistory?: unknown[]
}

/**
 * Convierte un valor de fecha (que puede ser texto sucio, null,
 * o una fecha válida) en un timestamp numérico comparable.
 * Devuelve 0 si no se puede interpretar, NUNCA lanza ni devuelve NaN.
 *
 * Esta es la pieza clave: aquí se arregla el bug de
 * `new Date('') > new Date(...)` que rompía la comparación.
 */
export function safeTimestamp(value: unknown): number {
  if (!value) return 0
  if (typeof value !== 'string' && typeof value !== 'number') return 0
  const ts = new Date(value).getTime()
  // getTime() devuelve NaN para fechas inválidas: lo neutralizamos
  return Number.isFinite(ts) ? ts : 0
}

/**
 * Decide qué versión de una entidad conservar cuando existe
 * tanto en local como en remoto.
 *
 * Regla (Last-Write-Wins con protección de notas):
 *   - Si la versión local es MÁS RECIENTE que la remota,
 *     se conserva la local (el usuario hizo cambios sin subir).
 *   - Si la remota es más reciente o igual, gana la remota.
 *   - El historial de notas se preserva por el lado que tenga
 *     MÁS entradas, para no perder notas añadidas offline.
 *
 * Devuelve además un flag `conflict` para poder avisar al usuario.
 */
export function resolveEntity<T extends MergeableEntity>(
  local: T,
  remote: T
): { winner: T; conflict: boolean } {
  const localTs = safeTimestamp(local.updatedAt)
  const remoteTs = safeTimestamp(remote.updatedAt)

  const localNotes = Array.isArray(local.notesHistory) ? local.notesHistory.length : 0
  const remoteNotes = Array.isArray(remote.notesHistory) ? remote.notesHistory.length : 0

  // El historial de notas más largo se preserva siempre
  const notesHistory = localNotes > remoteNotes ? local.notesHistory : remote.notesHistory

  // ¿Hay conflicto real? Ambos lados modificados con fechas distintas
  const conflict = localTs > 0 && remoteTs > 0 && localTs !== remoteTs

  if (localTs > remoteTs) {
    // Local más reciente: conservar local pero con las notas más completas
    return { winner: { ...local, notesHistory } as T, conflict }
  }
  // Remoto gana (más reciente o igual), pero preservando notas locales si son más
  return { winner: { ...remote, notesHistory } as T, conflict }
}

/**
 * Fusiona la lista remota (Supabase) con la lista local (offline).
 * - Entidades que están solo en local se conservan (aún no subidas).
 * - Entidades en ambos se resuelven con resolveEntity.
 * - Entidades solo en remoto se toman tal cual.
 *
 * @returns la lista fusionada y la lista de IDs en conflicto
 *          (para que el hook pueda avisar al usuario si quiere).
 */
export function mergeEntities<T extends MergeableEntity>(
  remote: T[],
  local: T[]
): { merged: T[]; conflicts: Array<string | number> } {
  const remoteById = new Map(remote.map((e) => [String(e.id), e]))
  const localById = new Map(local.map((e) => [String(e.id), e]))
  const conflicts: Array<string | number> = []

  // 1. Resolver todas las entidades remotas (fusionando con local si existe)
  const merged: T[] = remote.map((remoteEntity) => {
    const localEntity = localById.get(String(remoteEntity.id))
    if (!localEntity) return remoteEntity
    const { winner, conflict } = resolveEntity(localEntity, remoteEntity)
    if (conflict) conflicts.push(remoteEntity.id)
    return winner
  })

  // 2. Añadir las que están SOLO en local (creadas offline, aún no subidas)
  for (const localEntity of local) {
    if (!remoteById.has(String(localEntity.id))) {
      merged.push(localEntity)
    }
  }

  return { merged, conflicts }
}
