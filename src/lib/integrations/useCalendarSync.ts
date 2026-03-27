/**
 * Hook principal para sincronización de calendario y tareas
 * Unifica Google y Microsoft en una interfaz común
 */

import { useState, useCallback, useEffect, useRef } from 'react'
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
  SyncStatus,
  IntegrationProvider
} from './types'

const log = logger.create('CalendarSync')

const resolveConnectedProvider = (
  preferredProvider: IntegrationProvider | null,
  googleConnected: boolean,
  microsoftConnected: boolean
): IntegrationProvider | null => {
  if (preferredProvider === 'google' && googleConnected) {
    return 'google'
  }

  if (preferredProvider === 'microsoft' && microsoftConnected) {
    return 'microsoft'
  }

  if (googleConnected) {
    return 'google'
  }

  if (microsoftConnected) {
    return 'microsoft'
  }

  return null
}

const isGoogleTasksApiDisabledError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('Google Tasks API Error: 403') &&
    (error.message.includes('has not been used in project') ||
      error.message.includes('it is disabled'))
  )
}

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
  syncAllEvents: (events: CalendarEvent[]) => Promise<void>
  updateSyncedEvent: (
    eventId: string,
    updates: Partial<CalendarEvent>
  ) => Promise<void>
  deleteSyncedEvent: (calendarEventId: string) => Promise<void>

  // Sincronización de tareas
  syncTask: (task: Task) => Promise<void>
  syncAllTasks: (tasks: Task[]) => Promise<void>
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
  const autoRefreshedCalendarsProviderRef = useRef<IntegrationProvider | null>(
    null
  )
  const autoRefreshedTaskListsProviderRef = useRef<IntegrationProvider | null>(
    null
  )

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

  useEffect(() => {
    const nextCalendarProvider = resolveConnectedProvider(
      config.calendar.provider,
      googleAuth,
      microsoftAuth
    )
    const nextTasksProvider = resolveConnectedProvider(
      config.tasks.provider,
      googleAuth,
      microsoftAuth
    )
    // Auto-habilitar al conectar por primera vez (si el provider era null y ahora hay uno)
    const calendarJustConnected =
      nextCalendarProvider !== null && config.calendar.provider === null
    const tasksJustConnected =
      nextTasksProvider !== null && config.tasks.provider === null

    const nextCalendarEnabled = nextCalendarProvider
      ? calendarJustConnected || config.calendar.enabled
      : false
    const nextTasksEnabled = nextTasksProvider
      ? tasksJustConnected || config.tasks.enabled
      : false

    if (
      nextCalendarProvider === config.calendar.provider &&
      nextTasksProvider === config.tasks.provider &&
      nextCalendarEnabled === config.calendar.enabled &&
      nextTasksEnabled === config.tasks.enabled
    ) {
      return
    }

    updateConfig({
      calendar: {
        ...config.calendar,
        enabled: nextCalendarEnabled,
        provider: nextCalendarProvider
      },
      tasks: {
        ...config.tasks,
        enabled: nextTasksEnabled,
        provider: nextTasksProvider
      }
    })
  }, [
    config.calendar,
    config.tasks,
    googleAuth,
    microsoftAuth,
    updateConfig
  ])

  // Refresh calendars
  const refreshCalendars = useCallback(async () => {
    if (!googleToken && !microsoftToken) return

    try {
      const provider = resolveConnectedProvider(
        config.calendar.provider,
        Boolean(googleToken),
        Boolean(microsoftToken)
      )
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
      const provider = resolveConnectedProvider(
        config.tasks.provider,
        Boolean(googleToken),
        Boolean(microsoftToken)
      )
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
      toast.error(
        isGoogleTasksApiDisabledError(error)
          ? 'Google Tasks API no está habilitada en Google Cloud para este proyecto.'
          : 'Error actualizando listas de tareas'
      )
    }
  }, [googleToken, microsoftToken, config.tasks.provider])

  // Sincronizar evento
  const syncEvent = useCallback(
    async (event: CalendarEvent) => {
      if (!config.calendar.enabled) return

      setIsSyncing(true)
      try {
        const provider = resolveConnectedProvider(
          config.calendar.provider,
          Boolean(googleToken),
          Boolean(microsoftToken)
        )
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

  // Sincronizar todos los eventos (bulk)
  const syncAllEvents = useCallback(
    async (events: CalendarEvent[]) => {
      if (!events.length) return

      const provider = resolveConnectedProvider(
        config.calendar.provider,
        Boolean(googleToken),
        Boolean(microsoftToken)
      )
      let service: GoogleCalendarService | MicrosoftCalendarService | null = null

      if (provider === 'google' && googleToken) {
        service = new GoogleCalendarService(googleToken)
      } else if (provider === 'microsoft' && microsoftToken) {
        service = new MicrosoftCalendarService(microsoftToken)
      }

      if (!service) {
        toast.error('No hay proveedor de calendario conectado')
        return
      }

      setIsSyncing(true)
      let synced = 0
      let failed = 0

      for (const event of events) {
        try {
          await service.createEvent(event)
          synced++
        } catch (error) {
          log.error('Error sincronizando evento en bulk', error)
          failed++
        }
      }

      setIsSyncing(false)
      setSyncStatus((prev) => ({
        ...prev,
        lastSyncAt: new Date().toISOString()
      }))

      if (failed === 0) {
        toast.success(`${synced} evento${synced !== 1 ? 's' : ''} sincronizado${synced !== 1 ? 's' : ''} con el calendario`)
      } else {
        toast.warning(`${synced} sincronizados, ${failed} con error`)
      }
      log.info('Bulk sync eventos', { synced, failed })
    },
    [config.calendar.provider, googleToken, microsoftToken]
  )

  // Actualizar evento sincronizado
  const updateSyncedEvent = useCallback(
    async (eventId: string, updates: Partial<CalendarEvent>) => {
      if (!config.calendar.enabled) return

      try {
        const provider = resolveConnectedProvider(
          config.calendar.provider,
          Boolean(googleToken),
          Boolean(microsoftToken)
        )
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
        const provider = resolveConnectedProvider(
          config.calendar.provider,
          Boolean(googleToken),
          Boolean(microsoftToken)
        )
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
        const provider = resolveConnectedProvider(
          config.tasks.provider,
          Boolean(googleToken),
          Boolean(microsoftToken)
        )
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

  // Sincronizar todas las tareas (bulk)
  const syncAllTasks = useCallback(
    async (tasks: Task[]) => {
      if (!tasks.length) return

      const provider = resolveConnectedProvider(
        config.tasks.provider,
        Boolean(googleToken),
        Boolean(microsoftToken)
      )
      let service: GoogleTasksService | MicrosoftTodoService | null = null

      if (provider === 'google' && googleToken) {
        service = new GoogleTasksService(googleToken)
      } else if (provider === 'microsoft' && microsoftToken) {
        service = new MicrosoftTodoService(microsoftToken)
      }

      if (!service) {
        toast.error('No hay proveedor de tareas conectado')
        return
      }

      setIsSyncing(true)
      let synced = 0
      let failed = 0

      for (const task of tasks) {
        try {
          await service.createTask(task, config.tasks.taskListId || undefined)
          synced++
        } catch (error) {
          log.error('Error sincronizando tarea en bulk', error)
          failed++
        }
      }

      setIsSyncing(false)
      setSyncStatus((prev) => ({
        ...prev,
        lastSyncAt: new Date().toISOString()
      }))

      if (failed === 0) {
        toast.success(`${synced} tarea${synced !== 1 ? 's' : ''} sincronizada${synced !== 1 ? 's' : ''}`)
      } else {
        toast.warning(`${synced} sincronizadas, ${failed} con error`)
      }
      log.info('Bulk sync tareas', { synced, failed })
    },
    [config.tasks.provider, config.tasks.taskListId, googleToken, microsoftToken]
  )

  // Actualizar tarea sincronizada
  const updateSyncedTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      if (!config.tasks.enabled) return

      try {
        const provider = resolveConnectedProvider(
          config.tasks.provider,
          Boolean(googleToken),
          Boolean(microsoftToken)
        )
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
        const provider = resolveConnectedProvider(
          config.tasks.provider,
          Boolean(googleToken),
          Boolean(microsoftToken)
        )
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
    const provider = resolveConnectedProvider(
      config.calendar.provider,
      googleAuth,
      microsoftAuth
    )

    if (!provider) {
      autoRefreshedCalendarsProviderRef.current = null
      return
    }

    if (autoRefreshedCalendarsProviderRef.current === provider) {
      return
    }

    autoRefreshedCalendarsProviderRef.current = provider

    if (calendars.length === 0) {
      void refreshCalendars()
    }
  }, [
    calendars.length,
    config.calendar.provider,
    googleAuth,
    microsoftAuth,
    refreshCalendars
  ])

  useEffect(() => {
    const provider = resolveConnectedProvider(
      config.tasks.provider,
      googleAuth,
      microsoftAuth
    )

    if (!provider) {
      autoRefreshedTaskListsProviderRef.current = null
      return
    }

    if (autoRefreshedTaskListsProviderRef.current === provider) {
      return
    }

    autoRefreshedTaskListsProviderRef.current = provider

    if (taskLists.length === 0) {
      void refreshTaskLists()
    }
  }, [
    config.tasks.provider,
    googleAuth,
    microsoftAuth,
    refreshTaskLists,
    taskLists.length
  ])

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
    syncAllEvents,
    updateSyncedEvent,
    deleteSyncedEvent,
    syncTask,
    syncAllTasks,
    updateSyncedTask,
    deleteSyncedTask,
    syncStatus,
    isSyncing
  }
}
