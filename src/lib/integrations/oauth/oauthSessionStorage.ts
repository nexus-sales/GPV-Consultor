import { IntegrationAuth, IntegrationProvider } from '../types'

const STORAGE_KEYS: Record<IntegrationProvider, string> = {
  google: 'gpv_google_auth',
  microsoft: 'gpv_microsoft_auth'
}

const isBrowser = (): boolean =>
  typeof window !== 'undefined' &&
  typeof sessionStorage !== 'undefined' &&
  typeof localStorage !== 'undefined'

const getStorageKey = (provider: IntegrationProvider): string =>
  STORAGE_KEYS[provider]

export const readOAuthSession = (
  provider: IntegrationProvider
): IntegrationAuth | null => {
  if (!isBrowser()) {
    return null
  }

  const storageKey = getStorageKey(provider)
  const sessionValue = sessionStorage.getItem(storageKey)
  if (sessionValue) {
    return JSON.parse(sessionValue) as IntegrationAuth
  }

  const legacyValue = localStorage.getItem(storageKey)
  if (!legacyValue) {
    return null
  }

  sessionStorage.setItem(storageKey, legacyValue)
  localStorage.removeItem(storageKey)
  return JSON.parse(legacyValue) as IntegrationAuth
}

export const writeOAuthSession = (
  provider: IntegrationProvider,
  auth: IntegrationAuth
): void => {
  if (!isBrowser()) {
    return
  }

  const storageKey = getStorageKey(provider)
  sessionStorage.setItem(storageKey, JSON.stringify(auth))
  localStorage.removeItem(storageKey)
}

export const clearOAuthSession = (provider: IntegrationProvider): void => {
  if (!isBrowser()) {
    return
  }

  const storageKey = getStorageKey(provider)
  sessionStorage.removeItem(storageKey)
  localStorage.removeItem(storageKey)
}
