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

const parseStoredAuth = (value: string): IntegrationAuth | null => {
  try {
    const parsed = JSON.parse(value) as Partial<IntegrationAuth>
    if (
      parsed.provider !== 'google' &&
      parsed.provider !== 'microsoft'
    ) {
      return null
    }
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      !Array.isArray(parsed.scopes)
    ) {
      return null
    }
    return parsed as IntegrationAuth
  } catch {
    return null
  }
}

export const readOAuthSession = (
  provider: IntegrationProvider
): IntegrationAuth | null => {
  if (!isBrowser()) {
    return null
  }

  const storageKey = getStorageKey(provider)
  const sessionValue = sessionStorage.getItem(storageKey)
  if (sessionValue) {
    const auth = parseStoredAuth(sessionValue)
    if (!auth) sessionStorage.removeItem(storageKey)
    return auth
  }

  const legacyValue = localStorage.getItem(storageKey)
  if (!legacyValue) {
    return null
  }

  localStorage.removeItem(storageKey)
  const legacyAuth = parseStoredAuth(legacyValue)
  if (legacyAuth) {
    sessionStorage.setItem(storageKey, legacyValue)
  }
  return legacyAuth
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
