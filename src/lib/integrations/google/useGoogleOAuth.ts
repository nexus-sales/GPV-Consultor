import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { logger } from '../../logger'
import { IntegrationAuth } from '../types'
import { exchangeGoogleCodeWithEdge } from '../oauth/edgeOAuth'
import { writeOAuthSession } from '../oauth/oauthSessionStorage'
import { consumePkceSession } from '../oauth/pkce'
import { GoogleOAuthContext, GOOGLE_REDIRECT_URI } from './googleOAuthContext'

const log = logger.create('GoogleOAuth')

export function useGoogleOAuth() {
  const context = React.useContext(GoogleOAuthContext)
  if (context === undefined) {
    throw new Error('useGoogleOAuth must be used within a GoogleOAuthProvider')
  }
  return context
}

export function useGoogleOAuthCallback(): {
  handleCallback: (code: string, state: string | null) => Promise<void>
  isLoading: boolean
  error: string | null
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCallback = useCallback(
    async (code: string, state: string | null) => {
      setIsLoading(true)
      setError(null)

      try {
        const { codeVerifier } = consumePkceSession('google', state)
        const redirectUri =
          GOOGLE_REDIRECT_URI ||
          window.location.origin + '/auth/google/callback'

        const tokenData = await exchangeGoogleCodeWithEdge(
          code,
          codeVerifier,
          redirectUri
        )

        if (!tokenData.user_email) {
          throw new Error('Google OAuth no devolvió el email de la cuenta')
        }

        const auth: IntegrationAuth = {
          provider: 'google',
          accessToken: tokenData.access_token,
          expiresAt: Date.now() + tokenData.expires_in * 1000,
          scopes: (tokenData.scope || '').split(' ').filter(Boolean),
          userEmail: tokenData.user_email
        }

        writeOAuthSession('google', auth)

        toast.success('Google conectado exitosamente')
        log.info('Google OAuth callback completado', {
          email: tokenData.user_email
        })

        if (window.opener) {
          window.opener.postMessage(
            { type: 'GOOGLE_AUTH_SUCCESS', auth },
            window.location.origin
          )
          window.close()
        } else {
          window.location.href = '/settings'
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMessage)
        toast.error('Error conectando con Google')
        log.error('Error en Google OAuth callback', err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { handleCallback, isLoading, error }
}
