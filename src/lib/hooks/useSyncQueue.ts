import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { SyncOperation, SyncStatus, Notification } from '../types'
import { generateId } from '../data/helpers'
import { mapToSupabase } from '../mappers/supabaseMappers'

export function useSyncQueue() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [syncQueue, setSyncQueue] = useState<SyncOperation[]>([])
  const [lastSync, setLastSync] = useState<string | null>(
    localStorage.getItem('lastSync')
  )
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Agregar operación a la cola y persistir
  const addToSyncQueue = useCallback(
    (operation: Omit<SyncOperation, 'id' | 'timestamp'>) => {
      const syncOp: SyncOperation = {
        ...operation,
        id: generateId('sync'),
        timestamp: new Date().toISOString()
      }
      setSyncQueue((current) => {
        const updated = [...current, syncOp]
        localStorage.setItem('syncQueue', JSON.stringify(updated))
        return updated
      })
      if (!isOnline) {
        setNotifications((prev) => [
          ...prev,
          {
            id: generateId('notif'),
            type: 'info',
            title: 'Guardado offline',
            description:
              'Los datos se sincronizarán cuando recuperes la conexión',
            timestamp: new Date().toISOString(),
            read: false
          }
        ])
      }
    },
    [isOnline]
  )

  // Procesar cola de sincronización
  const processSyncQueue = useCallback(async () => {
    if (!isOnline || isSyncing || syncQueue.length === 0) return
    setIsSyncing(true)
    const successfulIds: string[] = []
    let errorCount = 0

    try {
      for (const operation of syncQueue) {
        console.log(`[Sync] Processing operation: ${operation.type} on ${operation.table}`, operation)

        const tableMap: Record<string, string> = {
          distributors: 'distributorsGPV',
          candidates: 'candidatesGPV',
          visits: 'visitsGPV',
          sales: 'salesGPV',
          sectors: 'sectorsGPV',
          brands: 'brandsGPV'
        }
        const supabaseTable = tableMap[operation.table]
        if (!supabaseTable) {
          console.error(`[Sync] Unknown table: ${operation.table}`)
          errorCount++
          continue
        }

        let result: { error: { message: string } | null }
        if (operation.type === 'create') {
          const mappedData = mapToSupabase(operation.data, operation.table)
          result = await supabase.from(supabaseTable).insert(mappedData)
        } else if (operation.type === 'update') {
          const mappedData = mapToSupabase(operation.data, operation.table)
          result = await supabase
            .from(supabaseTable)
            .update(mappedData)
            .eq('id', operation.data.id)
        } else if (operation.type === 'delete') {
          result = await supabase
            .from(supabaseTable)
            .delete()
            .eq('id', operation.data.id)
        } else {
          console.error(`[Sync] Unknown operation type: ${operation.type}`)
          errorCount++
          continue
        }

        if (!result.error) {
          successfulIds.push(operation.id)
        } else {
          console.error(`[Sync] Error processing operation ${operation.id}:`, result.error.message)
          errorCount++
        }
      }

      // Limpiar SOLO las operaciones exitosas de la cola
      if (successfulIds.length > 0) {
        setSyncQueue((current) => {
          const remaining = current.filter(op => !successfulIds.includes(op.id))
          localStorage.setItem('syncQueue', JSON.stringify(remaining))
          return remaining
        })

        setLastSync(new Date().toISOString())
        localStorage.setItem('lastSync', new Date().toISOString())

        setNotifications((prev) => [
          ...prev,
          {
            id: generateId('notif'),
            type: 'success',
            title: 'Sincronización completada',
            description: `${successfulIds.length} operaciones sincronizadas con éxito`,
            timestamp: new Date().toISOString(),
            read: false
          }
        ])
      }

      if (errorCount > 0) {
        setNotifications((prev) => [
          ...prev,
          {
            id: generateId('notif'),
            type: 'error',
            title: 'Error en sincronización',
            description: `${errorCount} operaciones fallaron. Permanecen en cola para reintentar.`,
            timestamp: new Date().toISOString(),
            read: false
          }
        ])
      }
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, syncQueue])

  // Sincronización manual
  const forceSync = useCallback(async () => {
    if (syncQueue.length === 0) {
      setNotifications((prev) => [
        ...prev,
        {
          id: generateId('notif'),
          type: 'info',
          title: 'Sin cambios pendientes',
          description: 'No hay datos pendientes de sincronizar',
          timestamp: new Date().toISOString(),
          read: false
        }
      ])
      return
    }
    if (!isOnline) {
      setNotifications((prev) => [
        ...prev,
        {
          id: generateId('notif'),
          type: 'warning',
          title: 'Sin conexión',
          description: 'Verifica tu conexión a internet e inténtalo de nuevo',
          timestamp: new Date().toISOString(),
          read: false
        }
      ])
      return
    }
    await processSyncQueue()
  }, [syncQueue, isOnline, processSyncQueue])

  // Estado del sistema de sincronización
  const syncStatus: SyncStatus = {
    isOnline,
    isSyncing,
    pendingOperations: syncQueue.length,
    lastSync,
    queueSize: syncQueue.length
  }

  // Efectos para conectividad y carga de cola
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setNotifications((prev) => [
        ...prev,
        {
          id: generateId('notif'),
          type: 'success',
          title: 'Conexión restaurada',
          description: 'Sincronizando datos pendientes...',
          timestamp: new Date().toISOString(),
          read: false
        }
      ])
    }
    const handleOffline = () => {
      setIsOnline(false)
      setNotifications((prev) => [
        ...prev,
        {
          id: generateId('notif'),
          type: 'warning',
          title: 'Sin conexión',
          description:
            'Los cambios se guardarán localmente hasta recuperar la conexión',
          timestamp: new Date().toISOString(),
          read: false
        }
      ])
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    // Cargar cola de sincronización desde localStorage al iniciar
    try {
      const savedQueue = localStorage.getItem('syncQueue')
      if (savedQueue) {
        const parsedQueue: SyncOperation[] = JSON.parse(savedQueue)
        setSyncQueue(parsedQueue)
      }
    } catch {
      // Error loading sync queue from localStorage - logged for development
    }
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sincronización automática cuando se recupera la conexión
  useEffect(() => {
    if (isOnline && syncQueue.length > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        processSyncQueue()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, syncQueue.length, isSyncing, processSyncQueue])

  return {
    isOnline,
    isSyncing,
    syncQueue,
    lastSync,
    notifications,
    addToSyncQueue,
    processSyncQueue,
    forceSync,
    syncStatus,
    setNotifications,
    setSyncQueue
  }
}
