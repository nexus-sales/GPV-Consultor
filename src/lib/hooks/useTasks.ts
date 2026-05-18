import { useCallback, useEffect, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { generateId, normaliseDate } from '../data/helpers'
import { normaliseTasks } from '../data/normalisers'
import { supabase } from '../supabaseClient'
import { mapToSupabase } from '../mappers/supabaseMappers'
import { isSupabaseConfigured } from '../config'
import type { Task, NewTask, TaskUpdates, EntityId } from '../types'
import { createLogger } from '../logger'

const log = createLogger('Tasks')

const STORAGE_KEY = 'tasks'

function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function persistTasksToStorage(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage())
  const { isOnline, addToSyncQueue, setNotifications } = useSyncQueue()

  useEffect(() => {
    persistTasksToStorage(tasks)
  }, [tasks])

  const refresh = useCallback(async () => {
    if (!navigator.onLine || !isSupabaseConfigured) return
    try {
      const { data, error } = await supabase.from('tasksGPV').select('*')
      if (error) {
        log.error('Error fetching from Supabase:', error.message)
        return
      }
      if (data) {
        const normalised = normaliseTasks(data)
        setTasks((prev) => {
          const supabaseIds = new Set(normalised.map((t) => String(t.id)))
          const localOnly = prev.filter((t) => !supabaseIds.has(String(t.id)))
          const merged = [...normalised, ...localOnly]
          persistTasksToStorage(merged)
          return merged
        })
      }
    } catch (err) {
      log.error('Network error fetching from Supabase:', err)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addTask = useCallback(
    async (payload: NewTask): Promise<Task> => {
      const newTask: Task = {
        id: generateId('task'),
        title: payload.title || 'Nueva Tarea',
        description: payload.description || '',
        status: payload.status || 'pending',
        priority: payload.priority || 'medium',
        dueDate: normaliseDate(payload.dueDate || new Date()),
        entityId: payload.entityId!,
        entityType: payload.entityType!,
        creatorId: payload.creatorId,
        createdAt: normaliseDate(new Date()),
        updatedAt: normaliseDate(new Date()),
        ...payload
      }

      setTasks((prev) => [newTask, ...prev])

      if (isOnline && isSupabaseConfigured) {
        const mappedData = mapToSupabase(newTask, 'tasksGPV')
        const { error } = await supabase.from('tasksGPV').insert(mappedData)
        if (!error) {

          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Tarea creada',
              description: `La tarea "${newTask.title}" se ha creado correctamente.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } else {
          log.error('Insert error:', error.message)
          addToSyncQueue({ type: 'create', table: 'tasks', data: newTask })
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'error',
              title: 'Error al guardar tarea',
              description: `[tasksGPV] ${error.message}`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        }
      } else {
        addToSyncQueue({ type: 'create', table: 'tasks', data: newTask })
      }
      return newTask
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const updateTask = useCallback(
    async (id: EntityId, updates: TaskUpdates): Promise<Task> => {
      const now = normaliseDate(new Date())
      const taskUpdates = { ...updates, updatedAt: now }

      if (updates.status === 'completed') {
        taskUpdates.completedAt = now
      }

      let updatedTask: Task | null = null

      setTasks((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            updatedTask = { ...item, ...taskUpdates }
            return updatedTask
          }
          return item
        })
      )

      if (isOnline && isSupabaseConfigured) {
        const mappedUpdates = mapToSupabase({ ...taskUpdates, id }, 'tasksGPV')
        const { error } = await supabase
          .from('tasksGPV')
          .update(mappedUpdates)
          .eq('id', id)

        if (!error) {

          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Tarea actualizada',
              description: 'Los cambios se han guardado correctamente.',
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } else {
          log.error('Update error:', error.message)
          addToSyncQueue({
            type: 'update',
            table: 'tasks',
            data: { ...taskUpdates, id }
          })
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'error',
              title: 'Error al actualizar tarea',
              description: `[tasksGPV] ${error.message}`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        }
      } else {
        addToSyncQueue({
          type: 'update',
          table: 'tasks',
          data: { ...taskUpdates, id }
        })
      }

      if (!updatedTask) {
        // Fallback if not found in state yet (shouldn't happen)
        const current = tasks.find((t) => t.id === id)
        updatedTask = current
          ? { ...current, ...taskUpdates }
          : (taskUpdates as unknown as Task)
      }

      return updatedTask!
    },
    [isOnline, addToSyncQueue, setNotifications, tasks]
  )

  const deleteTask = useCallback(
    async (id: EntityId): Promise<void> => {
      setTasks((prev) => prev.filter((item) => item.id !== id))

      if (isOnline && isSupabaseConfigured) {
        const { error } = await supabase.from('tasksGPV').delete().eq('id', id)
        if (!error) {

          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Tarea eliminada',
              description: 'La tarea se ha eliminado correctamente.',
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } else {
          log.error('Delete error:', error.message)
          addToSyncQueue({ type: 'delete', table: 'tasks', data: { id } })
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'error',
              title: 'Error al eliminar tarea',
              description: `[tasksGPV] ${error.message}`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        }
      } else {
        addToSyncQueue({ type: 'delete', table: 'tasks', data: { id } })
      }
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    refresh
  }
}
