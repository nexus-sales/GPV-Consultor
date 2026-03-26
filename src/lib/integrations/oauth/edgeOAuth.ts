import { logger } from '../../logger'
import { isSupabaseConfigured } from '../../config'
import { supabase } from '../../supabaseClient'

const log = logger.create('OAuthEdge')

export interface OAuthTokenResponse {
  access_token: string
  expires_in: number
  scope?: string
  token_type?: string
  user_email?: string
}

const invokeOAuthFunction = async <TPayload, TResponse = OAuthTokenResponse>(
  functionName: string,
  payload: TPayload
): Promise<TResponse> => {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase no está configurado. OAuth seguro requiere Edge Functions activas.'
    )
  }

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
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
    log.error(`Falló la función OAuth ${functionName}`, error)
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

export const refreshGoogleTokenWithEdge = (
): Promise<OAuthTokenResponse> =>
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
  invokeOAuthFunction<{ provider: 'google' | 'microsoft' }, { success: boolean }>(
    'oauth-disconnect',
    { provider }
  )