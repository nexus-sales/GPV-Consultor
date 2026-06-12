import { createLogger } from '../lib/logger'

const storageLogger = createLogger('storage')

export const LS_KEYS = {
  distributors: 'gpv_distributors',
  visits: 'gpv_visits',
  sales: 'gpv_sales',
  candidates: 'gpv_candidates'
} as const

export type LSKey = keyof typeof LS_KEYS

export function loadLS<T = unknown>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveLS<T = unknown>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      // Liberar entradas no críticas antes de avisar
      const evictOrder = ['gpv_visits', 'gpv_sales', 'gpv_leads']
      evictOrder.forEach(k => localStorage.removeItem(k))
      storageLogger.error('localStorage lleno — datos no guardados para:', key)
    }
    return false
  }
}
