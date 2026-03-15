import { useCallback, useEffect, useState } from 'react'
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

const STORAGE_KEY = 'candidates'

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

  const refresh = useCallback(async () => {
    if (!navigator.onLine || !isSupabaseConfigured) return
    try {
      const { data, error } = await supabase
        .from('candidatesGPV')
        .select('*')
      if (error) {
        console.error('[Candidates] Error fetching from Supabase:', error.message)
        return
      }
      if (data) {
        const normalised = normaliseCandidates(data)
        // Merge: Supabase es fuente de verdad para lo que ya existe,
        // pero preservamos ítems locales que aún no están en Supabase (pendientes de sync)
        setCandidates((prevLocal) => {
          const supabaseIds = new Set(normalised.map(c => c.id))
          const localOnly = prevLocal.filter(c => !supabaseIds.has(c.id))
          const merged = [...normalised, ...localOnly]
          persistCandidatesToStorage(merged)
          return merged
        })
      }
    } catch (err) {
      console.error('[Candidates] Network error fetching from Supabase:', err)
    }
  }, [])

  // Cargar datos iniciales desde Supabase
  useEffect(() => {
    refresh()
  }, [refresh])

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
          if (mappedData.category && typeof mappedData.category !== 'object') delete mappedData.category;
          if (mappedData.brandPolicy && typeof mappedData.brandPolicy !== 'object') delete mappedData.brandPolicy;

          const { error } = await supabase.from('candidatesGPV').insert(mappedData)
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
            console.error('[Candidates] Insert error:', error.message)
            addToSyncQueue({ type: 'create', table: 'candidates', data: newCandidate })
            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'warning',
                title: 'Guardado offline',
                description: `El candidato "${newCandidate.name}" se guardó localmente.`,
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          }
        } else {
          addToSyncQueue({ type: 'create', table: 'candidates', data: newCandidate })
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
        console.error('[Candidates] Error in addCandidate:', err)
        addToSyncQueue({ type: 'create', table: 'candidates', data: newCandidate })
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
          const mappedUpdates = mapToSupabase({ ...updates, id }, 'candidatesGPV')
          
          if (mappedUpdates.category && typeof mappedUpdates.category !== 'object') delete mappedUpdates.category;
          if (mappedUpdates.brandPolicy && typeof mappedUpdates.brandPolicy !== 'object') delete mappedUpdates.brandPolicy;

          const { error } = await supabase.from('candidatesGPV').update(mappedUpdates).eq('id', id)
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
            console.error('[Candidates] Update error:', error.message)
            addToSyncQueue({
              type: 'update',
              table: 'candidates',
              data: { ...updates, id }
            })
          }
        } else {
          addToSyncQueue({
            type: 'update',
            table: 'candidates',
            data: { ...updates, id }
          })
        }
      } catch (err) {
        console.error('[Candidates] Error in updateCandidate:', err)
        addToSyncQueue({
          type: 'update',
          table: 'candidates',
          data: { ...updates, id }
        })
      }
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const deleteCandidate = useCallback(
    async (id: EntityId): Promise<void> => {
      setCandidates((prev) => prev.filter((item) => item.id !== id))
      try {
        if (isOnline && isSupabaseConfigured) {
          const { error } = await supabase.from('candidatesGPV').delete().eq('id', id)
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
            console.error('[Candidates] Delete error:', error.message)
            addToSyncQueue({ type: 'delete', table: 'candidates', data: { id } })
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
        console.error('[Candidates] Error in deleteCandidate:', err)
        addToSyncQueue({ type: 'delete', table: 'candidates', data: { id } })
      }
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const moveCandidate = useCallback(
    async (id: EntityId, stage: string): Promise<void> => {
      // Importante: No usamos el estado 'candidates' directamente aquí para evitar cierres obsoletos
      // Pero como estamos dentro de useCandidates y refresh se llama, confiaremos en pasar el ID y updates.
      // Re-calculamos la posición basándonos en la lista actual.
      setCandidates((prev) => {
        const stageItems = prev.filter(c => c.stage === stage)
        const maxPos = stageItems.reduce((max, c) => Math.max(max, c.position || 0), -1)
        const newPos = maxPos + 1
        
        // Disparamos la actualización real (asíncrona)
        setTimeout(() => {
          updateCandidate(id, {
            stage,
            position: newPos,
            updatedAt: new Date().toISOString()
          })
        }, 0)
        
        return prev.map(c => c.id === id ? { ...c, stage, position: newPos, updatedAt: new Date().toISOString() } : c)
      })
    },
    [updateCandidate]
  )

  const reorderCandidate = useCallback(
    async (
      id: EntityId,
      stage: string,
      position: number
    ): Promise<void> => {
      setCandidates((prev) => {
        const result = [...prev]
        const currentIndex = result.findIndex((c) => c.id === id)
        if (currentIndex === -1) return prev

        const item = result[currentIndex]
        const updatedItem = {
          ...item,
          stage,
          position,
          updatedAt: new Date().toISOString()
        }

        result[currentIndex] = updatedItem
        return result
      })

      try {
        if (isOnline && isSupabaseConfigured) {
          const mappedData = mapToSupabase({ id, stage, position, updatedAt: new Date().toISOString() }, 'candidatesGPV')
          const { error } = await supabase
            .from('candidatesGPV')
            .update(mappedData)
            .eq('id', id)

          if (error) {
            console.error('[Candidates] Reorder error:', error)
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
        console.error('[Candidates] Error in reorderCandidate:', err)
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
