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
    const initTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 5000)

    // Obtener sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email)
      }
      setLoading(false)
      clearTimeout(initTimeout)
    }).catch(() => {
      setLoading(false)
      clearTimeout(initTimeout)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email)
      } else {
        setAuthUser(null)
      }
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
      const { data, error } = await supabase
        .from('user_profilesGPV')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
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
    } catch {
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
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[Auth] Error signing out from Supabase:', error.message)
      }

      // Limpiamos el estado local independientemente del error de Supabase
      setUser(null)
      setAuthUser(null)
      setSession(null)

      // Limpiamos localStorage por si acaso
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('syncQueue')

      // Redirigir manualmente si es necesario (aunque el navigate en el componente debería bastar)
      return { error: null }
    } catch (err) {
      console.error('[Auth] Unexpected error during signOut:', err)
      setUser(null)
      setAuthUser(null)
      setSession(null)
      return { error: err instanceof Error ? err : new Error('Unknown error during sign out') }
    }
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
