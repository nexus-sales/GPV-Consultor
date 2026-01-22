import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'commercial'
  zone: 'las_palmas' | 'tenerife' | 'todas'
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  authUser: AuthUser | null
  session: Session | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithOTP: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  hasRole: (role: AuthUser['role']) => boolean
  hasPermission: (permission: string) => boolean
  canAccess: (resource: string, action: 'read' | 'write' | 'delete') => boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isManager: boolean
  isCommercial: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[Auth] Initializing...')

    const initTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[Auth] Initialization timeout reached (5s), forcing loading to false')
        setLoading(false)
      }
    }, 5000)

    // Obtener sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[Auth] getSession() resolved:', session ? 'User present' : 'No user')
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log('[Auth] Loading profile from getSession()...')
        await loadUserProfile(session.user.id, session.user.email)
        console.log('[Auth] Profile loaded from getSession()')
      }

      console.log('[Auth] Initial session handle COMPLETE')
      setLoading(false)
      clearTimeout(initTimeout)
    }).catch(err => {
      console.error('[Auth] Initial session error:', err)
      setLoading(false)
      clearTimeout(initTimeout)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange event triggered:', event)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log('[Auth] Loading profile from onAuthStateChange...')
        await loadUserProfile(session.user.id, session.user.email)
        console.log('[Auth] Profile loaded from onAuthStateChange')
      } else {
        setAuthUser(null)
      }
      console.log('[Auth] onAuthStateChange handle COMPLETE, setting loading to false')
      setLoading(false)
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        clearTimeout(initTimeout)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(initTimeout)
    }
  }, [])

  const loadUserProfile = async (userId: string, email?: string | null) => {
    try {
      console.log('[Auth] Querying user_profiles for:', userId)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      console.log('[Auth] user_profiles query result:', { data: !!data, error: !!error })

      if (error) {
        console.warn('[Auth] No profile found, using defaults:', error.message)
        // Usar valores por defecto si no hay perfil
        setAuthUser({
          id: userId,
          email: email || '',
          fullName: email?.split('@')[0] || 'Usuario',
          role: 'commercial',
          zone: 'todas',
          permissions: []
        })
        return
      }

      if (data) {
        setAuthUser({
          id: userId,
          email: email || '',
          fullName: data.full_name || '',
          role: data.role || 'commercial',
          zone: data.zone || 'todas',
          permissions: data.permissions || []
        })
      }
    } catch (error) {
      console.error('[Auth] Error in loadUserProfile:', error)
      // Fallback a valores por defecto
      setAuthUser({
        id: userId,
        email: email || '',
        fullName: 'Usuario',
        role: 'commercial',
        zone: 'todas',
        permissions: []
      })
    }
  }

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signInWithOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` }
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setAuthUser(null)
      setSession(null)
    }
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    })
    return { error }
  }

  const hasRole = (role: AuthUser['role']) => authUser?.role === role

  const hasPermission = (permission: string) =>
    authUser?.permissions?.includes(permission) || false

  const canAccess = (resource: string, action: 'read' | 'write' | 'delete') => {
    if (!authUser) return false
    if (authUser.role === 'admin') return true
    if (authUser.role === 'manager') {
      if (action === 'read') return true
      return authUser.zone === 'todas'
    }
    if (authUser.role === 'commercial') {
      return action === 'read' || action === 'write'
    }
    return false
  }

  const value: AuthContextType = {
    user,
    authUser,
    session,
    loading,
    signInWithPassword,
    signInWithOTP,
    signOut,
    resetPassword,
    hasRole,
    hasPermission,
    canAccess,
    isAuthenticated: !!user,
    isAdmin: authUser?.role === 'admin',
    isManager: authUser?.role === 'manager',
    isCommercial: authUser?.role === 'commercial'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
