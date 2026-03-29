import { handleCors, jsonResponse } from '../_shared/cors.ts'
import {
  ensureFields,
  getAuthenticatedUserFromToken,
  readJsonBody,
  readRequiredEnv,
  requestOAuthTokenPayload,
  saveOAuthConnection
} from '../_shared/oauth.ts'

interface MicrosoftTokenRequest {
  code?: string
  codeVerifier?: string
  redirectUri?: string
  userAccessToken?: string
}

const fetchMicrosoftUserEmail = async (
  accessToken: string
): Promise<string> => {
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  const payload = (await response.json().catch(() => null)) as {
    mail?: string
    userPrincipalName?: string
  } | null

  const email = payload?.mail || payload?.userPrincipalName

  if (!response.ok || !email) {
    throw new Error('No se pudo recuperar el email de la cuenta de Microsoft')
  }

  return email
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const payload = await readJsonBody<MicrosoftTokenRequest>(request)
    ensureFields(payload, ['code', 'codeVerifier', 'redirectUri'])
    const user = await getAuthenticatedUserFromToken(payload.userAccessToken)

    const clientId = readRequiredEnv('MICROSOFT_CLIENT_ID')
    const clientSecret = readRequiredEnv('MICROSOFT_CLIENT_SECRET')

    const tokenPayload = await requestOAuthTokenPayload(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
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
    const userEmail = await fetchMicrosoftUserEmail(accessToken)

    if (!refreshToken) {
      throw new Error('Microsoft no devolvió refresh token para almacenar')
    }

    await saveOAuthConnection({
      userId: user.id,
      provider: 'microsoft',
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
