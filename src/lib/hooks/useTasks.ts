import { useCallback, useEffect, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { generateId, normaliseDate } from '../data/helpers'
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
        setTasks(data as Task[])
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
        }
      } else {
        addToSyncQueue({ type: 'create', table: 'tasks', data: newTask })
      }
      return newTask
    },
    [isOnline, isSupabaseConfigured, addToSyncQueue, setNotifications]
  )

  const updateTask = useCallback(
    async (id: EntityId, updates: TaskUpdates): Promise<void> => {
      const now = normaliseDate(new Date())
      const taskUpdates = { ...updates, updatedAt: now }
      
      if (updates.status === 'completed') {
        taskUpdates.completedAt = now
      }

      setTasks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...taskUpdates } : item))
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
          addToSyncQueue({ type: 'update', table: 'tasks', data: { ...taskUpdates, id } })
        }
      } else {
        addToSyncQueue({ type: 'update', table: 'tasks', data: { ...taskUpdates, id } })
      }
    },
    [isOnline, isSupabaseConfigured, addToSyncQueue, setNotifications]
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
        }
      } else {
        addToSyncQueue({ type: 'delete', table: 'tasks', data: { id } })
      }
    },
    [isOnline, isSupabaseConfigured, addToSyncQueue, setNotifications]
  )

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    refresh
  }
}
