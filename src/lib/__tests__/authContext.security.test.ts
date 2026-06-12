import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { clearEntityCache, LAST_USER_KEY } from '../cacheGuard'
import { clearOAuthSession } from '../integrations/oauth/oauthSessionStorage'

// ── hoisted mock variables (run before vi.mock factories and imports) ─────────

const mocks = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn()
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle
  }
  const mockFrom = vi.fn().mockReturnValue(mockQueryBuilder)
  const mockGetSession = vi.fn()
  const mockSignOut = vi.fn().mockResolvedValue({ error: null })
  const mockOnAuthStateChange = vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } }
  })
  return { mockGetSession, mockSignOut, mockOnAuthStateChange, mockMaybeSingle, mockFrom }
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: mocks.mockGetSession,
      onAuthStateChange: mocks.mockOnAuthStateChange,
      signOut: mocks.mockSignOut,
    },
    from: mocks.mockFrom
  }
}))

vi.mock('../cacheGuard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../cacheGuard')>()
  return { ...actual, clearEntityCache: vi.fn() }
})

vi.mock('../integrations/oauth/oauthSessionStorage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../integrations/oauth/oauthSessionStorage')>()
  return { ...actual, clearOAuthSession: vi.fn() }
})

// ── helpers ───────────────────────────────────────────────────────────────────

const FAKE_USER    = { id: 'user-A', email: 'test@example.com' }
const FAKE_PROFILE = { full_name: 'Test User', role: 'admin', zone: 'todas', permissions: [] }

const Wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children)

function mockSession(user = FAKE_USER) {
  mocks.mockGetSession.mockResolvedValueOnce({ data: { session: { user } } })
}

function noSession() {
  mocks.mockGetSession.mockResolvedValueOnce({ data: { session: null } })
}

// ── loadUserProfile tests ─────────────────────────────────────────────────────

describe('AuthContext — loadUserProfile', () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    setItemSpy = vi.spyOn(localStorage, 'setItem')
  })

  afterEach(() => {
    setItemSpy.mockRestore()
    cleanup()
  })

  it('(a) perfil inexistente (data null) → signOut + flag no_profile, authUser nunca asignado', async () => {
    mockSession()
    mocks.mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.profileLoaded).toBe(true))

    expect(sessionStorage.getItem('gpv_access_denied')).toBe('no_profile')
    expect(mocks.mockSignOut).toHaveBeenCalled()
    expect(result.current.authUser).toBeNull()
  })

  it('(b) error de red tras reintento → signOut + flag network_error', async () => {
    mockSession()
    // Both the initial attempt and the 800ms-delayed retry fail
    mocks.mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: { message: 'network error' } })
      .mockResolvedValueOnce({ data: null, error: { message: 'network error' } })

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

    // Retry waits 800 ms — allow up to 3 s
    await waitFor(() => expect(result.current.profileLoaded).toBe(true), { timeout: 3000 })

    expect(sessionStorage.getItem('gpv_access_denied')).toBe('network_error')
    expect(mocks.mockSignOut).toHaveBeenCalled()
    expect(result.current.authUser).toBeNull()
  })

  it('(c) perfil válido → carga rol de la BD y escribe gpv_last_user_id', async () => {
    mockSession()
    mocks.mockMaybeSingle.mockResolvedValueOnce({ data: FAKE_PROFILE, error: null })

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.authUser?.role).toBe('admin'))

    expect(result.current.authUser?.id).toBe(FAKE_USER.id)
    expect(clearEntityCache).toHaveBeenCalled()
    expect(setItemSpy).toHaveBeenCalledWith(LAST_USER_KEY, FAKE_USER.id)
  })
})

// ── signOut tests ─────────────────────────────────────────────────────────────

describe('AuthContext — signOut', () => {
  let removeItemSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    noSession()
    removeItemSpy = vi.spyOn(localStorage, 'removeItem')
  })

  afterEach(() => {
    removeItemSpy.mockRestore()
    cleanup()
  })

  it('limpia entity cache, gpv_last_user_id y llama a clearOAuthSession para google y microsoft', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.signOut()

    expect(clearEntityCache).toHaveBeenCalled()
    expect(clearOAuthSession).toHaveBeenCalledWith('google')
    expect(clearOAuthSession).toHaveBeenCalledWith('microsoft')
    expect(removeItemSpy).toHaveBeenCalledWith(LAST_USER_KEY)
  })
})
