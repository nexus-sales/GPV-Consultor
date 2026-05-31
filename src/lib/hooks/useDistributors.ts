import { useCallback, useEffect, useRef } from 'react'
import {
  normaliseDistributors,
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readEntityId(value: unknown): EntityId | null {
  if (!value || typeof value !== 'object' || !('id' in value)) return null
  const id = (value as { id: unknown }).id
  return typeof id === 'string' || typeof id === 'number' ? id : null
}

// ── Motor de datos compartido ─────────────────────────────────────────────────
// autoRefresh: false — el hook orquesta el primer fetch desde su propio
// useEffect para que onAfterRefresh (pushLocalOnly) corra en el mismo ciclo.
const useDistributorsStore = createEntityStore<Distributor>({
  table: TABLE,
  storageKey: 'distributors',
  syncTable: 'distributors',
  normalise: (rows) =>
    normaliseDistributors(rows as Parameters<typeof normaliseDistributors>[0]),
  toSupabase: (item) => {
    const row = mapToSupabase(item as unknown as Distributor, TABLE)
    // 3 campos jsonb — Supabase rechaza strings donde espera objetos
    if (row.category    && typeof row.category    !== 'object') delete row.category
    if (row.brandPolicy && typeof row.brandPolicy !== 'object') delete row.brandPolicy
    if (row.checklist   && typeof row.checklist   !== 'object') delete row.checklist
    // mapToSupabase puede no incluir notesHistory; lo garantizamos aquí
    const src = item as Record<string, unknown>
    if (src.notesHistory !== undefined) row.notesHistory = src.notesHistory
    // distributorsGPV usa snake_case para timestamps (updated_at, created_at).
    // mapToSupabase los copia como camelCase desde el modelo de la app, lo que
    // provoca PGRST204 ("column 'updatedAt' not found"). Los renombramos aquí.
    if (row.updatedAt !== undefined) { row.updated_at = row.updatedAt; delete row.updatedAt }
    if (row.createdAt !== undefined) { row.created_at = row.createdAt; delete row.createdAt }
    return row
  },
  label: 'Distribuidor',
  autoRefresh: false,
  onAfterRefresh: async (localOnly, setItems) => {
    // Sube a Supabase los distribuidores creados offline (solo en local).
    // Corre en scope de módulo, usa navigator.onLine (equivalente a isOnline).
    // El refresh ya garantizó conexión, pero recomprobamos como guarda.
    if (!localOnly.length || !isSupabaseConfigured || !navigator.onLine) return

    for (const dist of localOnly as Distributor[]) {
      const payload = mapToSupabase(dist, TABLE) as Record<string, unknown>
      if (payload.category    && typeof payload.category    !== 'object') delete payload.category
      if (payload.brandPolicy && typeof payload.brandPolicy !== 'object') delete payload.brandPolicy
      if (payload.checklist   && typeof payload.checklist   !== 'object') delete payload.checklist
      if (payload.updatedAt !== undefined) { payload.updated_at = payload.updatedAt; delete payload.updatedAt }
      if (payload.createdAt !== undefined) { payload.created_at = payload.createdAt; delete payload.createdAt }

      if (typeof dist.id === 'string' && !UUID_RE.test(dist.id)) {
        // ID no-UUID (generado offline): Supabase asigna un UUID real.
        payload.id = generateId()
        const { data: inserted, error } = await supabase
          .from(TABLE)
          .insert(payload)
          .select()
          .single()

        const insertedId = readEntityId(inserted)
        if (!error && insertedId !== null) {
          setItems((prev) =>
            prev.map((d) => (d.id === dist.id ? { ...d, id: insertedId } : d))
          )
        } else if (error) {
          log.error('Auto-sync insert error:', error.message)
        }
      } else {
        const { error } = await supabase.from(TABLE).upsert(payload)
        if (error) log.error('Auto-sync upsert error:', error.message)
      }
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

  return {
    distributors,
    addDistributor,
    updateDistributor,
    deleteDistributor,
    refresh,
  }
}
