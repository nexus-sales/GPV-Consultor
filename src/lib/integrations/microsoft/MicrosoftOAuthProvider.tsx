/**
 * Proveedor de autenticación OAuth para Microsoft
 * Maneja el flujo OAuth 2.0 para Microsoft Graph (Calendar y To Do)
 */

import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from '../../logger'
import { IntegrationAuth } from '../types'

const log = logger.create('MicrosoftOAuth')

// NOTA: Estos valores deben configurarse en .env
const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''
const MICROSOFT_REDIRECT_URI = import.meta.env.VITE_MICROSOFT_REDIRECT_URI || ''
const MICROSOFT_SCOPES = [
  'User.Read',
  'Calendars.ReadWrite',
  'Tasks.ReadWrite'
].join(' ')

interface MicrosoftOAuthProviderProps {
  children: React.ReactNode
}

interface MicrosoftOAuthContextType {
  isAuthenticated: boolean
  accessToken: string | null
  userEmail: string | null
  login: () => void
  logout: () => void
  refreshAccessToken: () => Promise<void>
}

const MicrosoftOAuthContext = React.createContext<MicrosoftOAuthContextType | undefined>(undefined)

export function MicrosoftOAuthProvider({ children }: MicrosoftOAuthProviderProps) {
  const [auth, setAuth] = useState<IntegrationAuth | null>(() => {
    const saved = localStorage.getItem('gpv_microsoft_auth')
    return saved ? JSON.parse(saved) : null
  })

  const saveAuth = (newAuth: IntegrationAuth | null) => {
    setAuth(newAuth)
    if (newAuth) {
      localStorage.setItem('gpv_microsoft_auth', JSON.stringify(newAuth))
    } else {
      localStorage.removeItem('gpv_microsoft_auth')
    }
  }

  const login = useCallback(() => {
    if (!MICROSOFT_CLIENT_ID) {
      toast.error('Microsoft OAuth no está configurado. Contacta con el administrador.')
      log.error('Microsoft Client ID no configurado')
      return
    }

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
    authUrl.searchParams.set('client_id', MICROSOFT_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', MICROSOFT_REDIRECT_URI || window.location.origin + '/auth/microsoft/callback')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', MICROSOFT_SCOPES)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', btoa(JSON.stringify({ timestamp: Date.now() })))

    log.info('Iniciando OAuth Microsoft')
    window.location.href = authUrl.toString()
  }, [])

  const logout = useCallback(() => {
    saveAuth(null)
    toast.success('Desconectado de Microsoft')
    log.info('Microsoft OAuth logout')
  }, [])

  const refreshAccessToken = useCallback(async () => {
    if (!auth?.refreshToken) {
      log.warn('No hay refresh token disponible')
      return
    }

    try {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: import.meta.env.VITE_MICROSOFT_CLIENT_SECRET || '',
          refresh_token: auth.refreshToken,
          grant_type: 'refresh_token',
          redirect_uri: MICROSOFT_REDIRECT_URI || window.location.origin + '/auth/microsoft/callback'
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
      log.info('Token de Microsoft refrescado exitosamente')
    } catch (error) {
      log.error('Error refrescando token', error)
      toast.error('Error refrescando la conexión con Microsoft')
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

  const value: MicrosoftOAuthContextType = {
    isAuthenticated: !!auth,
    accessToken: auth?.accessToken || null,
    userEmail: auth?.userEmail || null,
    login,
    logout,
    refreshAccessToken
  }

  return (
    <MicrosoftOAuthContext.Provider value={value}>
      {children}
    </MicrosoftOAuthContext.Provider>
  )
}

export function useMicrosoftOAuth() {
  const context = React.useContext(MicrosoftOAuthContext)
  if (context === undefined) {
    throw new Error('useMicrosoftOAuth must be used within a MicrosoftOAuthProvider')
  }
  return context
}

/**
 * Hook para manejar el callback de OAuth
 * Debe llamarse en la página /auth/microsoft/callback
 */
export function useMicrosoftOAuthCallback(): {
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
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: import.meta.env.VITE_MICROSOFT_CLIENT_SECRET || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: MICROSOFT_REDIRECT_URI || window.location.origin + '/auth/microsoft/callback'
        })
      })

      if (!response.ok) {
        throw new Error('Error exchanging code for token')
      }

      const data = await response.json()

      // Obtener información del usuario
      const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${data.access_token}`
        }
      })

      const userInfo = await userInfoResponse.json()

      const auth: IntegrationAuth = {
        provider: 'microsoft',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
        scopes: MICROSOFT_SCOPES.split(' '),
        userEmail: userInfo.mail || userInfo.userPrincipalName
      }

      localStorage.setItem('gpv_microsoft_auth', JSON.stringify(auth))
      
      toast.success('Microsoft conectado exitosamente')
      log.info('Microsoft OAuth callback completado', { email: userInfo.mail })

      // Cerrar ventana y avisar al opener
      if (window.opener) {
        window.opener.postMessage({ type: 'MICROSOFT_AUTH_SUCCESS', auth }, window.location.origin)
        window.close()
      } else {
        window.location.href = '/settings'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast.error('Error conectando con Microsoft')
      log.error('Error en Microsoft OAuth callback', err)
    } finally {
      setIsLoading(false)
    }
  }

  return { handleCallback, isLoading, error }
}
