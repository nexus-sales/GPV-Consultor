/**
 * Hook principal para sincronización de calendario y tareas
 * Unifica Google y Microsoft en una interfaz común
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { logger } from '../logger'
import { useAuth } from '../hooks/useAuth'
import {
  loadRemoteIntegrationConfig,
  readLocalIntegrationConfig,
  saveRemoteIntegrationConfig,
  writeLocalIntegrationConfig
} from './integrationSettingsService'
import {
  useGoogleOAuth,
  GoogleCalendarService,
  GoogleTasksService
} from './google'
import {
  useMicrosoftOAuth,
  MicrosoftCalendarService,
  MicrosoftTodoService
} from './microsoft'
import {
  IntegrationConfig,
  IntegrationConfigStorageStatus,
  CalendarEvent,
  Task,
  Calendar,
  TaskList,
  SyncStatus
} from './types'

const log = logger.create('CalendarSync')

interface UseCalendarSyncReturn {
  // Configuración
  config: IntegrationConfig
  updateConfig: (updates: Partial<IntegrationConfig>) => void
  configStorageStatus: IntegrationConfigStorageStatus

  // Estado de conexión
  googleConnected: boolean
  microsoftConnected: boolean

  // Acciones de conexión
  connectGoogle: () => void
  disconnectGoogle: () => void
  connectMicrosoft: () => void
  disconnectMicrosoft: () => void

  // Calendarios
  calendars: Calendar[]
  refreshCalendars: () => Promise<void>

  // Listas de tareas
  taskLists: TaskList[]
  refreshTaskLists: () => Promise<void>

  // Sincronización de eventos
  syncEvent: (event: CalendarEvent) => Promise<void>
  updateSyncedEvent: (
    eventId: string,
    updates: Partial<CalendarEvent>
  ) => Promise<void>
  deleteSyncedEvent: (calendarEventId: string) => Promise<void>

  // Sincronización de tareas
  syncTask: (task: Task) => Promise<void>
  updateSyncedTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  deleteSyncedTask: (calendarTaskId: string) => Promise<void>

  // Estado de sincronización
  syncStatus: SyncStatus
  isSyncing: boolean
}

export function useCalendarSync(): UseCalendarSyncReturn {
  const { user, isAdmin } = useAuth()
  const [config, setConfig] = useState<IntegrationConfig>(() =>
    readLocalIntegrationConfig()
  )
  const [configStorageStatus, setConfigStorageStatus] =
    useState<IntegrationConfigStorageStatus>({
      mode: 'local',
      lastSyncedAt: null
    })

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncAt: null,
    nextSyncAt: null,
    pendingOperations: 0,
    error: null,
    isConnected: false
  })

  const [isSyncing, setIsSyncing] = useState(false)
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [taskLists, setTaskLists] = useState<TaskList[]>([])

  const {
    isAuthenticated: googleAuth,
    accessToken: googleToken,
    login: googleLogin,
    logout: googleLogout
  } = useGoogleOAuth()

  const {
    isAuthenticated: microsoftAuth,
    accessToken: microsoftToken,
    login: microsoftLogin,
    logout: microsoftLogout
  } = useMicrosoftOAuth()

  // Guardar configuración
  const updateConfig = useCallback((updates: Partial<IntegrationConfig>) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        ...updates
      }

      writeLocalIntegrationConfig(newConfig)
      void saveRemoteIntegrationConfig(newConfig, user?.id, isAdmin).then(
        (savedRemotely) => {
          setConfigStorageStatus({
            mode: savedRemotely ? 'supabase' : 'local',
            lastSyncedAt: new Date().toISOString()
          })
        }
      )

      return newConfig
    })
  }, [isAdmin, user?.id])

  useEffect(() => {
    let cancelled = false

    const loadConfig = async () => {
      const remoteConfig = await loadRemoteIntegrationConfig(isAdmin)

      if (!cancelled && remoteConfig) {
        setConfig(remoteConfig)
        setConfigStorageStatus({
          mode: 'supabase',
          lastSyncedAt: new Date().toISOString()
        })
      } else if (!cancelled) {
        setConfigStorageStatus((prev) => ({
          ...prev,
          mode: 'local'
        }))
      }
    }

    void loadConfig()

    return () => {
      cancelled = true
    }
  }, [isAdmin, user?.id])

  // Conectar Google - abre popup de OAuth
  const connectGoogle = useCallback(() => {
    void googleLogin()
  }, [googleLogin])

  const disconnectGoogle = useCallback(() => {
    googleLogout()
    updateConfig({
      calendar: { ...config.calendar, enabled: false, provider: null },
      tasks: { ...config.tasks, enabled: false, provider: null }
    })
    setCalendars([])
    setTaskLists([])
    toast.success('Google desconectado')
  }, [googleLogout, updateConfig, config])

  // Conectar Microsoft - abre popup de OAuth
  const connectMicrosoft = useCallback(() => {
    void microsoftLogin()
  }, [microsoftLogin])

  const disconnectMicrosoft = useCallback(() => {
    microsoftLogout()
    updateConfig({
      calendar: { ...config.calendar, enabled: false, provider: null },
      tasks: { ...config.tasks, enabled: false, provider: null }
    })
    setCalendars([])
    setTaskLists([])
    toast.success('Microsoft desconectado')
  }, [microsoftLogout, updateConfig, config])

  // Refresh calendars
  const refreshCalendars = useCallback(async () => {
    if (!googleToken && !microsoftToken) return

    try {
      const provider = config.calendar.provider
      let fetchedCalendars: Calendar[] = []

      if (provider === 'google' && googleToken) {
        const service = new GoogleCalendarService(googleToken)
        fetchedCalendars = await service.getCalendars()
      } else if (provider === 'microsoft' && microsoftToken) {
        const service = new MicrosoftCalendarService(microsoftToken)
        fetchedCalendars = await service.getCalendars()
      }

      setCalendars(fetchedCalendars)
      log.info(`Calendarios actualizados: ${fetchedCalendars.length}`)
    } catch (error) {
      log.error('Error actualizando calendarios', error)
      toast.error('Error actualizando calendarios')
    }
  }, [googleToken, microsoftToken, config.calendar.provider])

  // Refresh task lists
  const refreshTaskLists = useCallback(async () => {
    if (!googleToken && !microsoftToken) return

    try {
      const provider = config.tasks.provider
      let fetchedLists: TaskList[] = []

      if (provider === 'google' && googleToken) {
        const service = new GoogleTasksService(googleToken)
        fetchedLists = await service.getTaskLists()
      } else if (provider === 'microsoft' && microsoftToken) {
        const service = new MicrosoftTodoService(microsoftToken)
        fetchedLists = await service.getTaskLists()
      }

      setTaskLists(fetchedLists)
      log.info(`Listas de tareas actualizadas: ${fetchedLists.length}`)
    } catch (error) {
      log.error('Error actualizando listas de tareas', error)
      toast.error('Error actualizando listas de tareas')
    }
  }, [googleToken, microsoftToken, config.tasks.provider])

  // Sincronizar evento
  const syncEvent = useCallback(
    async (event: CalendarEvent) => {
      if (!config.calendar.enabled) return

      setIsSyncing(true)
      try {
        const provider = config.calendar.provider
        let service: GoogleCalendarService | MicrosoftCalendarService

        if (provider === 'google' && googleToken) {
          service = new GoogleCalendarService(googleToken)
        } else if (provider === 'microsoft' && microsoftToken) {
          service = new MicrosoftCalendarService(microsoftToken)
        } else {
          throw new Error('No hay proveedor de calendario conectado')
        }

        await service.createEvent(event)

        setSyncStatus((prev) => ({
          ...prev,
          lastSyncAt: new Date().toISOString(),
          pendingOperations: Math.max(0, prev.pendingOperations - 1)
        }))

        toast.success('Evento sincronizado con el calendario')
        log.info('Evento sincronizado', { eventId: event.id })
      } catch (error) {
        log.error('Error sincronizando evento', error)
        toast.error('Error sincronizando evento con el calendario')
        setSyncStatus((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }))
      } finally {
        setIsSyncing(false)
      }
    },
    [
      config.calendar.enabled,
      config.calendar.provider,
      googleToken,
      microsoftToken
    ]
  )

  // Actualizar evento sincronizado
  const updateSyncedEvent = useCallback(
    async (eventId: string, updates: Partial<CalendarEvent>) => {
      if (!config.calendar.enabled) return

      try {
        const provider = config.calendar.provider
        let service: GoogleCalendarService | MicrosoftCalendarService

        if (provider === 'google' && googleToken) {
          service = new GoogleCalendarService(googleToken)
        } else if (provider === 'microsoft' && microsoftToken) {
          service = new MicrosoftCalendarService(microsoftToken)
        } else {
          return
        }

        await service.updateEvent(eventId, updates)
        log.info('Evento actualizado en calendario externo')
      } catch (error) {
        log.error('Error actualizando evento', error)
      }
    },
    [
      config.calendar.enabled,
      config.calendar.provider,
      googleToken,
      microsoftToken
    ]
  )

  // Eliminar evento sincronizado
  const deleteSyncedEvent = useCallback(
    async (calendarEventId: string) => {
      if (!config.calendar.enabled) return

      try {
        const provider = config.calendar.provider
        let service: GoogleCalendarService | MicrosoftCalendarService

        if (provider === 'google' && googleToken) {
          service = new GoogleCalendarService(googleToken)
        } else if (provider === 'microsoft' && microsoftToken) {
          service = new MicrosoftCalendarService(microsoftToken)
        } else {
          return
        }

        await service.deleteEvent(calendarEventId)
        log.info('Evento eliminado del calendario externo')
      } catch (error) {
        log.error('Error eliminando evento', error)
      }
    },
    [
      config.calendar.enabled,
      config.calendar.provider,
      googleToken,
      microsoftToken
    ]
  )

  // Sincronizar tarea
  const syncTask = useCallback(
    async (task: Task) => {
      if (!config.tasks.enabled) return

      setIsSyncing(true)
      try {
        const provider = config.tasks.provider
        let service: GoogleTasksService | MicrosoftTodoService

        if (provider === 'google' && googleToken) {
          service = new GoogleTasksService(googleToken)
        } else if (provider === 'microsoft' && microsoftToken) {
          service = new MicrosoftTodoService(microsoftToken)
        } else {
          throw new Error('No hay proveedor de tareas conectado')
        }

        await service.createTask(task, config.tasks.taskListId || undefined)

        setSyncStatus((prev) => ({
          ...prev,
          lastSyncAt: new Date().toISOString(),
          pendingOperations: Math.max(0, prev.pendingOperations - 1)
        }))

        toast.success('Tarea sincronizada')
        log.info('Tarea sincronizada', { taskId: task.id })
      } catch (error) {
        log.error('Error sincronizando tarea', error)
        toast.error('Error sincronizando tarea')
        setSyncStatus((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }))
      } finally {
        setIsSyncing(false)
      }
    },
    [
      config.tasks.enabled,
      config.tasks.provider,
      config.tasks.taskListId,
      googleToken,
      microsoftToken
    ]
  )

  // Actualizar tarea sincronizada
  const updateSyncedTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      if (!config.tasks.enabled) return

      try {
        const provider = config.tasks.provider
        let service: GoogleTasksService | MicrosoftTodoService

        if (provider === 'google' && googleToken) {
          service = new GoogleTasksService(googleToken)
        } else if (provider === 'microsoft' && microsoftToken) {
          service = new MicrosoftTodoService(microsoftToken)
        } else {
          return
        }

        await service.updateTask(taskId, updates)
        log.info('Tarea actualizada en servicio externo')
      } catch (error) {
        log.error('Error actualizando tarea', error)
      }
    },
    [config.tasks.enabled, config.tasks.provider, googleToken, microsoftToken]
  )

  // Eliminar tarea sincronizada
  const deleteSyncedTask = useCallback(
    async (calendarTaskId: string) => {
      if (!config.tasks.enabled) return

      try {
        const provider = config.tasks.provider
        let service: GoogleTasksService | MicrosoftTodoService

        if (provider === 'google' && googleToken) {
          service = new GoogleTasksService(googleToken)
        } else if (provider === 'microsoft' && microsoftToken) {
          service = new MicrosoftTodoService(microsoftToken)
        } else {
          return
        }

        await service.deleteTask(calendarTaskId)
        log.info('Tarea eliminada del servicio externo')
      } catch (error) {
        log.error('Error eliminando tarea', error)
      }
    },
    [config.tasks.enabled, config.tasks.provider, googleToken, microsoftToken]
  )

  // Actualizar estado de conexión
  useEffect(() => {
    const connected = googleAuth || microsoftAuth
    setSyncStatus((prev) => ({
      ...prev,
      isConnected: connected,
      pendingOperations: connected ? prev.pendingOperations : 0
    }))
  }, [googleAuth, microsoftAuth])

  // Auto-refresh calendars cuando se conecta
  useEffect(() => {
    if ((googleAuth || microsoftAuth) && calendars.length === 0) {
      refreshCalendars()
    }
  }, [googleAuth, microsoftAuth]) // eslint-disable-line

  return {
    config,
    updateConfig,
    configStorageStatus,
    googleConnected: googleAuth,
    microsoftConnected: microsoftAuth,
    connectGoogle,
    disconnectGoogle,
    connectMicrosoft,
    disconnectMicrosoft,
    calendars,
    refreshCalendars,
    taskLists,
    refreshTaskLists,
    syncEvent,
    updateSyncedEvent,
    deleteSyncedEvent,
    syncTask,
    updateSyncedTask,
    deleteSyncedTask,
    syncStatus,
    isSyncing
  }
}
