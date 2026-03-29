/**
 * Servicio de Microsoft Graph para Calendar
 * Utiliza Microsoft Graph API para gestionar eventos de Outlook Calendar
 */

import {
  CalendarService,
  Calendar,
  CalendarEvent,
  MicrosoftCalendarListItem,
  MicrosoftEventResource
} from '../types'
import { logger } from '../../logger'

const log = logger.create('MicrosoftCalendar')

interface MicrosoftEventRequest {
  subject?: string
  body?: {
    contentType: 'text'
    content?: string
  }
  location?: {
    displayName?: string
  }
  start?: {
    dateTime: string
    timeZone: string
  }
  end?: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    emailAddress: { address: string }
    type: 'required'
  }>
  reminderMinutesBeforeStart?: number
  isReminderOn?: boolean
}

export class MicrosoftCalendarService implements CalendarService {
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
  }

  async getCalendars(): Promise<Calendar[]> {
    try {
      const data = await this.request<{ value: MicrosoftCalendarListItem[] }>(
        '/me/calendars'
      )

      return data.value.map((item) => ({
        id: item.id,
        name: item.name,
        description: '',
        primary: item.isDefault || false,
        backgroundColor: item.hexColor
      }))
    } catch (error) {
      log.error('Error fetching calendars', error)
      throw error
    }
  }

  async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    try {
      const requestBody: MicrosoftEventRequest = {
        subject: event.title,
        body: event.description
          ? {
              contentType: 'text',
              content: event.description
            }
          : undefined,
        location: event.location
          ? {
              displayName: event.location
            }
          : undefined,
        start: {
          dateTime: event.startTime.replace('Z', ''),
          timeZone: 'Atlantic/Canary'
        },
        end: {
          dateTime: event.endTime.replace('Z', ''),
          timeZone: 'Atlantic/Canary'
        },
        attendees: event.attendees?.map((email) => ({
          emailAddress: { address: email },
          type: 'required'
        })),
        reminderMinutesBeforeStart: event.reminders?.[0] || 15,
        isReminderOn: true
      }

      // Añadir metadata en el body si existe
      if (event.metadata) {
        const metadataText = `\n\n---\nGPV: ${event.metadata.type} | ${event.metadata.entityType}:${event.metadata.entityId}`
        if (requestBody.body) {
          requestBody.body.content += metadataText
        } else {
          requestBody.body = {
            contentType: 'text',
            content: metadataText
          }
        }
      }

      const calendarId = event.metadata?.gpvUrl || 'calendar'
      const data = await this.request<MicrosoftEventResource>(
        `/me/calendars/${calendarId}/events`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      )

      log.info(`Event created: ${data.id}`)

      return {
        id: data.id,
        title: data.subject,
        description: data.body?.content,
        location: data.location?.displayName,
        startTime: data.start?.dateTime + 'Z',
        endTime: data.end?.dateTime + 'Z',
        attendees: data.attendees?.map(
          (attendee) => attendee.emailAddress.address
        ),
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
      const requestBody: MicrosoftEventRequest = {}

      if (updates.title !== undefined) requestBody.subject = updates.title
      if (updates.description !== undefined) {
        requestBody.body = {
          contentType: 'text',
          content: updates.description
        }
      }
      if (updates.location !== undefined) {
        requestBody.location = {
          displayName: updates.location
        }
      }
      if (updates.startTime !== undefined) {
        requestBody.start = {
          dateTime: updates.startTime.replace('Z', ''),
          timeZone: 'Atlantic/Canary'
        }
      }
      if (updates.endTime !== undefined) {
        requestBody.end = {
          dateTime: updates.endTime.replace('Z', ''),
          timeZone: 'Atlantic/Canary'
        }
      }

      const data = await this.request<MicrosoftEventResource>(
        `/me/events/${eventId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(requestBody)
        }
      )

      log.info(`Event updated: ${data.id}`)

      return {
        id: data.id,
        title: data.subject,
        description: data.body?.content,
        location: data.location?.displayName,
        startTime: data.start?.dateTime + 'Z',
        endTime: data.end?.dateTime + 'Z',
        attendees: data.attendees?.map(
          (attendee) => attendee.emailAddress.address
        )
      }
    } catch (error) {
      log.error('Error updating event', error)
      throw error
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.request(`/me/events/${eventId}`, { method: 'DELETE' })
      log.info(`Event deleted: ${eventId}`)
    } catch (error) {
      log.error('Error deleting event', error)
      throw error
    }
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      const data = await this.request<MicrosoftEventResource>(
        `/me/events/${eventId}`
      )

      if (!data) {
        return null
      }

      return {
        id: data.id,
        title: data.subject,
        description: data.body?.content,
        location: data.location?.displayName,
        startTime: data.start?.dateTime + 'Z',
        endTime: data.end?.dateTime + 'Z',
        attendees: data.attendees?.map(
          (attendee) => attendee.emailAddress.address
        )
      }
    } catch (error) {
      log.error('Error fetching event', error)
      return null
    }
  }
}
