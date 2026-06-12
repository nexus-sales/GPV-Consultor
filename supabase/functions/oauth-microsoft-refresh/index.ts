import { handleCors, jsonResponse } from '../_shared/cors.ts'
import {
  ensureFields,
  getAuthenticatedUserFromToken,
  loadOAuthConnection,
  readJsonBody,
  readRequiredEnv,
  requestOAuthTokenPayload,
  saveOAuthConnection
} from '../_shared/oauth.ts'

interface MicrosoftRefreshRequest {
  redirectUri?: string
  userAccessToken?: string
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse
  const reply = (body: unknown, status = 200) => jsonResponse(body, status, request)

  if (request.method !== 'POST') {
    return reply({ error: 'method_not_allowed' }, 405)
  }

  try {
    const payload = await readJsonBody<MicrosoftRefreshRequest>(request)
    ensureFields(payload, ['redirectUri'])
    const user = await getAuthenticatedUserFromToken(payload.userAccessToken)

    const connection = await loadOAuthConnection(user.id, 'microsoft')

    if (!connection) {
      return reply({ error: 'oauth_connection_not_found' }, 404)
    }

    const clientId = readRequiredEnv('MICROSOFT_CLIENT_ID')
    const clientSecret = readRequiredEnv('MICROSOFT_CLIENT_SECRET')

    const tokenPayload = await requestOAuthTokenPayload(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
        redirect_uri: payload.redirectUri!
      })
    )

    const nextRefreshToken = String(tokenPayload.refresh_token ?? '')

    await saveOAuthConnection({
      userId: user.id,
      provider: 'microsoft',
      refreshToken: nextRefreshToken || connection.refresh_token,
      scopes: String(tokenPayload.scope ?? connection.scopes.join(' '))
        .split(' ')
        .filter(Boolean),
      tokenType: String(tokenPayload.token_type ?? connection.token_type ?? ''),
      providerUserEmail: connection.provider_user_email
    })

    return reply({
      access_token: String(tokenPayload.access_token ?? ''),
      expires_in: Number(tokenPayload.expires_in ?? 0),
      scope: String(tokenPayload.scope ?? connection.scopes.join(' ')),
      token_type: String(
        tokenPayload.token_type ?? connection.token_type ?? ''
      ),
      user_email: connection.provider_user_email
    })
  } catch (error) {
    return reply(
      { error: error instanceof Error ? error.message : 'unknown_error' },
      400
    )
  }
})
