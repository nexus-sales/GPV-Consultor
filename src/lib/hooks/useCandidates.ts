import { useCallback, useEffect, useRef } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { candidateIdentityKey, normaliseCandidates } from '../data/normalisers'
import { generateId, normaliseDate } from '../data/helpers'
import { supabase } from '../supabaseClient'
import { mapToSupabase } from '../mappers/supabaseMappers'
import { isSupabaseConfigured } from '../config'
import { createEntityStore } from '../data/createEntityStore'
import type {
  Candidate,
  NewCandidate,
  CandidateUpdates,
  EntityId
} from '../types'
import { createLogger } from '../logger'

const log = createLogger('Candidates')
const TABLE = 'candidatesGPV'

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
const useCandidatesStore = createEntityStore<Candidate>({
  table: TABLE,
  storageKey: 'candidates',
  syncTable: 'candidates',
  normalise: (rows) => normaliseCandidates(rows as Parameters<typeof normaliseCandidates>[0]),
  toSupabase: (item) => {
    const row = mapToSupabase(item as unknown as Candidate, TABLE)
    // category y brandPolicy son jsonb en Supabase. Si llegan como string
    // (legacy o error de serialización), la columna rechaza el insert.
    if (row.category && typeof row.category !== 'object') delete row.category
    if (row.brandPolicy && typeof row.brandPolicy !== 'object') delete row.brandPolicy
    // mapToSupabase puede no incluir notesHistory; lo garantizamos aquí para
    // que updateItem lo pase correctamente al actualizar notas.
    const src = item as Record<string, unknown>
    if (src.notesHistory !== undefined) row.notesHistory = src.notesHistory
    return row
  },
  label: 'Candidato',
  autoRefresh: false,
  onAfterRefresh: async (localOnly, setItems) => {
    // Sube a Supabase los candidatos creados offline (solo en local).
    // Corre fuera del ciclo de hooks (scope de módulo), por eso usa
    // navigator.onLine en vez de isOnline. El refresh ya garantizó que
    // estábamos online, pero lo recomprobamos como guarda defensiva.
    if (!localOnly.length || !isSupabaseConfigured || !navigator.onLine) return

    for (const candidate of localOnly as Candidate[]) {
      const payload = mapToSupabase(candidate, TABLE) as Record<string, unknown>
      if (payload.category && typeof payload.category !== 'object') delete payload.category
      if (payload.brandPolicy && typeof payload.brandPolicy !== 'object') delete payload.brandPolicy

      if (typeof candidate.id === 'string' && !UUID_RE.test(candidate.id)) {
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
            prev.map((c) => (c.id === candidate.id ? { ...c, id: insertedId } : c))
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
export function useCandidates() {
  const {
    items: candidates,
    setItems: setCandidates,
    refresh,
    addItem,
    updateItem,
    removeItem,
  } = useCandidatesStore()
  const { isOnline, addToSyncQueue } = useSyncQueue()

  // autoRefresh: false — orquestamos el primer fetch aquí para que
  // onAfterRefresh (pushLocalOnly) se ejecute en el mismo ciclo de fetch.
  useEffect(() => {
    const ac = new AbortController()
    void refresh(ac.signal)
    return () => ac.abort()
  }, [refresh])

  // Ref al estado actual para evitar stale closures en updateCandidate:
  // necesita leer notesHistory del candidato sin añadirlo como dep reactiva.
  const candidatesRef = useRef(candidates)
  useEffect(() => { candidatesRef.current = candidates }, [candidates])

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const addCandidate = useCallback(
    async (payload: NewCandidate): Promise<Candidate> => {
      const duplicate = candidatesRef.current.find(
        (candidate) =>
          candidateIdentityKey(candidate as unknown as Record<string, unknown>) ===
          candidateIdentityKey(payload as unknown as Record<string, unknown>)
      )
      if (duplicate) return duplicate

      const newCandidate: Candidate = {
        id: generateId('cand'),
        name: payload.name?.trim() || 'Candidato sin nombre',
        taxId: payload.taxId?.trim() || '',
        stage: payload.stage || 'new',
        channelCode: payload.channelCode || '',
        contact: payload.contact || undefined,
        city: payload.city || '',
        island: payload.island || '',
        province: payload.province || '',
        category: payload.category,
        categoryId: payload.categoryId,
        pendingData: Boolean(payload.pendingData),
        brandPolicy: payload.brandPolicy,
        priority: payload.priority || 'medium',
        score: payload.score,
        notes: payload.notes || '',
        notesHistory: payload.notesHistory,
        operator: payload.operator || '',
        gpvProposal: Boolean(payload.gpvProposal),
        createdAt: normaliseDate(payload.createdAt),
        updatedAt: normaliseDate(payload.updatedAt),
        lastContactAt: payload.lastContactAt,
        position: payload.position,
        source: payload.source,
      }
      // addItem: optimistic update + Supabase insert + cola offline + notificación
      return addItem(newCandidate)
    },
    [addItem]
  )

  const updateCandidate = useCallback(
    async (id: EntityId, updates: CandidateUpdates): Promise<void> => {
      // Auditoría para cambios sensibles — se dispara antes de la persistencia.
      if (isOnline && isSupabaseConfigured && (updates.name || updates.taxId || updates.contact)) {
        void supabase.rpc('log_audit_event', {
          event_action: 'UPDATE',
          event_entity_type: 'candidate',
          event_entity_id: id.toString(),
          event_details: { fields: Object.keys(updates) },
        })
      }

      // Si se actualiza solo notes (texto), recuperar el historial completo del
      // candidato actual para no perder entradas que ya estaban en Supabase.
      const enrichedUpdates: CandidateUpdates = { ...updates }
      if (!updates.notesHistory && updates.notes) {
        const current = candidatesRef.current.find((c) => c.id === id)
        if (current?.notesHistory) {
          enrichedUpdates.notesHistory = current.notesHistory
        }
      }

      // updateItem: optimistic update + Supabase update + cola offline + notificación.
      // La limpieza de jsonb y el paso de notesHistory van en toSupabase del store.
      await updateItem(id, enrichedUpdates)
    },
    [isOnline, updateItem]
  )

  const deleteCandidate = useCallback(
    (id: EntityId): Promise<void> => removeItem(id),
    [removeItem]
  )

  const purgeDuplicateCandidates = useCallback(async (): Promise<{
    removed: number
    remaining: number
  }> => {
    const candidates = candidatesRef.current
    const keepByKey = new Map<string, Candidate>()
    const duplicates: Candidate[] = []

    const getTimestamp = (candidate: Candidate): number => {
      const timestamp = new Date(candidate.updatedAt || candidate.createdAt || 0).getTime()
      return Number.isNaN(timestamp) ? 0 : timestamp
    }

    for (const candidate of candidates) {
      const key = candidateIdentityKey(candidate as unknown as Record<string, unknown>)
      const existing = keepByKey.get(key)
      if (!existing) {
        keepByKey.set(key, candidate)
        continue
      }

      if (getTimestamp(candidate) > getTimestamp(existing)) {
        duplicates.push(existing)
        keepByKey.set(key, candidate)
      } else {
        duplicates.push(candidate)
      }
    }

    if (!duplicates.length) {
      return { removed: 0, remaining: candidates.length }
    }

    const duplicateIds = new Set(duplicates.map((candidate) => candidate.id))
    const remainingCandidates = candidates.filter(
      (candidate) => !duplicateIds.has(candidate.id)
    )
    setCandidates(remainingCandidates)

    if (isOnline && isSupabaseConfigured) {
      for (const duplicate of duplicates) {
        const { error } = await supabase.from(TABLE).delete().eq('id', duplicate.id)
        if (error) {
          log.error('Error deleting duplicate candidate:', error.message)
          addToSyncQueue({
            type: 'delete',
            table: 'candidates',
            data: { id: duplicate.id }
          })
        }
      }
    } else {
      for (const duplicate of duplicates) {
        addToSyncQueue({
          type: 'delete',
          table: 'candidates',
          data: { id: duplicate.id }
        })
      }
    }

    return { removed: duplicates.length, remaining: remainingCandidates.length }
  }, [addToSyncQueue, isOnline, setCandidates])

  // ── Kanban ────────────────────────────────────────────────────────────────

  const moveCandidate = useCallback(
    async (id: EntityId, stage: string): Promise<void> => {
      setCandidates((prev) => {
        const stageItems = prev.filter((c) => c.stage === stage)
        const maxPos = stageItems.reduce(
          (max, c) => Math.max(max, c.position || 0),
          -1
        )
        const newPos = maxPos + 1

        updateCandidate(id, {
          stage,
          position: newPos,
          updatedAt: new Date().toISOString(),
        }).catch((err) => log.error('Error moving candidate', err))

        return prev.map((c) =>
          c.id === id
            ? { ...c, stage, position: newPos, updatedAt: new Date().toISOString() }
            : c
        )
      })
    },
    [updateCandidate, setCandidates]
  )

  const reorderCandidate = useCallback(
    async (id: EntityId, stage: string, position: number): Promise<void> => {
      setCandidates((prev) => {
        const otherItems = prev.filter((c) => c.id !== id)
        const movingItem = prev.find((c) => c.id === id)
        if (!movingItem) return prev

        const stageItems = otherItems
          .filter((c) => c.stage === stage)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

        stageItems.splice(position, 0, {
          ...movingItem,
          stage,
          position,
          updatedAt: new Date().toISOString(),
        })

        const updatedStageItems = stageItems.map((c, idx) => ({ ...c, position: idx }))
        const otherStagesItems = otherItems.filter((c) => c.stage !== stage)
        return [...otherStagesItems, ...updatedStageItems]
      })

      try {
        if (isOnline && isSupabaseConfigured) {
          const mappedData = mapToSupabase(
            { id, stage, position, updatedAt: new Date().toISOString() },
            TABLE
          )
          const { error } = await supabase.from(TABLE).update(mappedData).eq('id', id)
          if (error) {
            log.error('Reorder error:', error)
            addToSyncQueue({
              type: 'update',
              table: 'candidates',
              data: { id, stage, position, updatedAt: new Date().toISOString() },
            })
          }
        } else {
          addToSyncQueue({
            type: 'update',
            table: 'candidates',
            data: { id, stage, position, updatedAt: new Date().toISOString() },
          })
        }
      } catch (err) {
        log.error('Error in reorderCandidate:', err)
        addToSyncQueue({
          type: 'update',
          table: 'candidates',
          data: { id, stage, position, updatedAt: new Date().toISOString() },
        })
      }
    },
    [isOnline, addToSyncQueue, setCandidates]
  )

  return {
    candidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    purgeDuplicateCandidates,
    moveCandidate,
    reorderCandidate,
    refresh,
  }
}
