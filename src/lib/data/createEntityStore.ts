import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { isSupabaseConfigured } from '../config'
import { saveLS } from '../../utils/storage'
import { useSyncQueue } from '../hooks/useSyncQueue'
import { createLogger } from '../logger'
import { generateId } from './helpers'
import type { EntityId, SyncOperation } from '../types'

type WithId = { id: EntityId; updatedAt?: string; updated_at?: string }

interface EntityStoreConfig<T extends WithId> {
  /** Supabase table name */
  table: string
  /** localStorage key */
  storageKey: string
  /** Key used in the sync queue — must match SyncOperation['table'] */
  syncTable: SyncOperation['table']
  /** Convert raw Supabase rows to app type. Cast inside as needed. */
  normalise: (rows: unknown[]) => T[]
  /** Optional mapper before writing to Supabase. Defaults to identity. */
  toSupabase?: (item: Record<string, unknown>) => Record<string, unknown>
  /** Display name for toast notifications, e.g. "Visita" */
  label?: string
  /**
   * Override the default `select('*')` query.
   * Receives the table builder; must call .select() and return the result.
   * Typed as `unknown` to avoid fighting Supabase's deep generics.
   */
  buildQuery?: (base: unknown) => unknown
}

function getTimestamp(item: WithId): number {
  const raw = item.updated_at ?? item.updatedAt
  if (!raw) return 0
  const ts = new Date(raw).getTime()
  return isNaN(ts) ? 0 : ts
}

/**
 * Factory that creates a self-contained React hook for a Supabase entity.
 *
 * Handles: localStorage persistence (with QuotaExceeded protection),
 * refresh with conflict detection (local wins if newer than remote),
 * AbortController cleanup on unmount, and generic CRUD with offline queue.
 *
 * Usage:
 *   const useVisitsStore = createEntityStore({ table: 'visitsGPV', ... })
 *   export function useVisits() {
 *     const { items, refresh, addItem, updateItem, removeItem } = useVisitsStore()
 *     // add entity-specific construction here
 *   }
 */
export function createEntityStore<T extends WithId>(config: EntityStoreConfig<T>) {
  const {
    table,
    storageKey,
    syncTable,
    normalise,
    toSupabase = (x) => x,
    label = 'Elemento',
    buildQuery,
  } = config

  const log = createLogger(table)

  function loadFromStorage(): T[] {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return []
      return normalise(JSON.parse(raw) as unknown[])
    } catch {
      return []
    }
  }

  return function useEntityStore() {
    const [items, setItems] = useState<T[]>(loadFromStorage)
    const { isOnline, addToSyncQueue, setNotifications } = useSyncQueue()

    // Persist on every change — safeSetItem handles QuotaExceededError
    useEffect(() => {
      saveLS(storageKey, items)
    }, [items])

    // ── Refresh with conflict detection ────────────────────────────────────
    const refresh = useCallback(async (signal?: AbortSignal) => {
      if (!navigator.onLine || !isSupabaseConfigured) return
      try {
        const base = supabase.from(table)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query = buildQuery ? buildQuery(base) : (base as any).select('*').range(0, 499)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error, count } = await (query as any)

        if (signal?.aborted) return
        if (error) {
          if ((error as { code?: string }).code === 'PGRST116') return // empty table
          log.error('fetch error:', (error as { message?: string }).message)
          return
        }
        if (!data) return
        if (count !== null && count !== undefined && count > 500) {
          log.warn(`Table ${table} has ${count} rows — showing latest 500 only`)
        }

        const remoteItems = normalise(data as unknown[])
        const remoteMap = new Map(remoteItems.map((r) => [String(r.id), r]))

        setItems((prev) => {
          const result: T[] = []

          // Remote items: keep remote, but prefer local if local is newer
          for (const remote of remoteItems) {
            const local = prev.find((l) => String(l.id) === String(remote.id))
            if (local && getTimestamp(local) > getTimestamp(remote)) {
              result.push(local)
            } else {
              result.push(remote)
            }
          }

          // Local-only items: keep (pending sync to Supabase)
          for (const local of prev) {
            if (!remoteMap.has(String(local.id))) {
              result.push(local)
            }
          }

          saveLS(storageKey, result)
          return result
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        log.error('network error:', err)
      }
    }, []) // stable — reads latest state via setState callback

    useEffect(() => {
      const ac = new AbortController()
      refresh(ac.signal)
      return () => ac.abort()
    }, [refresh])

    // ── Helpers ─────────────────────────────────────────────────────────────

    const notify = useCallback(
      (type: 'success' | 'warning' | 'error', title: string, description: string) => {
        setNotifications((prev) => [
          ...prev,
          {
            id: generateId('notif'),
            type,
            title,
            description,
            timestamp: new Date().toISOString(),
            read: false,
          },
        ])
      },
      [setNotifications]
    )

    // ── Generic CRUD ─────────────────────────────────────────────────────────

    /**
     * Add a fully constructed item to state + Supabase (or sync queue).
     * The caller builds the item with entity-specific defaults.
     */
    const addItem = useCallback(
      async (item: T): Promise<T> => {
        setItems((prev) => [item, ...prev])

        if (isOnline && isSupabaseConfigured) {
          const row = toSupabase(item as unknown as Record<string, unknown>)
          const { error } = await supabase.from(table).insert(row)
          if (!error) {
            notify('success', `${label} creado`, `${label} guardado correctamente.`)
          } else {
            log.error('insert error:', error.message)
            addToSyncQueue({ type: 'create', table: syncTable, data: item })
            notify('warning', 'Guardado offline', `${label} se sincronizará cuando haya conexión.`)
          }
        } else {
          addToSyncQueue({ type: 'create', table: syncTable, data: item })
          notify('warning', 'Guardado offline', `${label} se sincronizará cuando haya conexión.`)
        }

        return item
      },
      [isOnline, addToSyncQueue, notify]
    )

    /** Apply partial updates to an item in state + Supabase. */
    const updateItem = useCallback(
      async (id: EntityId, updates: Partial<T>): Promise<void> => {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
        )

        if (isOnline && isSupabaseConfigured) {
          const row = toSupabase({ ...(updates as Record<string, unknown>), id })
          const { error } = await supabase.from(table).update(row).eq('id', id)
          if (!error) {
            notify('success', `${label} actualizado`, `Los cambios se guardaron correctamente.`)
          } else {
            log.error('update error:', error.message)
            addToSyncQueue({ type: 'update', table: syncTable, data: { ...updates, id } })
            notify('warning', 'Actualización offline', `Los cambios se sincronizarán cuando haya conexión.`)
          }
        } else {
          addToSyncQueue({ type: 'update', table: syncTable, data: { ...updates, id } })
          notify('warning', 'Actualización offline', `Los cambios se sincronizarán cuando haya conexión.`)
        }
      },
      [isOnline, addToSyncQueue, notify]
    )

    /** Remove an item from state + Supabase. */
    const removeItem = useCallback(
      async (id: EntityId): Promise<void> => {
        setItems((prev) => prev.filter((i) => i.id !== id))

        if (isOnline && isSupabaseConfigured) {
          const { error } = await supabase.from(table).delete().eq('id', id)
          if (!error) {
            notify('success', `${label} eliminado`, `${label} eliminado correctamente.`)
          } else {
            log.error('delete error:', error.message)
            addToSyncQueue({ type: 'delete', table: syncTable, data: { id } })
          }
        } else {
          addToSyncQueue({ type: 'delete', table: syncTable, data: { id } })
        }
      },
      [isOnline, addToSyncQueue, notify]
    )

    return { items, setItems, refresh, addItem, updateItem, removeItem }
  }
}
