const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const textEncoder = new TextEncoder()

type OAuthProvider = 'google' | 'microsoft'

interface PkceSession {
  verifier: string
  state: string
  createdAt: number
}

const PKCE_TTL_MS = 15 * 60 * 1000

const sessionStorageKey = (provider: OAuthProvider) =>
  `gpv_oauth_${provider}_pkce_session`

const legacyStorageKey = (
  provider: OAuthProvider,
  key: 'verifier' | 'state'
) => `gpv_oauth_${provider}_${key}`

const generateRandomString = (length = 64): string => {
  const randomValues = new Uint8Array(length)
  window.crypto.getRandomValues(randomValues)
  return base64UrlEncode(randomValues)
}

const sha256 = async (value: string): Promise<Uint8Array> => {
  const digest = await window.crypto.subtle.digest(
    'SHA-256',
    textEncoder.encode(value)
  )

  return new Uint8Array(digest)
}

const persistPkceSession = (provider: OAuthProvider, session: PkceSession) => {
  const serialized = JSON.stringify(session)
  sessionStorage.setItem(sessionStorageKey(provider), serialized)
  localStorage.setItem(sessionStorageKey(provider), serialized)
}

const cleanupPkceSession = (provider: OAuthProvider) => {
  sessionStorage.removeItem(sessionStorageKey(provider))
  localStorage.removeItem(sessionStorageKey(provider))
  sessionStorage.removeItem(legacyStorageKey(provider, 'state'))
  sessionStorage.removeItem(legacyStorageKey(provider, 'verifier'))
}

const loadPkceSession = (provider: OAuthProvider): PkceSession | null => {
  const currentValue =
    sessionStorage.getItem(sessionStorageKey(provider)) ||
    localStorage.getItem(sessionStorageKey(provider))

  if (currentValue) {
    try {
      const parsed = JSON.parse(currentValue) as PkceSession

      if (
        typeof parsed.verifier !== 'string' ||
        typeof parsed.state !== 'string' ||
        typeof parsed.createdAt !== 'number'
      ) {
        cleanupPkceSession(provider)
        return null
      }

      if (Date.now() - parsed.createdAt > PKCE_TTL_MS) {
        cleanupPkceSession(provider)
        return null
      }

      return parsed
    } catch {
      cleanupPkceSession(provider)
      return null
    }
  }

  const legacyState = sessionStorage.getItem(legacyStorageKey(provider, 'state'))
  const legacyVerifier = sessionStorage.getItem(
    legacyStorageKey(provider, 'verifier')
  )

  if (!legacyState || !legacyVerifier) {
    return null
  }

  const legacySession: PkceSession = {
    verifier: legacyVerifier,
    state: legacyState,
    createdAt: Date.now()
  }

  persistPkceSession(provider, legacySession)
  return legacySession
}

export const createPkceSession = async (
  provider: OAuthProvider
): Promise<{ codeChallenge: string; state: string }> => {
  const verifier = generateRandomString(96)
  const state = generateRandomString(32)
  const codeChallenge = base64UrlEncode(await sha256(verifier))

  persistPkceSession(provider, {
    verifier,
    state,
    createdAt: Date.now()
  })

  return { codeChallenge, state }
}

export const consumePkceSession = (
  provider: OAuthProvider,
  state: string | null
): { codeVerifier: string } => {
  const session = loadPkceSession(provider)

  if (!state || !session || state !== session.state || !session.verifier) {
    cleanupPkceSession(provider)
    throw new Error('La sesión OAuth no es válida o ha expirado')
  }

  cleanupPkceSession(provider)

  return { codeVerifier: session.verifier }
}