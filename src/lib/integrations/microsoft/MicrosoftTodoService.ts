/**
 * Servicio de Microsoft To Do
 * Utiliza Microsoft Graph API para gestionar tareas de Microsoft To Do
 */

import {
  TasksService,
  Task,
  TaskList,
  MicrosoftTaskFolderResource,
  MicrosoftTodoTaskResource
} from '../types'
import { logger } from '../../logger'

const log = logger.create('MicrosoftTodo')

interface MicrosoftTodoTaskRequest {
  title?: string
  notes?: string
  dueDateTime?: {
    dateTime: string
    timeZone: string
  }
  isCompleted?: boolean
}

export class MicrosoftTodoService implements TasksService {
  private accessToken: string
  private readonly BASE_URL = 'https://graph.microsoft.com/v1.0'

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

    try {
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
          `Microsoft Graph API Error: ${response.status} - ${error.error?.message || 'Unknown error'}`
        )
      }

      return response.json()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        log.error(
          'Network/CORS error detected while fetching Microsoft API',
          error
        )
        throw new Error(
          'Error de red o CORS al contactar con Microsoft Graph API. Verifica tu conexión.'
        )
      }
      throw error
    }
  }

  async getTaskLists(): Promise<TaskList[]> {
    try {
      // Microsoft To Do usa "taskFolders" dentro de "todo"
      const data = await this.request<{ value: MicrosoftTaskFolderResource[] }>(
        '/me/todo/taskFolders'
      )

      return data.value.map((item) => ({
        id: item.id,
        name: item.name
      }))
    } catch (error) {
      log.error('Error fetching task lists', error)
      throw error
    }
  }

  async createTask(task: Task, taskListId?: string): Promise<Task> {
    try {
      const listId = taskListId || '@default'

      const requestBody: MicrosoftTodoTaskRequest = {
        title: task.title,
        notes: task.notes,
        dueDateTime: task.dueDate
          ? {
              dateTime: task.dueDate.replace('Z', ''),
              timeZone: 'Atlantic/Canary'
            }
          : undefined
      }

      // Añadir metadata en las notas
      if (task.metadata) {
        const metadataText = `\n\n---\nGPV: ${task.metadata.entityType}:${task.metadata.entityId}${task.metadata.gpvUrl ? ' | ' + task.metadata.gpvUrl : ''}`
        requestBody.notes = (task.notes || '') + metadataText
      }

      const endpoint =
        listId === '@default'
          ? '/me/todo/tasks'
          : `/me/todo/taskFolders/${listId}/tasks`

      const data = await this.request<MicrosoftTodoTaskResource>(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      log.info(`Task created: ${data.id}`)

      return {
        id: data.id,
        title: data.title,
        notes: data.notes?.split('\n\n---\n')[0] || data.notes,
        dueDate: data.dueDateTime?.dateTime + 'Z',
        completed: data.isCompleted || false,
        completedAt: data.completedDateTime?.dateTime + 'Z',
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
      const requestBody: MicrosoftTodoTaskRequest = {}

      if (updates.title !== undefined) requestBody.title = updates.title
      if (updates.dueDate !== undefined) {
        requestBody.dueDateTime = {
          dateTime: updates.dueDate.replace('Z', ''),
          timeZone: 'Atlantic/Canary'
        }
      }
      if (updates.completed !== undefined) {
        requestBody.isCompleted = updates.completed
      }
      if (updates.notes !== undefined) {
        // Mantener metadata si existe
        const currentTask = await this.getTask(taskId)
        const metadataMatch = currentTask?.notes?.match(/\n\n---\n([\s\S]*)/)
        requestBody.notes =
          updates.notes + (metadataMatch ? metadataMatch[0] : '')
      }

      const data = await this.request<MicrosoftTodoTaskResource>(
        `/me/todo/tasks/${taskId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(requestBody)
        }
      )

      log.info(`Task updated: ${data.id}`)

      return {
        id: data.id,
        title: data.title,
        notes: data.notes?.split('\n\n---\n')[0] || data.notes,
        dueDate: data.dueDateTime?.dateTime + 'Z',
        completed: data.isCompleted,
        completedAt: data.completedDateTime?.dateTime + 'Z',
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
      await this.request(`/me/todo/tasks/${taskId}`, { method: 'DELETE' })
      log.info(`Task deleted: ${taskId}`)
    } catch (error) {
      log.error('Error deleting task', error)
      throw error
    }
  }

  async getTask(taskId: string): Promise<Task | null> {
    try {
      const data = await this.request<MicrosoftTodoTaskResource>(
        `/me/todo/tasks/${taskId}`
      )

      if (!data) {
        return null
      }

      return {
        id: data.id,
        title: data.title,
        notes: data.notes?.split('\n\n---\n')[0] || data.notes,
        dueDate: data.dueDateTime?.dateTime + 'Z',
        completed: data.isCompleted,
        completedAt: data.completedDateTime?.dateTime + 'Z'
      }
    } catch (error) {
      log.error('Error fetching task', error)
      return null
    }
  }

  async markTaskCompleted(taskId: string): Promise<Task> {
    try {
      const data = await this.request<MicrosoftTodoTaskResource>(
        `/me/todo/tasks/${taskId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isCompleted: true })
        }
      )

      log.info(`Task completed: ${data.id}`)

      return {
        id: data.id,
        title: data.title,
        notes: data.notes?.split('\n\n---\n')[0] || data.notes,
        dueDate: data.dueDateTime?.dateTime + 'Z',
        completed: true,
        completedAt: data.completedDateTime?.dateTime + 'Z'
      }
    } catch (error) {
      log.error('Error marking task as completed', error)
      throw error
    }
  }
}
