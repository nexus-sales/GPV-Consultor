import { useCallback, useEffect, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { normaliseVisits } from '../data/normalisers'
import { generateId, normaliseDate } from '../data/helpers'
import { supabase } from '../supabaseClient'
import type { Visit, NewVisit, VisitUpdates, EntityId } from '../types'

const STORAGE_KEY = 'visits'

function loadVisitsFromStorage(): Visit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return normaliseVisits(arr)
  } catch {
    return []
  }
}

function persistVisitsToStorage(visits: Visit[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visits))
}

export function useVisits() {
  const [visits, setVisits] = useState<Visit[]>(() => loadVisitsFromStorage())
  const { isOnline, addToSyncQueue, setNotifications } = useSyncQueue()

  useEffect(() => {
    persistVisitsToStorage(visits)
  }, [visits])

  const addVisit = useCallback(
    async (payload: NewVisit): Promise<Visit> => {
      const newVisit: Visit = {
        id: generateId('visit'),
        distributorId: payload.distributorId || null,
        candidateId: payload.candidateId || null,
        date: normaliseDate(payload.date),
        type: payload.type || 'presentacion',
        objective: payload.objective || '',
        summary: payload.summary || '',
        nextSteps: payload.nextSteps || '',
        result: payload.result || 'pendiente',
        durationMinutes: payload.durationMinutes || 30,
        createdAt: normaliseDate(payload.createdAt),
        reminder: payload.reminder || {
          enabled: false,
          minutesBefore: 60,
          channel: 'email',
          scheduledAt: null,
          lastTriggeredAt: null,
          createdAt: normaliseDate(new Date()),
          updatedAt: normaliseDate(new Date())
        },
        notes: payload.notes || ''
      }
      setVisits((prev) => [newVisit, ...prev])
      if (isOnline) {
        try {
          await supabase.from('visitsGPV').insert(newVisit)
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Visita creada',
              description: `La visita se ha creado correctamente.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } catch {
          addToSyncQueue({ type: 'create', table: 'visits', data: newVisit })
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'warning',
              title: 'Guardado offline',
              description: `La visita se guardó offline y se sincronizará más tarde.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        }
      } else {
        addToSyncQueue({ type: 'create', table: 'visits', data: newVisit })
        setNotifications((prev) => [
          ...prev,
          {
            id: generateId('notif'),
            type: 'warning',
            title: 'Guardado offline',
            description: `La visita se guardó offline y se sincronizará más tarde.`,
            timestamp: new Date().toISOString(),
            read: false
          }
        ])
      }
      return newVisit
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const updateVisit = useCallback(
    async (id: EntityId, updates: VisitUpdates): Promise<void> => {
      setVisits((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
      if (isOnline) {
        try {
          await supabase.from('visitsGPV').update(updates).eq('id', id)
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Visita actualizada',
              description: `La visita se ha actualizado correctamente.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } catch {
          addToSyncQueue({
            type: 'update',
            table: 'visits',
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
          table: 'visits',
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

  const deleteVisit = useCallback(
    async (id: EntityId): Promise<void> => {
      setVisits((prev) => prev.filter((item) => item.id !== id))
      if (isOnline) {
        try {
          await supabase.from('visitsGPV').delete().eq('id', id)
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Visita eliminada',
              description: `La visita se ha eliminado correctamente.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } catch {
          addToSyncQueue({ type: 'delete', table: 'visits', data: { id } })
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
        addToSyncQueue({ type: 'delete', table: 'visits', data: { id } })
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
    visits,
    addVisit,
    updateVisit,
    deleteVisit
  }
}
