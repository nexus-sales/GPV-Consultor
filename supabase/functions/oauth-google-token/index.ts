import { handleCors, jsonResponse } from '../_shared/cors.ts'
import {
  ensureFields,
  getAuthenticatedUserFromToken,
  readJsonBody,
  readRequiredEnv,
  requestOAuthTokenPayload,
  saveOAuthConnection
} from '../_shared/oauth.ts'

interface GoogleTokenRequest {
  code?: string
  codeVerifier?: string
  redirectUri?: string
  userAccessToken?: string
}

const fetchGoogleUserEmail = async (accessToken: string): Promise<string> => {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  const payload = (await response.json().catch(() => null)) as {
    email?: string
  } | null

  if (!response.ok || !payload?.email) {
    throw new Error('No se pudo recuperar el email de la cuenta de Google')
  }

  return payload.email
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const payload = await readJsonBody<GoogleTokenRequest>(request)
    ensureFields(payload, ['code', 'codeVerifier', 'redirectUri'])
    const user = await getAuthenticatedUserFromToken(payload.userAccessToken)

    const clientId = readRequiredEnv('GOOGLE_CLIENT_ID')
    const clientSecret = readRequiredEnv('GOOGLE_CLIENT_SECRET')

    const tokenPayload = await requestOAuthTokenPayload(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: payload.code!,
        code_verifier: payload.codeVerifier!,
        grant_type: 'authorization_code',
        redirect_uri: payload.redirectUri!
      })
    )

    const accessToken = String(tokenPayload.access_token ?? '')
    const refreshToken = String(tokenPayload.refresh_token ?? '')
    const userEmail = await fetchGoogleUserEmail(accessToken)

    if (!refreshToken) {
      throw new Error('Google no devolvió refresh token para almacenar')
    }

    await saveOAuthConnection({
      userId: user.id,
      provider: 'google',
      refreshToken,
      scopes: String(tokenPayload.scope ?? '')
        .split(' ')
        .filter(Boolean),
      tokenType: String(tokenPayload.token_type ?? ''),
      providerUserEmail: userEmail
    })

    return jsonResponse({
      access_token: accessToken,
      expires_in: Number(tokenPayload.expires_in ?? 0),
      scope: String(tokenPayload.scope ?? ''),
      token_type: String(tokenPayload.token_type ?? ''),
      user_email: userEmail
    })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'unknown_error' },
      400
    )
  }
})
