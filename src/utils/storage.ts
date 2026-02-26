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

export function saveLS<T = unknown>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}
