import { createPrefixedLogger } from '../utils/logger'

const log = createPrefixedLogger('[storage]')

interface StorageConfig<T> {
  storageKey: string
  storageVersion: number
  payload?: T
}

export const loadStoredState = <T>({
  storageKey,
  storageVersion
}: StorageConfig<T>): T | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { version?: number; payload?: T } | null
    if (!parsed || parsed.version !== storageVersion) return null
    return parsed.payload ?? null
  } catch (error) {
    log.warn('No se pudo leer localStorage:', error)
    return null
  }
}

export const persistState = <T>({
  storageKey,
  storageVersion,
  payload
}: StorageConfig<T>): void => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ version: storageVersion, payload })
    )
  } catch (error) {
    log.warn('No se pudo guardar en localStorage:', error)
  }
}
