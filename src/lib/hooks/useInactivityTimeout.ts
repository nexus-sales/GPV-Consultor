import { useEffect, useRef } from 'react'

/** Single source of truth for the inactivity timeout. Change here to adjust. */
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

const THROTTLE_MS = 500

interface Options {
  signOut: () => Promise<{ error: Error | null }>
  enabled: boolean
}

/**
 * Fires signOut (from AuthContext) after INACTIVITY_TIMEOUT_MS of no user
 * interaction. Setting gpv_access_denied='inactivity' in sessionStorage
 * causes Login.tsx to show the inactivity message on the next render.
 *
 * The hook does NOT duplicate any cache/OAuth cleanup — that lives entirely
 * inside AuthContext.signOut.
 *
 * Architecture note: listeners live in a stable effect (empty deps) so they
 * are never torn down by an enabled toggle or intermediate re-render. The
 * timer is managed separately via enabledRef so OAuth refresh failures or
 * any other transient state changes cannot silently kill the countdown.
 */
export function useInactivityTimeout({ signOut, enabled }: Options): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const signOutRef = useRef(signOut)
  const enabledRef = useRef(enabled)
  // resetRef lets the enabled-effect call reset() without re-running the stable effect
  const resetRef = useRef<() => void>(() => {})

  useEffect(() => {
    signOutRef.current = signOut
  }, [signOut])

  // Stable effect (empty deps): sets up event listeners once for component lifetime.
  // Cleanup only runs on true unmount — never on an enabled toggle — so the live
  // timer is never killed by an intermediate re-render or OAuth state change.
  useEffect(() => {
    const reset = () => {
      if (!enabledRef.current) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (!enabledRef.current) return
        sessionStorage.setItem('gpv_access_denied', 'inactivity')
        void signOutRef.current()
      }, INACTIVITY_TIMEOUT_MS)
    }

    resetRef.current = reset

    let lastActivity = Date.now()
    const handleActivity = () => {
      if (!enabledRef.current) return
      const now = Date.now()
      if (now - lastActivity < THROTTLE_MS) return
      lastActivity = now
      reset()
    }

    const events = ['mousemove', 'keydown', 'click', 'touchstart'] as const
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, handleActivity))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect: starts/stops the timer when enabled changes.
  // Does NOT touch the event listeners.
  useEffect(() => {
    enabledRef.current = enabled
    if (enabled) {
      resetRef.current()
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled])
}
