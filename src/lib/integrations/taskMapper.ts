/**
 * Conversión de Tareas (dominio GPV) a Task (integración externa)
 */

import { Task as AppTask } from '../types'
import { Task as ExternalTask } from './types'

/**
 * Transforma una tarea del sistema en una Task para integraciones externas.
 */
export function appTaskToExternalTask(
  task: AppTask,
  entityName?: string
): ExternalTask {
  const title = entityName ? `${task.title} (${entityName})` : task.title

  return {
    id: String(task.id),
    title,
    notes: task.description || '',
    dueDate: task.dueDate ? `${task.dueDate}T23:59:59Z` : undefined,
    completed: task.status === 'completed',
    priority:
      task.priority === 'high'
        ? 'high'
        : task.priority === 'medium'
          ? 'medium'
          : 'low',
    metadata: {
      entityType: task.entityType,
      entityId: String(task.entityId)
    }
  }
}
