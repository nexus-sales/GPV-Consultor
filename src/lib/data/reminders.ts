import type { VisitReminder } from '../types'

const DEFAULT_REFERENCE_HOUR = 9 // 09:00 local time
const MINUTES_IN_DAY = 60 * 24

const parseVisitDate = (isoDate?: string): Date | null => {
  if (!isoDate) return null
  const parts = isoDate.split('-').map(Number)
  if (parts.length !== 3) return null
  const [year, month, day] = parts
  if (!year || !month || !day) return null
  const base = new Date()
  base.setFullYear(year, month - 1, day)
  base.setHours(DEFAULT_REFERENCE_HOUR, 0, 0, 0)
  return base
}

export const computeReminderTimestamp = (
  visitDate: string,
  minutesBefore: number
): string | null => {
  const baseDate = parseVisitDate(visitDate)
  if (!baseDate) return null
  const offset = Number.isFinite(minutesBefore) ? minutesBefore : 0
  baseDate.setMinutes(baseDate.getMinutes() - offset)
  return baseDate.toISOString()
}

export const createDefaultVisitReminder = (
  visitDate: string
): VisitReminder => {
  const nowIso = new Date().toISOString()
  const scheduledAt = computeReminderTimestamp(visitDate, MINUTES_IN_DAY)
  return {
    enabled: false,
    minutesBefore: MINUTES_IN_DAY,
    channel: 'phone',
    scheduledAt,
    lastTriggeredAt: null,
    createdAt: nowIso,
    updatedAt: nowIso
  }
}

export const resolveReminderWithDefaults = (
  visitDate: string,
  reminder?: Partial<VisitReminder> | null
): VisitReminder => {
  const defaults = createDefaultVisitReminder(visitDate)
  if (!reminder) {
    return defaults
  }

  const minutesBefore = Number.isFinite(reminder.minutesBefore)
    ? Number(reminder.minutesBefore)
    : defaults.minutesBefore

  const scheduledAt =
    reminder.scheduledAt ?? computeReminderTimestamp(visitDate, minutesBefore)
  const nowIso = new Date().toISOString()

  return {
    enabled: reminder.enabled ?? defaults.enabled,
    minutesBefore,
    channel: reminder.channel ?? defaults.channel,
    scheduledAt,
    lastTriggeredAt: reminder.lastTriggeredAt ?? null,
    createdAt: reminder.createdAt ?? defaults.createdAt,
    updatedAt: reminder.updatedAt ?? nowIso
  }
}

export const shiftReminderForVisitDate = (
  visitDate: string,
  reminder: VisitReminder
): VisitReminder => {
  const scheduledAt = computeReminderTimestamp(
    visitDate,
    reminder.minutesBefore
  )
  const nowIso = new Date().toISOString()
  return {
    ...reminder,
    scheduledAt,
    updatedAt: nowIso
  }
}
