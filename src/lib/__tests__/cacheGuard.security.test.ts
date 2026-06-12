import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runCacheGuard, ENTITY_CACHE_KEYS, LAST_USER_KEY } from '../cacheGuard'

// Build an in-memory Storage whose keys appear in Object.keys() — required by
// getCurrentSessionUserId(), which does Object.keys(localStorage).find(…).
function makeStorage(): Storage {
  const store: Record<string, string> = {}
  return new Proxy(store as unknown as Storage, {
    get(_t, prop: string) {
      if (prop === 'getItem')    return (k: string) => store[k] ?? null
      if (prop === 'setItem')    return (k: string, v: string) => { store[k] = v }
      if (prop === 'removeItem') return (k: string) => { delete store[k] }
      if (prop === 'clear')      return () => Object.keys(store).forEach(k => delete store[k])
      if (prop === 'length')     return Object.keys(store).length
      if (prop === 'key')        return (i: number) => Object.keys(store)[i] ?? null
      return store[prop]
    },
    ownKeys() { return Object.keys(store) },
    getOwnPropertyDescriptor(_t, key: PropertyKey) {
      const k = String(key)
      if (k in store) return { configurable: true, enumerable: true, writable: true, value: store[k] }
      return undefined
    },
    has(_t, prop) { return String(prop) in store }
  })
}

const originalStorage = global.localStorage

describe('cacheGuard — runCacheGuard', () => {
  beforeEach(() => { global.localStorage = makeStorage() })
  afterEach(() => { global.localStorage = originalStorage })

  it('(a) usuario distinto al último limpia TODAS las keys de ENTITY_CACHE_KEYS', () => {
    localStorage.setItem('sb-test-auth-token', JSON.stringify({ user: { id: 'user-B' } }))
    localStorage.setItem(LAST_USER_KEY, 'user-A')
    ENTITY_CACHE_KEYS.forEach(k => localStorage.setItem(k, '["data"]'))

    runCacheGuard()

    ENTITY_CACHE_KEYS.forEach(k =>
      expect(localStorage.getItem(k)).toBeNull()
    )
  })

  it('(b) mismo usuario NO limpia la caché de entidades', () => {
    localStorage.setItem('sb-test-auth-token', JSON.stringify({ user: { id: 'user-A' } }))
    localStorage.setItem(LAST_USER_KEY, 'user-A')
    localStorage.setItem('candidates', '["cached"]')

    runCacheGuard()

    expect(localStorage.getItem('candidates')).toBe('["cached"]')
  })

  it('(c) sin sesión activa limpia la caché y elimina gpv_last_user_id', () => {
    // No sb-*-auth-token key present
    localStorage.setItem(LAST_USER_KEY, 'user-A')
    ENTITY_CACHE_KEYS.forEach(k => localStorage.setItem(k, '["data"]'))

    runCacheGuard()

    ENTITY_CACHE_KEYS.forEach(k =>
      expect(localStorage.getItem(k)).toBeNull()
    )
    expect(localStorage.getItem(LAST_USER_KEY)).toBeNull()
  })
})
