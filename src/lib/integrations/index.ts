/**
 * Módulo de integraciones con servicios externos
 * Google Workspace y Microsoft 365
 */

// Tipos
export * from './types'

// Google
export * from './google'

// Microsoft
export * from './microsoft'

// Hooks
export { useCalendarSync } from './useCalendarSync'

// Componentes UI
export { CalendarSyncPanel } from './CalendarSyncPanel'
export { TaskSyncPanel } from './TaskSyncPanel'

// Utilidades
export { visitToCalendarEvent } from './visitMapper'
