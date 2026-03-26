/**
 * Proveedor de autenticación OAuth para Microsoft
 * Maneja el flujo OAuth 2.0 para Microsoft Graph (Calendar y To Do)
 */

import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from '../../logger'
import { IntegrationAuth } from '../types'
import {
  MICROSOFT_CLIENT_ID,
  MICROSOFT_REDIRECT_URI,
  MICROSOFT_SCOPES,
  MicrosoftOAuthContext,
  MicrosoftOAuthContextType
} from './microsoftOAuthContext'

const log = logger.create('MicrosoftOAuth')

interface MicrosoftOAuthProviderProps {
  children: React.ReactNode
}

export function MicrosoftOAuthProvider({
  children
}: MicrosoftOAuthProviderProps) {
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
      toast.error(
        'Microsoft OAuth no está configurado. Contacta con el administrador.'
      )
      log.error('Microsoft Client ID no configurado')
      return
    }

    const authUrl = new URL(
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
    )
    authUrl.searchParams.set('client_id', MICROSOFT_CLIENT_ID)
    authUrl.searchParams.set(
      'redirect_uri',
      MICROSOFT_REDIRECT_URI ||
        window.location.origin + '/auth/microsoft/callback'
    )
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', MICROSOFT_SCOPES)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set(
      'state',
      btoa(JSON.stringify({ timestamp: Date.now() }))
    )

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
      const response = await fetch(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: MICROSOFT_CLIENT_ID,
            client_secret: import.meta.env.VITE_MICROSOFT_CLIENT_SECRET || '',
            refresh_token: auth.refreshToken,
            grant_type: 'refresh_token',
            redirect_uri:
              MICROSOFT_REDIRECT_URI ||
              window.location.origin + '/auth/microsoft/callback'
          })
        }
      )

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
