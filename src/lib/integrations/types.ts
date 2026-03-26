/**
 * Tipos e interfaces para integraciones con servicios externos
 * Google Calendar, Google Tasks, Microsoft Calendar, Microsoft To Do
 */

// ============================================
// Tipos comunes
// ============================================

export type IntegrationProvider = 'google' | 'microsoft'
export type IntegrationType = 'calendar' | 'tasks' | 'email'

export interface IntegrationAuth {
  provider: IntegrationProvider
  accessToken: string
  refreshToken: string
  expiresAt: number // timestamp
  scopes: string[]
  userEmail: string
}

export interface IntegrationConfig {
  calendar: {
    enabled: boolean
    provider: IntegrationProvider | null
    calendarId: string | null
    defaultReminderMinutes: number
    syncVisits: boolean
    syncCalls: boolean
    syncDeadlines: boolean
  }
  tasks: {
    enabled: boolean
    provider: IntegrationProvider | null
    taskListId: string | null
    syncFollowUps: boolean
    syncPendingData: boolean
  }
  email: {
    enabled: boolean
    provider: IntegrationProvider | null
    sendConfirmations: boolean
    sendReminders: boolean
  }
}

export const defaultIntegrationConfig: IntegrationConfig = {
  calendar: {
    enabled: false,
    provider: null,
    calendarId: 'primary',
    defaultReminderMinutes: 15,
    syncVisits: true,
    syncCalls: true,
    syncDeadlines: true
  },
  tasks: {
    enabled: false,
    provider: null,
    taskListId: null,
    syncFollowUps: true,
    syncPendingData: true
  },
  email: {
    enabled: false,
    provider: null,
    sendConfirmations: false,
    sendReminders: false
  }
}

// ============================================
// Eventos de calendario
// ============================================

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  startTime: string // ISO
  endTime: string // ISO
  attendees?: string[]
  reminders?: number[] // minutos antes
  metadata?: {
    type: 'visit' | 'call' | 'deadline' | 'meeting'
    entityType: 'visit' | 'candidate' | 'distributor' | 'lead' | 'sale'
    entityId: string
    gpvUrl?: string
  }
}

export interface Calendar {
  id: string
  name: string
  description?: string
  primary: boolean
  backgroundColor?: string
}

// ============================================
// Tareas
// ============================================

export interface Task {
  id: string
  title: string
  notes?: string
  dueDate?: string // ISO
  completed: boolean
  completedAt?: string // ISO
  priority?: 'low' | 'medium' | 'high'
  metadata?: {
    entityType: 'visit' | 'candidate' | 'distributor' | 'lead' | 'sale'
    entityId: string
    gpvUrl?: string
  }
}

export interface TaskList {
  id: string
  name: string
}

// ============================================
// Respuestas de proveedores externos
// ============================================

export interface GoogleCalendarListItem {
  id: string
  summary: string
  description?: string
  primary?: boolean
  backgroundColor?: string
}

export interface GoogleCalendarDateTime {
  dateTime?: string
  date?: string
}

export interface GoogleCalendarAttendee {
  email: string
}

export interface GoogleCalendarEventResource {
  id: string
  summary: string
  description?: string
  location?: string
  status?: string
  start: GoogleCalendarDateTime
  end: GoogleCalendarDateTime
  attendees?: GoogleCalendarAttendee[]
}

export interface GoogleTasksListItem {
  id: string
  title: string
}

export interface GoogleTaskResource {
  id: string
  title: string
  notes?: string
  due?: string
  status?: string
  completed?: string
}

export interface MicrosoftCalendarListItem {
  id: string
  name: string
  isDefault?: boolean
  hexColor?: string
}

export interface MicrosoftBodyContent {
  contentType?: string
  content?: string
}

export interface MicrosoftLocation {
  displayName?: string
}

export interface MicrosoftDateTimeTimeZone {
  dateTime?: string
  timeZone?: string
}

export interface MicrosoftAttendee {
  emailAddress: {
    address: string
  }
  type?: string
}

export interface MicrosoftEventResource {
  id: string
  subject: string
  body?: MicrosoftBodyContent
  location?: MicrosoftLocation
  start?: MicrosoftDateTimeTimeZone
  end?: MicrosoftDateTimeTimeZone
  attendees?: MicrosoftAttendee[]
}

export interface MicrosoftTaskFolderResource {
  id: string
  name: string
}

export interface MicrosoftTodoTaskResource {
  id: string
  title: string
  notes?: string
  dueDateTime?: MicrosoftDateTimeTimeZone
  isCompleted: boolean
  completedDateTime?: MicrosoftDateTimeTimeZone
}

// ============================================
// Servicios
// ============================================

export interface CalendarService {
  getCalendars(): Promise<Calendar[]>
  createEvent(event: CalendarEvent): Promise<CalendarEvent>
  updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent>
  deleteEvent(eventId: string): Promise<void>
  getEvent(eventId: string): Promise<CalendarEvent | null>
}

export interface TasksService {
  getTaskLists(): Promise<TaskList[]>
  createTask(task: Task, taskListId?: string): Promise<Task>
  updateTask(taskId: string, updates: Partial<Task>): Promise<Task>
  deleteTask(taskId: string): Promise<void>
  getTask(taskId: string): Promise<Task | null>
  markTaskCompleted(taskId: string): Promise<Task>
}

// ============================================
// Estados de sincronización
// ============================================

export interface SyncStatus {
  lastSyncAt: string | null
  nextSyncAt: string | null
  pendingOperations: number
  error: string | null
  isConnected: boolean
}

export interface IntegrationConfigStorageStatus {
  mode: 'supabase' | 'local'
  lastSyncedAt: string | null
}

export interface SyncLog {
  id: string
  timestamp: string
  type: 'create' | 'update' | 'delete'
  entityType: 'event' | 'task'
  entityId: string
  provider: IntegrationProvider
  status: 'success' | 'error'
  errorMessage?: string
}
