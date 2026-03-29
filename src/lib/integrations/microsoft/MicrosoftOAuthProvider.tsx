/**
 * Proveedor de autenticación OAuth para Microsoft
 * Maneja el flujo OAuth 2.0 para Microsoft Graph (Calendar y To Do)
 */

import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from '../../logger'
import { IntegrationAuth } from '../types'
import {
  disconnectProviderWithEdge,
  refreshMicrosoftTokenWithEdge
} from '../oauth/edgeOAuth'
import {
  clearOAuthSession,
  readOAuthSession,
  writeOAuthSession
} from '../oauth/oauthSessionStorage'
import { createPkceSession } from '../oauth/pkce'
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

const MICROSOFT_AUTH_MESSAGE = 'MICROSOFT_AUTH_SUCCESS'

const isMicrosoftOAuthConfigured = Boolean(MICROSOFT_CLIENT_ID)

export function MicrosoftOAuthProvider({
  children
}: MicrosoftOAuthProviderProps) {
  const [auth, setAuth] = useState<IntegrationAuth | null>(() => {
    return readOAuthSession('microsoft')
  })
  const [restoreAttempted, setRestoreAttempted] = useState(false)

  const saveAuth = (newAuth: IntegrationAuth | null) => {
    setAuth(newAuth)
    if (newAuth) {
      writeOAuthSession('microsoft', newAuth)
    } else {
      clearOAuthSession('microsoft')
    }
  }

  const login = useCallback(async () => {
    if (!MICROSOFT_CLIENT_ID) {
      toast.error(
        'Microsoft OAuth no está configurado. Contacta con el administrador.'
      )
      log.error('Microsoft Client ID no configurado')
      return
    }

    const { codeChallenge, state } = await createPkceSession('microsoft')

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
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    authUrl.searchParams.set('state', state)

    log.info('Iniciando OAuth Microsoft')
    window.location.href = authUrl.toString()
  }, [])

  const logout = useCallback(() => {
    saveAuth(null)
    void disconnectProviderWithEdge('microsoft').catch((error) => {
      log.warn(
        'No se pudo eliminar la conexión OAuth de Microsoft en servidor',
        error
      )
    })
    toast.success('Desconectado de Microsoft')
    log.info('Microsoft OAuth logout')
  }, [])

  const refreshAccessToken = useCallback(async () => {
    if (!isMicrosoftOAuthConfigured) {
      return
    }

    try {
      const redirectUri =
        MICROSOFT_REDIRECT_URI ||
        window.location.origin + '/auth/microsoft/callback'

      const tokenData = await refreshMicrosoftTokenWithEdge(redirectUri)

      const newAuth: IntegrationAuth = {
        provider: 'microsoft',
        accessToken: tokenData.access_token,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
        scopes: (tokenData.scope || MICROSOFT_SCOPES)
          .split(' ')
          .filter(Boolean),
        userEmail: tokenData.user_email || auth?.userEmail || ''
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
    if (!isMicrosoftOAuthConfigured) {
      return
    }

    if (auth && auth.expiresAt - Date.now() < 5 * 60 * 1000) {
      // Less than 5 minutes, refresh
      refreshAccessToken()
    }
  }, [auth, refreshAccessToken])

  React.useEffect(() => {
    if (!isMicrosoftOAuthConfigured) {
      return
    }

    if (auth || restoreAttempted) {
      return
    }

    setRestoreAttempted(true)

    const redirectUri =
      MICROSOFT_REDIRECT_URI ||
      window.location.origin + '/auth/microsoft/callback'

    refreshMicrosoftTokenWithEdge(redirectUri)
      .then((tokenData) => {
        const restoredAuth: IntegrationAuth = {
          provider: 'microsoft',
          accessToken: tokenData.access_token,
          expiresAt: Date.now() + tokenData.expires_in * 1000,
          scopes: (tokenData.scope || MICROSOFT_SCOPES)
            .split(' ')
            .filter(Boolean),
          userEmail: tokenData.user_email || ''
        }

        saveAuth(restoredAuth)
        log.info('Sesión OAuth de Microsoft restaurada desde servidor')
      })
      .catch(() => {
        log.info('No hay conexión OAuth previa de Microsoft para restaurar')
      })
  }, [auth, restoreAttempted])

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return
      }

      if (event.data?.type !== MICROSOFT_AUTH_MESSAGE || !event.data?.auth) {
        return
      }

      saveAuth(event.data.auth as IntegrationAuth)
      log.info('Sesión OAuth de Microsoft recibida por postMessage')
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

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
