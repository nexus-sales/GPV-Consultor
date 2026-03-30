/**
 * Servicio de Google Tasks
 * Utiliza la API de Google Tasks para crear y gestionar tareas
 */

import {
  TasksService,
  Task,
  TaskList,
  GoogleTaskResource,
  GoogleTasksListItem
} from '../types'
import { logger } from '../../logger'

const log = logger.create('GoogleTasks')

interface GoogleTaskRequest {
  title?: string
  notes?: string
  due?: string
  status?: 'completed' | 'needsAction'
}

export class GoogleTasksService implements TasksService {
  private accessToken: string
  private readonly BASE_URL = 'https://www.googleapis.com/tasks/v1'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.BASE_URL}${endpoint}`
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }

    log.debug(`Request: ${options.method || 'GET'} ${endpoint}`)

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))
      log.error(`API Error: ${response.status}`, error)
      throw new Error(
        `Google Tasks API Error: ${response.status} - ${error.error?.message || 'Unknown error'}`
      )
    }

    return response.json()
  }

  async getTaskLists(): Promise<TaskList[]> {
    try {
      const data = await this.request<{ items: GoogleTasksListItem[] }>(
        '/users/@me/lists'
      )

      return data.items.map((item) => ({
        id: item.id,
        name: item.title
      }))
    } catch (error) {
      log.error('Error fetching task lists', error)
      throw error
    }
  }

  async createTask(task: Task, taskListId?: string): Promise<Task> {
    try {
      const listId = taskListId || '@default'

      const requestBody: GoogleTaskRequest = {
        title: task.title,
        notes: task.notes,
        due: task.dueDate
      }

      // Añadir metadata como notas extendidas
      if (task.metadata) {
        const metadata = `\n---\nGPV Entity: ${task.metadata.entityType}:${task.metadata.entityId}\nGPV URL: ${task.metadata.gpvUrl || ''}`
        requestBody.notes = (task.notes || '') + metadata
      }

      const data = await this.request<GoogleTaskResource>(
        `/lists/${listId}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      )

      log.info(`Task created: ${data.id}`)

      return {
        id: data.id,
        title: data.title,
        notes: data.notes?.split('\n---\n')[0] || data.notes,
        dueDate: data.due,
        completed: data.status === 'completed',
        completedAt: data.completed,
        priority: task.priority,
        metadata: task.metadata
      }
    } catch (error) {
      log.error('Error creating task', error)
      throw error
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      // Primero obtener la tarea actual
      const currentTask = await this.request<GoogleTaskResource>(
        `/lists/@default/tasks/${taskId}`
      )

      const requestBody: GoogleTaskRequest = {
        title: updates.title ?? currentTask.title,
        notes: currentTask.notes, // Mantener notas originales con metadata
        due: updates.dueDate ?? currentTask.due,
        status: updates.completed
          ? 'completed'
          : ((currentTask.status || 'needsAction') as 'completed' | 'needsAction')
      }

      // Si hay notas nuevas, reemplazar solo la parte antes del separador
      if (updates.notes !== undefined) {
        const metadataMatch = currentTask.notes?.match(/\n---\n([\s\S]*)/)
        requestBody.notes =
          updates.notes + (metadataMatch ? metadataMatch[0] : '')
      }

      const data = await this.request<GoogleTaskResource>(
        `/lists/@default/tasks/${taskId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(requestBody)
        }
      )

      log.info(`Task updated: ${data.id}`)

      return {
        id: data.id,
        title: data.title,
        notes: data.notes?.split('\n---\n')[0] || data.notes,
        dueDate: data.due,
        completed: data.status === 'completed',
        completedAt: data.completed,
        priority: updates.priority,
        metadata: updates.metadata
      }
    } catch (error) {
      log.error('Error updating task', error)
      throw error
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.request(`/lists/@default/tasks/${taskId}`, {
        method: 'DELETE'
      })
      log.info(`Task deleted: ${taskId}`)
    } catch (error) {
      log.error('Error deleting task', error)
      throw error
    }
  }

  async getTask(taskId: string): Promise<Task | null> {
    try {
      const data = await this.request<GoogleTaskResource>(
        `/lists/@default/tasks/${taskId}`
      )

      if (!data || data.status === 'deleted') {
        return null
      }

      return {
        id: data.id,
        title: data.title,
        notes: data.notes?.split('\n---\n')[0] || data.notes,
        dueDate: data.due,
        completed: data.status === 'completed',
        completedAt: data.completed
      }
    } catch (error) {
      log.error('Error fetching task', error)
      return null
    }
  }

  async markTaskCompleted(taskId: string): Promise<Task> {
    try {
      const data = await this.request<GoogleTaskResource>(
        `/lists/@default/tasks/${taskId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'completed' satisfies GoogleTaskRequest['status']
          })
        }
      )

      log.info(`Task completed: ${data.id}`)

      return {
        id: data.id,
        title: data.title,
        notes: data.notes?.split('\n---\n')[0] || data.notes,
        dueDate: data.due,
        completed: true,
        completedAt: data.completed
      }
    } catch (error) {
      log.error('Error marking task as completed', error)
      throw error
    }
  }
}
