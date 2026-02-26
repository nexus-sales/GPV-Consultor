import type { LookupOption } from '../types'

type WithId = { id: string | number }

export const getInitials = (value = ''): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

export const sanitisePhone = (value = ''): string => value.replace(/\s+/g, '')

export const generateId = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`

export const createLookup = <T extends WithId>(
  arr: T[] = []
): Record<string, T> =>
  arr.reduce<Record<string, T>>((acc, item) => {
    acc[String(item.id)] = item
    return acc
  }, {})

export const normaliseDate = (value?: string | number | Date): string => {
  if (!value) return new Date().toISOString().slice(0, 10)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return date.toISOString().slice(0, 10)
}

export const daysDifference = (isoDate: string): number => {
  const date = new Date(isoDate)
  const today = new Date()
  const diffMs = today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export const formatRelativeTime = (isoDate: string): string => {
  const diff = daysDifference(isoDate)
  if (Number.isNaN(diff)) return 'Fecha no disponible'
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Hace 1 día'
  if (diff < 7) return `Hace ${diff} días`
  if (diff < 30) return `Hace ${Math.round(diff / 7)} semanas`
  const months = Math.round(diff / 30)
  return `Hace ${months} mes${months > 1 ? 'es' : ''}`
}

export const toLookupOptions = (
  options: LookupOption[]
): Record<string, LookupOption> => createLookup(options)
