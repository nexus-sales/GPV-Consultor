/**
 * Proveedor de autenticación OAuth para Google
 * Maneja el flujo OAuth 2.0 para Google Calendar y Tasks
 */

import React, { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { logger } from '../../logger'
import { IntegrationAuth } from '../types'
import {
  disconnectProviderWithEdge,
  refreshGoogleTokenWithEdge
} from '../oauth/edgeOAuth'
import {
  clearOAuthSession,
  readOAuthSession,
  writeOAuthSession
} from '../oauth/oauthSessionStorage'
import { createPkceSession } from '../oauth/pkce'
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

const GOOGLE_AUTH_MESSAGE = 'GOOGLE_AUTH_SUCCESS'

export function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  const [auth, setAuth] = useState<IntegrationAuth | null>(() => {
    return readOAuthSession('google')
  })
  const [restoreAttempted, setRestoreAttempted] = useState(false)
  const isLoggingOutRef = useRef(false)
  // Si el token ya está caducado o caduca en <5 min, bloqueamos el accessToken
  // en el contexto hasta que el refresh asíncrono termine, evitando llamadas 401.
  const [isRefreshing, setIsRefreshing] = useState<boolean>(() => {
    const initialAuth = readOAuthSession('google')
    return !!initialAuth && initialAuth.expiresAt - Date.now() < 5 * 60 * 1000
  })
  // Mutex sincrónico: evita que dos llamadas concurrentes a refreshAccessToken
  // lancen dos peticiones simultáneas al edge function de refresh.
  const isRefreshingRef = useRef(false)

  const saveAuth = (newAuth: IntegrationAuth | null) => {
    setAuth(newAuth)
    if (newAuth) {
      writeOAuthSession('google', newAuth)
    } else {
      clearOAuthSession('google')
    }
  }

  const login = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error(
        'Google OAuth no está configurado. Contacta con el administrador.'
      )
      log.error('Google Client ID no configurado')
      return
    }

    const { codeChallenge, state } = await createPkceSession('google')

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
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    authUrl.searchParams.set('state', state)

    log.info('Iniciando OAuth Google')
    window.location.href = authUrl.toString()
  }, [])

  const logout = useCallback(() => {
    isLoggingOutRef.current = true
    saveAuth(null)
    void disconnectProviderWithEdge('google')
      .finally(() => {
        isLoggingOutRef.current = false
      })
      .catch((error) => {
        log.warn(
          'No se pudo eliminar la conexión OAuth de Google en servidor',
          error
        )
      })
    toast.success('Desconectado de Google')
    log.info('Google OAuth logout')
  }, [])

  const refreshAccessToken = useCallback(async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true
    setIsRefreshing(true)
    try {
      const tokenData = await refreshGoogleTokenWithEdge()

      const newAuth: IntegrationAuth = {
        provider: 'google',
        accessToken: tokenData.access_token,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
        scopes: (tokenData.scope || auth?.scopes?.join(' ') || '')
          .split(' ')
          .filter(Boolean),
        userEmail: tokenData.user_email || auth?.userEmail || ''
      }

      saveAuth(newAuth)
      log.info('Token de Google refrescado exitosamente')
    } catch (error) {
      log.error('Error refrescando token', error)
      toast.error('Error refrescando la conexión con Google')
      logout()
    } finally {
      isRefreshingRef.current = false
      setIsRefreshing(false)
    }
  }, [auth, logout])

  // Check if token needs refresh
  React.useEffect(() => {
    if (auth && auth.expiresAt - Date.now() < 5 * 60 * 1000) {
      // Less than 5 minutes, refresh
      refreshAccessToken()
    }
  }, [auth, refreshAccessToken])

  React.useEffect(() => {
    if (auth || restoreAttempted || isLoggingOutRef.current) {
      return
    }

    setRestoreAttempted(true)

    refreshGoogleTokenWithEdge()
      .then((tokenData) => {
        if (isLoggingOutRef.current) return

        const restoredAuth: IntegrationAuth = {
          provider: 'google',
          accessToken: tokenData.access_token,
          expiresAt: Date.now() + tokenData.expires_in * 1000,
          scopes: (tokenData.scope || '').split(' ').filter(Boolean),
          userEmail: tokenData.user_email || ''
        }

        saveAuth(restoredAuth)
        log.info('Sesión OAuth de Google restaurada desde servidor')
      })
      .catch((error) => {
        // En lugar de loguear info genérica, verificamos si es una falta de conexión esperada
        if (
          error instanceof Error &&
          error.message.includes('oauth_connection_not_found')
        ) {
          log.info('No hay conexión OAuth previa de Google para restaurar')
        } else {
          // Loggear error real si es otra cosa (400, 500, etc)
          log.debug(
            'Sesión OAuth de Google no restaurada (probablemente no existe)',
            error
          )
        }
      })
  }, [auth, restoreAttempted])

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return
      }

      if (event.data?.type !== GOOGLE_AUTH_MESSAGE || !event.data?.auth) {
        return
      }

      saveAuth(event.data.auth as IntegrationAuth)
      log.info('Sesión OAuth de Google recibida por postMessage')
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const value: GoogleOAuthContextType = {
    isAuthenticated: !!auth,
    // No exponer el token mientras se está refrescando: evita que los efectos
    // de useCalendarSync disparen llamadas a la API con un token ya caducado.
    accessToken: isRefreshing ? null : auth?.accessToken || null,
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
