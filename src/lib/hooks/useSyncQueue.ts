import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { SyncOperation, SyncStatus, Notification } from '../types'
import { generateId } from '../data/helpers'

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
        try {
          console.log(`[Sync] Processing operation: ${operation.type} on ${operation.table}`, operation)
          switch (operation.table) {
            case 'distributors':
              if (operation.type === 'create') {
                await supabase.from('distributors').insert(operation.data)
              } else if (operation.type === 'update') {
                await supabase
                  .from('distributors')
                  .update(operation.data)
                  .eq('id', operation.data.id)
              } else if (operation.type === 'delete') {
                await supabase
                  .from('distributors')
                  .delete()
                  .eq('id', operation.data.id)
              }
              break
            case 'candidates':
              if (operation.type === 'create') {
                await supabase.from('candidates').insert(operation.data)
              } else if (operation.type === 'update') {
                await supabase
                  .from('candidates')
                  .update(operation.data)
                  .eq('id', operation.data.id)
              } else if (operation.type === 'delete') {
                await supabase
                  .from('candidates')
                  .delete()
                  .eq('id', operation.data.id)
              }
              break
            case 'visits':
              if (operation.type === 'create') {
                await supabase.from('visits').insert(operation.data)
              } else if (operation.type === 'update') {
                await supabase
                  .from('visits')
                  .update(operation.data)
                  .eq('id', operation.data.id)
              } else if (operation.type === 'delete') {
                await supabase
                  .from('visits')
                  .delete()
                  .eq('id', operation.data.id)
              }
              break
            case 'sales':
              if (operation.type === 'create') {
                await supabase.from('sales').insert(operation.data)
              } else if (operation.type === 'update') {
                await supabase
                  .from('sales')
                  .update(operation.data)
                  .eq('id', operation.data.id)
              } else if (operation.type === 'delete') {
                await supabase
                  .from('sales')
                  .delete()
                  .eq('id', operation.data.id)
              }
              break
            case 'sectors':
              if (operation.type === 'create') {
                await supabase.from('sectors').insert(operation.data)
              } else if (operation.type === 'update') {
                await supabase
                  .from('sectors')
                  .update(operation.data)
                  .eq('id', operation.data.id)
              } else if (operation.type === 'delete') {
                await supabase.from('sectors').delete().eq('id', operation.data.id)
              }
              break
            case 'brands':
              if (operation.type === 'create') {
                await supabase.from('brands').insert(operation.data)
              } else if (operation.type === 'update') {
                await supabase
                  .from('brands')
                  .update(operation.data)
                  .eq('id', operation.data.id)
              } else if (operation.type === 'delete') {
                await supabase.from('brands').delete().eq('id', operation.data.id)
              }
              break
          }
          successfulIds.push(operation.id)
        } catch (err) {
          console.error(`[Sync] Error processing operation ${operation.id}:`, err)
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
