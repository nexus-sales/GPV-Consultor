import { logger } from '../../logger'
import { isSupabaseConfigured } from '../../config'
import { supabase } from '../../supabaseClient'
import type { FunctionsHttpError } from '@supabase/supabase-js'

const log = logger.create('OAuthEdge')

const getValidAccessToken = async (): Promise<string> => {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  let activeSession = session

  if (
    activeSession?.expires_at &&
    activeSession.expires_at * 1000 <= Date.now() + 60_000
  ) {
    const {
      data: { session: refreshedSession }
    } = await supabase.auth.refreshSession()

    activeSession = refreshedSession
  }

  const accessToken = activeSession?.access_token

  if (!accessToken) {
    throw new Error(
      'No hay sesión activa de Supabase. Inicia sesión de nuevo antes de conectar OAuth.'
    )
  }

  return accessToken
}

export interface OAuthTokenResponse {
  access_token: string
  expires_in: number
  scope?: string
  token_type?: string
  user_email?: string
}

const invokeOAuthFunction = async <
  TPayload extends Record<string, unknown>,
  TResponse = OAuthTokenResponse
>(
  functionName: string,
  payload: TPayload,
  allowRetry = true
): Promise<TResponse> => {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase no está configurado. OAuth seguro requiere Edge Functions activas.'
    )
  }

  try {
    const accessToken = await getValidAccessToken()

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        ...payload,
        userAccessToken: accessToken
      },
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (error) {
      throw error
    }

    if ((data as OAuthTokenResponse | null)?.access_token === undefined) {
      return data as TResponse
    }

    if (!(data as OAuthTokenResponse | null)?.expires_in) {
      throw new Error(`Respuesta inválida de la función ${functionName}`)
    }

    return data as TResponse
  } catch (error) {
    // Si es un error 404 (oauth_connection_not_found), no lo loggeamos como error estrepitoso
    // ya que el frontend usa esto para intentar restaurar sesiones inexistentes de forma proactiva.
    const isNotFound =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'FunctionsHttpError' &&
      (error as FunctionsHttpError).context.status === 404

    if (!isNotFound) {
      log.error(`Falló la función OAuth ${functionName}`, error)
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'FunctionsHttpError'
    ) {
      const httpError = error as FunctionsHttpError

      if (httpError.context.status === 401) {
        if (allowRetry) {
          const {
            data: { session: refreshedSession }
          } = await supabase.auth.refreshSession()

          if (refreshedSession?.access_token) {
            return invokeOAuthFunction<TPayload, TResponse>(
              functionName,
              payload,
              false
            )
          }
        }

        throw new Error(
          'La Edge Function rechazó la sesión de Supabase. Cierra sesión y vuelve a entrar antes de conectar Google.'
        )
      }
    }

    throw new Error(
      'No se pudo completar OAuth seguro. Verifica Edge Functions y secretos en Supabase.'
    )
  }
}

export const exchangeGoogleCodeWithEdge = (
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<OAuthTokenResponse> =>
  invokeOAuthFunction('oauth-google-token', {
    code,
    codeVerifier,
    redirectUri
  })

export const refreshGoogleTokenWithEdge = (): Promise<OAuthTokenResponse> =>
  invokeOAuthFunction('oauth-google-refresh', {})

export const exchangeMicrosoftCodeWithEdge = (
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<OAuthTokenResponse> =>
  invokeOAuthFunction('oauth-microsoft-token', {
    code,
    codeVerifier,
    redirectUri
  })

export const refreshMicrosoftTokenWithEdge = (
  redirectUri: string
): Promise<OAuthTokenResponse> =>
  invokeOAuthFunction('oauth-microsoft-refresh', {
    redirectUri
  })

export const disconnectProviderWithEdge = (
  provider: 'google' | 'microsoft'
): Promise<{ success: boolean }> =>
  invokeOAuthFunction<
    { provider: 'google' | 'microsoft' },
    { success: boolean }
  >('oauth-disconnect', { provider })
