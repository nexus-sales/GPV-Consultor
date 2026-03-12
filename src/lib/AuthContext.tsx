import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'
import type { User, Session } from '@supabase/supabase-js'
import { logger } from './logger'
import { isSupabaseConfigured } from './config'

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
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null; success?: boolean }>
  signInWithOTP: (email: string) => Promise<{ error: Error | null; success?: boolean }>
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

// Rate limiting para intentos de login
const LOGIN_ATTEMPTS_KEY = 'gpv_login_attempts'
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutos

interface LoginAttempts {
  count: number
  lockedUntil: number | null
}

function getLoginAttempts(): LoginAttempts {
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY)
    if (!stored) return { count: 0, lockedUntil: null }
    
    const data: LoginAttempts = JSON.parse(stored)
    // Si el tiempo de bloqueo expiró, resetear
    if (data.lockedUntil && Date.now() > data.lockedUntil) {
      return { count: 0, lockedUntil: null }
    }
    return data
  } catch {
    return { count: 0, lockedUntil: null }
  }
}

function updateLoginAttempts(increment: boolean): { allowed: boolean; remainingTime?: number } {
  try {
    const current = getLoginAttempts()
    
    // Si está bloqueado, verificar si ya pasó el tiempo
    if (current.lockedUntil) {
      if (Date.now() > current.lockedUntil) {
        // Resetear después del timeout
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ count: 0, lockedUntil: null }))
        return { allowed: true }
      }
      return { allowed: false, remainingTime: current.lockedUntil - Date.now() }
    }
    
    if (increment) {
      const newCount = current.count + 1
      if (newCount >= MAX_LOGIN_ATTEMPTS) {
        // Bloquear
        const lockedUntil = Date.now() + LOGIN_LOCKOUT_TIME
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ count: newCount, lockedUntil }))
        return { allowed: false, remainingTime: LOGIN_LOCKOUT_TIME }
      }
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ count: newCount, lockedUntil: null }))
    } else {
      // Resetear después de login exitoso
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ count: 0, lockedUntil: null }))
    }
    
    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}

function resetLoginAttempts() {
  try {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
  } catch {
    // Ignorar errores de localStorage
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const loadedUserIdRef = useRef<string | null>(null)

  // Cargar perfil FUERA del onAuthStateChange para evitar deadlock con el cliente Supabase v2
  // Guardamos el userId ya cargado para no repetir la llamada si el mismo user dispara múltiples eventos auth
  useEffect(() => {
    if (user) {
      if (loadedUserIdRef.current !== user.id) {
        loadedUserIdRef.current = user.id
        loadUserProfile(user.id, user.email)
      }
    } else {
      loadedUserIdRef.current = null
      setAuthUser(null)
    }
  }, [user])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null)
      setUser(null)
      setAuthUser(null)
      setLoading(false)
      return
    }
    const initTimeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    // Obtener sesión inicial — solo actualiza estado, sin llamadas DB aquí
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      clearTimeout(initTimeout)
    }).catch(() => {
      setLoading(false)
      clearTimeout(initTimeout)
    })

    // Escuchar cambios de autenticación — SOLO actualizar session/user, NUNCA llamadas DB aquí
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      clearTimeout(initTimeout)
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
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase no está configurado'), success: false }
    }
    // Verificar rate limiting
    const rateLimit = updateLoginAttempts(false)
    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.remainingTime || 0) / 60000)
      return { 
        error: new Error(`Demasiados intentos. Intenta de nuevo en ${minutes} minutos.`),
        success: false
      }
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: new Error('Email inválido'), success: false }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        // Incrementar contador de intentos fallidos
        updateLoginAttempts(true)
        logger.warn('[Auth] Failed login attempt', { email, error: error.message })
        return { error, success: false }
      }

      // Resetear intentos después de login exitoso
      resetLoginAttempts()
      logger.info('[Auth] User logged in successfully', { email })
      return { error: null, success: true }
    } catch (err) {
      updateLoginAttempts(true)
      const error = err instanceof Error ? err : new Error('Error desconocido')
      logger.error('[Auth] Unexpected error during login', err)
      return { error, success: false }
    }
  }

  const signInWithOTP = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase no está configurado'), success: false }
    }
    // Verificar rate limiting
    const rateLimit = updateLoginAttempts(false)
    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.remainingTime || 0) / 60000)
      return { 
        error: new Error(`Demasiados intentos. Intenta de nuevo en ${minutes} minutos.`),
        success: false
      }
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: new Error('Email inválido'), success: false }
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { 
          emailRedirectTo: `${window.location.origin}/dashboard`,
          shouldCreateUser: false // Evitar creación automática de usuarios
        }
      })

      if (error) {
        updateLoginAttempts(true)
        logger.warn('[Auth] Failed OTP request', { email, error: error.message })
        return { error, success: false }
      }

      logger.info('[Auth] OTP sent successfully', { email })
      return { error: null, success: true }
    } catch (err) {
      updateLoginAttempts(true)
      const error = err instanceof Error ? err : new Error('Error desconocido')
      logger.error('[Auth] Unexpected error during OTP request', err)
      return { error, success: false }
    }
  }

  const signOut = async () => {
    try {
      if (!isSupabaseConfigured) {
        setUser(null)
        setAuthUser(null)
        setSession(null)
        return { error: null }
      }
      // Usar Promise.race para evitar que un signOut colgado bloquee la UI
      const { error } = await Promise.race([
        supabase.auth.signOut(),
        new Promise<{ error: null }>((resolve) => setTimeout(() => resolve({ error: null }), 1000))
      ])

      if (error) {
        logger.error('[Auth] Error signing out from Supabase', error)
      }

      // Limpiamos el estado local independientemente del error de Supabase
      setUser(null)
      setAuthUser(null)
      setSession(null)

      // Limpiamos localStorage específico y genérico de supabase
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('syncQueue')

      // Limpiar también cualquier key que empiece por sb- y termine en -auth-token (formato v2)
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key)
          }
        })
      }

      return { error: null }
    } catch (err) {
      logger.error('[Auth] Unexpected error during signOut', err)
      // Asegurar limpieza en caso de error
      setUser(null)
      setAuthUser(null)
      setSession(null)
      return { error: err instanceof Error ? err : new Error('Unknown error during sign out') }
    }
  }

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase no está configurado') }
    }
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
