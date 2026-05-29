import { useCallback } from 'react'
import { normaliseTasks } from '../data/normalisers'
import { generateId, normaliseDate } from '../data/helpers'
import { mapToSupabase } from '../mappers/supabaseMappers'
import { createEntityStore } from '../data/createEntityStore'
import type { Task, NewTask, TaskUpdates, EntityId } from '../types'

const useTasksStore = createEntityStore<Task>({
  table: 'tasksGPV',
  storageKey: 'tasks',
  syncTable: 'tasks',
  normalise: (rows) => normaliseTasks(rows as Parameters<typeof normaliseTasks>[0]),
  toSupabase: (item) => mapToSupabase(item as unknown as Task, 'tasksGPV'),
  label: 'Tarea',
})

export function useTasks() {
  const { items: tasks, refresh, addItem, updateItem, removeItem } = useTasksStore()

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
        ...payload,
      }
      return addItem(newTask)
    },
    [addItem]
  )

  const updateTask = useCallback(
    async (id: EntityId, updates: TaskUpdates): Promise<Task> => {
      const now = normaliseDate(new Date())
      const taskUpdates: TaskUpdates = { ...updates, updatedAt: now }
      if (updates.status === 'completed') {
        taskUpdates.completedAt = now
      }
      await updateItem(id, taskUpdates)
      const found = tasks.find((t) => t.id === id)
      return found ? { ...found, ...taskUpdates } : (taskUpdates as unknown as Task)
    },
    [updateItem, tasks]
  )

  const deleteTask = useCallback(
    (id: EntityId): Promise<void> => removeItem(id),
    [removeItem]
  )

  return { tasks, addTask, updateTask, deleteTask, refresh }
}
