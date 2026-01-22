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
        try {
          await supabase.from('candidates').insert(newCandidate)
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
        } catch {
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
        try {
          await supabase.from('candidates').update(updates).eq('id', id)
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
        } catch {
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
        try {
          await supabase.from('candidates').delete().eq('id', id)
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
        } catch {
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

  return {
    candidates,
    addCandidate,
    updateCandidate,
    deleteCandidate
  }
}
