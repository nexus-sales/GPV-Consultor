/**
 * Proveedor de autenticación OAuth para Google
 * Maneja el flujo OAuth 2.0 para Google Calendar y Tasks
 */

import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from '../../logger'
import { IntegrationAuth } from '../types'

const log = logger.create('GoogleOAuth')

// NOTA: Estos valores deben configurarse en .env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || ''
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'email',
  'profile'
].join(' ')

interface GoogleOAuthProviderProps {
  children: React.ReactNode
}

interface GoogleOAuthContextType {
  isAuthenticated: boolean
  accessToken: string | null
  userEmail: string | null
  login: () => void
  logout: () => void
  refreshAccessToken: () => Promise<void>
}

const GoogleOAuthContext = React.createContext<GoogleOAuthContextType | undefined>(undefined)

export function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  const [auth, setAuth] = useState<IntegrationAuth | null>(() => {
    const saved = localStorage.getItem('gpv_google_auth')
    return saved ? JSON.parse(saved) : null
  })

  const saveAuth = (newAuth: IntegrationAuth | null) => {
    setAuth(newAuth)
    if (newAuth) {
      localStorage.setItem('gpv_google_auth', JSON.stringify(newAuth))
    } else {
      localStorage.removeItem('gpv_google_auth')
    }
  }

  const login = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google OAuth no está configurado. Contacta con el administrador.')
      log.error('Google Client ID no configurado')
      return
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI || window.location.origin + '/auth/google/callback')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', GOOGLE_SCOPES)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', btoa(JSON.stringify({ timestamp: Date.now() })))

    log.info('Iniciando OAuth Google')
    window.location.href = authUrl.toString()
  }, [])

  const logout = useCallback(() => {
    saveAuth(null)
    toast.success('Desconectado de Google')
    log.info('Google OAuth logout')
  }, [])

  const refreshAccessToken = useCallback(async () => {
    if (!auth?.refreshToken) {
      log.warn('No hay refresh token disponible')
      return
    }

    try {
      // NOTA: En producción, esto debería hacerse através de tu backend
      // para no exponer el client secret
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
          refresh_token: auth.refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) {
        throw new Error('Error refreshing token')
      }

      const data = await response.json()
      
      const newAuth: IntegrationAuth = {
        ...auth,
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000)
      }

      saveAuth(newAuth)
      log.info('Token de Google refrescado exitosamente')
    } catch (error) {
      log.error('Error refrescando token', error)
      toast.error('Error refrescando la conexión con Google')
      logout()
    }
  }, [auth, logout])

  // Check if token needs refresh
  React.useEffect(() => {
    if (auth && auth.expiresAt - Date.now() < 5 * 60 * 1000) {
      // Less than 5 minutes, refresh
      refreshAccessToken()
    }
  }, [auth, refreshAccessToken])

  const value: GoogleOAuthContextType = {
    isAuthenticated: !!auth,
    accessToken: auth?.accessToken || null,
    userEmail: auth?.userEmail || null,
    login,
    logout,
    refreshAccessToken
  }

  return (
    <GoogleOAuthContext.Provider value={value}>
      {children}
    </GoogleOAuthContext.Provider>
  )
}

export function useGoogleOAuth() {
  const context = React.useContext(GoogleOAuthContext)
  if (context === undefined) {
    throw new Error('useGoogleOAuth must be used within a GoogleOAuthProvider')
  }
  return context
}

/**
 * Hook para manejar el callback de OAuth
 * Debe llamarse en la página /auth/google/callback
 */
export function useGoogleOAuthCallback(): {
  handleCallback: (code: string) => Promise<void>
  isLoading: boolean
  error: string | null
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCallback = async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Intercambiar código por token
      // NOTA: En producción, esto debería hacerse através de tu backend
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: GOOGLE_REDIRECT_URI || window.location.origin + '/auth/google/callback'
        })
      })

      if (!response.ok) {
        throw new Error('Error exchanging code for token')
      }

      const data = await response.json()

      // Obtener información del usuario
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${data.access_token}`
        }
      })

      const userInfo = await userInfoResponse.json()

      const auth: IntegrationAuth = {
        provider: 'google',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
        scopes: data.scope.split(' '),
        userEmail: userInfo.email
      }

      localStorage.setItem('gpv_google_auth', JSON.stringify(auth))
      
      toast.success('Google conectado exitosamente')
      log.info('Google OAuth callback completado', { email: userInfo.email })

      // Cerrar ventana y avisar al opener
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', auth }, window.location.origin)
        window.close()
      } else {
        window.location.href = '/settings'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast.error('Error conectando con Google')
      log.error('Error en Google OAuth callback', err)
    } finally {
      setIsLoading(false)
    }
  }

  return { handleCallback, isLoading, error }
}
