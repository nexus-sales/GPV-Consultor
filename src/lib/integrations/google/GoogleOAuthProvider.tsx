/**
 * Proveedor de autenticación OAuth para Google
 * Maneja el flujo OAuth 2.0 para Google Calendar y Tasks
 */

import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from '../../logger'
import { IntegrationAuth } from '../types'
import {
  GoogleOAuthContext,
  GoogleOAuthContextType,
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  GOOGLE_SCOPES
} from './googleOAuthContext'

const log = logger.create('GoogleOAuth')

interface GoogleOAuthProviderProps {
  children: React.ReactNode
}

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
      toast.error(
        'Google OAuth no está configurado. Contacta con el administrador.'
      )
      log.error('Google Client ID no configurado')
      return
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set(
      'redirect_uri',
      GOOGLE_REDIRECT_URI || window.location.origin + '/auth/google/callback'
    )
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', GOOGLE_SCOPES)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set(
      'state',
      btoa(JSON.stringify({ timestamp: Date.now() }))
    )

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
        expiresAt: Date.now() + data.expires_in * 1000
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
