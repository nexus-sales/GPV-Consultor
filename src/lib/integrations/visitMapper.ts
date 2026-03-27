/**
 * Conversión de Visit (dominio GPV) a CalendarEvent (integración externa)
 */

import { Visit } from '../types'
import { CalendarEvent } from './types'

/**
 * Transforma una visita en un CalendarEvent listo para enviar a Google/Microsoft.
 * @param visit       - Visita de la BD
 * @param title       - Nombre del contacto (distribuidor o candidato)
 * @param location    - Ciudad/ubicación del contacto (opcional)
 */
export function visitToCalendarEvent(
  visit: Visit,
  title: string,
  location?: string
): CalendarEvent {
  // Construir fecha/hora de inicio
  const dateStr = visit.date ?? new Date().toISOString().split('T')[0]
  const timeStr = visit.scheduledTime ?? '08:00'
  const startTime = `${dateStr}T${timeStr}:00`

  const durationMs = (visit.durationMinutes ?? 60) * 60_000
  const endTime = new Date(new Date(startTime).getTime() + durationMs).toISOString()

  const descriptionParts: string[] = []
  if (visit.objective) descriptionParts.push(`Objetivo: ${visit.objective}`)
  if (visit.summary) descriptionParts.push(`Resumen: ${visit.summary}`)
  if (visit.nextSteps) descriptionParts.push(`Próximos pasos: ${visit.nextSteps}`)

  const reminderMinutes =
    visit.reminder?.minutesBefore != null ? [visit.reminder.minutesBefore] : [15]

  return {
    id: String(visit.id),
    title,
    description: descriptionParts.join('\n') || undefined,
    location: location || undefined,
    startTime,
    endTime,
    reminders: reminderMinutes,
    metadata: {
      type: 'visit',
      entityType: 'visit',
      entityId: String(visit.id)
    }
  }
}
