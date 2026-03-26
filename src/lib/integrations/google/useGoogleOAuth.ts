import React, { useState } from 'react'
import { toast } from 'sonner'

import { logger } from '../../logger'
import { IntegrationAuth } from '../types'
import {
  GoogleOAuthContext,
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI
} from './googleOAuthContext'

const log = logger.create('GoogleOAuth')

export function useGoogleOAuth() {
  const context = React.useContext(GoogleOAuthContext)
  if (context === undefined) {
    throw new Error('useGoogleOAuth must be used within a GoogleOAuthProvider')
  }
  return context
}

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
          redirect_uri:
            GOOGLE_REDIRECT_URI ||
            window.location.origin + '/auth/google/callback'
        })
      })

      if (!response.ok) {
        throw new Error('Error exchanging code for token')
      }

      const data = await response.json()
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`
          }
        }
      )

      const userInfo = await userInfoResponse.json()

      const auth: IntegrationAuth = {
        provider: 'google',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        scopes: data.scope.split(' '),
        userEmail: userInfo.email
      }

      localStorage.setItem('gpv_google_auth', JSON.stringify(auth))

      toast.success('Google conectado exitosamente')
      log.info('Google OAuth callback completado', { email: userInfo.email })

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
    } finally {
      setIsLoading(false)
    }
  }

  return { handleCallback, isLoading, error }
}