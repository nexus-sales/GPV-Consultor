import { useCallback, useEffect, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { normaliseCandidates } from '../data/normalisers'
import { generateId, normaliseDate } from '../data/helpers'
import { supabase } from '../supabaseClient'
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
    if (!navigator.onLine) return
    try {
      const { data, error } = await supabase
        .from('candidatesGPV')
        .select('*')
      if (error) {
        console.error('[Candidates] Error fetching from Supabase:', error.message)
        return
      }
      if (data && data.length > 0) {
        const normalised = normaliseCandidates(data)
        setCandidates(normalised)
        persistCandidatesToStorage(normalised)
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
      setCandidates((prev) => [newCandidate, ...prev])
      if (isOnline) {
        const { error } = await supabase.from('candidatesGPV').insert(newCandidate)
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
              description: `El candidato "${newCandidate.name}" se guardó offline y se sincronizará más tarde.`,
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
            description: `El candidato "${newCandidate.name}" se guardó offline y se sincronizará más tarde.`,
            timestamp: new Date().toISOString(),
            read: false
          }
        ])
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
      if (isOnline) {
        const { error } = await supabase.from('candidatesGPV').update(updates).eq('id', id)
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
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'warning',
              title: 'Actualización offline',
              description: `La actualización se guardó offline y se sincronizará más tarde.`,
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
        setNotifications((prev) => [
          ...prev,
          {
            id: generateId('notif'),
            type: 'warning',
            title: 'Actualización offline',
            description: `La actualización se guardó offline y se sincronizará más tarde.`,
            timestamp: new Date().toISOString(),
            read: false
          }
        ])
      }
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const deleteCandidate = useCallback(
    async (id: EntityId): Promise<void> => {
      setCandidates((prev) => prev.filter((item) => item.id !== id))
      if (isOnline) {
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
              description: `La eliminación se guardó offline y se sincronizará más tarde.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        }
      } else {
        addToSyncQueue({ type: 'delete', table: 'candidates', data: { id } })
        setNotifications((prev) => [
          ...prev,
          {
            id: generateId('notif'),
            type: 'warning',
            title: 'Eliminación offline',
            description: `La eliminación se guardó offline y se sincronizará más tarde.`,
            timestamp: new Date().toISOString(),
            read: false
          }
        ])
      }
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const moveCandidate = useCallback(
    async (id: EntityId, stage: string): Promise<void> => {
      // Find max position in target stage to append
      const maxPos = candidates
        .filter(c => c.stage === stage)
        .reduce((max, c) => Math.max(max, c.position || 0), -1)

      const newPos = maxPos + 1

      await updateCandidate(id, {
        stage,
        position: newPos,
        updatedAt: new Date().toISOString()
      })
    },
    [candidates, updateCandidate]
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
        const oldStage = item.stage

        // Optimistic update
        const updatedItem = {
          ...item,
          stage,
          position,
          updatedAt: new Date().toISOString()
        }

        // Update the item
        result[currentIndex] = updatedItem

        // If stage changed or just reordering, we might want to normalize positions
        // But for now, simple update is enough for dnd-kit visual feedback
        return result
      })

      if (isOnline) {
        const { error } = await supabase
          .from('candidatesGPV')
          .update({ stage, position, updatedAt: new Date().toISOString() })
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
