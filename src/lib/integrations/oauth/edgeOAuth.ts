import { logger } from '../../logger'
import { isSupabaseConfigured } from '../../config'
import { supabase } from '../../supabaseClient'

const log = logger.create('OAuthEdge')

export interface OAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
  token_type?: string
}

const invokeOAuthFunction = async <TPayload>(
  functionName: string,
  payload: TPayload
): Promise<OAuthTokenResponse | null> => {
  if (!isSupabaseConfigured) {
    return null
  }

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    })

    if (error) {
      throw error
    }

    return data as OAuthTokenResponse
  } catch (error) {
    log.warn(`Fallback a modo técnico para ${functionName}`, error)
    return null
  }
}

export const exchangeGoogleCodeWithEdge = (
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<OAuthTokenResponse | null> =>
  invokeOAuthFunction('oauth-google-token', {
    code,
    codeVerifier,
    redirectUri
  })

export const refreshGoogleTokenWithEdge = (
  refreshToken: string
): Promise<OAuthTokenResponse | null> =>
  invokeOAuthFunction('oauth-google-refresh', { refreshToken })

export const exchangeMicrosoftCodeWithEdge = (
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<OAuthTokenResponse | null> =>
  invokeOAuthFunction('oauth-microsoft-token', {
    code,
    codeVerifier,
    redirectUri
  })

export const refreshMicrosoftTokenWithEdge = (
  refreshToken: string,
  redirectUri: string
): Promise<OAuthTokenResponse | null> =>
  invokeOAuthFunction('oauth-microsoft-refresh', {
    refreshToken,
    redirectUri
  })