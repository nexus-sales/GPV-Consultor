import { useCallback, useEffect, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { normaliseDate, generateId } from '../data/helpers'
import { normaliseSales } from '../data/normalisers'
import { supabase } from '../supabaseClient'
import { mapToSupabase } from '../mappers/supabaseMappers'
import type { Sale, NewSale, SaleUpdates, EntityId } from '../types'

const STORAGE_KEY = 'sales'

function loadSalesFromStorage(): Sale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return normaliseSales(arr)
  } catch {
    return []
  }
}

function persistSalesToStorage(sales: Sale[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>(() => loadSalesFromStorage())
  const { isOnline, addToSyncQueue, setNotifications } = useSyncQueue()

  useEffect(() => {
    persistSalesToStorage(sales)
  }, [sales])

  const refresh = useCallback(async () => {
    if (!navigator.onLine) return
    try {
      const { data, error } = await supabase
        .from('salesGPV')
        .select('*')
      if (error) {
        console.error('[Sales] Error fetching from Supabase:', error.message)
        return
      }
      if (data && data.length > 0) {
        const normalised = normaliseSales(data)
        setSales(normalised)
      }
    } catch (err) {
      console.error('[Sales] Network error fetching from Supabase:', err)
    }
  }, [])

  // Cargar datos iniciales desde Supabase
  useEffect(() => {
    refresh()
  }, [refresh])

  const addSale = useCallback(
    async (payload: NewSale): Promise<Sale> => {
      const newSale: Sale = {
        id: generateId('sale'),
        distributorId: payload.distributorId || '',
        date: normaliseDate(payload.date),
        brand: payload.brand || '',
        sectorId: payload.sectorId || 'telco',
        family: payload.family || '',
        operations: payload.operations || 0,
        notes: payload.notes || '',
        createdAt: normaliseDate(payload.createdAt)
      }
      setSales((prev) => [newSale, ...prev])
      if (isOnline) {
        const mappedData = mapToSupabase(newSale, 'salesGPV')
        const { error } = await supabase.from('salesGPV').insert(mappedData)
        if (!error) {
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Venta creada',
              description: `La venta se ha creado correctamente.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } else {
          console.error('[Sales] Insert error:', error.message)
          addToSyncQueue({ type: 'create', table: 'sales', data: newSale })
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'warning',
              title: 'Guardado offline',
              description: `La venta se guardó offline y se sincronizará más tarde.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        }
      } else {
        addToSyncQueue({ type: 'create', table: 'sales', data: newSale })
        setNotifications((prev) => [
          ...prev,
          {
            id: generateId('notif'),
            type: 'warning',
            title: 'Guardado offline',
            description: `La venta se guardó offline y se sincronizará más tarde.`,
            timestamp: new Date().toISOString(),
            read: false
          }
        ])
      }
      return newSale
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const updateSale = useCallback(
    async (id: EntityId, updates: SaleUpdates): Promise<void> => {
      setSales((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
      if (isOnline) {
        const mappedUpdates = mapToSupabase({ ...updates, id }, 'salesGPV')
        const { error } = await supabase.from('salesGPV').update(mappedUpdates).eq('id', id)
        if (!error) {
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Venta actualizada',
              description: `La venta se ha actualizado correctamente.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } else {
          console.error('[Sales] Update error:', error.message)
          addToSyncQueue({
            type: 'update',
            table: 'sales',
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
          table: 'sales',
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

  const deleteSale = useCallback(
    async (id: EntityId): Promise<void> => {
      setSales((prev) => prev.filter((item) => item.id !== id))
      if (isOnline) {
        const { error } = await supabase.from('salesGPV').delete().eq('id', id)
        if (!error) {
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Venta eliminada',
              description: `La venta se ha eliminado correctamente.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } else {
          console.error('[Sales] Delete error:', error.message)
          addToSyncQueue({ type: 'delete', table: 'sales', data: { id } })
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
        addToSyncQueue({ type: 'delete', table: 'sales', data: { id } })
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
    sales,
    addSale,
    updateSale,
    deleteSale,
    refresh
  }
}
