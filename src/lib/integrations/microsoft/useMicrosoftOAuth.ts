import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { logger } from '../../logger'
import { IntegrationAuth } from '../types'
import { exchangeMicrosoftCodeWithEdge } from '../oauth/edgeOAuth'
import { writeOAuthSession } from '../oauth/oauthSessionStorage'
import { consumePkceSession } from '../oauth/pkce'
import {
  MICROSOFT_REDIRECT_URI,
  MICROSOFT_SCOPES,
  MicrosoftOAuthContext
} from './microsoftOAuthContext'

const log = logger.create('MicrosoftOAuth')

export function useMicrosoftOAuth() {
  const context = React.useContext(MicrosoftOAuthContext)
  if (context === undefined) {
    throw new Error(
      'useMicrosoftOAuth must be used within a MicrosoftOAuthProvider'
    )
  }
  return context
}

export function useMicrosoftOAuthCallback(): {
  handleCallback: (code: string, state: string | null) => Promise<void>
  isLoading: boolean
  error: string | null
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCallback = useCallback(async (code: string, state: string | null) => {
    setIsLoading(true)
    setError(null)

    try {
      const { codeVerifier } = consumePkceSession('microsoft', state)
      const redirectUri =
        MICROSOFT_REDIRECT_URI ||
        window.location.origin + '/auth/microsoft/callback'

      const tokenData = await exchangeMicrosoftCodeWithEdge(
        code,
        codeVerifier,
        redirectUri
      )

      if (!tokenData.user_email) {
        throw new Error('Microsoft OAuth no devolvió el email de la cuenta')
      }

      const auth: IntegrationAuth = {
        provider: 'microsoft',
        accessToken: tokenData.access_token,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
        scopes: MICROSOFT_SCOPES.split(' '),
        userEmail: tokenData.user_email
      }

      writeOAuthSession('microsoft', auth)

      toast.success('Microsoft conectado exitosamente')
      log.info('Microsoft OAuth callback completado', {
        email: tokenData.user_email
      })

      if (window.opener) {
        window.opener.postMessage(
          { type: 'MICROSOFT_AUTH_SUCCESS', auth },
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
      toast.error('Error conectando con Microsoft')
      log.error('Error en Microsoft OAuth callback', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { handleCallback, isLoading, error }
}