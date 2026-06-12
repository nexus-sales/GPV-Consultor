import { useCallback, useEffect, useRef } from 'react'
import {
  normaliseDistributors,
  distributorIdentityKey,
  evaluateDistributorChecklist,
  computeDistributorCompletion
} from '../data/normalisers'
import { calculateDistributorPriority } from '../data/priority'
import { generateId, normaliseDate } from '../data/helpers'
import { supabase } from '../supabaseClient'
import { mapToSupabase } from '../mappers/supabaseMappers'
import { isSupabaseConfigured } from '../config'
import { createEntityStore } from '../data/createEntityStore'
import type {
  Distributor,
  NewDistributor,
  DistributorUpdates,
  EntityId,
  Sale,
  Visit
} from '../types'
import { createLogger } from '../logger'

const log = createLogger('Distributors')
const TABLE = 'distributorsGPV'

// ── Motor de datos compartido ─────────────────────────────────────────────────
// autoRefresh: false — el hook orquesta el primer fetch desde su propio
// useEffect para que onAfterRefresh (pushLocalOnly) corra en el mismo ciclo.
const useDistributorsStore = createEntityStore<Distributor>({
  table: TABLE,
  storageKey: 'distributors',
  syncTable: 'distributors',
  normalise: (rows) =>
    normaliseDistributors(rows as Parameters<typeof normaliseDistributors>[0]),
  identityKey: (distributor) =>
    distributorIdentityKey(distributor as unknown as Record<string, unknown>),
  toSupabase: (item) => {
    const row = mapToSupabase(item as unknown as Distributor, TABLE)
    // 3 campos jsonb — Supabase rechaza strings donde espera objetos
    if (row.category    && typeof row.category    !== 'object') delete row.category
    if (row.brandPolicy && typeof row.brandPolicy !== 'object') delete row.brandPolicy
    if (row.checklist   && typeof row.checklist   !== 'object') delete row.checklist
    // mapToSupabase puede no incluir notesHistory; lo garantizamos aquí
    const src = item as Record<string, unknown>
    if (src.notesHistory !== undefined) row.notesHistory = src.notesHistory
    return row
  },
  label: 'Distribuidor',
  autoRefresh: false,
  onAfterRefresh: async (localOnly) => {
    // Sube a Supabase los distribuidores creados offline (solo en local).
    // Corre en scope de módulo, usa navigator.onLine (equivalente a isOnline).
    // El refresh ya garantizó conexión, pero recomprobamos como guarda.
    if (!localOnly.length || !isSupabaseConfigured || !navigator.onLine) return

    for (const dist of localOnly as Distributor[]) {
      const payload = mapToSupabase(dist, TABLE) as Record<string, unknown>
      if (payload.category    && typeof payload.category    !== 'object') delete payload.category
      if (payload.brandPolicy && typeof payload.brandPolicy !== 'object') delete payload.brandPolicy
      if (payload.checklist   && typeof payload.checklist   !== 'object') delete payload.checklist

      const { error } = await supabase.from(TABLE).upsert(payload)
      if (error) log.error('Auto-sync upsert error:', error.message)
    }
  },
})

// ── Hook público ──────────────────────────────────────────────────────────────
export function useDistributors({
  sales,
  visits,
}: {
  sales: Sale[]
  visits: Visit[]
}) {
  const {
    items: distributors,
    setItems: setDistributors,
    refresh,
    addItem,
    updateItem,
    removeItem,
  } = useDistributorsStore()

  // refs para sales/visits: evitan stale closures en addDistributor y en el
  // efecto de recálculo de prioridad sin crear dependencias reactivas.
  const salesRef = useRef<Sale[]>(sales)
  useEffect(() => { salesRef.current = sales }, [sales])

  const visitsRef = useRef<Visit[]>(visits)
  useEffect(() => { visitsRef.current = visits }, [visits])

  // autoRefresh: false — orquestamos el primer fetch aquí con AbortController
  // para que onAfterRefresh (pushLocalOnly) corra en el mismo ciclo de fetch.
  useEffect(() => {
    const ac = new AbortController()
    void refresh(ac.signal)
    return () => ac.abort()
  }, [refresh])

  // Ref al estado actual — evita stale closure en updateDistributor
  // (necesita leer notesHistory del distribuidor sin añadirlo como dep reactiva).
  const distributorsRef = useRef(distributors)
  useEffect(() => { distributorsRef.current = distributors }, [distributors])

  // Recalcular prioridad, checklist y completion cuando cambian ventas o visitas.
  // No hay riesgo de bucle: sales/visits son props del padre; setDistributors
  // no puede retroalimentarlas. setDistributors es el setter de useState de la
  // factoría (referencialmente estable); lo incluimos en deps para satisfacer
  // ESLint — no cambia cuántas veces corre el efecto.
  useEffect(() => {
    setDistributors((prev) =>
      prev.map((dist) => {
        const checklist = evaluateDistributorChecklist(dist)
        const completion = computeDistributorCompletion(
          dist as unknown as Record<string, unknown>,
          checklist
        )
        const priority = calculateDistributorPriority(
          {
            ...dist,
            completion,
            checklist,
            checklistComplete: Object.values(checklist).every(Boolean),
          },
          { sales: salesRef.current, visits: visitsRef.current }
        )
        return {
          ...dist,
          checklist,
          checklistComplete: Object.values(checklist).every(Boolean),
          completion,
          priorityScore: priority.score,
          priorityLevel: priority.level,
          priorityDrivers: priority.drivers,
        }
      })
    )
  }, [sales, visits, setDistributors])

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const addDistributor = useCallback(
    async (payload: NewDistributor): Promise<Distributor> => {
      const duplicate = distributorsRef.current.find(
        (distributor) =>
          distributorIdentityKey(distributor as unknown as Record<string, unknown>) ===
          distributorIdentityKey(payload as unknown as Record<string, unknown>)
      )
      if (duplicate) return duplicate

      const code =
        payload.code?.trim()?.toUpperCase() || generateId('dist').toUpperCase()
      const category = payload.category || {
        id: '',
        label: '',
        description: '',
        badgeClass: '',
        tooltip: '',
        brandPolicy: { allowed: null, blocked: [], conditional: [], note: '' },
        pendingData: false,
      }
      const brands = Array.isArray(payload.brands) ? payload.brands : []
      const checklist = evaluateDistributorChecklist({
        ...payload,
        code,
        brands,
        category,
      })
      const completion = computeDistributorCompletion(payload, checklist)

      const baseDistributor: Distributor = {
        id: generateId('dist'),
        code,
        category,
        categoryId: category.id,
        pendingData: Boolean(payload.pendingData),
        brandPolicy: category.brandPolicy,
        name: payload.name?.trim() || 'Distribuidor sin nombre',
        contactPerson: payload.contactPerson?.trim() || '',
        contactPersonBackup: payload.contactPersonBackup?.trim() || '',
        channelType: payload.channelType || 'non_exclusive',
        brands,
        sectors: payload.sectors || ['telco'],
        status: payload.status || 'pending',
        province: payload.province || '',
        island: payload.island || '',
        city: payload.city || '',
        postalCode: payload.postalCode || '',
        phone: payload.phone || '',
        email: payload.email || '',
        address: payload.address || undefined,
        createdAt: normaliseDate(payload.createdAt),
        updatedAt: normaliseDate(payload.updatedAt || payload.createdAt),
        notes: payload.notes || '',
        notesHistory: payload.notesHistory || [],
        externalCode: payload.externalCode || '',
        taxId: payload.taxId || '',
        fiscalName: payload.fiscalName || '',
        fiscalAddress: payload.fiscalAddress || '',
        upgradeRequested: Boolean(payload.upgradeRequested),
        checklist,
        checklistComplete: Object.values(checklist).every(Boolean),
        completion,
        salesYtd: 0,
        priorityScore: 0,
        priorityLevel: 'medium',
        priorityDrivers: {
          traffic: 0,
          sales: 0,
          dataQuality: 0,
          salesLast90Days: 0,
          lastSaleDays: null,
          lastVisitDays: null,
          updatedAt: normaliseDate(new Date()),
        },
      }

      const priority = calculateDistributorPriority(baseDistributor, {
        sales: salesRef.current,
        visits: visitsRef.current,
      })

      const newDistributor: Distributor = {
        ...baseDistributor,
        priorityScore: priority.score,
        priorityLevel: priority.level,
        priorityDrivers: priority.drivers,
      }

      // addItem: optimistic update + Supabase insert + cola offline + notificación
      return addItem(newDistributor)
    },
    [addItem]
  )

  const updateDistributor = useCallback(
    async (id: EntityId, updates: DistributorUpdates): Promise<void> => {
      // Si se actualiza solo notes, recuperar notesHistory completo para no
      // perder entradas previas que ya están en Supabase.
      const enrichedUpdates: DistributorUpdates = { ...updates }
      if (!updates.notesHistory && updates.notes) {
        const current = distributorsRef.current.find((d) => d.id === id)
        if (current?.notesHistory) {
          enrichedUpdates.notesHistory = current.notesHistory
        }
      }

      // updateItem: optimistic update + Supabase update + cola offline + notificación.
      // La limpieza de jsonb y el paso de notesHistory van en toSupabase del store.
      await updateItem(id, enrichedUpdates)
    },
    [updateItem]
  )

  const deleteDistributor = useCallback(
    (id: EntityId): Promise<void> => removeItem(id),
    [removeItem]
  )

  const purgeDuplicateDistributors = useCallback(async (): Promise<{
    removed: number
    remaining: number
  }> => {
    if (navigator.onLine && isSupabaseConfigured) {
      const { data, error } = await supabase.from(TABLE).select('*').range(0, 9999)
      if (!error && Array.isArray(data)) {
        const keepByKey = new Map<string, Record<string, unknown>>()
        const duplicateIds: EntityId[] = []

        const getTimestamp = (distributor: Record<string, unknown>): number => {
          const timestamp = new Date(
            String(distributor.updated_at ?? distributor.updatedAt ?? distributor.created_at ?? distributor.createdAt ?? 0)
          ).getTime()
          return Number.isNaN(timestamp) ? 0 : timestamp
        }

        for (const distributor of data as Record<string, unknown>[]) {
          const key = distributorIdentityKey(distributor)
          const existing = keepByKey.get(key)
          if (!existing) {
            keepByKey.set(key, distributor)
            continue
          }

          const distributorId = distributor.id as EntityId | undefined
          const existingId = existing.id as EntityId | undefined
          if (getTimestamp(distributor) > getTimestamp(existing)) {
            if (existingId != null) duplicateIds.push(existingId)
            keepByKey.set(key, distributor)
          } else if (distributorId != null) {
            duplicateIds.push(distributorId)
          }
        }

        if (!duplicateIds.length) {
          return { removed: 0, remaining: data.length }
        }

        const { error: deleteError } = await supabase
          .from(TABLE)
          .delete()
          .in('id', duplicateIds)
        if (deleteError) {
          log.error('Remote duplicate purge error:', deleteError.message)
        } else {
          await refresh()
          return {
            removed: duplicateIds.length,
            remaining: data.length - duplicateIds.length
          }
        }
      } else if (error) {
        log.error('Remote duplicate fetch error:', error.message)
      }
    }

    const distributors = distributorsRef.current
    const keepByKey = new Map<string, Distributor>()
    const duplicates: Distributor[] = []

    const getTimestamp = (distributor: Distributor): number => {
      const timestamp = new Date(
        distributor.updatedAt || distributor.createdAt || 0
      ).getTime()
      return Number.isNaN(timestamp) ? 0 : timestamp
    }

    for (const distributor of distributors) {
      const key = distributorIdentityKey(
        distributor as unknown as Record<string, unknown>
      )
      const existing = keepByKey.get(key)
      if (!existing) {
        keepByKey.set(key, distributor)
        continue
      }

      if (getTimestamp(distributor) > getTimestamp(existing)) {
        duplicates.push(existing)
        keepByKey.set(key, distributor)
      } else {
        duplicates.push(distributor)
      }
    }

    if (!duplicates.length) {
      return { removed: 0, remaining: distributors.length }
    }

    await Promise.all(duplicates.map((dup) => removeItem(dup.id)))

    return {
      removed: duplicates.length,
      remaining: distributors.length - duplicates.length
    }
  }, [removeItem, refresh])

  return {
    distributors,
    addDistributor,
    updateDistributor,
    deleteDistributor,
    purgeDuplicateDistributors,
    refresh,
  }
}
