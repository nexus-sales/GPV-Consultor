import { useCallback, useEffect, useState, useRef } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { normaliseCandidates } from '../data/normalisers'
import { generateId, normaliseDate } from '../data/helpers'
import { supabase } from '../supabaseClient'
import { mapToSupabase } from '../mappers/supabaseMappers'
import { isSupabaseConfigured } from '../config'
import type {
  Candidate,
  NewCandidate,
  CandidateUpdates,
  EntityId
} from '../types'
import { createLogger } from '../logger'

const log = createLogger('Candidates')
const STORAGE_KEY = 'candidates'
const TABLE = 'candidatesGPV'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readEntityId(value: unknown): EntityId | null {
  if (!value || typeof value !== 'object' || !('id' in value)) return null
  const id = (value as { id: unknown }).id
  return typeof id === 'string' || typeof id === 'number' ? id : null
}

function loadCandidatesFromStorage(): Candidate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return normaliseCandidates(arr)
  } catch {
    return []
  }
}

function persistCandidatesToStorage(candidates: Candidate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates))
}

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    loadCandidatesFromStorage()
  )
  const { isOnline, addToSyncQueue, setNotifications } = useSyncQueue()

  useEffect(() => {
    persistCandidatesToStorage(candidates)
  }, [candidates])

  const pushLocalOnly = useCallback(
    async (
      localOnly: Candidate[],
      onIdRemap: (oldId: EntityId, newId: EntityId) => void
    ) => {
      if (!localOnly.length || !isSupabaseConfigured || !isOnline) return
      for (const candidate of localOnly) {
        const payload = mapToSupabase(candidate, TABLE) as Record<string, unknown>
        
        // Limpieza extra para candidatos
        if (payload.category && typeof payload.category !== 'object') delete payload.category
        if (payload.brandPolicy && typeof payload.brandPolicy !== 'object') delete payload.brandPolicy

        if (typeof candidate.id === 'string' && !UUID_RE.test(candidate.id)) {
          // Si el ID no es un UUID, dejamos que Supabase genere uno
          payload.id = generateId()
          const { data: inserted, error } = await supabase
            .from(TABLE)
            .insert(payload)
            .select()
            .single()
          
          const insertedId = readEntityId(inserted)
          if (!error && insertedId !== null) {
            onIdRemap(candidate.id, insertedId)
          } else if (error) {
            log.error('Auto-sync insert error:', error.message)
          }
        } else {
          // Si es un UUID (o número), intentamos un upsert
          const { error } = await supabase.from(TABLE).upsert(payload)
          if (error) log.error('Auto-sync upsert error:', error.message)
        }
      }
    },
    [isOnline]
  )

  const pushLocalOnlyRef = useRef(pushLocalOnly)
  useEffect(() => { pushLocalOnlyRef.current = pushLocalOnly }, [pushLocalOnly])

  const refresh = useCallback(async () => {
    if (!navigator.onLine || !isSupabaseConfigured) return
    try {
      const { data, error } = await supabase.from(TABLE).select('*')
      if (error) {
        log.error('Error fetching from Supabase:', error.message)
        return
      }
      if (data) {
        const normalised = normaliseCandidates(data)
        const supabaseIds = new Set(normalised.map((c) => String(c.id)))
        // Snapshot from ref before setState — avoids race where setState callback
        // runs after pushLocalOnly is called and localOnlySnapshot is still []
        const localOnly = candidatesRef.current.filter((c) => !supabaseIds.has(String(c.id)))

        setCandidates((prevLocal) => {
          const localMap = new Map(prevLocal.map(c => [String(c.id), c]))
          const localOnlyNow = prevLocal.filter((c) => !supabaseIds.has(String(c.id)))

          const merged = normalised.map((remote) => {
            const local = localMap.get(String(remote.id))
            if (!local) return remote

            // Mergear historial de notas para no perder cambios locales que aún no se han subido
            const remoteNotesCount = remote.notesHistory?.length || 0
            const localNotesCount = local.notesHistory?.length || 0

            return {
              ...remote,
              // Si tenemos más notas locales, las preservamos (asumiendo que son más recientes)
              notesHistory: localNotesCount > remoteNotesCount ? local.notesHistory : remote.notesHistory,
              updatedAt: local.updatedAt && new Date(local.updatedAt) > new Date(remote.updatedAt || 0)
                ? local.updatedAt
                : remote.updatedAt
            }
          })

          const all = [...merged, ...localOnlyNow]
          persistCandidatesToStorage(all)
          return all
        })

        // await prevents concurrent pushes if refresh() is called again before this completes
        await pushLocalOnlyRef.current(localOnly, (oldId, newId) => {
          setCandidates((prev) =>
            prev.map((c) => (c.id === oldId ? { ...c, id: newId } : c))
          )
        })
      }
    } catch (err) {
      log.error('Network error fetching from Supabase:', err)
    }
  }, [])

  // Cargar datos iniciales desde Supabase
  useEffect(() => {
    refresh()
  }, [refresh])

  const candidatesRef = useRef(candidates)
  useEffect(() => { candidatesRef.current = candidates }, [candidates])

  const addCandidate = useCallback(
    async (payload: NewCandidate): Promise<Candidate> => {
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
        source: payload.source
      }

      // Actualización optimista
      setCandidates((prev) => [newCandidate, ...prev])

      try {
        if (isOnline && isSupabaseConfigured) {
          const mappedData = mapToSupabase(newCandidate, 'candidatesGPV')

          // Limpieza de campos internos
          if (mappedData.category && typeof mappedData.category !== 'object')
            delete mappedData.category
          if (
            mappedData.brandPolicy &&
            typeof mappedData.brandPolicy !== 'object'
          )
            delete mappedData.brandPolicy

          const { error } = await supabase
            .from('candidatesGPV')
            .insert(mappedData)
          if (!error) {

            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'success',
                title: 'Candidato creado',
                description: `El candidato "${newCandidate.name}" se ha creado correctamente.`,
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          } else {
            log.error('Insert error:', error.message)
            addToSyncQueue({
              type: 'create',
              table: 'candidates',
              data: newCandidate
            })
            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'error',
                title: 'Error al guardar en BD',
                description: `[candidatesGPV] ${error.message}`,
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          }
        } else {
          addToSyncQueue({
            type: 'create',
            table: 'candidates',
            data: newCandidate
          })
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'warning',
              title: 'Guardado offline',
              description: `El candidato "${newCandidate.name}" se guardó offline.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        }
      } catch (err) {
        log.error('Error in addCandidate:', err)
        addToSyncQueue({
          type: 'create',
          table: 'candidates',
          data: newCandidate
        })
      }
      return newCandidate
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const updateCandidate = useCallback(
    async (id: EntityId, updates: CandidateUpdates): Promise<void> => {
      setCandidates((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )

      try {
        if (isOnline && isSupabaseConfigured) {
          const mappedUpdates = mapToSupabase(
            { ...updates, id },
            'candidatesGPV'
          )

          if (
            mappedUpdates.category &&
            typeof mappedUpdates.category !== 'object'
          )
            delete mappedUpdates.category
          if (
            mappedUpdates.brandPolicy &&
            typeof mappedUpdates.brandPolicy !== 'object'
          )
            delete mappedUpdates.brandPolicy

          // Registro de auditoría si hay cambios sensibles
          if (updates.name || updates.taxId || updates.contact) {
            void supabase.rpc('log_audit_event', {
              event_action: 'UPDATE',
              event_entity_type: 'candidate',
              event_entity_id: id.toString(),
              event_details: { fields: Object.keys(updates) }
            })
          }

          // Asegurar que notesHistory se incluya en la actualización si está presente en updates
          if (updates.notesHistory) {
            mappedUpdates.notesHistory = updates.notesHistory
          } else if (updates.notes) {
            // Buscamos el candidato actual para no perder el historial
            const current = candidatesRef.current.find(c => c.id === id)
            if (current?.notesHistory) {
              mappedUpdates.notesHistory = current.notesHistory
            }
          }

          const { error } = await supabase
            .from('candidatesGPV')
            .update(mappedUpdates)
            .eq('id', id)
          if (!error) {

            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'success',
                title: 'Candidato actualizado',
                description: `El candidato se ha actualizado correctamente.`,
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          } else {
            log.error('Update error:', error.message)
            addToSyncQueue({
              type: 'update',
              table: 'candidates',
              data: { ...updates, id }
            })
            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'error',
                title: 'Error al actualizar en BD',
                description: `[candidatesGPV] ${error.message}`,
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          }
        } else {
          addToSyncQueue({
            type: 'update',
            table: 'candidates',
            data: { ...updates, id }
          })
        }
      } catch (err) {
        log.error('Error in updateCandidate:', err)
        addToSyncQueue({
          type: 'update',
          table: 'candidates',
          data: { ...updates, id }
        })
      }
    },
    [addToSyncQueue, isOnline, setNotifications]
  )

  const deleteCandidate = useCallback(
    async (id: EntityId): Promise<void> => {
      setCandidates((prev) => prev.filter((item) => item.id !== id))
      try {
        if (isOnline && isSupabaseConfigured) {
          const { error } = await supabase
            .from('candidatesGPV')
            .delete()
            .eq('id', id)
          if (!error) {

            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'success',
                title: 'Candidato eliminado',
                description: `El candidato se ha eliminado correctamente.`,
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          } else {
            log.error('Delete error:', error.message)
            addToSyncQueue({
              type: 'delete',
              table: 'candidates',
              data: { id }
            })
            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'warning',
                title: 'Eliminación offline',
                description: `La eliminación se guardó offline.`,
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          }
        } else {
          addToSyncQueue({ type: 'delete', table: 'candidates', data: { id } })
        }
      } catch (err) {
        log.error('Error in deleteCandidate:', err)
        addToSyncQueue({ type: 'delete', table: 'candidates', data: { id } })
      }
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

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
          updatedAt: new Date().toISOString()
        }).catch((err) => log.error('Error moving candidate', err))

        return prev.map((c) =>
          c.id === id
            ? {
                ...c,
                stage,
                position: newPos,
                updatedAt: new Date().toISOString()
              }
            : c
        )
      })
    },
    [updateCandidate]
  )

  const reorderCandidate = useCallback(
    async (id: EntityId, stage: string, position: number): Promise<void> => {
      setCandidates((prev) => {
        const otherItems = prev.filter((c) => c.id !== id)
        const movingItem = prev.find((c) => c.id === id)

        if (!movingItem) return prev

        // 1. Obtener items del mismo stage destino, ordenados por posición
        const stageItems = otherItems
          .filter((c) => c.stage === stage)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

        // 2. Insertar el item moving en la nueva posición
        stageItems.splice(position, 0, {
          ...movingItem,
          stage,
          position,
          updatedAt: new Date().toISOString()
        })

        // 3. Recalcular todas las posiciones para asegurar integridad
        const updatedStageItems = stageItems.map((c, idx) => ({
          ...c,
          position: idx
        }))

        // 4. Reconstruir el array global
        const otherStagesItems = otherItems.filter((c) => c.stage !== stage)
        return [...otherStagesItems, ...updatedStageItems]
      })

      // Sync logic remains essentially the same but technically we should sync all changed positions
      // For now, let's at least sync the main item move correctly.
      try {
        if (isOnline && isSupabaseConfigured) {
          const mappedData = mapToSupabase(
            { id, stage, position, updatedAt: new Date().toISOString() },
            'candidatesGPV'
          )
          const { error } = await supabase
            .from('candidatesGPV')
            .update(mappedData)
            .eq('id', id)

          if (error) {
            log.error('Reorder error:', error)
            addToSyncQueue({
              type: 'update',
              table: 'candidates',
              data: { id, stage, position, updatedAt: new Date().toISOString() }
            })
          }
        } else {
          addToSyncQueue({
            type: 'update',
            table: 'candidates',
            data: { id, stage, position, updatedAt: new Date().toISOString() }
          })
        }
      } catch (err) {
        log.error('Error in reorderCandidate:', err)
        addToSyncQueue({
          type: 'update',
          table: 'candidates',
          data: { id, stage, position, updatedAt: new Date().toISOString() }
        })
      }
    },
    [isOnline, addToSyncQueue]
  )

  return {
    candidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    moveCandidate,
    reorderCandidate,
    refresh
  }
}
