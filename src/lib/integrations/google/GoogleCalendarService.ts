/**
 * Servicio de Google Calendar
 * Utiliza la API de Google Calendar para crear, actualizar y eliminar eventos
 */

import {
  CalendarService,
  Calendar,
  CalendarEvent,
  GoogleCalendarEventResource,
  GoogleCalendarListItem
} from '../types'
import { logger } from '../../logger'

const log = logger.create('GoogleCalendar')

interface GoogleCalendarEventRequest {
  summary?: string
  description?: string
  location?: string
  start?: {
    dateTime?: string
    timeZone: string
  }
  end?: {
    dateTime?: string
    timeZone: string
  }
  attendees?: Array<{ email: string }>
  reminders?: {
    useDefault: boolean
    overrides: Array<{ method: 'popup'; minutes: number }>
  }
  extendedProperties?: {
    private: {
      gpvType: string
      gpvEntityType: string
      gpvEntityId: string
      gpvUrl?: string
    }
  }
}

export class GoogleCalendarService implements CalendarService {
  private accessToken: string
  private readonly BASE_URL = 'https://www.googleapis.com/calendar/v3'

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
          `Google Calendar API Error: ${response.status} - ${error.error?.message || 'Unknown error'}`
        )
      }

      return response.json()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        log.error('Network/CORS error detected while fetching Google API', error)
        throw new Error(
          'Error de red o CORS al contactar con Google API. Verifica tu conexión o revisa la configuración de orígenes autorizados en Google Cloud Console.'
        )
      }
      throw error
    }
  }

  async getCalendars(): Promise<Calendar[]> {
    try {
      const data = await this.request<{ items: GoogleCalendarListItem[] }>(
        '/users/me/calendarList'
      )

      return data.items.map((item) => ({
        id: item.id,
        name: item.summary,
        description: item.description,
        primary: item.primary || false,
        backgroundColor: item.backgroundColor
      }))
    } catch (error) {
      log.error('Error fetching calendars', error)
      throw error
    }
  }

  async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    try {
      const calendarId = event.metadata?.gpvUrl || 'primary'

      const requestBody: GoogleCalendarEventRequest = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startTime,
          timeZone: 'Atlantic/Canary'
        },
        end: {
          dateTime: event.endTime,
          timeZone: 'Atlantic/Canary'
        },
        attendees: event.attendees?.map((email) => ({ email })),
        reminders: {
          useDefault: false,
          overrides: event.reminders?.map((minutes) => ({
            method: 'popup',
            minutes
          })) || [{ method: 'popup', minutes: 15 }]
        }
      }

      // Añadir metadata como extensión privada
      if (event.metadata) {
        requestBody.extendedProperties = {
          private: {
            gpvType: event.metadata.type,
            gpvEntityType: event.metadata.entityType,
            gpvEntityId: event.metadata.entityId,
            gpvUrl: event.metadata.gpvUrl
          }
        }
      }

      const data = await this.request<GoogleCalendarEventResource>(
        `/calendars/${calendarId}/events`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      )

      log.info(`Event created: ${data.id}`)

      return {
        id: data.id,
        title: data.summary,
        description: data.description,
        location: data.location,
        startTime: data.start.dateTime ?? data.start.date ?? '',
        endTime: data.end.dateTime ?? data.end.date ?? '',
        attendees: data.attendees?.map((attendee) => attendee.email),
        metadata: event.metadata
      }
    } catch (error) {
      log.error('Error creating event', error)
      throw error
    }
  }

  async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    try {
      // Primero obtener el evento actual
      const currentEvent = await this.request<GoogleCalendarEventResource>(
        `/calendars/primary/events/${eventId}`
      )

      const requestBody: GoogleCalendarEventRequest = {
        summary: updates.title ?? currentEvent.summary,
        description: updates.description ?? currentEvent.description,
        location: updates.location ?? currentEvent.location,
        start: {
          dateTime: updates.startTime ?? currentEvent.start.dateTime,
          timeZone: 'Atlantic/Canary'
        },
        end: {
          dateTime: updates.endTime ?? currentEvent.end.dateTime,
          timeZone: 'Atlantic/Canary'
        }
      }

      if (updates.attendees) {
        requestBody.attendees = updates.attendees.map((email) => ({ email }))
      }

      if (updates.reminders) {
        requestBody.reminders = {
          useDefault: false,
          overrides: updates.reminders.map((minutes) => ({
            method: 'popup',
            minutes
          }))
        }
      }

      const data = await this.request<GoogleCalendarEventResource>(
        `/calendars/primary/events/${eventId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(requestBody)
        }
      )

      log.info(`Event updated: ${data.id}`)

      return {
        id: data.id,
        title: data.summary,
        description: data.description,
        location: data.location,
        startTime: data.start.dateTime ?? data.start.date ?? '',
        endTime: data.end.dateTime ?? data.end.date ?? '',
        attendees: data.attendees?.map((attendee) => attendee.email)
      }
    } catch (error) {
      log.error('Error updating event', error)
      throw error
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.request(`/calendars/primary/events/${eventId}`, {
        method: 'DELETE'
      })
      log.info(`Event deleted: ${eventId}`)
    } catch (error) {
      log.error('Error deleting event', error)
      throw error
    }
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      const data = await this.request<GoogleCalendarEventResource>(
        `/calendars/primary/events/${eventId}`
      )

      if (!data || data.status === 'cancelled') {
        return null
      }

      return {
        id: data.id,
        title: data.summary,
        description: data.description,
        location: data.location,
        startTime: data.start.dateTime ?? data.start.date ?? '',
        endTime: data.end.dateTime ?? data.end.date ?? '',
        attendees: data.attendees?.map((attendee) => attendee.email)
      }
    } catch (error) {
      log.error('Error fetching event', error)
      return null
    }
  }
}
