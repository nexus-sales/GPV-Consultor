import { useCallback, useEffect, useState, useRef } from 'react'
import { useSyncQueue } from './useSyncQueue'
import {
  normaliseDistributors,
  evaluateDistributorChecklist,
  computeDistributorCompletion
} from '../data/normalisers'
import { calculateDistributorPriority } from '../data/priority'
import { generateId, normaliseDate } from '../data/helpers'
import { supabase } from '../supabaseClient'
import { mapToSupabase } from '../mappers/supabaseMappers'
import type {
  Distributor,
  NewDistributor,
  DistributorUpdates,
  EntityId
} from '../types'

const STORAGE_KEY = 'distributors'

function loadDistributorsFromStorage(): Distributor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return normaliseDistributors(arr)
  } catch {
    return []
  }
}

function persistDistributorsToStorage(distributors: Distributor[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(distributors))
}

import type { Sale, Visit } from '../types'

export function useDistributors({
  sales,
  visits
}: {
  sales: Sale[]
  visits: Visit[]
}) {
  const [distributors, setDistributors] = useState<Distributor[]>(() =>
    loadDistributorsFromStorage()
  )
  const { isOnline, addToSyncQueue, setNotifications } = useSyncQueue()
  const salesRef = useRef<Sale[]>(sales)
  const visitsRef = useRef<Visit[]>(visits)
  useEffect(() => {
    salesRef.current = sales
  }, [sales])
  useEffect(() => {
    visitsRef.current = visits
  }, [visits])

  // Persistir en localStorage cada vez que cambian
  useEffect(() => {
    persistDistributorsToStorage(distributors)
  }, [distributors])

  const refresh = useCallback(async () => {
    if (!navigator.onLine) return
    try {
      const { data, error } = await supabase
        .from('distributorsGPV')
        .select('*')
      if (error) {
        console.error('[Distributors] Error fetching from Supabase:', error.message)
        return
      }
      if (data && data.length > 0) {
        const normalised = normaliseDistributors(data)
        setDistributors(normalised)
      }
    } catch (err) {
      console.error('[Distributors] Network error fetching from Supabase:', err)
    }
  }, [])

  // Cargar datos iniciales desde Supabase
  useEffect(() => {
    refresh()
  }, [refresh])

  // Recalcular prioridad, checklist y completion cuando cambian ventas o visitas
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
            checklistComplete: Object.values(checklist).every(Boolean)
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
          priorityDrivers: priority.drivers
        }
      })
    )
  }, [sales, visits])

  // CRUD
  const addDistributor = useCallback(
    async (payload: NewDistributor): Promise<Distributor> => {
      // Normalización y helpers
      const code =
        payload.code?.trim()?.toUpperCase() || generateId('dist').toUpperCase()
      const category = payload.category || {
        id: '',
        label: '',
        description: '',
        badgeClass: '',
        tooltip: '',
        brandPolicy: { allowed: null, blocked: [], conditional: [], note: '' },
        pendingData: false
      }
      const brands = Array.isArray(payload.brands) ? payload.brands : []
      const checklist = evaluateDistributorChecklist({
        ...payload,
        code,
        brands,
        category
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
        city: payload.city || '',
        postalCode: payload.postalCode || '',
        phone: payload.phone || '',
        email: payload.email || '',
        createdAt: normaliseDate(payload.createdAt),
        notes: payload.notes || '',
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
          updatedAt: normaliseDate(new Date())
        }
      }
      // Calcular prioridad
      const priority = calculateDistributorPriority(baseDistributor, {
        sales: salesRef.current,
        visits: visitsRef.current
      })
      const newDistributor: Distributor = {
        ...baseDistributor,
        priorityScore: priority.score,
        priorityLevel: priority.level,
        priorityDrivers: priority.drivers
      }
      // Estado local inmediato
      setDistributors((prev) => [newDistributor, ...prev])
      // Sincronización
      if (isOnline) {
        const mappedData = mapToSupabase(newDistributor, 'distributorsGPV')
        const { error } = await supabase.from('distributorsGPV').insert(mappedData)
        if (!error) {
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Distribuidor creado',
              description: `El distribuidor "${newDistributor.name}" se ha creado correctamente.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } else {
          console.error('[Distributors] Insert error:', error.message)
          addToSyncQueue({
            type: 'create',
            table: 'distributors',
            data: newDistributor
          })
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'warning',
              title: 'Guardado offline',
              description: `El distribuidor "${newDistributor.name}" se guardó offline y se sincronizará más tarde.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        }
      } else {
        addToSyncQueue({
          type: 'create',
          table: 'distributors',
          data: newDistributor
        })
        setNotifications((prev) => [
          ...prev,
          {
            id: generateId('notif'),
            type: 'warning',
            title: 'Guardado offline',
            description: `El distribuidor "${newDistributor.name}" se guardó offline y se sincronizará más tarde.`,
            timestamp: new Date().toISOString(),
            read: false
          }
        ])
      }
      return newDistributor
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const updateDistributor = useCallback(
    async (id: EntityId, updates: DistributorUpdates): Promise<void> => {
      setDistributors((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
      if (isOnline) {
        const mappedUpdates = mapToSupabase({ ...updates, id }, 'distributorsGPV')
        const { error } = await supabase.from('distributorsGPV').update(mappedUpdates).eq('id', id)
        if (!error) {
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Distribuidor actualizado',
              description: `El distribuidor se ha actualizado correctamente.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } else {
          console.error('[Distributors] Update error:', error.message)
          addToSyncQueue({
            type: 'update',
            table: 'distributors',
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
          table: 'distributors',
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

  const deleteDistributor = useCallback(
    async (id: EntityId): Promise<void> => {
      setDistributors((prev) => prev.filter((item) => item.id !== id))
      if (isOnline) {
        const { error } = await supabase.from('distributorsGPV').delete().eq('id', id)
        if (!error) {
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Distribuidor eliminado',
              description: `El distribuidor se ha eliminado correctamente.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } else {
          console.error('[Distributors] Delete error:', error.message)
          addToSyncQueue({
            type: 'delete',
            table: 'distributors',
            data: { id }
          })
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
        addToSyncQueue({ type: 'delete', table: 'distributors', data: { id } })
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
    distributors,
    addDistributor,
    updateDistributor,
    deleteDistributor,
    refresh
  }
}
