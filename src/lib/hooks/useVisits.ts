import { useCallback, useEffect, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { normaliseVisits } from '../data/normalisers'
import { generateId, normaliseDate } from '../data/helpers'
import { supabase } from '../supabaseClient'
import { mapToSupabase } from '../mappers/supabaseMappers'
import { isSupabaseConfigured } from '../config'
import { queryClient } from '../queryClient'
import { VISITS_QUERY_KEY } from './queries/useVisitsQuery'
import type { Visit, NewVisit, VisitUpdates, EntityId } from '../types'
import { createLogger } from '../logger'

const log = createLogger('Visits')

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

  const refresh = useCallback(async () => {
    if (!navigator.onLine || !isSupabaseConfigured) return
    try {
      const { data, error } = await supabase.from('visitsGPV').select('*')
      if (error) {
        log.error('Error fetching from Supabase:', error.message)
        return
      }
      if (data) {
        const normalised = normaliseVisits(data)
        // Merge: conservar visitas locales que aún no llegaron a Supabase
        // para no borrar visitas recién creadas durante la sincronización
        setVisits((prevLocal) => {
          const supabaseIds = new Set(normalised.map((v) => String(v.id)))
          const localOnly = prevLocal.filter(
            (v) => !supabaseIds.has(String(v.id))
          )
          const merged = [...normalised, ...localOnly]
          persistVisitsToStorage(merged)
          return merged
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

  const addVisit = useCallback(
    async (payload: NewVisit): Promise<Visit> => {
      const newVisit: Visit = {
        id: generateId('visit'),
        distributorId: payload.distributorId || null,
        candidateId: payload.candidateId || null,
        date: normaliseDate(payload.date),
        scheduledTime: payload.scheduledTime,
        type: payload.type || 'presentacion',
        objective: payload.objective || '',
        summary: payload.summary || '',
        nextSteps: payload.nextSteps || '',
        result: payload.result || 'pendiente',
        statusOperative: payload.statusOperative || 'planificada',
        outcome: payload.outcome || 'neutral',
        location: payload.location || '',
        checklist: payload.checklist || {},
        linkedSaleId: payload.linkedSaleId || null,
        lat: payload.lat,
        lng: payload.lng,
        durationMinutes: payload.durationMinutes || 30,
        createdAt: normaliseDate(payload.createdAt || new Date()),
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
      if (isOnline && isSupabaseConfigured) {
        const mappedData = mapToSupabase(newVisit, 'visitsGPV')
        const { error } = await supabase.from('visitsGPV').insert(mappedData)
        if (!error) {
          void queryClient.invalidateQueries({ queryKey: VISITS_QUERY_KEY })
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
        } else {
          log.error('Insert error:', error.message)
          addToSyncQueue({ type: 'create', table: 'visits', data: newVisit })
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'error',
              title: 'Error al guardar en BD',
              description: `[visitsGPV] ${error.message}`,
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
      const normalisedUpdates: VisitUpdates = { ...updates }
      if (normalisedUpdates.date) {
        normalisedUpdates.date = normaliseDate(normalisedUpdates.date)
      }
      setVisits((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...normalisedUpdates } : item
        )
      )
      if (isOnline && isSupabaseConfigured) {
        const mappedUpdates = mapToSupabase(
          { ...normalisedUpdates, id },
          'visitsGPV'
        )
        const { error } = await supabase
          .from('visitsGPV')
          .update(mappedUpdates)
          .eq('id', id)
        if (!error) {
          void queryClient.invalidateQueries({ queryKey: VISITS_QUERY_KEY })
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
        } else {
          log.error('Update error:', error.message)
          addToSyncQueue({
            type: 'update',
            table: 'visits',
            data: { ...normalisedUpdates, id }
          })
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'error',
              title: 'Error al actualizar en BD',
              description: `[visitsGPV] ${error.message}`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        }
      } else {
        addToSyncQueue({
          type: 'update',
          table: 'visits',
          data: { ...normalisedUpdates, id }
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
      if (isOnline && isSupabaseConfigured) {
        const { error } = await supabase.from('visitsGPV').delete().eq('id', id)
        if (!error) {
          void queryClient.invalidateQueries({ queryKey: VISITS_QUERY_KEY })
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
        } else {
          log.error('Delete error:', error.message)
          addToSyncQueue({ type: 'delete', table: 'visits', data: { id } })
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'error',
              title: 'Error al eliminar en BD',
              description: `[visitsGPV] ${error.message}`,
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
    deleteVisit,
    refresh
  }
}
