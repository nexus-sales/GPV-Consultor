import React, { useState } from 'react'
import { toast } from 'sonner'

import { logger } from '../../logger'
import { IntegrationAuth } from '../types'
import { exchangeMicrosoftCodeWithEdge } from '../oauth/edgeOAuth'
import { consumePkceSession } from '../oauth/pkce'
import {
  MICROSOFT_CLIENT_ID,
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

  const handleCallback = async (code: string, state: string | null) => {
    setIsLoading(true)
    setError(null)

    try {
      const { codeVerifier } = consumePkceSession('microsoft', state)
      const redirectUri =
        MICROSOFT_REDIRECT_URI ||
        window.location.origin + '/auth/microsoft/callback'

      const edgePayload = await exchangeMicrosoftCodeWithEdge(
        code,
        codeVerifier,
        redirectUri
      )

      const tokenData = edgePayload
        ? edgePayload
        : await (async () => {
            const response = await fetch(
              'https://login.microsoftonline.com/common/oauth2/v2.0/token',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                  client_id: MICROSOFT_CLIENT_ID,
                  code,
                  code_verifier: codeVerifier,
                  grant_type: 'authorization_code',
                  redirect_uri: redirectUri
                })
              }
            )

            if (!response.ok) {
              throw new Error('Error exchanging code for token')
            }

            return await response.json()
          })()
      const userInfoResponse = await fetch(
        'https://graph.microsoft.com/v1.0/me',
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`
          }
        }
      )

      const userInfo = await userInfoResponse.json()

      const auth: IntegrationAuth = {
        provider: 'microsoft',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || '',
        expiresAt: Date.now() + tokenData.expires_in * 1000,
        scopes: MICROSOFT_SCOPES.split(' '),
        userEmail: userInfo.mail || userInfo.userPrincipalName
      }

      localStorage.setItem('gpv_microsoft_auth', JSON.stringify(auth))

      toast.success('Microsoft conectado exitosamente')
      log.info('Microsoft OAuth callback completado', { email: userInfo.mail })

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
    } finally {
      setIsLoading(false)
    }
  }

  return { handleCallback, isLoading, error }
}