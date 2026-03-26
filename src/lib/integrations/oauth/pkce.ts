const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const textEncoder = new TextEncoder()

const storageKey = (provider: string, key: 'verifier' | 'state') =>
  `gpv_oauth_${provider}_${key}`

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

export const createPkceSession = async (
  provider: 'google' | 'microsoft'
): Promise<{ codeChallenge: string; state: string }> => {
  const verifier = generateRandomString(96)
  const state = generateRandomString(32)
  const codeChallenge = base64UrlEncode(await sha256(verifier))

  sessionStorage.setItem(storageKey(provider, 'verifier'), verifier)
  sessionStorage.setItem(storageKey(provider, 'state'), state)

  return { codeChallenge, state }
}

export const consumePkceSession = (
  provider: 'google' | 'microsoft',
  state: string | null
): { codeVerifier: string } => {
  const savedState = sessionStorage.getItem(storageKey(provider, 'state'))
  const codeVerifier = sessionStorage.getItem(storageKey(provider, 'verifier'))

  sessionStorage.removeItem(storageKey(provider, 'state'))
  sessionStorage.removeItem(storageKey(provider, 'verifier'))

  if (!state || !savedState || state !== savedState || !codeVerifier) {
    throw new Error('La sesión OAuth no es válida o ha expirado')
  }

  return { codeVerifier }
}