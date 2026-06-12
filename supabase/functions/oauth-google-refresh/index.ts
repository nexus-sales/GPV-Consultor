import { handleCors, jsonResponse } from '../_shared/cors.ts'
import {
  getAuthenticatedUserFromToken,
  loadOAuthConnection,
  readJsonBody,
  readRequiredEnv,
  requestOAuthTokenPayload,
  saveOAuthConnection
} from '../_shared/oauth.ts'

interface GoogleRefreshRequest {
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
    const payload = await readJsonBody<GoogleRefreshRequest>(request)
    const user = await getAuthenticatedUserFromToken(payload.userAccessToken)
    const connection = await loadOAuthConnection(user.id, 'google')

    if (!connection) {
      return reply({ error: 'oauth_connection_not_found' }, 404)
    }

    const clientId = readRequiredEnv('GOOGLE_CLIENT_ID')
    const clientSecret = readRequiredEnv('GOOGLE_CLIENT_SECRET')

    const tokenPayload = await requestOAuthTokenPayload(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token'
      })
    )

    const nextRefreshToken = String(tokenPayload.refresh_token ?? '')

    await saveOAuthConnection({
      userId: user.id,
      provider: 'google',
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
