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
import { isSupabaseConfigured } from '../config'
import { queryClient } from '../queryClient'
import { DISTRIBUTORS_QUERY_KEY } from './queries/useDistributorsQuery'
import type {
  Distributor,
  NewDistributor,
  DistributorUpdates,
  EntityId
} from '../types'
import { createLogger } from '../logger'

const log = createLogger('Distributors')
const STORAGE_KEY = 'distributors'
const TABLE = 'distributorsGPV'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readEntityId(value: unknown): EntityId | null {
  if (!value || typeof value !== 'object' || !('id' in value)) return null
  const id = (value as { id: unknown }).id
  return typeof id === 'string' || typeof id === 'number' ? id : null
}

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

  const pushLocalOnly = useCallback(
    async (
      localOnly: Distributor[],
      onIdRemap: (oldId: EntityId, newId: EntityId) => void
    ) => {
      if (!localOnly.length || !isSupabaseConfigured || !isOnline) return
      for (const dist of localOnly) {
        const payload = mapToSupabase(dist, TABLE) as Record<string, unknown>
        
        // Limpieza extra
        if (payload.category && typeof payload.category !== 'object') delete payload.category
        if (payload.brandPolicy && typeof payload.brandPolicy !== 'object') delete payload.brandPolicy
        if (payload.checklist && typeof payload.checklist !== 'object') delete payload.checklist

        if (typeof dist.id === 'string' && !UUID_RE.test(dist.id)) {
          payload.id = generateId()
          const { data: inserted, error } = await supabase
            .from(TABLE)
            .insert(payload)
            .select()
            .single()
          
          const insertedId = readEntityId(inserted)
          if (!error && insertedId !== null) {
            onIdRemap(dist.id, insertedId)
          } else if (error) {
            log.error('Auto-sync insert error:', error.message)
          }
        } else {
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
        const normalised = normaliseDistributors(data)
        let localOnlySnapshot: Distributor[] = []

        setDistributors((prev) => {
          const localMap = new Map(prev.map(d => [String(d.id), d]))
          const supabaseIds = new Set(normalised.map((d) => String(d.id)))
          const localOnly = prev.filter((d) => !supabaseIds.has(String(d.id)))
          localOnlySnapshot = localOnly

          const merged = normalised.map((remote) => {
            const local = localMap.get(String(remote.id))
            if (!local) return remote

            // Mergear historial de notas
            const remoteNotesCount = remote.notesHistory?.length || 0
            const localNotesCount = local.notesHistory?.length || 0

            return {
              ...remote,
              notesHistory: localNotesCount > remoteNotesCount ? local.notesHistory : remote.notesHistory,
              updatedAt: local.updatedAt && new Date(local.updatedAt) > new Date(remote.updatedAt || 0)
                ? local.updatedAt
                : remote.updatedAt
            }
          })

          const all = [...merged, ...localOnly]
          persistDistributorsToStorage(all)
          return all
        })

        // Auto-push
        pushLocalOnlyRef.current(localOnlySnapshot, (oldId, newId) => {
          setDistributors((prev) =>
            prev.map((d) => (d.id === oldId ? { ...d, id: newId } : d))
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

  // Recalcular prioridad cuando cambian ventas o visitas
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

  const distributorsRef = useRef(distributors)
  useEffect(() => { distributorsRef.current = distributors }, [distributors])

  // CRUD
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
          updatedAt: normaliseDate(new Date())
        }
      }

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

      setDistributors((prev) => [newDistributor, ...prev])

      try {
        if (isOnline && isSupabaseConfigured) {
          const mappedData = mapToSupabase(newDistributor, 'distributorsGPV')

          if (mappedData.category && typeof mappedData.category !== 'object')
            delete mappedData.category
          if (
            mappedData.brandPolicy &&
            typeof mappedData.brandPolicy !== 'object'
          )
            delete mappedData.brandPolicy
          if (mappedData.checklist && typeof mappedData.checklist !== 'object')
            delete mappedData.checklist

          const { error } = await supabase
            .from('distributorsGPV')
            .insert(mappedData)
          if (!error) {
            void queryClient.invalidateQueries({
              queryKey: DISTRIBUTORS_QUERY_KEY
            })
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
            log.error('Insert error:', error.message)
            addToSyncQueue({
              type: 'create',
              table: 'distributors',
              data: newDistributor
            })
            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'error',
                title: 'Error al guardar en BD',
                description: `[distributorsGPV] ${error.message}`,
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
              description: `El distribuidor "${newDistributor.name}" se guardó offline.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        }
      } catch (err) {
        log.error('Crash in addDistributor:', err)
        addToSyncQueue({
          type: 'create',
          table: 'distributors',
          data: newDistributor
        })
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

      try {
        if (isOnline && isSupabaseConfigured) {
          const mappedUpdates = mapToSupabase(
            { ...updates, id },
            'distributorsGPV'
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
          if (
            mappedUpdates.checklist &&
            typeof mappedUpdates.checklist !== 'object'
          )
            delete mappedUpdates.checklist

          // Asegurar que notesHistory se incluya en la actualización si está presente en updates
          if (updates.notesHistory) {
            mappedUpdates.notesHistory = updates.notesHistory
          } else if (updates.notes) {
            // Buscamos el distribuidor actual para no perder el historial
            const current = distributorsRef.current.find(d => d.id === id)
            if (current?.notesHistory) {
              mappedUpdates.notesHistory = current.notesHistory
            }
          }

          const { error } = await supabase
            .from('distributorsGPV')
            .update(mappedUpdates)
            .eq('id', id)
          if (!error) {
            void queryClient.invalidateQueries({
              queryKey: DISTRIBUTORS_QUERY_KEY
            })
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
            log.error('Update error:', error.message)
            addToSyncQueue({
              type: 'update',
              table: 'distributors',
              data: { ...updates, id }
            })
            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'error',
                title: 'Error al actualizar en BD',
                description: `[distributorsGPV] ${error.message}`,
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
        }
      } catch (err) {
        log.error('Crash in updateDistributor:', err)
        addToSyncQueue({
          type: 'update',
          table: 'distributors',
          data: { ...updates, id }
        })
      }
    },
    [addToSyncQueue, isOnline, setNotifications]
  )

  const deleteDistributor = useCallback(
    async (id: EntityId): Promise<void> => {
      setDistributors((prev) => prev.filter((item) => item.id !== id))
      try {
        if (isOnline && isSupabaseConfigured) {
          const { error } = await supabase
            .from('distributorsGPV')
            .delete()
            .eq('id', id)
          if (!error) {
            void queryClient.invalidateQueries({
              queryKey: DISTRIBUTORS_QUERY_KEY
            })
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
            log.error('Delete error:', error.message)
            addToSyncQueue({
              type: 'delete',
              table: 'distributors',
              data: { id }
            })
          }
        } else {
          addToSyncQueue({
            type: 'delete',
            table: 'distributors',
            data: { id }
          })
        }
      } catch (err) {
        log.error('Crash in deleteDistributor:', err)
        addToSyncQueue({ type: 'delete', table: 'distributors', data: { id } })
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
