// ============================================================
// createEntityStore — MOTOR DE DATOS COMÚN
// ============================================================
// Encapsula TODO lo que es idéntico entre los 8 hooks de entidad:
//   - estado local + persistencia en localStorage (segura)
//   - carga inicial desde Supabase con AbortController
//   - merge robusto local+remoto (vía mergeEntities, con detección
//     de conflictos a prueba de fechas sucias)
//
// Lo que NO hace (y a propósito): la lógica específica de cada
// entidad (kanban de candidatos, auditoría, limpieza de jsonb,
// notificaciones a medida). Eso se queda en cada hook, que usa
// esta factoría como base y añade lo suyo encima.
//
// Filosofía: la factoría hace lo COMÚN bien hecho una sola vez.
// Cada hook hace lo ESPECÍFICO. No metemos banderas por entidad
// dentro de la factoría: eso la convertiría en otro monolito.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { mergeEntities, type MergeableEntity } from './mergeEntities'
import { safeSetItem, safeGetItem } from './safeStorage'
import { supabase } from '../supabaseClient'
import { isSupabaseConfigured } from '../config'
import { createLogger } from '../logger'
import type { EntityId } from '../types'

export interface EntityStoreConfig<T extends MergeableEntity> {
  /** Nombre de la tabla en Supabase (ej. 'candidatesGPV') */
  table: string
  /** Clave de localStorage (ej. 'candidates') */
  storageKey: string
  /** Etiqueta para los logs (ej. 'Candidates') */
  logLabel: string
  /** Convierte filas crudas (de Supabase o storage) en entidades tipadas */
  normalise: (raw: unknown[]) => T[]
  /**
   * Hook opcional: se llama tras un fetch+merge exitoso, con la lista
   * de IDs que estaban solo en local (aún no subidos a Supabase) y la
   * lista de conflictos detectados. Cada hook lo usa para su lógica
   * propia (ej. subir los local-only, avisar de conflictos).
   */
  onAfterFetch?: (info: {
    localOnly: T[]
    conflicts: EntityId[]
    setEntities: React.Dispatch<React.SetStateAction<T[]>>
  }) => void | Promise<void>
}

export interface EntityStore<T extends MergeableEntity> {
  entities: T[]
  setEntities: React.Dispatch<React.SetStateAction<T[]>>
  /** Vuelve a cargar desde Supabase y fusiona con lo local */
  refresh: () => Promise<void>
  /** Ref siempre actualizada al valor de entities (para evitar stale closures) */
  entitiesRef: React.MutableRefObject<T[]>
}

/**
 * Crea un store de entidad con la lógica común de datos.
 * Devuelve un hook que cada entidad envuelve con su lógica propia.
 */
export function createEntityStore<T extends MergeableEntity>(
  config: EntityStoreConfig<T>
) {
  const log = createLogger(config.logLabel)

  function loadFromStorage(): T[] {
    const raw = safeGetItem(config.storageKey)
    if (!raw) return []
    try {
      return config.normalise(JSON.parse(raw))
    } catch {
      return []
    }
  }

  return function useEntityStore(): EntityStore<T> {
    const [entities, setEntities] = useState<T[]>(() => loadFromStorage())

    // Ref siempre al día (evita stale closures en callbacks async)
    const entitiesRef = useRef(entities)
    useEffect(() => {
      entitiesRef.current = entities
    }, [entities])

    // Persistir en localStorage de forma segura ante QuotaExceededError
    useEffect(() => {
      safeSetItem(config.storageKey, entities)
    }, [entities])

    const refresh = useCallback(async (signal?: AbortSignal) => {
      if (!navigator.onLine || !isSupabaseConfigured) return
      try {
        const { data, error } = await supabase.from(config.table).select('*')
        if (signal?.aborted) return
        if (error) {
          log.error('Error fetching from Supabase:', error.message)
          return
        }
        if (!data) return

        const remote = config.normalise(data)
        const local = entitiesRef.current
        const { merged, conflicts } = mergeEntities(remote, local)

        // IDs que están solo en local (creados offline, aún sin subir)
        const remoteIds = new Set(remote.map((e) => String(e.id)))
        const localOnly = local.filter((e) => !remoteIds.has(String(e.id)))

        setEntities(merged)

        if (config.onAfterFetch) {
          await config.onAfterFetch({ localOnly, conflicts, setEntities })
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          log.error('Network error fetching from Supabase:', err)
        }
      }
    }, [])
    // ↑ deps vacías a propósito y CORRECTAS: refresh no usa ninguna
    //   variable reactiva (lee de entitiesRef.current y de constantes
    //   de config). Por eso es estable sin necesidad de eslint-disable.
    //   Esta estabilidad es lo que evita los re-renders en cascada.

    // Carga inicial con AbortController (cancela si se desmonta)
    useEffect(() => {
      const ac = new AbortController()
      void refresh(ac.signal)
      return () => ac.abort()
    }, [refresh])

    // Exponemos refresh sin el signal para la API pública del hook
    const publicRefresh = useCallback(() => refresh(), [refresh])

    return { entities, setEntities, refresh: publicRefresh, entitiesRef }
  }
}
